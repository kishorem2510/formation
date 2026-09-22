import { z } from "zod";

export const signupSchema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  name: z.string().min(1, "Your name is required"),
  email: z.string().email(),
  password: z.string().min(10, "At least 10 characters"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const confirmSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6, "6-digit code"),
});
export type ConfirmInput = z.infer<typeof confirmSchema>;

export const createTeamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  sport: z.string().optional(),
  ageGroup: z.string().optional(),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["MANAGER", "COACH", "PLAYER", "PHYSIO"]),
  teamId: z.string().optional(),
});
export type InviteInput = z.infer<typeof inviteSchema>;

export const createEventSchema = z.object({
  eventType: z.enum(["GAME", "PRACTICE"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;
