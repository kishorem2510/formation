"use client";

import { useTeamMembers } from "@/hooks/useTeams";
import { useEventAttendance, useMarkAttendance, AttendanceStatus } from "@/hooks/useAttendance";
import { Select } from "@/components/ui";

export function AttendancePanel({
  teamId,
  eventId,
  canMark,
}: {
  teamId: string;
  eventId: string;
  canMark: boolean;
}) {
  const { data: members } = useTeamMembers(teamId);
  const { data: attendance } = useEventAttendance(teamId, eventId);
  const mark = useMarkAttendance(teamId, eventId);
  const players = members?.filter((m) => m.role === "PLAYER") ?? [];

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {players.map((p) => {
        const record = attendance?.find((a) => a.userId === p.userId);
        return (
          <div key={p.userId} className="flex items-center justify-between text-sm">
            <span>{p.userId}</span>
            {canMark ? (
              <Select
                value={record?.status ?? ""}
                onChange={(e) =>
                  mark.mutate({ userId: p.userId, status: e.target.value as AttendanceStatus })
                }
                className="w-40"
              >
                <option value="" disabled>
                  Mark...
                </option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="EXCUSED">Excused</option>
              </Select>
            ) : (
              <span className="text-muted">{record?.status ?? "Not marked"}</span>
            )}
          </div>
        );
      })}
      {players.length === 0 && <p className="text-sm text-muted">No players on this team yet.</p>}
    </div>
  );
}
