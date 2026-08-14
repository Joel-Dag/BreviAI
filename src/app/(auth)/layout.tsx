import Link from "next/link";
import { JBitMascot } from "@/components/brand/jbit-mascot";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col bg-[#FBF8F3]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 text-center flex flex-col items-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2 group">
            <JBitMascot size="lg" glow />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold tracking-tight text-[#22150E]">
                Brevi<span className="text-[#B85414]">AI</span>
              </span>
            </div>
          </Link>
          <p className="mt-2 text-xs text-[#8A7264]">AI-Powered Meeting Transcripts & Summaries</p>
        </div>

        <div className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

