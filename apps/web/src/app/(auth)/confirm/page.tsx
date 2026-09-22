"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { confirmSignUp } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";
import { confirmSchema, type ConfirmInput } from "@/lib/schemas";
import { Button, Field, Input } from "@/components/ui";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";

function ConfirmForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmInput>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { email: params.get("email") ?? "" },
  });

  async function onSubmit(data: ConfirmInput) {
    setSubmitError(null);
    configureAmplify();
    try {
      await confirmSignUp({ username: data.email, confirmationCode: data.code });
      router.push("/login");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Confirmation failed");
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Check your email</h1>
      <p className="mb-6 text-sm text-muted">
        Enter the 6-digit code we just sent you to activate your account.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
        <Field label="Verification code" error={errors.code?.message}>
          <Input {...register("code")} placeholder="123456" />
        </Field>
        {submitError && <p className="text-sm text-danger">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Verifying..." : "Verify"}
        </Button>
      </form>
    </>
  );
}

export default function ConfirmPage() {
  return (
    <AuthSplitLayout
      eyebrow="Almost there"
      headline="One code away from kickoff."
      body="Verifying your email keeps your organization's data secured to you from day one."
    >
      <Suspense fallback={null}>
        <ConfirmForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
