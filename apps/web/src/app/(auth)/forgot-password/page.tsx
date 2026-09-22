"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";
import {
  requestResetSchema,
  RequestResetInput,
  resetPasswordSchema,
  ResetPasswordInput,
} from "@/lib/schemas";
import { Button, Field, Input } from "@/components/ui";
import { PasswordInput, PasswordRequirements } from "@/components/PasswordField";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";

const PANEL_PROPS = {
  eyebrow: "Account recovery",
  headline: "Back in, in two steps.",
  body: "We'll email you a verification code to confirm it's really you before setting a new password.",
};

function RequestCodeStep({ onSent }: { onSent: (email: string) => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const params = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetInput>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: params.get("email") ?? "" },
  });

  async function onSubmit(data: RequestResetInput) {
    setSubmitError(null);
    configureAmplify();
    try {
      await resetPassword({ username: data.email });
      onSent(data.email);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not send a code");
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Reset your password</h1>
      <p className="mb-6 text-sm text-muted">
        Enter your account email and we&apos;ll send a verification code.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
        {submitError && <p className="text-sm text-danger">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Sending code..." : "Send verification code"}
        </Button>
      </form>
    </>
  );
}

function ConfirmResetStep({ email }: { email: string }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email },
  });
  const password = useWatch({ control, name: "password" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";

  async function onSubmit(data: ResetPasswordInput) {
    setSubmitError(null);
    try {
      await confirmResetPassword({
        username: data.email,
        confirmationCode: data.code,
        newPassword: data.password,
      });
      router.push("/login");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not reset password");
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Check your email</h1>
      <p className="mb-6 text-sm text-muted">
        Enter the code we sent to <span className="text-foreground">{email}</span> along with
        your new password.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("email")} />
        <Field label="Verification code" error={errors.code?.message}>
          <Input {...register("code")} placeholder="123456" />
        </Field>
        <Field label="New password" error={errors.password?.message}>
          <PasswordInput {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput {...register("confirmPassword")} />
        </Field>
        <PasswordRequirements password={password} confirmPassword={confirmPassword} />
        {submitError && <p className="text-sm text-danger">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    </>
  );
}

function ForgotPasswordFlow() {
  const [email, setEmail] = useState<string | null>(null);
  return (
    <AuthSplitLayout {...PANEL_PROPS}>
      {email ? <ConfirmResetStep email={email} /> : <RequestCodeStep onSent={setEmail} />}
    </AuthSplitLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordFlow />
    </Suspense>
  );
}
