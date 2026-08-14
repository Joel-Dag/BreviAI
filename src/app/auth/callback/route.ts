import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const errorDescription = requestUrl.searchParams.get("error_description");

  // In reverse-proxy/container environments, use the x-forwarded-host or origin
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(error.message)}`,
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Authentication session exchange failed.";
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(msg)}`,
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No authorization code was provided.")}`,
  );
}

