"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/** If a Cognito session is already active, auth pages (login/signup/confirm/
 * forgot-password) redirect straight to the dashboard instead of rendering
 * -- landing on /login while already signed in is exactly what triggers
 * Amplify's "There is already a signed in user" error on submit. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "authenticated") return null;
  return <>{children}</>;
}
