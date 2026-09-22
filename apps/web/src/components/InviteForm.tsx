"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteSchema, InviteInput } from "@/lib/schemas";
import { useInviteUser } from "@/hooks/useTeams";
import { Button, Field, Input, Select } from "@/components/ui";
import { PasswordInput, PasswordRequirements } from "@/components/PasswordField";

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Manager (org-wide)",
  COACH: "Coach",
  PLAYER: "Player",
  PHYSIO: "Physio",
};

export function InviteForm({
  orgId,
  allowedRoles,
  fixedTeamId,
  teamOptions,
  onDone,
}: {
  orgId: string;
  allowedRoles: readonly string[];
  fixedTeamId?: string;
  /** When provided, the team field renders as a dropdown instead of a
   * free-text id field. Ignored when fixedTeamId is set. */
  teamOptions?: { teamId: string; name: string }[];
  onDone?: () => void;
}) {
  const invite = useInviteUser(orgId);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { teamId: fixedTeamId, mode: "EMAIL" },
  });
  const mode = useWatch({ control, name: "mode" });
  const role = useWatch({ control, name: "role" });
  const password = useWatch({ control, name: "password" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";

  if (credentials) {
    return (
      <div className="space-y-3 rounded-lg border border-accent/40 bg-accent/10 p-4">
        <p className="text-sm font-medium">
          Share these credentials with {credentials.email} now &mdash; they won&apos;t be shown
          again.
        </p>
        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2.5">
          <span className="font-mono text-sm">{credentials.password}</span>
          <button
            type="button"
            className="text-sm text-accent hover:underline"
            onClick={async () => {
              await navigator.clipboard.writeText(credentials.password);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setCredentials(null);
            setCopied(false);
            onDone?.();
          }}
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((data) =>
        invite.mutate(data, {
          onSuccess: (result) => {
            reset({ teamId: fixedTeamId, mode: "EMAIL" });
            if (result.temporaryPassword) {
              setCredentials({ email: data.email, password: result.temporaryPassword });
            } else {
              onDone?.();
            }
          },
        }),
      )}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" error={errors.name?.message}>
          <Input {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
      </div>

      <Field label="Role" error={errors.role?.message}>
        <Select {...register("role")} defaultValue="">
          <option value="" disabled>
            Select a role
          </option>
          {allowedRoles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>

      {!fixedTeamId && role && role !== "MANAGER" && (
        <Field label="Team" error={errors.teamId?.message}>
          {teamOptions ? (
            <Select {...register("teamId")} defaultValue="">
              <option value="" disabled>
                Select a team
              </option>
              {teamOptions.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input {...register("teamId")} placeholder="Paste the team's id" />
          )}
        </Field>
      )}

      <div>
        <span className="mb-1.5 block text-sm font-medium text-muted">How should they get access?</span>
        <div className="flex gap-2 rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setValue("mode", "EMAIL")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "EMAIL" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            Email invite
          </button>
          <button
            type="button"
            onClick={() => setValue("mode", "MANUAL")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "MANUAL" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            Create credentials
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {mode === "EMAIL"
            ? "Cognito emails them a temporary password directly."
            : "You set a temporary password here and share it with them yourself."}
        </p>
      </div>

      {mode === "MANUAL" && (
        <>
          <Field label="Temporary password" error={errors.password?.message}>
            <PasswordInput {...register("password")} />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <PasswordInput {...register("confirmPassword")} />
          </Field>
          <PasswordRequirements password={password} confirmPassword={confirmPassword} />
        </>
      )}

      {invite.isError && <p className="text-sm text-danger">{(invite.error as Error).message}</p>}
      <Button type="submit" disabled={invite.isPending}>
        {invite.isPending ? "Sending invite..." : "Send invite"}
      </Button>
    </form>
  );
}
