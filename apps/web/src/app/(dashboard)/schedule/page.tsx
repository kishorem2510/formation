"use client";

import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { usePermissions } from "@/hooks/usePermissions";
import { useMyTeams } from "@/hooks/useMyTeams";
import { TeamPicker, useTeamSelection } from "@/components/TeamPicker";
import { ScheduleSection } from "@/components/team/ScheduleSection";
import { Card } from "@/components/ui";

export default function SchedulePage() {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const { teams, isLoading } = useMyTeams(me);
  const teamId = useTeamSelection(teams);
  const { can } = usePermissions();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Schedule</h1>
      <TeamPicker teams={teams} />

      {!isLoading && teams.length === 0 && (
        <p className="text-sm text-muted">You&apos;re not on a team yet.</p>
      )}

      {teamId && (
        <Card>
          <ScheduleSection teamId={teamId} canManage={can("schedule:manage")} />
        </Card>
      )}
    </div>
  );
}
