import type {
  RefreshResponse, DashboardData, SimPortfolio, SimPosition, SimTrade,
  BacktestResult, StrategyInfo, BenchmarkInfo, KlineResponse,
} from './types';

const API_BASE = '/api';

export async function refreshDashboard(): Promise<RefreshResponse> {
  const res = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`);
  }
  return res.json() as Promise<RefreshResponse>;
}

export async function getDashboard(useCache = true): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/dashboard?use_cache=${useCache}`);
  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`);
  }
  const data = await res.json() as RefreshResponse;
  if (!data.success || !data.data) {
    throw new Error(data.message || '获取数据失败');
  }
  return data.data;
}


// ── 模拟盘API ──────────────────────────────────────────────
export async function getSimPortfolio(): Promise<SimPortfolio> {
  const res = await fetch(`${API_BASE}/sim/portfolio`);
  if (!res.ok) throw new Error(`获取模拟仓失败: ${res.status}`);
  return res.json();
}

export async function batchBuySim(items: { code: string; name: string; price: number; shares: number }[]): Promise<SimPortfolio> {
  const res = await fetch(`${API_BASE}/sim/batch-buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(`买入失败: ${res.status}`);
  return res.json();
}

export async function clearAllSim(): Promise<SimPortfolio> {
  const res = await fetch(`${API_BASE}/sim/clear-all`, { method: "POST" });
  if (!res.ok) throw new Error(`清仓失败: ${res.status}`);
  return res.json();
}

export async function upsertPositionSim(item: SimPosition): Promise<SimPortfolio> {
  const res = await fetch(`${API_BASE}/sim/upsert-position`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`编辑持仓失败: ${res.status}`);
  return res.json();
}

export async function removePositionSim(code: string): Promise<SimPortfolio> {
  const res = await fetch(`${API_BASE}/sim/position/${code}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`删除持仓失败: ${res.status}`);
  return res.json();
}

export async function upsertTradeSim(trade: SimTrade): Promise<SimPortfolio> {
  const res = await fetch(`${API_BASE}/sim/upsert-trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trade),
  });
  if (!res.ok) throw new Error(`编辑记录失败: ${res.status}`);
  return res.json();
}

export async function removeTradeSim(id: string): Promise<SimPortfolio> {
  const res = await fetch(`${API_BASE}/sim/trade/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`删除记录失败: ${res.status}`);
  return res.json();
}

export async function resetSim(): Promise<SimPortfolio> {
  const res = await fetch(`${API_BASE}/sim/reset`, { method: "POST" });
  if (!res.ok) throw new Error(`重置失败: ${res.status}`);
  return res.json();
}

export async function updateInitialCashSim(amount: number): Promise<SimPortfolio> {
  const res = await fetch(`${API_BASE}/sim/initial-cash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initial_cash: amount }),
  });
  if (!res.ok) throw new Error(`更新初始资金失败: ${res.status}`);
  return res.json();
}


// ── 回测API ────────────────────────────────────────────────
export async function listStrategies(): Promise<{ strategies: StrategyInfo[] }> {
  const res = await fetch(`${API_BASE}/backtest/strategies`);
  if (!res.ok) throw new Error(`获取策略列表失败: ${res.status}`);
  return res.json();
}

export async function getDefaultCodes(): Promise<{ codes: string[] }> {
  const res = await fetch(`${API_BASE}/backtest/default-codes`);
  if (!res.ok) throw new Error(`获取默认ETF代码失败: ${res.status}`);
  return res.json();
}

export async function listBenchmarks(): Promise<{ benchmarks: BenchmarkInfo[] }> {
  const res = await fetch(`${API_BASE}/backtest/benchmarks`);
  if (!res.ok) throw new Error(`获取基准列表失败: ${res.status}`);
  return res.json();
}

export interface BacktestRunParams {
  strategy: string;
  codes?: string[];
  start_date: string;
  end_date: string;
  initial_cash?: number;
  cost_rate?: number;
  benchmark_code?: string;
}

export async function runBacktest(params: BacktestRunParams): Promise<BacktestResult> {
  const res = await fetch(`${API_BASE}/backtest/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`回测请求失败: ${res.status}`);
  return res.json();
}

export async function compareStrategies(params: {
  strategies: string[];
  codes?: string[];
  start_date: string;
  end_date: string;
  initial_cash?: number;
  cost_rate?: number;
  benchmark_code?: string;
}): Promise<{ results: Record<string, BacktestResult> }> {
  const res = await fetch(`${API_BASE}/backtest/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`策略对比失败: ${res.status}`);
  return res.json();
}

export async function getEtfKline(code: string, days = 120): Promise<KlineResponse> {
  const res = await fetch(`${API_BASE}/kline/${code}?days=${days}`);
  if (!res.ok) throw new Error(`获取K线失败: ${res.status}`);
  return res.json();
}


// ── 数据加载进度 ────────────────────────────────────────────
export interface DashboardProgress {
  done: number;
  total: number;
  phase: 'idle' | 'init' | 'starting' | 'fetching' | 'done' | string;
  started_at: number | null;
  finished_at: number | null;
  elapsed_sec: number;
}

export async function getDashboardProgress(): Promise<DashboardProgress> {
  const res = await fetch(`${API_BASE}/dashboard/progress`);
  if (!res.ok) throw new Error(`获取进度失败: ${res.status}`);
  return res.json();
}
