"use client";

import { useEffect, useState, useCallback } from "react";
import { getCurrentUser, signOut as amplifySignOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useQueryClient } from "@tanstack/react-query";
import { configureAmplify } from "@/lib/amplify";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const queryClient = useQueryClient();

  useEffect(() => {
    configureAmplify();
    getCurrentUser()
      .then(() => setStatus("authenticated"))
      .catch(() => setStatus("unauthenticated"));

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") setStatus("authenticated");
      if (payload.event === "signedOut") {
        setStatus("unauthenticated");
        queryClient.clear();
      }
    });
    return unsubscribe;
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await amplifySignOut();
  }, []);

  return { status, isAuthenticated: status === "authenticated", signOut };
}
