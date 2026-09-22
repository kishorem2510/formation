"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { IconEye, IconEyeOff, IconCheck, IconCircle } from "@/components/icons";

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ className = "", ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          {...props}
          className={`w-full rounded-lg border border-border bg-background px-3.5 py-2.5 pr-11 text-foreground outline-none transition-colors focus:border-accent ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    );
  },
);

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1.5 text-sm ${met ? "text-accent" : "text-muted"}`}>
      {met ? <IconCheck className="h-4 w-4" /> : <IconCircle className="h-4 w-4" />}
      {label}
    </span>
  );
}

/** Mirrors the Cognito password policy -- see lib/schemas.ts passwordSchema. */
export function PasswordRequirements({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword?: string;
}) {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const showMatch = confirmPassword !== undefined;
  const matches = showMatch && confirmPassword.length > 0 && password === confirmPassword;

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        Password requirements
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <Requirement met={hasLength} label="8+ characters" />
        <Requirement met={hasUpper} label="Uppercase letter" />
        <Requirement met={hasNumber} label="One number" />
        {showMatch && <Requirement met={matches} label="Passwords match" />}
      </div>
    </div>
  );
}
