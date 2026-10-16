import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PARENT_UNLOCK_COOKIE, readUnlock } from "@/lib/pin-cookie";
import { BUILD_PREVIEW } from "@/lib/preview";
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
  const needsUser = path.startsWith("/parent") || path.startsWith("/kid") || path.startsWith("/join");
  const parentGate = path.startsWith("/parent") && !path.startsWith("/parent/unlock");

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.headers.getSetCookie()) {
      redirect.headers.append("set-cookie", cookie);
    }
    return redirect;
  };

  if (BUILD_PREVIEW && (path === "/login" || path === "/join")) return redirectTo("/kid/home");
  if (BUILD_PREVIEW && path === "/parent/unlock") return redirectTo("/parent");
  if (!BUILD_PREVIEW && user && path === "/login") return redirectTo("/");
  if (!BUILD_PREVIEW && !user && needsUser) return redirectTo("/login");

  if (!BUILD_PREVIEW && user && parentGate) {
    const unlock = await readUnlock(request.cookies.get(PARENT_UNLOCK_COOKIE)?.value, process.env.CRON_SECRET ?? "");
    if (!unlock || unlock.sub !== user.id) return redirectTo("/parent/unlock");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon.svg).*)"],
};
