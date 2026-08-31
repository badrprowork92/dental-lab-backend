import { useQueryClient } from "@tanstack/react-query";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { clearLabSessionToken, getLabSessionToken, setLabSessionToken } from "@/lib/lab-session-storage";
import { trpc } from "@/lib/trpc";

export type ActiveLabSession = { userId: number; labId: number | null; role: "admin" | "lab_user"; username: string; sessionVersion: number; mustChangePassword: boolean; labName: string | null };

type LabSessionContextValue = {
  session: ActiveLabSession | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const LabSessionContext = createContext<LabSessionContextValue | null>(null);

export function LabSessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<ActiveLabSession | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionQuery = trpc.license.session.useQuery(undefined, { enabled: false, retry: false });

  const refresh = useCallback(async () => {
    const token = await getLabSessionToken();
    if (!token) {
      setSession(null);
      setLoading(false);
      return;
    }
    try {
      const remote = await sessionQuery.refetch();
      if (!remote.data) throw new Error("تعذر التحقق من الجلسة.");
      setSession(remote.data);
    } catch {
      await clearLabSessionToken();
      queryClient.clear();
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [queryClient, sessionQuery]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<LabSessionContextValue>(() => ({
    session,
    loading,
    signIn: async (token) => {
      await setLabSessionToken(token);
      queryClient.clear();
      setLoading(true);
      await refresh();
    },
    signOut: async () => {
      await clearLabSessionToken();
      queryClient.clear();
      setSession(null);
      setLoading(false);
    },
    refresh,
  }), [session, loading, queryClient]);

  return <LabSessionContext.Provider value={value}>{children}</LabSessionContext.Provider>;
}

export function useLabSession() {
  const context = useContext(LabSessionContext);
  if (!context) throw new Error("useLabSession يجب استخدامه داخل LabSessionProvider.");
  return context;
}
