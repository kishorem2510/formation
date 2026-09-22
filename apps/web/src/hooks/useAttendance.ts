import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";

export interface AttendanceRecord {
  eventId: string;
  userId: string;
  status: AttendanceStatus;
  markedBy: string;
}

export function useEventAttendance(teamId: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: ["attendance", teamId, eventId],
    queryFn: () => api.get<AttendanceRecord[]>(`/teams/${teamId}/events/${eventId}/attendance`),
    enabled: !!teamId && !!eventId,
  });
}

export function useMarkAttendance(teamId: string | undefined, eventId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AttendanceStatus }) =>
      api.put(`/teams/${teamId}/events/${eventId}/attendance/${userId}`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["attendance", teamId, eventId] }),
  });
}
