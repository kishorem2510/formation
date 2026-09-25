"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { resolveRole } from "@/hooks/usePermissions";
import { useAppStore } from "@/store/useAppStore";
import { canAccessPath } from "@/lib/rbac";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui";

/**
 * Client-side route protection. Waits for the Cognito session check, redirects
 * unauthenticated users to /login, and blocks a route the current role can't
 * open per NAV_ITEMS (constants/navigation.ts) -- the same data the sidebar
 * renders from, so what's shown and what's enforced never drift apart.
 *
 * This is UX, not the security boundary: every Lambda re-checks authorization
 * against DynamoDB regardless of what this component decides (see
 * services/common/authz.py). Hiding a button here doesn't grant anything the
 * backend wouldn't already refuse.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, signOut } = useAuth();
  // Called directly (not via usePermissions/useCurrentRole) so the loading
  // and error states are visible here -- a hook that only returns `Role |
  // null` can't tell "still fetching /me" apart from "that fetch failed",
  // and treating them the same is exactly what spun forever below.
  const meQuery = useMe(status === "authenticated");
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const role = resolveRole(meQuery.data, selectedTeamId);
  const sessionExpired = meQuery.error instanceof ApiError && meQuery.error.status === 401;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  // A 401 on /me means Cognito rejected the token -- expired, revoked (e.g.
  // after a password change elsewhere), or otherwise invalid. Recover
  // silently: clear the stale local session and send them back to sign in,
  // rather than surfacing a scary "couldn't load your account" error for
  // what is really just "please sign in again."
  useEffect(() => {
    if (sessionExpired) {
      signOut().finally(() => router.replace(`/login?from=${encodeURIComponent(pathname)}`));
    }
  }, [sessionExpired, pathname, router, signOut]);

  if (status !== "authenticated" || sessionExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  if (meQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Couldn&apos;t load your account</h1>
        <p className="max-w-sm text-sm text-muted">
          {meQuery.error instanceof Error ? meQuery.error.message : "Something went wrong."}
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => meQuery.refetch()}>
            Try again
          </Button>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  // Still fetching /me for the first time -- wait rather than flash an
  // incorrect denial. (meQuery.isError above already ruled out "it failed".)
  if (!meQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">No role assigned</h1>
        <p className="max-w-sm text-sm text-muted">
          Your account isn&apos;t on any team yet. Ask your organization&apos;s
          Owner or Manager to add you to one.
        </p>
        <Button onClick={signOut}>Sign out</Button>
      </div>
    );
  }

  if (!canAccessPath(role, pathname)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="max-w-sm text-sm text-muted">
          Your role doesn&apos;t have permission to view this section.
        </p>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return <>{children}</>;
}
