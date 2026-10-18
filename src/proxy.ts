import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PARENT_UNLOCK_COOKIE, readUnlock } from "@/lib/pin-cookie";
import { needsDevice, openDeviceSession } from "@/lib/device-session";
import { decideGate } from "@/lib/parent-gate";
import { REMEMBER_COOKIE, authCookieOptions, wantsRemember } from "@/lib/supabase/remember";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions(wantsRemember(request.cookies.get(REMEMBER_COOKIE)?.value)),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const sessionUser = user ?? (needsDevice(path) ? await openDeviceSession(supabase) : null);
  const unlock = await readUnlock(request.cookies.get(PARENT_UNLOCK_COOKIE)?.value, process.env.CRON_SECRET ?? "");
  const decision = decideGate(path, Boolean(sessionUser), Boolean(unlock && sessionUser && unlock.sub === sessionUser.id));

  const redirectTo = (pathname: string, clearUnlock: boolean) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.headers.getSetCookie()) {
      redirect.headers.append("set-cookie", cookie);
    }
    if (clearUnlock) expireUnlock(redirect);
    return redirect;
  };

  if (decision.deny) {
    const denied = NextResponse.json({ error: "Parents only" }, { status: 401 });
    for (const cookie of response.headers.getSetCookie()) {
      denied.headers.append("set-cookie", cookie);
    }
    return denied;
  }
  if (decision.redirectTo) return redirectTo(decision.redirectTo, decision.clearUnlock);
  if (decision.clearUnlock) expireUnlock(response);
  return response;
}

function expireUnlock(response: NextResponse) {
  response.cookies.set(PARENT_UNLOCK_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon.svg).*)"],
};
