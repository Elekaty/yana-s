import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PARENT_UNLOCK_COOKIE, readUnlock } from "@/lib/pin-cookie";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  };

  if (!user && needsUser) return redirectTo("/login");

  if (user && parentGate) {
    const unlock = await readUnlock(request.cookies.get(PARENT_UNLOCK_COOKIE)?.value, process.env.CRON_SECRET ?? "");
    if (!unlock || unlock.sub !== user.id) return redirectTo("/parent/unlock");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon.svg).*)"],
};
