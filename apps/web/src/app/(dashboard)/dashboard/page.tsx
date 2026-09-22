"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { Card } from "@/components/ui";

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { data: me, isLoading } = useMe(isAuthenticated);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isLoading ? "Loading..." : `Welcome, ${me?.name ?? ""}`}
        </h1>
        <p className="text-muted">
          {me?.orgRole === "OWNER" || me?.orgRole === "MANAGER"
            ? "Org admin"
            : `${me?.teams.length ?? 0} team(s)`}
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Your teams</h2>
        {me?.teams.length ? (
          <ul className="space-y-2">
            {me.teams.map((t) => (
              <li key={t.teamId}>
                <Link href={`/teams/${t.teamId}`} className="text-accent hover:underline">
                  {t.teamId}
                </Link>{" "}
                <span className="text-sm text-muted">({t.role})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            {me?.orgRole === "OWNER" || me?.orgRole === "MANAGER" ? (
              <>
                No teams yet.{" "}
                <Link href="/teams" className="text-accent hover:underline">
                  Create one
                </Link>
                .
              </>
            ) : (
              "You haven't been added to a team yet."
            )}
          </p>
        )}
      </Card>
    </div>
  );
}
