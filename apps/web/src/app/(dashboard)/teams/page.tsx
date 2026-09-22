"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useMe, isOrgAdmin } from "@/hooks/useMe";
import { useOrgTeams, useCreateTeam } from "@/hooks/useTeams";
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
    <Card>
      <h2 className="mb-3 font-medium">Create a team</h2>
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
    </Card>
  );
}

function TeamsContent() {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const { data: teams } = useOrgTeams(isOrgAdmin(me) ? me?.orgId : undefined);
  const params = useSearchParams();
  const [showInvite, setShowInvite] = useState(params.get("invite") === "1");

  if (!me) return null;

  if (!isOrgAdmin(me)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Your teams</h1>
        {me.teams.map((t) => (
          <Card key={t.teamId}>
            <Link href={`/teams/${t.teamId}`} className="text-accent hover:underline">
              {t.teamId}
            </Link>
            <span className="ml-2 text-sm text-muted">({t.role})</span>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Teams</h1>
        <Button variant="ghost" onClick={() => setShowInvite((v) => !v)}>
          {showInvite ? "Hide invite" : "Invite someone"}
        </Button>
      </div>

      <CreateTeamForm orgId={me.orgId} />
      {showInvite && (
        <Card>
          <h2 className="mb-3 font-medium">Invite someone</h2>
          <InviteForm orgId={me.orgId} allowedRoles={ORG_INVITE_ROLES} />
        </Card>
      )}

      <div className="space-y-3">
        {teams?.map((team) => (
          <Card key={team.teamId}>
            <Link href={`/teams/${team.teamId}`} className="font-medium text-accent hover:underline">
              {team.name}
            </Link>
            <p className="text-sm text-muted">
              {team.sport ?? "—"} {team.ageGroup ? `· ${team.ageGroup}` : ""}
            </p>
          </Card>
        ))}
        {teams?.length === 0 && <p className="text-sm text-muted">No teams yet.</p>}
      </div>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={null}>
      <TeamsContent />
    </Suspense>
  );
}
