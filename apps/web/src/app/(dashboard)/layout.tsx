"use client";

import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { Sidebar } from "@/components/Sidebar";
import { AuthGuard } from "@/components/AuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, signOut } = useAuth();
  const { data: me } = useMe(isAuthenticated);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar me={me} onSignOut={signOut} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
