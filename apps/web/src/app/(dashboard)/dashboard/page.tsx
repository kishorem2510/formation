"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useMe, isOrgAdmin } from "@/hooks/useMe";
import { useOrg } from "@/hooks/useOrg";
import { useMyTeams } from "@/hooks/useMyTeams";
import { useOrgMembers } from "@/hooks/useTeams";
import { useOrgUpdates } from "@/hooks/useUpdates";
import { Card } from "@/components/ui";

function Widget({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-surface-hover">
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const { data: org } = useOrg(me?.orgId);
  const { teams } = useMyTeams(me);
  const admin = isOrgAdmin(me);
  const { data: members } = useOrgMembers(admin ? me?.orgId : undefined);
  const { data: updates } = useOrgUpdates(me?.orgId);
  const latestUpdate = updates?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome to {org?.name ?? "your organization"}</h1>
        <p className="text-muted">
          {me?.name} &middot; {me?.orgRole}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Widget label="Teams" value={teams.length} href="/team" />
        {admin && <Widget label="Members" value={members?.length ?? "—"} href="/team" />}
        <Widget label="Updates" value={updates?.length ?? "—"} href="/updates" />
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Your teams</h2>
        {teams.length ? (
          <ul className="space-y-2">
            {teams.map((t) => (
              <li key={t.teamId}>
                <span className="font-medium">{t.name}</span>
                <span className="ml-2 text-sm text-muted">
                  {t.sport ?? "—"} {t.ageGroup ? `· ${t.ageGroup}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            {admin ? (
              <>
                No teams yet. <Link href="/team" className="text-accent hover:underline">Create one</Link>.
              </>
            ) : (
              "You haven't been added to a team yet."
            )}
          </p>
        )}
      </Card>

      {latestUpdate && (
        <Card>
          <h2 className="mb-1 font-medium">Latest update</h2>
          <p className="mb-1 text-sm font-medium">{latestUpdate.title}</p>
          <p className="mb-3 text-sm text-muted line-clamp-2">{latestUpdate.body}</p>
          <Link href="/updates" className="text-sm text-accent hover:underline">
            See all updates
          </Link>
        </Card>
      )}
    </div>
  );
}
