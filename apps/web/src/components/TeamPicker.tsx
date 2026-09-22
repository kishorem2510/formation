"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Select } from "@/components/ui";
import { Team } from "@/hooks/useTeams";

/** Keeps the globally-selected team (Zustand) valid as the available team
 * list loads/changes -- auto-picks the first team, re-picks if the
 * previously selected one drops out of the list (e.g. switched orgs). */
export function useTeamSelection(teams: Team[]): string | undefined {
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const setSelectedTeamId = useAppStore((s) => s.setSelectedTeamId);

  useEffect(() => {
    if (teams.length === 0) return;
    const stillValid = teams.some((t) => t.teamId === selectedTeamId);
    if (!stillValid) setSelectedTeamId(teams[0].teamId);
  }, [teams, selectedTeamId, setSelectedTeamId]);

  return teams.some((t) => t.teamId === selectedTeamId) ? (selectedTeamId ?? undefined) : undefined;
}

export function TeamPicker({ teams }: { teams: Team[] }) {
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const setSelectedTeamId = useAppStore((s) => s.setSelectedTeamId);

  if (teams.length <= 1) return null;

  return (
    <Select
      value={selectedTeamId ?? ""}
      onChange={(e) => setSelectedTeamId(e.target.value)}
      className="mb-6 w-full sm:w-64"
    >
      {teams.map((t) => (
        <option key={t.teamId} value={t.teamId}>
          {t.name}
        </option>
      ))}
    </Select>
  );
}
