"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { usePermissions } from "@/hooks/usePermissions";
import { useMyTeams } from "@/hooks/useMyTeams";
import { useTeamEvents } from "@/hooks/useSchedule";
import { TeamPicker, useTeamSelection } from "@/components/TeamPicker";
import { AttendancePanel } from "@/components/team/AttendancePanel";
import { Card } from "@/components/ui";

function EventAttendance({ teamId, canMark }: { teamId: string; canMark: boolean }) {
  const { data: events } = useTeamEvents(teamId);
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = events?.slice().sort((a, b) => b.startTime.localeCompare(a.startTime));

  return (
    <Card>
      <h2 className="mb-3 font-medium">Events</h2>
      <ul className="space-y-2">
        {sorted?.map((e) => (
          <li key={e.eventId} className="rounded-lg border border-border p-3">
            <button
              className="flex w-full items-center justify-between text-left text-sm"
              onClick={() => setExpanded(expanded === e.eventId ? null : e.eventId)}
            >
              <span>
                <span className="font-medium">{e.eventType}</span>{" "}
                {new Date(e.startTime).toLocaleString()}
                {e.location ? ` · ${e.location}` : ""}
              </span>
              <span className="text-muted">{expanded === e.eventId ? "Hide" : "View"}</span>
            </button>
            {expanded === e.eventId && (
              <AttendancePanel teamId={teamId} eventId={e.eventId} canMark={canMark} />
            )}
          </li>
        ))}
        {sorted?.length === 0 && <p className="text-sm text-muted">No events yet.</p>}
      </ul>
    </Card>
  );
}

export default function AttendancePage() {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const { teams, isLoading } = useMyTeams(me);
  const teamId = useTeamSelection(teams);
  const { can } = usePermissions();
  const canMark = can("attendance:mark");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <TeamPicker teams={teams} />

      {!isLoading && teams.length === 0 && (
        <p className="text-sm text-muted">You&apos;re not on a team yet.</p>
      )}

      {teamId && <EventAttendance teamId={teamId} canMark={canMark} />}
    </div>
  );
}
