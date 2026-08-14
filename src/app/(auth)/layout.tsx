import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            Recap<span className="text-accent">AI</span>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
