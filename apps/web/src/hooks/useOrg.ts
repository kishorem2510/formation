import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Org {
  orgId: string;
  name: string;
  createdAt: string;
}

export function useOrg(orgId: string | undefined) {
  return useQuery({
    queryKey: ["org", orgId],
    queryFn: () => api.get<Org>(`/orgs/${orgId}`),
    enabled: !!orgId,
  });
}
