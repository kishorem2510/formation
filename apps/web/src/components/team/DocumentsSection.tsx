"use client";

import { useTeamDocuments, useUploadDocument, useDownloadDocument } from "@/hooks/useDocuments";

export function DocumentsSection({ teamId, canUpload }: { teamId: string; canUpload: boolean }) {
  const { data: docs } = useTeamDocuments(teamId);
  const upload = useUploadDocument(teamId);
  const download = useDownloadDocument(teamId);

  return (
    <div>
      <ul className="mb-4 space-y-1.5">
        {docs?.map((d) => (
          <li key={d.docId} className="flex items-center justify-between text-sm">
            <span>
              {d.fileName} <span className="text-muted">({d.category})</span>
            </span>
            <button
              className="text-accent hover:underline"
              onClick={async () => {
                const { downloadUrl } = await download.mutateAsync(d.docId);
                window.open(downloadUrl, "_blank");
              }}
            >
              Download
            </button>
          </li>
        ))}
        {docs?.length === 0 && <p className="text-sm text-muted">No documents yet.</p>}
      </ul>

      {canUpload && (
        <input
          type="file"
          className="text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate({ file, category: "GENERAL" });
          }}
        />
      )}
    </div>
  );
}
