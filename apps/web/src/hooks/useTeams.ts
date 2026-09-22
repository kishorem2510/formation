import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreateTeamInput, InviteInput } from "@/lib/schemas";

export interface Team {
  teamId: string;
  orgId: string;
  name: string;
  sport?: string;
  ageGroup?: string;
}

export interface TeamMember {
  userId: string;
  role: "COACH" | "PLAYER" | "PHYSIO";
  teamId: string;
}

export function useOrgTeams(orgId: string | undefined) {
  return useQuery({
    queryKey: ["orgTeams", orgId],
    queryFn: () => api.get<Team[]>(`/orgs/${orgId}/teams`),
    enabled: !!orgId,
  });
}

export function useTeam(teamId: string | undefined) {
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: () => api.get<Team>(`/teams/${teamId}`),
    enabled: !!teamId,
  });
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ["teamMembers", teamId],
    queryFn: () => api.get<TeamMember[]>(`/teams/${teamId}/members`),
    enabled: !!teamId,
  });
}

export function useCreateTeam(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTeamInput) => api.post<Team>(`/orgs/${orgId}/teams`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orgTeams", orgId] }),
  });
}

export function useInviteUser(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteInput) => api.post(`/orgs/${orgId}/invites`, data),
    onSuccess: (_, variables) => {
      if (variables.teamId) {
        queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.teamId] });
      }
    },
  });
}
