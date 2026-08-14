import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/lib/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{
    redirect?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/dashboard";

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to access your meeting notes and action items.
        </p>
      </div>

      {params.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </p>
      )}

      <AuthForm mode="login" redirectTo={redirectTo} action={signIn} />
    </>
  );
}
