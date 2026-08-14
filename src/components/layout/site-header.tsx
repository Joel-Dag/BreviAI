import { signOut } from "@/lib/auth/actions";
import { getSessionContext } from "@/lib/supabase/profile";
import Link from "next/link";
import { JBitLogo } from "@/components/brand/jbit-mascot";

export async function SiteHeader() {
  const { user, profile } = await getSessionContext();

  return (
    <header className="border-b border-[#E6D7C7] bg-[#FFFFFF]/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <JBitLogo />
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[#6E584C] transition-colors hover:text-[#22150E] px-2.5 py-1.5 rounded-lg hover:bg-[#F6EEE5]"
              >
                Dashboard
              </Link>
              <Link
                href="/meetings/new"
                className="inline-flex items-center justify-center rounded-lg bg-[#B85414] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#9C430C] transition-colors"
              >
                + New Meeting
              </Link>
              <span className="hidden text-xs text-[#8A7264] sm:inline border-l border-[#E6D7C7] pl-3">
                {user.email}
                {profile ? ` (${profile.plan_tier})` : ""}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg border border-[#E6D7C7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#6E584C] transition-colors hover:bg-[#F6EEE5] hover:text-[#22150E]"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-[#6E584C] transition-colors hover:text-[#22150E] px-3 py-1.5 rounded-lg hover:bg-[#F6EEE5]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-[#B85414] px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#9C430C]"
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

