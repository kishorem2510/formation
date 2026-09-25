"use client";

import { useMemo } from "react";
import type { PermissionId, Role } from "@/types/rbac";
import { SYSTEM_ROLES } from "@/constants/roles";
import { canAccess, canAll, canAny, getAccessibleNav } from "@/lib/rbac";
import { useAuth } from "@/hooks/useAuth";
import { useMe, type Me } from "@/hooks/useMe";
import { useAppStore } from "@/store/useAppStore";

/**
 * Resolves the current user's Role. Owner/Manager are org-wide. Coach/Player/
 * Physio are granted per team (TeamMembership), so for staff this resolves
 * against whichever team is currently selected (falling back to their first
 * team) -- the same selection the Schedule/Attendance/Documents pages already
 * use via TeamPicker. Switching teams can change a Coach-on-Team-A,
 * Player-on-Team-B user's effective role, which is correct: their real-world
 * authority genuinely differs per team, same as the backend enforces.
 */
export function resolveRole(me: Me | undefined, selectedTeamId: string | null): Role | null {
  if (!me) return null;
  if (me.orgRole === "OWNER") return SYSTEM_ROLES.OWNER;
  if (me.orgRole === "MANAGER") return SYSTEM_ROLES.MANAGER;
  const membership = me.teams.find((t) => t.teamId === selectedTeamId) ?? me.teams[0];
  if (!membership) return null;
  return SYSTEM_ROLES[membership.role];
}

export function useCurrentRole(): Role | null {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  return useMemo(() => resolveRole(me, selectedTeamId), [me, selectedTeamId]);
}

/** Permission helpers bound to the current role, plus the role-filtered nav. */
export function usePermissions() {
  const role = useCurrentRole();
  return {
    role,
    can: (permission: PermissionId | null) => canAccess(role, permission),
    canAll: (permissions: PermissionId[]) => canAll(role, permissions),
    canAny: (permissions: PermissionId[]) => canAny(role, permissions),
    nav: getAccessibleNav(role),
  };
}
