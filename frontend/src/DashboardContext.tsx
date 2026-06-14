import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { DashboardData } from "./types";
import { refreshDashboard, getDashboard, getDashboardProgress, DashboardProgress } from "./api";

interface DashboardContextValue {
  data: DashboardData | null;
  loading: boolean;
  error: string;
  progress: DashboardProgress | null;
  load: (force?: boolean) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue>({
  data: null,
  loading: false,
  error: "",
  progress: null,
  load: async () => {},
});

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<DashboardProgress | null>(null);

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

  // 进度轮询：loading 期间每 500ms 取一次，loading 结束停止
  useEffect(() => {
    if (!loading) {
      setProgress(null);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const p = await getDashboardProgress();
        if (!cancelled) setProgress(p);
      } catch {
        // ignore
      }
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [loading]);

  return (
    <DashboardContext.Provider value={{ data, loading, error, progress, load }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
