"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useOrg } from "@/hooks/useOrg";
import { Button, Card } from "@/components/ui";

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const { data: org } = useOrg(me?.orgId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <h2 className="mb-3 font-medium">Security</h2>
        <p className="mb-4 text-sm text-muted">
          Change your password by verifying a code sent to your email.
        </p>
        <Link href={`/forgot-password${me?.email ? `?email=${encodeURIComponent(me.email)}` : ""}`}>
          <Button variant="ghost">Change password</Button>
        </Link>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">About</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Organization</dt>
            <dd>{org?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Your role</dt>
            <dd>{me?.orgRole ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Signed in as</dt>
            <dd>{me?.email ?? "—"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
