export interface ETFItem {
  code: string;
  name: string;
  category: string;
  current_price: number;
  current_change_pct: number;
  two_day_change_pct: number;
  volume_expand_pct: number;
  composite_score: number;
  volume: number;
  ma20?: number;
  ma20_confirmed?: boolean;
  change_30d?: number;
  change_30d_score?: number;
}

export interface QuantRecommend {
  rank: number;
  code: string;
  name: string;
  category: string;
  current_change_pct: number;
  two_day_change_pct: number;
  volume_expand_pct: number;
  composite_score: number;
  ma20?: number;
  ma20_confirmed?: boolean;
  change_30d?: number;
  change_30d_score?: number;
}

export interface LLMRecommend {
  rank: number;
  code: string;
  name: string;
  category: string;
  reason: string;
  source: 'llm' | 'fallback';
}

export interface DashboardData {
  etf_list: ETFItem[];
  quant_top5: QuantRecommend[];
  llm_top5: LLMRecommend[];
  data_time: string;     // 如 "2026-04-21 盘中(实时)" 或 "2026-04-18 收盘"
  is_trading_time: boolean;
  data_type: 'realtime' | 'closed' | 'closed_today';  // 盘中实时 vs 今日收盘(盘后) vs 收盘历史
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data?: DashboardData;
}


// ── 模拟盘类型 ─────────────────────────────────────────────
export interface SimPosition {
  code: string;
  name: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  updated_at: string;
  profit?: number;
  profit_pct?: number;
  market_value?: number;
}

export interface SimTrade {
  id: string;
  time: string;
  action: "buy" | "sell";
  code: string;
  name: string;
  price: number;
  shares: number;
  amount: number;
  note?: string;
}

export interface SimPortfolio {
  initial_cash: number;
  available_cash: number;
  positions: SimPosition[];
  trades: SimTrade[];
  total_cost: number;
  total_value: number;
  profit: number;         // 持仓浮动盈亏
  profit_pct: number;
  realized_profit: number;     // 已实现盈亏
  total_profit: number;        // 累计总盈亏 = 已实现 + 浮动
  total_profit_pct: number;    // 总盈亏率
}


// ── 回测类型 ───────────────────────────────────────────────
export interface NavPoint {
  date: string;
  nav: number;
}

export interface TradeItem {
  date: string;
  code: string;
  action: "buy" | "sell";
  price: number;
  shares: number;
  amount: number;
  reason: string;
}

export interface SignalItem {
  date: string;
  target_codes: string[];
  reason: string;
  scores?: Record<string, number>;
}

export interface BacktestMetrics {
  annual_return: number;
  sharpe: number;
  max_drawdown: number;
  calmar: number;
  monthly_win_rate: number;
  annual_turnover: number;
}

export interface BacktestResult {
  strategy: string;
  start: string;
  end: string;
  cost_rate: number;
  nav: NavPoint[];
  benchmark_nav: NavPoint[];
  trades: TradeItem[];
  signals: SignalItem[];
  metrics: BacktestMetrics;
  status: "ok" | "error";
  message?: string;
}

export interface StrategyInfo {
  id: string;
  name: string;
  description: string;
  rebalance_freq: string;
}

export interface BenchmarkInfo {
  code: string;
  name: string;
}

export interface KlinePoint {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface KlineResponse {
  code: string;
  name: string;
  kline: KlinePoint[];
}
