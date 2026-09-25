"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";
import { signupSchema, type SignupInput } from "@/lib/schemas";
import { Button, Field, Input } from "@/components/ui";
import { PasswordInput, PasswordRequirements } from "@/components/PasswordField";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";

export default function SignupPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });
  const password = useWatch({ control, name: "password" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";

  async function onSubmit(data: SignupInput) {
    setSubmitError(null);
    configureAmplify();
    try {
      await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: { email: data.email, name: data.name },
        },
      });
      // orgName rides through to /confirm and gets passed to confirmSignUp's
      // own clientMetadata there -- Cognito scopes clientMetadata per API
      // call, so passing it here (to signUp) would only ever reach the
      // Pre-Sign-up trigger, never post_confirmation_trigger.py, which fires
      // during the separate confirmSignUp call.
      router.push(
        `/confirm?email=${encodeURIComponent(data.email)}&orgName=${encodeURIComponent(data.orgName)}`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Sign up failed");
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Get started"
      headline="One platform for the whole club."
      body="Rosters, schedules, attendance and documents — with role-based access built in from day one."
    >
      <h1 className="mb-1 text-2xl font-semibold">Create your organization</h1>
      <p className="mb-6 text-sm text-muted">
        You&apos;ll be the Owner &mdash; invite Coaches, Players, Physios and
        Managers once you&apos;re in.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Organization name" error={errors.orgName?.message}>
          <Input {...register("orgName")} placeholder="Riverside FC" />
        </Field>
        <Field label="Your name" error={errors.name?.message}>
          <Input {...register("name")} placeholder="Jordan Smith" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} placeholder="you@club.com" />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <PasswordInput {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput {...register("confirmPassword")} />
        </Field>
        <PasswordRequirements password={password} confirmPassword={confirmPassword} />
        {submitError && <p className="text-sm text-danger">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create organization"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <a href="/login" className="text-accent hover:underline">
          Sign in
        </a>
      </p>
    </AuthSplitLayout>
  );
}
