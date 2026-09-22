"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, confirmSignIn } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { Button, Card, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Invited users (Coach/Player/Physio/Manager) are created via
  // AdminCreateUser and must set a permanent password on first sign-in.
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

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
      setSubmitError(err instanceof Error ? err.message : "Sign in failed");
    }
  }

  async function onSetNewPassword() {
    setSubmitError(null);
    try {
      await confirmSignIn({ challengeResponse: newPassword });
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not set password");
    }
  }

  if (needsNewPassword) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Card>
          <h1 className="mb-1 text-2xl font-semibold">Set your password</h1>
          <p className="mb-6 text-sm text-muted">
            First sign-in &mdash; choose a permanent password.
          </p>
          <div className="space-y-4">
            <Field label="New password">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>
            {submitError && <p className="text-sm text-danger">{submitError}</p>}
            <Button onClick={onSetNewPassword} className="w-full">
              Set password &amp; continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <h1 className="mb-1 text-2xl font-semibold">Sign in</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <Input type="password" {...register("password")} />
          </Field>
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
      </Card>
    </div>
  );
}
