import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/lib/auth/actions";

export default function SignUpPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted">
          Start free with 3 meetings per month. No credit card required.
        </p>
      </div>

      <AuthForm mode="signup" action={signUp} />
    </>
  );
}
