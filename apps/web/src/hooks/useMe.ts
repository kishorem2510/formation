import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TeamMembership {
  teamId: string;
  role: "COACH" | "PLAYER" | "PHYSIO";
}

export interface Me {
  userId: string;
  orgId: string;
  email: string;
  name: string;
  orgRole: "OWNER" | "MANAGER" | "MEMBER";
  teams: TeamMembership[];
}

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Me>("/me"),
    enabled,
    staleTime: 60_000,
  });
}

export function isOrgAdmin(me: Me | undefined): boolean {
  return me?.orgRole === "OWNER" || me?.orgRole === "MANAGER";
}

export function roleOnTeam(me: Me | undefined, teamId: string): string | null {
  return me?.teams.find((t) => t.teamId === teamId)?.role ?? null;
}
