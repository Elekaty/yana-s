require("dotenv").config();

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const sessionString = process.env.TELEGRAM_SESSION_STRING || "";
const target = String(process.env.TARGET_CHAT_ID || "").trim();
const receiver = process.env.VERCEL_RECEIVER_URL || "";
const secret = process.env.USERBOT_WEBHOOK_SECRET || "";
const inviteCode = (process.env.FAMILY_INVITE_CODE || "").trim();
const PHOTO_LIMIT = 3_500_000;

function chatForms(id) {
  const value = String(id ?? "").trim();
  const forms = new Set([value]);
  if (value.startsWith("-100")) forms.add(value.slice(4));
  else if (/^\d+$/.test(value)) forms.add(`-100${value}`);
  return forms;
}

function sameChat(chatId) {
  const left = chatForms(chatId);
  for (const form of chatForms(target)) {
    if (left.has(form)) return true;
  }
  return false;
}

async function senderName(message) {
  try {
    const sender = await message.getSender();
    if (!sender) return "";
    return [sender.firstName, sender.lastName, sender.title].filter(Boolean).join(" ").trim();
  } catch {
    return "";
  }
}

async function postNote(body) {
  let reason = "failed";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(receiver, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-userbot-secret": secret,
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        console.log(`saved ${body.chatId} ${body.messageId}`);
        return;
      }
      reason = `HTTP ${response.status}`;
    } catch (error) {
      reason = error instanceof Error ? error.message : "network";
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  console.error(`post failed for ${body.messageId}: ${reason}`);
}

async function onMessage(client, event) {
  const message = event.message;
  if (!message || !sameChat(message.chatId)) return;
  try {
    let photoBase64 = null;
    let mediaMimeType = null;
    if (message.photo) {
      const downloaded = await client.downloadMedia(message, {});
      const bytes = downloaded ? Buffer.from(downloaded) : Buffer.alloc(0);
      if (bytes.length > PHOTO_LIMIT) {
        console.error(`photo too large on ${message.id}`);
      } else if (bytes.length > 0) {
        photoBase64 = bytes.toString("base64");
        mediaMimeType = "image/jpeg";
      }
    }
    const text = typeof message.message === "string" ? message.message : "";
    if (!text.trim() && !photoBase64) return;
    await postNote({
      chatId: target,
      messageId: Number(message.id),
      senderName: await senderName(message),
      date: new Date(Number(message.date) * 1000).toISOString(),
      text: text || null,
      photoBase64,
      mediaMimeType,
      inviteCode: inviteCode || undefined,
    });
  } catch (error) {
    console.error(`listener error on ${message.id}: ${error instanceof Error ? error.message : "unknown"}`);
  }
}

async function main() {
  if (!apiId || !apiHash || !sessionString || !target || !receiver || !secret) {
    console.error("Missing TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION_STRING, TARGET_CHAT_ID, VERCEL_RECEIVER_URL, or USERBOT_WEBHOOK_SECRET.");
    process.exit(1);
  }
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();
  if (!(await client.checkAuthorization())) {
    console.error("The session string is not logged in. Run npm run login on your computer.");
    process.exit(1);
  }
  let chats = [];
  try {
    chats = [await client.getEntity(target)];
  } catch {
    console.error("Could not open the class group yet. Listening and matching the id directly.");
  }
  client.addEventHandler((event) => onMessage(client, event), new NewMessage(chats.length ? { chats } : {}));
  console.log("Listening for the class group.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "listener stopped");
  process.exit(1);
});
