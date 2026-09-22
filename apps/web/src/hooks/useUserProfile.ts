import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UserProfile {
  userId: string;
  orgId: string;
  email: string;
  name: string;
  orgRole: "OWNER" | "MANAGER" | "MEMBER";
  status: string;
  teams: { teamId: string; role: string }[];
  dob?: string;
  height?: string;
  weight?: string;
  jerseySize?: string;
}

export type ProfileUpdateInput = Partial<
  Pick<UserProfile, "name" | "dob" | "height" | "weight" | "jerseySize">
>;

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => api.get<UserProfile>(`/users/${userId}`),
    enabled: !!userId,
  });
}

export function useUpdateUserProfile(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdateInput) => api.put<UserProfile>(`/users/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
