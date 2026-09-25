import type { Permission, PermissionAction, PermissionCategory } from "@/types/rbac";

/** Wildcard permission id granting full access. */
export const WILDCARD = "*" as const;

const p = (module: string, action: PermissionAction, label: string): Permission => ({
  id: `${module}:${action}`,
  module,
  action,
  label,
});

/**
 * Full permission catalog, grouped by module. Every module has a `view`
 * (matches the sidebar item + route guard); action permissions exist only
 * for the specific things a role can actually do in that module -- this
 * mirrors exactly what services/common/authz.py already enforces server
 * side, so the frontend never offers a control the backend would 403.
 */
export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    module: "dashboard",
    label: "Dashboard",
    permissions: [p("dashboard", "view", "View Dashboard")],
  },
  {
    module: "team",
    label: "Team",
    permissions: [
      p("team", "view", "View Team"),
      // Covers: create/edit/delete teams, invite members, remove members.
      // Mirrors require_org_admin() in team_service.handler / auth_service.handler.
      p("team", "manage", "Manage Team (invite, remove, create teams)"),
    ],
  },
  {
    module: "schedule",
    label: "Schedule",
    permissions: [
      p("schedule", "view", "View Schedule"),
      // Mirrors CAN_MANAGE_EVENTS in schedule_service.handler.
      p("schedule", "manage", "Create & edit events"),
    ],
  },
  {
    module: "attendance",
    label: "Attendance",
    permissions: [
      p("attendance", "view", "View Attendance"),
      // Mirrors CAN_MARK_ATTENDANCE in attendance_service.handler.
      p("attendance", "mark", "Mark Attendance"),
    ],
  },
  {
    module: "documents",
    label: "Documents",
    permissions: [
      p("documents", "view", "View Documents"),
      // Mirrors CAN_UPLOAD in docs_service.handler.
      p("documents", "upload", "Upload Documents"),
    ],
  },
  {
    module: "updates",
    label: "Updates",
    permissions: [
      p("updates", "view", "View Updates"),
      // Mirrors require_org_admin() in updates_service.handler.
      p("updates", "post", "Post & delete Updates"),
    ],
  },
  {
    module: "settings",
    label: "Settings",
    permissions: [p("settings", "view", "View Settings")],
  },
];

/** Flat list of every permission. */
export const ALL_PERMISSIONS: Permission[] = PERMISSION_CATEGORIES.flatMap(
  (c) => c.permissions,
);

/** Lookup map id -> Permission. */
export const PERMISSION_MAP: Record<string, Permission> = Object.fromEntries(
  ALL_PERMISSIONS.map((perm) => [perm.id, perm]),
);
