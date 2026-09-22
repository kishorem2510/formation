"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTeamEvents, useCreateEvent } from "@/hooks/useSchedule";
import { createEventSchema, CreateEventInput } from "@/lib/schemas";
import { Button, Field, Input, Select } from "@/components/ui";
import { AttendancePanel } from "@/components/team/AttendancePanel";

export function ScheduleSection({ teamId, canManage }: { teamId: string; canManage: boolean }) {
  const { data: events } = useTeamEvents(teamId);
  const createEvent = useCreateEvent(teamId);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
  });

  return (
    <div>
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
              {expanded === e.eventId && (
                <AttendancePanel teamId={teamId} eventId={e.eventId} canMark={false} />
              )}
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
    </div>
  );
}
