"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

type AuthFormProps = {
  mode: "login" | "signup";
  redirectTo?: string;
  action?: (
    prevState: { error?: string; message?: string },
    formData: FormData,
  ) => Promise<{ error?: string; message?: string }>;
};

export function AuthForm({ mode, redirectTo = "/dashboard" }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );

  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  async function handleEmailAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const targetDestination = redirectTo || "/dashboard";

      if (mode === "signup") {
        const origin = window.location.origin;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(targetDestination)}`,
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        // If session was not automatically created, attempt sign-in immediately
        if (!data.session) {
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          }).catch(() => null);
        }

        // Navigate immediately to dashboard without triggering full page reload
        router.push(targetDestination);
        router.refresh();
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          router.push(targetDestination);
          router.refresh();
        } else {
          setErrorMessage("Login was not completed. Please try again.");
          setLoading(false);
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during authentication.";
      setErrorMessage(msg);
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setErrorMessage(
          error.message.includes("provider is not enabled")
            ? "Google provider is not enabled yet in your Supabase Dashboard under Authentication -> Providers -> Google."
            : error.message
        );
        setGoogleLoading(false);
        return;
      }

      if (data?.url) {
        try {
          if (window.self !== window.top) {
            window.top!.location.href = data.url;
          } else {
            window.location.href = data.url;
          }
        } catch {
          window.location.href = data.url;
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to initialize Google authentication.";
      setErrorMessage(msg);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-5" id="auth-form-container">
      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Supabase Credentials Notice</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Make sure <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are saved in your environment settings.
            </p>
          </div>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        id="btn-google-auth"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E6D7C7] bg-[#FFFFFF] px-4 py-2.5 text-xs font-semibold text-[#22150E] transition-colors hover:bg-[#F6EEE5] disabled:cursor-not-allowed disabled:opacity-60 shadow-xs cursor-pointer"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#B85414]" />
        ) : (
          <GoogleIcon />
        )}
        <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
      </button>

      {isIframe && (
        <p className="text-[11px] text-[#8A7264] text-center">
          Note: If Google sign-in is blocked in this preview frame,{" "}
          <a
            href={typeof window !== "undefined" ? window.location.href : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#B85414] hover:underline"
          >
            open in a new tab <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      )}

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E6D7C7]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#FFFFFF] px-2 text-[#8A7264] font-medium">
            or continue with email
          </span>
        </div>
      </div>

      {/* Email & Password Form: Added method="POST" to prevent URL params */}
      <form
        id="email-auth-form"
        method="POST"
        onSubmit={handleEmailAuth}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="auth-email-input"
            className="mb-1.5 block text-xs font-semibold text-[#22150E]"
          >
            Email Address
          </label>
          <input
            id="auth-email-input"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-xl border border-[#E6D7C7] bg-[#FAF6F0] px-3.5 py-2.5 text-xs text-[#22150E] placeholder:text-[#8A7264] outline-none ring-[#B85414] focus:ring-2 transition"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label
            htmlFor="auth-password-input"
            className="mb-1.5 block text-xs font-semibold text-[#22150E]"
          >
            Password
          </label>
          <input
            id="auth-password-input"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            className="w-full rounded-xl border border-[#E6D7C7] bg-[#FAF6F0] px-3.5 py-2.5 text-xs text-[#22150E] placeholder:text-[#8A7264] outline-none ring-[#B85414] focus:ring-2 transition"
            placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
          />
        </div>

        {errorMessage && (
          <div
            id="auth-error-message"
            className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            id="auth-success-message"
            className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          id="btn-submit-email-auth"
          type="submit"
          disabled={loading || googleLoading}
          className="w-full rounded-xl bg-[#2A1810] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#3C2317] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
          <span>
            {loading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Sign in with Email"
                : "Create account with Email"}
          </span>
        </button>

        <p className="text-center text-xs text-[#8A7264] pt-2">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link
                id="link-go-to-signup"
                href="/signup"
                className="font-bold text-[#B85414] hover:underline"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                id="link-go-to-login"
                href="/login"
                className="font-bold text-[#B85414] hover:underline"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}