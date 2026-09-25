import type { Role } from "@/types/rbac";
import { WILDCARD } from "./permissions";

/**
 * Formation's fixed roles (no custom-role editor, by design). Owner/Manager
 * are org-wide; Coach/Player/Physio are granted per team via TeamMembership,
 * so their effective Role here is resolved against whichever team is
 * currently selected (see hooks/usePermissions.ts).
 */
export const SYSTEM_ROLES: Record<Role["id"], Role> = {
  OWNER: {
    id: "OWNER",
    name: "Owner",
    description: "Full, unrestricted control of the organization.",
    permissions: [WILDCARD],
  },
  MANAGER: {
    id: "MANAGER",
    name: "Manager",
    description: "Same access as Owner, day to day -- except the Owner can't be removed.",
    permissions: [
      "dashboard:view",
      "team:view",
      "team:manage",
      "schedule:view",
      "schedule:manage",
      "attendance:view",
      "attendance:mark",
      "documents:view",
      "documents:upload",
      "updates:view",
      "updates:post",
      "settings:view",
    ],
  },
  COACH: {
    id: "COACH",
    name: "Coach",
    description: "Runs schedule and attendance for their team.",
    permissions: [
      "dashboard:view",
      "team:view",
      "schedule:view",
      "schedule:manage",
      "attendance:view",
      "attendance:mark",
      "documents:view",
      "documents:upload",
      "updates:view",
      "settings:view",
    ],
  },
  PLAYER: {
    id: "PLAYER",
    name: "Player",
    description: "Views their team's schedule, attendance, and documents.",
    permissions: [
      "dashboard:view",
      "team:view",
      "schedule:view",
      "attendance:view",
      "documents:view",
      "updates:view",
      "settings:view",
    ],
  },
  PHYSIO: {
    id: "PHYSIO",
    name: "Physio",
    description: "Views the team and uploads medical documents.",
    permissions: [
      "dashboard:view",
      "team:view",
      "schedule:view",
      "attendance:view",
      "documents:view",
      "documents:upload",
      "updates:view",
      "settings:view",
    ],
  },
};
