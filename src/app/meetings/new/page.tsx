import AudioUploader from "@/components/upload/AudioUploader";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { ArrowLeft } from "lucide-react";

export default function NewMeetingPage() {
  return (
    <div className="flex flex-1 flex-col min-h-screen bg-[#FBF8F3]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {/* Navigation / Back link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A7264] hover:text-[#22150E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Audio Uploader Component */}
        <AudioUploader />
      </main>
    </div>
  );
}
