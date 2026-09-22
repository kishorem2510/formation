"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useMe, isOrgAdmin, roleOnTeam } from "@/hooks/useMe";
import { useTeam, useTeamMembers, useInviteUser } from "@/hooks/useTeams";
import { useTeamEvents, useCreateEvent } from "@/hooks/useSchedule";
import { useEventAttendance, useMarkAttendance, AttendanceStatus } from "@/hooks/useAttendance";
import { useTeamDocuments, useUploadDocument, useDownloadDocument } from "@/hooks/useDocuments";
import { createEventSchema, CreateEventInput, inviteSchema, InviteInput } from "@/lib/schemas";
import { Button, Card, Field, Input, Select } from "@/components/ui";

function RosterSection({ teamId, canManage }: { teamId: string; canManage: boolean }) {
  const { data: members } = useTeamMembers(teamId);
  const { data: me } = useMe(true);
  const invite = useInviteUser(me?.orgId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { teamId },
  });

  return (
    <Card>
      <h2 className="mb-3 font-medium">Roster</h2>
      <ul className="mb-4 space-y-1.5">
        {members?.map((m) => (
          <li key={m.userId} className="flex justify-between text-sm">
            <span>{m.userId}</span>
            <span className="text-muted">{m.role}</span>
          </li>
        ))}
        {members?.length === 0 && <p className="text-sm text-muted">No members yet.</p>}
      </ul>

      {canManage && (
        <form
          onSubmit={handleSubmit((data) =>
            invite.mutate({ ...data, teamId }, { onSuccess: () => reset({ teamId }) }),
          )}
          className="space-y-3 border-t border-border pt-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
          </div>
          <Field label="Role" error={errors.role?.message}>
            <Select {...register("role")} defaultValue="">
              <option value="" disabled>
                Select a role
              </option>
              <option value="COACH">Coach</option>
              <option value="PLAYER">Player</option>
              <option value="PHYSIO">Physio</option>
            </Select>
          </Field>
          <Button type="submit" disabled={invite.isPending}>
            {invite.isPending ? "Inviting..." : "Add to roster"}
          </Button>
        </form>
      )}
    </Card>
  );
}

function AttendancePanel({ teamId, eventId }: { teamId: string; eventId: string }) {
  const { data: members } = useTeamMembers(teamId);
  const { data: attendance } = useEventAttendance(teamId, eventId);
  const mark = useMarkAttendance(teamId, eventId);
  const players = members?.filter((m) => m.role === "PLAYER") ?? [];

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {players.map((p) => {
        const record = attendance?.find((a) => a.userId === p.userId);
        return (
          <div key={p.userId} className="flex items-center justify-between text-sm">
            <span>{p.userId}</span>
            <Select
              value={record?.status ?? ""}
              onChange={(e) =>
                mark.mutate({ userId: p.userId, status: e.target.value as AttendanceStatus })
              }
              className="w-40"
            >
              <option value="" disabled>
                Mark...
              </option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="EXCUSED">Excused</option>
            </Select>
          </div>
        );
      })}
      {players.length === 0 && <p className="text-sm text-muted">No players on this team yet.</p>}
    </div>
  );
}

function ScheduleSection({ teamId, canManage }: { teamId: string; canManage: boolean }) {
  const { data: events } = useTeamEvents(teamId);
  const createEvent = useCreateEvent(teamId);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
  });

  return (
    <Card>
      <h2 className="mb-3 font-medium">Schedule</h2>
      <ul className="mb-4 space-y-2">
        {events
          ?.slice()
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((e) => (
            <li key={e.eventId} className="rounded-lg border border-border p-3">
              <button
                className="flex w-full items-center justify-between text-left text-sm"
                onClick={() => setExpanded(expanded === e.eventId ? null : e.eventId)}
              >
                <span>
                  <span className="font-medium">{e.eventType}</span>{" "}
                  {new Date(e.startTime).toLocaleString()}
                  {e.location ? ` · ${e.location}` : ""}
                </span>
                <span className="text-muted">{expanded === e.eventId ? "Hide" : "Attendance"}</span>
              </button>
              {expanded === e.eventId && <AttendancePanel teamId={teamId} eventId={e.eventId} />}
            </li>
          ))}
        {events?.length === 0 && <p className="text-sm text-muted">No events scheduled.</p>}
      </ul>

      {canManage && (
        <form
          onSubmit={handleSubmit((data) => createEvent.mutate(data, { onSuccess: () => reset() }))}
          className="space-y-3 border-t border-border pt-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" error={errors.eventType?.message}>
              <Select {...register("eventType")} defaultValue="">
                <option value="" disabled>
                  Select...
                </option>
                <option value="PRACTICE">Practice</option>
                <option value="GAME">Game</option>
              </Select>
            </Field>
            <Field label="Start time" error={errors.startTime?.message}>
              <Input type="datetime-local" {...register("startTime")} />
            </Field>
          </div>
          <Field label="Location">
            <Input {...register("location")} placeholder="Home field" />
          </Field>
          <Button type="submit" disabled={createEvent.isPending}>
            {createEvent.isPending ? "Adding..." : "Add to schedule"}
          </Button>
        </form>
      )}
    </Card>
  );
}

function DocumentsSection({ teamId, canUpload }: { teamId: string; canUpload: boolean }) {
  const { data: docs } = useTeamDocuments(teamId);
  const upload = useUploadDocument(teamId);
  const download = useDownloadDocument(teamId);

  return (
    <Card>
      <h2 className="mb-3 font-medium">Documents</h2>
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
    </Card>
  );
}

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const { data: team } = useTeam(teamId);

  const admin = isOrgAdmin(me);
  const role = roleOnTeam(me, teamId);
  const canManageRoster = admin;
  const canManageSchedule = admin || role === "COACH";
  const canUploadDocs = admin || role === "COACH" || role === "PHYSIO";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{team?.name ?? "Team"}</h1>
        <p className="text-muted">
          {team?.sport ?? "—"} {team?.ageGroup ? `· ${team.ageGroup}` : ""}
        </p>
      </div>

      <RosterSection teamId={teamId} canManage={canManageRoster} />
      <ScheduleSection teamId={teamId} canManage={canManageSchedule} />
      <DocumentsSection teamId={teamId} canUpload={canUploadDocs} />
    </div>
  );
}
