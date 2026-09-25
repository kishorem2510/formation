/**
 * RBAC type model, ported from the task-management reference app's pattern
 * (permission catalog + fixed role grants) but with a closed set of roles --
 * Formation has no custom-role editor, by design.
 *
 * A permission id is `"<module>:<action>"` (e.g. `schedule:manage`). A role
 * holds a list of permission ids, or the wildcard `"*"` for full access.
 */

export type PermissionAction = "view" | "manage" | "mark" | "upload" | "post";

export type PermissionId = string; // `${module}:${action}` or "*"

export interface Permission {
  id: PermissionId;
  module: string;
  action: PermissionAction;
  label: string;
}

export interface PermissionCategory {
  module: string;
  label: string;
  permissions: Permission[];
}

export type FormationRoleId = "OWNER" | "MANAGER" | "COACH" | "PLAYER" | "PHYSIO";

export interface Role {
  id: FormationRoleId;
  name: string;
  description: string;
  /** Permission ids, or ["*"] for full access. */
  permissions: PermissionId[];
}
