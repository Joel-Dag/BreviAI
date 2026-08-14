import { SiteHeader } from "@/components/layout/site-header";
import { getPublicEnvStatus, isSupabaseConfigured } from "@/lib/env";
import { getSessionContext } from "@/lib/supabase/profile";
import Link from "next/link";

export default async function Home() {
  const envStatus = getPublicEnvStatus();
  const supabaseReady = isSupabaseConfigured();
  const { user } = await getSessionContext();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-accent">
            Step 3 complete
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            AI-powered meeting notes
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            RecapAI transcribes your meetings, generates structured summaries,
            and extracts action items with owners and due dates.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  Start free
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        <section className="mt-12 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Setup checklist
          </h2>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center gap-3 text-sm">
              <StatusDot ok />
              Supabase Auth (email + Google) with login, signup, logout
            </li>
            <li className="flex items-center gap-3 text-sm">
              <StatusDot ok />
              Profiles table + auto-create trigger
            </li>
            <li className="flex items-center gap-3 text-sm">
              <StatusDot ok />
              Meetings, transcripts, summaries, and action_items tables with RLS
            </li>
            {envStatus.map(({ key, configured }) => (
              <li key={key} className="flex items-center gap-3 text-sm">
                <StatusDot ok={configured} />
                <code className="rounded bg-background px-1.5 py-0.5 text-xs">
                  {key}
                </code>
                {configured ? "configured" : "missing"}
              </li>
            ))}
          </ul>

          {!supabaseReady && (
            <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Add your Supabase URL and anon key to <code className="font-mono">.env.local</code>,
              then run the SQL in{" "}
              <code className="font-mono">supabase/migrations/001_profiles.sql</code>.
            </p>
          )}

          {supabaseReady && (
            <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Run{" "}
              <code className="font-mono">supabase/migrations/002_meetings_schema.sql</code>{" "}
              in the Supabase SQL editor, then open the dashboard to confirm the empty
              meetings list loads.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function StatusDot({ ok = true }: { ok?: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
        ok ? "bg-emerald-500" : "bg-amber-400"
      }`}
      aria-hidden
    />
  );
}
