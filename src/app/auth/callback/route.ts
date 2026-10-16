import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { REMEMBER_COOKIE, REMEMBER_SECONDS, authCookieOptions, wantsRemember } from "@/lib/supabase/remember";

function readCookieHeader(header: string | null) {
  if (!header) return [];
  return header.split(";").flatMap((part) => {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) return [];
    return [{ name: trimmed.slice(0, eq), value: trimmed.slice(eq + 1) }];
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const incoming = readCookieHeader(request.headers.get("cookie"));
  const remember = wantsRemember(incoming.find((cookie) => cookie.name === REMEMBER_COOKIE)?.value);
  const login = new URL("/login", url.origin);
  login.searchParams.set("error", "link");

  if (!code && !tokenHash) return NextResponse.redirect(login);

  const response = NextResponse.redirect(new URL("/", url.origin));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions(remember),
      cookies: {
        getAll() {
          return incoming;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const exchanged = code ? await supabase.auth.exchangeCodeForSession(code) : { error: { message: "missing" } };
  const verified =
    exchanged.error && tokenHash
      ? await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type === "magiclink" ? "magiclink" : "email",
        })
      : exchanged;
  if (verified.error) return NextResponse.redirect(login);

  if (remember) {
    response.cookies.set(REMEMBER_COOKIE, "1", {
      ...authCookieOptions(true),
      maxAge: REMEMBER_SECONDS,
      httpOnly: false,
    });
  }
  return response;
}
