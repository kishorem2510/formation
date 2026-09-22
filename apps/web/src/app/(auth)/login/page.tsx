"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, confirmSignIn } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";
import { loginSchema, type LoginInput, newPasswordSchema, type NewPasswordInput } from "@/lib/schemas";
import { Button, Field, Input } from "@/components/ui";
import { PasswordInput, PasswordRequirements } from "@/components/PasswordField";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";

const PANEL_PROPS = {
  eyebrow: "Welcome back",
  headline: "Run your season from your pocket.",
  body: "Sign in to check today's schedule, mark attendance, or see who's on the roster.",
};

function NewPasswordStep({ onSubmit }: { onSubmit: (password: string) => Promise<void> }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) });
  const password = useWatch({ control, name: "password" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";

  async function submit(data: NewPasswordInput) {
    setSubmitError(null);
    try {
      await onSubmit(data.password);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not set password");
    }
  }

  return (
    <AuthSplitLayout {...PANEL_PROPS}>
      <h1 className="mb-1 text-2xl font-semibold">Set your password</h1>
      <p className="mb-6 text-sm text-muted">
        First sign-in &mdash; choose a permanent password.
      </p>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <Field label="New password" error={errors.password?.message}>
          <PasswordInput {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput {...register("confirmPassword")} />
        </Field>
        <PasswordRequirements password={password} confirmPassword={confirmPassword} />
        {submitError && <p className="text-sm text-danger">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Setting password..." : "Set password & continue"}
        </Button>
      </form>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Invited users (Coach/Player/Physio/Manager) are created via
  // AdminCreateUser and must set a permanent password on first sign-in.
  const [needsNewPassword, setNeedsNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setSubmitError(null);
    configureAmplify();
    try {
      const result = await signIn({ username: data.email, password: data.password });
      if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setNeedsNewPassword(true);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      // A stale Cognito session was still active in this browser -- the
      // AuthLayout redirect should normally prevent reaching this page at
      // all, but if we still land here mid-race, treat it as success.
      if (err instanceof Error && /already a signed in user/i.test(err.message)) {
        router.push("/dashboard");
        return;
      }
      setSubmitError(err instanceof Error ? err.message : "Sign in failed");
    }
  }

  async function onSetNewPassword(newPassword: string) {
    await confirmSignIn({ challengeResponse: newPassword });
    router.push("/dashboard");
  }

  if (needsNewPassword) {
    return <NewPasswordStep onSubmit={onSetNewPassword} />;
  }

  return (
    <AuthSplitLayout {...PANEL_PROPS}>
      <h1 className="mb-1 text-2xl font-semibold">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
        <div>
          <Field label="Password" error={errors.password?.message}>
            <PasswordInput {...register("password")} />
          </Field>
          <a href="/forgot-password" className="mt-1.5 block text-right text-sm text-accent hover:underline">
            Forgot password?
          </a>
        </div>
        {submitError && <p className="text-sm text-danger">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New organization?{" "}
        <a href="/signup" className="text-accent hover:underline">
          Create one
        </a>
      </p>
    </AuthSplitLayout>
  );
}
