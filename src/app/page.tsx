import { SiteHeader } from "@/components/layout/site-header";
import { getSessionContext } from "@/lib/supabase/profile";
import { JBitMascot } from "@/components/brand/jbit-mascot";
import Link from "next/link";
import { Mic, Sparkles, CheckSquare, Download, ArrowRight, ShieldCheck } from "lucide-react";

export default async function Home() {
  const { user } = await getSessionContext();

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-[#FBF8F3]">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-12">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 py-6">
          <div className="max-w-xl space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#22150E] sm:text-5xl leading-tight">
              Turn voice & meetings into <span className="text-[#B85414]">actionable recaps</span>.
            </h1>

            <p className="text-base leading-relaxed text-[#6E584C]">
              Capture live microphone audio or upload recordings. BreviAI transcribes speech at light speed with Whisper, extracts structured executive summaries, and tracks interactive action items.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {user ? (
                <Link
                  id="btn-hero-dashboard"
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#B85414] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#9C430C] transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    id="btn-hero-signup"
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#B85414] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#9C430C] transition"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    id="btn-hero-login"
                    href="/login"
                    className="rounded-xl border border-[#E6D7C7] bg-[#FFFFFF] px-5 py-3 text-sm font-semibold text-[#22150E] hover:bg-[#F6EEE5] shadow-xs transition"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Hero Summarizer Preview Card */}
          <div className="shrink-0 flex flex-col items-center p-8 rounded-3xl border border-[#E6D7C7] bg-gradient-to-b from-[#FFFFFF] to-[#FAF6F0] shadow-sm text-center">
            <JBitMascot size="lg" glow />
            <p className="mt-4 text-xs font-mono font-bold text-[#8A4315] uppercase tracking-wider">
              BreviAI Summarizer
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-[#F6EEE5] text-[#B85414] w-fit mb-3">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#22150E]">Live Audio Suite</h3>
            <p className="mt-1 text-xs text-[#6E584C] leading-relaxed">
              Record microphone in-browser with live waveforms, pause/resume, and preview.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 w-fit mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#22150E]">Smart Summaries</h3>
            <p className="mt-1 text-xs text-[#6E584C] leading-relaxed">
              Auto-extract executive summaries, key topics, and major team decisions.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 w-fit mb-3">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#22150E]">Interactive Tasks</h3>
            <p className="mt-1 text-xs text-[#6E584C] leading-relaxed">
              Toggle task checkboxes, assign team owners, set due dates, and add new tasks.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 w-fit mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#22150E]">Export & Share</h3>
            <p className="mt-1 text-xs text-[#6E584C] leading-relaxed">
              Export notes to Markdown, PDF, Plain Text, JSON, or email teammates in one click.
            </p>
          </div>
        </div>

        {/* Security & RLS badge */}
        <div className="mt-8 rounded-2xl border border-[#E6D7C7] bg-[#FAF6F0] p-4 flex items-center justify-between text-xs text-[#6E584C]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Row Level Security (RLS) enabled — all meeting data and recordings remain strictly private.</span>
          </div>
          <Link href="/dashboard" className="font-bold text-[#B85414] hover:underline">
            Launch App →
          </Link>
        </div>
      </main>
    </div>
  );
}
