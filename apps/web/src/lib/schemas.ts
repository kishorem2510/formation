import { z } from "zod";

// Mirrors the Cognito user pool password policy (infra/infra/constructs/auth.py) --
// keep these in sync so client-side validation never accepts something Cognito rejects.
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[0-9]/, "At least one number");

export const signupSchema = z
  .object({
    orgName: z.string().min(2, "Organization name is required"),
    name: z.string().min(1, "Your name is required"),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

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

export const requestResetSchema = z.object({
  email: z.string().email(),
});
export type RequestResetInput = z.infer<typeof requestResetSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    code: z.string().min(6, "6-digit code"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const createTeamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  sport: z.string().optional(),
  ageGroup: z.string().optional(),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const inviteSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1, "Name is required"),
    role: z.enum(["MANAGER", "COACH", "PLAYER", "PHYSIO"]),
    teamId: z.string().optional(),
    // EMAIL: Cognito emails its own auto-generated temp password (Flow 1).
    // MANUAL: Owner sets the temp password here and relays it themselves,
    // no email sent (Flow 2).
    mode: z.enum(["EMAIL", "MANUAL"]),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode !== "MANUAL") return;
    const result = passwordSchema.safeParse(data.password ?? "");
    if (!result.success) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: result.error.issues[0].message,
      });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords don't match" });
    }
  });
export type InviteInput = z.infer<typeof inviteSchema>;

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dob: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  jerseySize: z.string().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const updateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Message is required"),
});
export type UpdateInput = z.infer<typeof updateSchema>;

export const createEventSchema = z.object({
  eventType: z.enum(["GAME", "PRACTICE"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;
