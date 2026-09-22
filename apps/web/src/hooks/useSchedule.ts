import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreateEventInput } from "@/lib/schemas";

export interface TeamEvent {
  eventId: string;
  teamId: string;
  eventType: "GAME" | "PRACTICE";
  startTime: string;
  endTime?: string;
  location?: string;
  notes?: string;
}

export function useTeamEvents(teamId: string | undefined) {
  return useQuery({
    queryKey: ["events", teamId],
    queryFn: () => api.get<TeamEvent[]>(`/teams/${teamId}/events`),
    enabled: !!teamId,
  });
}

export function useCreateEvent(teamId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventInput) =>
      api.post<TeamEvent>(`/teams/${teamId}/events`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events", teamId] }),
  });
}
