"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useMe, isOrgAdmin } from "@/hooks/useMe";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/useUserProfile";
import { profileSchema, ProfileInput } from "@/lib/schemas";
import { Button, Card, Field, Input } from "@/components/ui";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span>{value || "—"}</span>
    </div>
  );
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const { data: profile } = useUserProfile(userId);
  const updateProfile = useUpdateUserProfile(userId);

  const canEdit = !!me && (me.userId === userId || isOrgAdmin(me));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        dob: profile.dob ?? "",
        height: profile.height ?? "",
        weight: profile.weight ?? "",
        jerseySize: profile.jerseySize ?? "",
      });
    }
  }, [profile, reset]);

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{profile.name}</h1>
        <p className="text-muted">
          {profile.orgRole !== "MEMBER" ? profile.orgRole : "Team member"}
          {profile.teams.length > 0 && ` · ${profile.teams.map((t) => t.role).join(", ")}`}
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Account</h2>
        <Row label="Email" value={profile.email} />
        <Row label="Status" value={profile.status} />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Athlete details</h2>
        {canEdit ? (
          <form
            onSubmit={handleSubmit((data) => updateProfile.mutate(data))}
            className="space-y-3"
          >
            <Field label="Name" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of birth">
                <Input type="date" {...register("dob")} />
              </Field>
              <Field label="Jersey size">
                <Input {...register("jerseySize")} placeholder="M, L, 10-12Y..." />
              </Field>
              <Field label="Height">
                <Input {...register("height")} placeholder={'5\'10" or 178 cm'} />
              </Field>
              <Field label="Weight">
                <Input {...register("weight")} placeholder="75 kg or 165 lb" />
              </Field>
            </div>
            {updateProfile.isSuccess && !isDirty && (
              <p className="text-sm text-accent">Saved.</p>
            )}
            <Button type="submit" disabled={updateProfile.isPending || !isDirty}>
              {updateProfile.isPending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        ) : (
          <>
            <Row label="Date of birth" value={profile.dob} />
            <Row label="Height" value={profile.height} />
            <Row label="Weight" value={profile.weight} />
            <Row label="Jersey size" value={profile.jerseySize} />
          </>
        )}
      </Card>
    </div>
  );
}
