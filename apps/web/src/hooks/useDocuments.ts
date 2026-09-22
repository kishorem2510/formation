import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TeamDocument {
  docId: string;
  teamId: string;
  fileName: string;
  category: string;
  uploadedBy: string;
}

export function useTeamDocuments(teamId: string | undefined) {
  return useQuery({
    queryKey: ["documents", teamId],
    queryFn: () => api.get<TeamDocument[]>(`/teams/${teamId}/documents`),
    enabled: !!teamId,
  });
}

/** Presigns with the API, then PUTs the file straight to S3 -- the file
 * bytes never pass through our Lambdas (see docs_service.handler). */
export function useUploadDocument(teamId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, category }: { file: File; category: string }) => {
      const { uploadUrl } = await api.post<{ docId: string; uploadUrl: string }>(
        `/teams/${teamId}/documents/presign`,
        { fileName: file.name, contentType: file.type, category },
      );
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error("Upload to storage failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents", teamId] }),
  });
}

export function useDownloadDocument(teamId: string | undefined) {
  return useMutation({
    mutationFn: (docId: string) =>
      api.get<{ downloadUrl: string; fileName: string }>(
        `/teams/${teamId}/documents/${docId}/download`,
      ),
  });
}
