import AudioUploader from "@/components/upload/AudioUploader";
import Link from "next/link";

export default function NewMeetingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation / Back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload or Record Meeting</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload an existing audio file or record directly from your browser to generate summary and action items.
          </p>
        </div>

        {/* Audio Uploader Component */}
        <AudioUploader />
      </div>
    </div>
  );
}