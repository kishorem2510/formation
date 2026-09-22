"use client";

import { useAuth } from "@/hooks/useAuth";
import { useMe, isOrgAdmin, roleOnTeam } from "@/hooks/useMe";
import { useMyTeams } from "@/hooks/useMyTeams";
import { TeamPicker, useTeamSelection } from "@/components/TeamPicker";
import { DocumentsSection } from "@/components/team/DocumentsSection";
import { Card } from "@/components/ui";

export default function DocumentsPage() {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const { teams, isLoading } = useMyTeams(me);
  const teamId = useTeamSelection(teams);
  const role = roleOnTeam(me, teamId ?? "");
  const canUpload = isOrgAdmin(me) || role === "COACH" || role === "PHYSIO";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Documents</h1>
      <TeamPicker teams={teams} />

      {!isLoading && teams.length === 0 && (
        <p className="text-sm text-muted">You&apos;re not on a team yet.</p>
      )}

      {teamId && (
        <Card>
          <DocumentsSection teamId={teamId} canUpload={canUpload} />
        </Card>
      )}
    </div>
  );
}
