import { signOut } from "@/lib/auth/actions";
import { getSessionContext } from "@/lib/supabase/profile";
import Link from "next/link";

export async function SiteHeader() {
  const { user, profile } = await getSessionContext();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Recap<span className="text-accent">AI</span>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <span className="hidden text-sm text-muted sm:inline">
                {user.email}
                {profile ? ` · ${profile.plan_tier}` : ""}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-background"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Start free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
