import type { PermissionId } from "@/types/rbac";

export interface NavItem {
  label: string;
  href: string;
  /** Permission required to see this item / open this route. */
  permission: PermissionId;
}

/**
 * Single source of truth for the sidebar AND route guarding (AuthGuard uses
 * the same list via lib/rbac.ts) -- so what's shown and what's enforced
 * never drift apart.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", permission: "dashboard:view" },
  { label: "Team", href: "/team", permission: "team:view" },
  { label: "Schedule", href: "/schedule", permission: "schedule:view" },
  { label: "Attendance", href: "/attendance", permission: "attendance:view" },
  { label: "Documents", href: "/documents", permission: "documents:view" },
  { label: "Updates", href: "/updates", permission: "updates:view" },
  { label: "Settings", href: "/settings", permission: "settings:view" },
];
