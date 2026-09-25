"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentRole } from "@/hooks/usePermissions";
import { canAccessPath } from "@/lib/rbac";
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
  const { status } = useAuth();
  const role = useCurrentRole();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  // Role is still resolving (e.g. /me hasn't returned yet, or a staff user's
  // teams haven't loaded) -- wait rather than flash an incorrect denial.
  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading...
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
