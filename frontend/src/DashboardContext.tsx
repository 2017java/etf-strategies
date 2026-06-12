import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { DashboardData } from "./types";
import { refreshDashboard, getDashboard } from "./api";

interface DashboardContextValue {
  data: DashboardData | null;
  loading: boolean;
  error: string;
  load: (force?: boolean) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue>({
  data: null,
  loading: false,
  error: "",
  load: async () => {},
});

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError("");
    try {
      if (force) {
        const res = await refreshDashboard();
        if (res.success && res.data) setData(res.data);
        else setError(res.message || "刷新失败");
      } else {
        const res = await getDashboard(true);
        setData(res ?? null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  return (
    <DashboardContext.Provider value={{ data, loading, error, load }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
