"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { usePermissions } from "@/hooks/usePermissions";
import { useOrgUpdates, usePostUpdate, useDeleteUpdate, useDownloadUpdateAttachment } from "@/hooks/useUpdates";
import { updateSchema, UpdateInput } from "@/lib/schemas";
import { Button, Card, Field, Input } from "@/components/ui";

function PostUpdateForm({ orgId }: { orgId: string }) {
  const post = usePostUpdate(orgId);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [fileInputKey, setFileInputKey] = useState(0);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateInput>({
    resolver: zodResolver(updateSchema),
  });

  function onSubmit(data: UpdateInput) {
    post.mutate(
      { ...data, file },
      {
        onSuccess: () => {
          reset();
          setFile(undefined);
          setFileInputKey((k) => k + 1);
        },
      },
    );
  }

  return (
    <Card>
      <h2 className="mb-3 font-medium">Post an update</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Field label="Title" error={errors.title?.message}>
          <Input {...register("title")} placeholder="Practice moved to Friday" />
        </Field>
        <Field label="Message" error={errors.body?.message}>
          <textarea
            {...register("body")}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-foreground outline-none transition-colors focus:border-accent"
          />
        </Field>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-muted">
            Attachment (PDF or image, optional)
          </span>
          <input
            key={fileInputKey}
            type="file"
            accept="application/pdf,image/*"
            className="text-sm"
            onChange={(e) => setFile(e.target.files?.[0])}
          />
        </div>
        {post.isError && <p className="text-sm text-danger">{(post.error as Error).message}</p>}
        <Button type="submit" disabled={post.isPending}>
          {post.isPending ? "Posting..." : "Post update"}
        </Button>
      </form>
    </Card>
  );
}

export default function UpdatesPage() {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const { data: updates } = useOrgUpdates(me?.orgId);
  const deleteUpdate = useDeleteUpdate(me?.orgId);
  const download = useDownloadUpdateAttachment(me?.orgId);
  const { can } = usePermissions();
  const admin = can("updates:post");
  const [showForm, setShowForm] = useState(false);

  if (!me) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Updates</h1>
        {admin && (
          <Button variant="ghost" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "New update"}
          </Button>
        )}
      </div>

      {admin && showForm && <PostUpdateForm orgId={me.orgId} />}

      <div className="space-y-3">
        {updates?.map((u) => (
          <Card key={u.updateId}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{u.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{u.body}</p>
                <p className="mt-2 text-xs text-muted">
                  {new Date(u.createdAt).toLocaleString()}
                </p>
              </div>
              {admin && (
                <button
                  onClick={() => {
                    if (confirm("Delete this update?")) deleteUpdate.mutate(u.updateId);
                  }}
                  className="shrink-0 text-sm text-danger hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
            {u.attachment && (
              <button
                className="mt-3 text-sm text-accent hover:underline"
                onClick={async () => {
                  const { downloadUrl } = await download.mutateAsync(u.updateId);
                  window.open(downloadUrl, "_blank");
                }}
              >
                {u.attachment.fileName}
              </button>
            )}
          </Card>
        ))}
        {updates?.length === 0 && <p className="text-sm text-muted">No updates yet.</p>}
      </div>
    </div>
  );
}
