import type { Role, PermissionId } from "@/types/rbac";
import { WILDCARD } from "@/constants/permissions";
import { NAV_ITEMS, type NavItem } from "@/constants/navigation";

/**
 * Core access check. An explicit grant always wins; the wildcard "*" grants
 * everything. Formation has no contributor-only carve-out (unlike the
 * reference app's Time Tracking case) -- Owner's wildcard is unconditional.
 */
export function canAccess(role: Role | null | undefined, permission: PermissionId | null): boolean {
  if (permission === null) return true;
  if (!role) return false;
  if (role.permissions.includes(permission)) return true;
  return role.permissions.includes(WILDCARD);
}

/** True if the role holds every listed permission. */
export function canAll(role: Role | null | undefined, permissions: PermissionId[]): boolean {
  return permissions.every((perm) => canAccess(role, perm));
}

/** True if the role holds at least one of the listed permissions. */
export function canAny(role: Role | null | undefined, permissions: PermissionId[]): boolean {
  return permissions.some((perm) => canAccess(role, perm));
}

/** Filters NAV_ITEMS down to what the role may see. Drives the sidebar. */
export function getAccessibleNav(role: Role | null | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => canAccess(role, item.permission));
}

/** The most specific registered nav entry for a path (longest href match). */
function navItemForPath(pathname: string): NavItem | null {
  let match: NavItem | null = null;
  for (const item of NAV_ITEMS) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!match || item.href.length > match.href.length) match = item;
    }
  }
  return match;
}

/**
 * Can this role open `pathname`? A path with no registered nav entry (e.g.
 * /users/[id], reached by clicking a roster row rather than the sidebar) is
 * open here -- its own access control lives server-side
 * (common.authz.require_can_view_user).
 */
export function canAccessPath(role: Role | null | undefined, pathname: string): boolean {
  const item = navItemForPath(pathname);
  if (!item) return true;
  return canAccess(role, item.permission);
}

/**
 * True for a same-origin absolute path only -- rejects `//evil.com` and
 * `/\evil.com`, both of which start with "/" yet are protocol-relative URLs
 * to another host (an open-redirect an attacker controls via `?from=`).
 */
export function isSafeRedirectPath(from: string | null | undefined): from is string {
  return !!from && from.startsWith("/") && !/^\/[\\/]/.test(from);
}

/**
 * Where to send a user who has just authenticated, given the `?from=` the
 * login page carried. `from` is only honoured when the signed-in role can
 * actually reach it and is a safe same-origin path.
 */
export function safeLandingPath(role: Role | null | undefined, from: string | null | undefined): string {
  if (!isSafeRedirectPath(from)) return "/dashboard";
  return canAccessPath(role, from) ? from : "/dashboard";
}
