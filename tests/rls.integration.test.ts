import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, expect, it } from "vitest";

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const admin = url && service ? createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const createdUsers: string[] = [];
const createdFamilies: string[] = [];

afterAll(async () => {
  if (!admin) return;
  for (const familyId of createdFamilies) {
    await admin.from("families").delete().eq("id", familyId);
  }
  for (const userId of createdUsers) {
    await admin.auth.admin.deleteUser(userId);
  }
});

const live = Boolean(admin && anon);

it.skipIf(!live)("hides another family's rows and blocks archive until both parents tick", async () => {

  const parentA = await makeUser();
  const parentB = await makeUser();
  const outsider = await makeUser();
  const a = await signIn(parentA);
  const b = await signIn(parentB);
  const c = await signIn(outsider);

  const familyA = await rpcId(a, "create_family", {
    p_name: "Family A",
    p_timezone: "Europe/Paris",
    p_display_name: "Ada",
    p_child_name: "Yana",
  });
  createdFamilies.push(familyA);
  const { error: pinError } = await a.rpc("set_family_pin", { p_pin: "1234" });
  expect(pinError).toBeNull();

  const { data: summary } = await a.rpc("my_family");
  const code = (summary as { invite_code: string }).invite_code;
  const childId = (summary as { child_id: string }).child_id;
  const { error: joinError } = await b.rpc("join_family", { p_code: code, p_display_name: "Ben" });
  expect(joinError).toBeNull();

  const familyC = await rpcId(c, "create_family", {
    p_name: "Family C",
    p_timezone: "Europe/Paris",
    p_display_name: "Cleo",
    p_child_name: "Noa",
  });
  createdFamilies.push(familyC);

  const { data: visible } = await c.from("families").select("id, name");
  expect((visible ?? []).some((row) => row.id === familyA)).toBe(false);

  const { data: message, error: messageError } = await a
    .from("messages")
    .insert({
      family_id: familyA,
      source: "upload",
      external_id: `test-${randomUUID()}`,
      original_text: "Réunion demain",
      title: "Note",
    })
    .select("id")
    .single();
  expect(messageError).toBeNull();

  const { data: leaked } = await c.from("messages").select("id").eq("family_id", familyA);
  expect(leaked ?? []).toEqual([]);

  const { error: outsiderArchive } = await c.rpc("archive_message", { p_msg: message!.id });
  expect(outsiderArchive).toBeTruthy();

  const { error: tooSoon } = await a.rpc("archive_message", { p_msg: message!.id });
  expect(tooSoon?.message ?? "").toMatch(/both parents/i);

  const memberA = await memberId(a, parentA.id);
  const memberB = await memberId(b, parentB.id);
  const { error: ackA } = await a.from("message_acks").insert({ message_id: message!.id, member_id: memberA });
  expect(ackA).toBeNull();
  const { error: stillWaiting } = await a.rpc("archive_message", { p_msg: message!.id });
  expect(stillWaiting?.message ?? "").toMatch(/both parents/i);

  const { error: ackB } = await b.from("message_acks").insert({ message_id: message!.id, member_id: memberB });
  expect(ackB).toBeNull();
  const { error: archived } = await a.rpc("archive_message", { p_msg: message!.id });
  expect(archived).toBeNull();
  const { data: stored } = await a.from("messages").select("status").eq("id", message!.id).single();
  expect(stored?.status).toBe("archived");

  const { data: balance, error: starsError } = await a.rpc("award_stars", {
    p_child: childId,
    p_amount: 2,
    p_reason: "test",
  });
  expect(starsError).toBeNull();
  expect(balance).toBe(2);
  const { error: badAmount } = await a.rpc("award_stars", { p_child: childId, p_amount: 9, p_reason: "nope" });
  expect(badAmount).toBeTruthy();

  const { error: directStars } = await a.from("children").update({ star_balance: 100 }).eq("id", childId);
  expect(directStars).toBeTruthy();
  const { data: after } = await a.rpc("my_family");
  expect((after as { star_balance: number }).star_balance).toBe(2);

  const { data: second, error: secondError } = await a
    .from("messages")
    .insert({
      family_id: familyA,
      source: "upload",
      external_id: `test-${randomUUID()}`,
      original_text: "Menu",
      title: "Menu",
    })
    .select("id")
    .single();
  expect(secondError).toBeNull();
  const { error: directArchive } = await a.from("messages").update({ status: "archived" }).eq("id", second!.id);
  expect(directArchive).toBeTruthy();
  const { data: stillNew } = await a.from("messages").select("status").eq("id", second!.id).single();
  expect(stillNew?.status).toBe("new");

  const { data: reward, error: rewardError } = await a
    .from("rewards")
    .insert({ family_id: familyA, title: "Story", cost_stars: 2, active: true })
    .select("id")
    .single();
  expect(rewardError).toBeNull();
  const { data: purchase, error: askError } = await a
    .from("purchases")
    .insert({ family_id: familyA, child_id: childId, reward_id: reward!.id, status: "requested" })
    .select("id")
    .single();
  expect(askError).toBeNull();
  const { data: beforeBuy } = await a.rpc("my_family");
  expect((beforeBuy as { star_balance: number }).star_balance).toBe(2);
  const { data: left, error: approveError } = await a.rpc("approve_purchase", { p_purchase: purchase!.id });
  expect(approveError).toBeNull();
  expect(left).toBe(0);
  const { data: spent } = await a.from("star_ledger").select("amount, reason").eq("child_id", childId).eq("reason", "purchase");
  expect(spent).toEqual([{ amount: -2, reason: "purchase" }]);

  const { data: dear, error: dearError } = await a
    .from("rewards")
    .insert({ family_id: familyA, title: "Trip", cost_stars: 5, active: true })
    .select("id")
    .single();
  expect(dearError).toBeNull();
  const { data: tooMuch, error: tooMuchAsk } = await a
    .from("purchases")
    .insert({ family_id: familyA, child_id: childId, reward_id: dear!.id, status: "requested" })
    .select("id")
    .single();
  expect(tooMuchAsk).toBeNull();
  const { error: short } = await a.rpc("approve_purchase", { p_purchase: tooMuch!.id });
  expect(short).toBeTruthy();
  const { data: stillAsked } = await a.from("purchases").select("status").eq("id", tooMuch!.id).single();
  expect(stillAsked?.status).toBe("requested");
  const { error: denied } = await a.from("purchases").update({ status: "denied" }).eq("id", tooMuch!.id);
  expect(denied).toBeNull();
  const { data: afterBuy } = await a.rpc("my_family");
  expect((afterBuy as { star_balance: number }).star_balance).toBe(0);
});

async function makeUser() {
  if (!admin) throw new Error("missing admin");
  const email = `parent-${randomUUID()}@yana.test`;
  const password = `${randomBytes(18).toString("base64url")}Aa1`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message ?? "could not create test user");
  createdUsers.push(data.user.id);
  return { id: data.user.id, email, password };
}

async function signIn(user: { email: string; password: string }) {
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password });
  if (error) throw new Error(error.message);
  return client;
}

async function rpcId(client: SupabaseClient, fn: "create_family", args: Record<string, string>) {
  const { data, error } = await client.rpc(fn, args);
  if (error || !data) {
    throw new Error(error?.message ?? `Apply supabase/migrations/0001_core.sql before this test (${fn})`);
  }
  return data as string;
}

async function memberId(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from("members").select("id").eq("user_id", userId).single();
  if (error || !data) throw new Error(error?.message ?? "member missing");
  return data.id as string;
}

function loadEnv() {
  let text = "";
  try {
    text = readFileSync(".env.local", "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index);
    if (!process.env[key]) process.env[key] = line.slice(index + 1);
  }
}
