"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useMe, isOrgAdmin } from "@/hooks/useMe";
import { useOrgTeams, useOrgMembers, useCreateTeam, useRemoveOrgMember } from "@/hooks/useTeams";
import { createTeamSchema, CreateTeamInput } from "@/lib/schemas";
import { Button, Card, Field, Input } from "@/components/ui";
import { InviteForm } from "@/components/InviteForm";

const ORG_INVITE_ROLES = ["MANAGER", "COACH", "PLAYER", "PHYSIO"] as const;

function CreateTeamForm({ orgId }: { orgId: string }) {
  const createTeam = useCreateTeam(orgId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
  });

  return (
    <form
      onSubmit={handleSubmit((data) => createTeam.mutate(data, { onSuccess: () => reset() }))}
      className="space-y-3"
    >
      <Field label="Team name" error={errors.name?.message}>
        <Input {...register("name")} placeholder="U16 Boys" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Sport">
          <Input {...register("sport")} placeholder="Soccer" />
        </Field>
        <Field label="Age group">
          <Input {...register("ageGroup")} placeholder="U16" />
        </Field>
      </div>
      <Button type="submit" disabled={createTeam.isPending}>
        {createTeam.isPending ? "Creating..." : "Create team"}
      </Button>
    </form>
  );
}

export default function TeamPage() {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const admin = isOrgAdmin(me);
  const { data: teams } = useOrgTeams(admin ? me?.orgId : undefined);
  const { data: members } = useOrgMembers(me?.orgId);
  const removeMember = useRemoveOrgMember(me?.orgId);
  const [panel, setPanel] = useState<"none" | "team" | "invite">("none");

  if (!me) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Team</h1>
        {admin && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setPanel(panel === "team" ? "none" : "team")}>
              {panel === "team" ? "Cancel" : "New team"}
            </Button>
            <Button variant="ghost" onClick={() => setPanel(panel === "invite" ? "none" : "invite")}>
              {panel === "invite" ? "Cancel" : "Invite someone"}
            </Button>
          </div>
        )}
      </div>

      {admin && panel === "team" && (
        <Card>
          <h2 className="mb-3 font-medium">Create a team</h2>
          <CreateTeamForm orgId={me.orgId} />
        </Card>
      )}

      {admin && panel === "invite" && (
        <Card>
          <h2 className="mb-3 font-medium">Invite someone</h2>
          <InviteForm
            orgId={me.orgId}
            allowedRoles={ORG_INVITE_ROLES}
            teamOptions={teams?.map((t) => ({ teamId: t.teamId, name: t.name }))}
            onDone={() => setPanel("none")}
          />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-medium">Members</h2>
        <div className="space-y-1">
          {members?.map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-hover"
            >
              <Link href={`/users/${m.userId}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="truncate text-xs text-muted">
                  {m.orgRole !== "MEMBER" ? m.orgRole : m.teams.map((t) => t.role).join(", ") || "No team"}
                </p>
              </Link>
              {admin && m.orgRole !== "OWNER" && m.userId !== me.userId && (
                <button
                  onClick={() => {
                    if (confirm(`Remove ${m.name} from the organization?`)) {
                      removeMember.mutate(m.userId);
                    }
                  }}
                  className="shrink-0 text-sm text-danger hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {members?.length === 0 && (
            <p className="text-sm text-muted">
              {admin ? "No members yet -- invite someone to get started." : "No teammates to show yet."}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
