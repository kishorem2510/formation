import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Me, isOrgAdmin } from "@/hooks/useMe";
import { useOrgTeams, Team } from "@/hooks/useTeams";

/** Org admins see every team in the org; everyone else sees only the teams
 * they're a member of (fetched individually since /me only returns
 * teamId+role, not the team's name). */
export function useMyTeams(me: Me | undefined) {
  const admin = isOrgAdmin(me);
  const orgTeams = useOrgTeams(admin ? me?.orgId : undefined);

  const teamIds = !admin ? (me?.teams.map((t) => t.teamId) ?? []) : [];
  const results = useQueries({
    queries: teamIds.map((teamId) => ({
      queryKey: ["team", teamId],
      queryFn: () => api.get<Team>(`/teams/${teamId}`),
      enabled: !admin,
    })),
  });

  if (admin) {
    return { teams: orgTeams.data ?? [], isLoading: orgTeams.isLoading };
  }
  const teams = results.map((r) => r.data).filter((t): t is Team => !!t);
  return { teams, isLoading: !me || results.some((r) => r.isLoading) };
}
