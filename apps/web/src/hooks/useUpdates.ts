import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface OrgUpdate {
  updateId: string;
  orgId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
  attachment?: { s3Key: string; fileName: string };
}

export function useOrgUpdates(orgId: string | undefined) {
  return useQuery({
    queryKey: ["updates", orgId],
    queryFn: () => api.get<OrgUpdate[]>(`/orgs/${orgId}/updates`),
    enabled: !!orgId,
  });
}

/** Presigns with the API (if a file is attached), then PUTs straight to S3
 * -- mirrors useDocuments.ts's upload pattern. */
export function usePostUpdate(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, body, file }: { title: string; body: string; file?: File }) => {
      const { uploadUrl } = await api.post<{ updateId: string; uploadUrl: string | null }>(
        `/orgs/${orgId}/updates`,
        {
          title,
          body,
          fileName: file?.name,
          contentType: file?.type,
        },
      );
      if (file && uploadUrl) {
        const res = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!res.ok) throw new Error("Upload to storage failed");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["updates", orgId] }),
  });
}

export function useDeleteUpdate(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updateId: string) => api.delete(`/orgs/${orgId}/updates/${updateId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["updates", orgId] }),
  });
}

export function useDownloadUpdateAttachment(orgId: string | undefined) {
  return useMutation({
    mutationFn: (updateId: string) =>
      api.get<{ downloadUrl: string; fileName: string }>(
        `/orgs/${orgId}/updates/${updateId}/download`,
      ),
  });
}
