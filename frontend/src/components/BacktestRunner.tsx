import { useState, useEffect } from "react";
import { runBacktest, listStrategies, getDefaultCodes, listBenchmarks } from "../api";
import type { BacktestResult, StrategyInfo, BenchmarkInfo } from "../types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar, Calculator, BarChart3, PlayCircle, ArrowRight } from "lucide-react";

function formatPct(v: number | undefined, digits = 2): string {
  if (v === undefined || v === null || isNaN(v)) return "-";
  return `${(v * 100).toFixed(digits)}%`;
}

function metricColor(v: number | undefined, higherBetter = true): string {
  if (v === undefined || v === null || isNaN(v)) return "text-slate-500";
  if (v === 0) return "text-slate-500";
  if (higherBetter) return v > 0 ? "text-rise" : "text-fall";
  return v > 0 ? "text-fall" : "text-rise";
}

const METRIC_LABELS: { key: keyof BacktestResult["metrics"]; label: string; higherBetter: boolean; digits?: number }[] = [
  { key: "annual_return", label: "年化收益", higherBetter: true },
  { key: "max_drawdown", label: "最大回撤", higherBetter: false },
  { key: "sharpe", label: "夏普比率", higherBetter: true, digits: 3 },
  { key: "calmar", label: "卡玛比率", higherBetter: true, digits: 3 },
  { key: "monthly_win_rate", label: "月胜率", higherBetter: true },
  { key: "annual_turnover", label: "年化换手", higherBetter: false, digits: 3 },
];

export default function BacktestRunner() {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [defaultCodes, setDefaultCodes] = useState<string[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkInfo[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("l1");
  const [startDate, setStartDate] = useState<string>("2024-01-02");
  const [endDate, setEndDate] = useState<string>("2024-12-31");
  const [initialCash, setInitialCash] = useState<number>(1_000_000);
  const [costRate, setCostRate] = useState<number>(0.0002);
  const [benchmarkCode, setBenchmarkCode] = useState<string>("510300");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);

  useEffect(() => {
    listStrategies().then(d => setStrategies(d.strategies)).catch(() => {});
    getDefaultCodes().then(d => setDefaultCodes(d.codes)).catch(() => {});
    listBenchmarks().then(d => setBenchmarks(d.benchmarks)).catch(() => {});
  }, []);

  useEffect(() => {
    if (strategies.length === 0) return;
    if (strategies.some(s => s.id === selectedStrategy)) return;
    setSelectedStrategy(strategies[0].id);
  }, [strategies, selectedStrategy]);

  useEffect(() => {
    if (benchmarks.length === 0) return;
    if (benchmarks.some(b => b.code === benchmarkCode)) return;
    setBenchmarkCode(benchmarks[0].code);
  }, [benchmarks, benchmarkCode]);

  function handleRun() {
    setLoading(true);
    setError(null);
    runBacktest({
      strategy: selectedStrategy,
      start_date: startDate,
      end_date: endDate,
      initial_cash: initialCash,
      cost_rate: costRate,
      benchmark_code: benchmarkCode,
    }).then(r => {
      setResult(r);
      setLoading(false);
      if (r.status === "error") setError(r.message || "回测失败");
    }).catch(e => {
      setError(String(e));
      setLoading(false);
    });
  }

  // 组装走势图数据（按 date 匹配而非数组下标，避免长度不一致时错位）
  const benchMap = new Map((result?.benchmark_nav ?? []).map(p => [p.date, p.nav]));
  const chartData = result?.nav.map(p => ({
    date: p.date,
    strategy: +(p.nav * 100 - 100).toFixed(2),
    benchmark: benchMap.has(p.date) ? +((benchMap.get(p.date)! * 100 - 100).toFixed(2)) : 0,
  })) || [];

  const selectedInfo = strategies.find(s => s.id === selectedStrategy);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <Calculator size={18} />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">策略回测</div>
              <div className="text-xs text-slate-400">ETF 轮动策略 · 历史业绩验证</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 参数表单 + 说明 */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-800">回测参数</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">策略选择</label>
                <select
                  value={selectedStrategy}
                  onChange={e => setSelectedStrategy(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  {strategies.length === 0 && (
                    <option value={selectedStrategy}>加载中...</option>
                  )}
                  {strategies.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">基准代码</label>
                <select
                  value={benchmarkCode} onChange={e => setBenchmarkCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  {benchmarks.length === 0 && (
                    <option value={benchmarkCode}>{benchmarkCode} - 加载中...</option>
                  )}
                  {benchmarks.map(b => (
                    <option key={b.code} value={b.code}>{`${b.code} - ${b.name}`}</option>
                  ))}
                </select>
              </div>
              <label className="block cursor-pointer">
                <span className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                  <Calendar size={12} /> 起始日期
                </span>
                <input
                  type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </label>
              <label className="block cursor-pointer">
                <span className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                  <Calendar size={12} /> 结束日期
                </span>
                <input
                  type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </label>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">初始资金</label>
                <input
                  type="number" value={initialCash} onChange={e => setInitialCash(+e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">成本费率</label>
                <input
                  type="number" step="0.0001" value={costRate} onChange={e => setCostRate(+e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleRun} disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 transition"
              >
                {loading ? <PlayCircle size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                {loading ? "回测中..." : "运行回测"}
              </button>
            </div>
            {error && (
              <div className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-5 border border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-indigo-900">
                {selectedInfo?.name || "策略说明"}
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              {selectedInfo?.description || "正在加载..."}
            </p>
            <div className="mt-4 pt-4 border-t border-indigo-200/50 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>调仓频率</span>
                <span className="font-mono text-slate-800">
                  {selectedInfo?.rebalance_freq === "monthly" ? "每月初" :
                   selectedInfo?.rebalance_freq === "daily" ? "每日" :
                   selectedInfo?.rebalance_freq || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>可选 ETF</span>
                <span className="font-mono text-slate-800">{defaultCodes.length} 只</span>
              </div>
            </div>
          </div>
        </section>

        {/* 结果展示 */}
        {result && result.status === "ok" && (
          <>
            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">业绩指标</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {METRIC_LABELS.map(m => (
                  <div key={m.key} className="bg-slate-50 rounded-xl px-3 py-3">
                    <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                    <div className={`text-lg font-bold ${metricColor(result.metrics[m.key], m.higherBetter)}`}>
                      {formatPct(result.metrics[m.key], m.digits ?? 2).replace("%",
                        (m.key === "sharpe" || m.key === "calmar") ? "" : "%")}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">净值曲线（%）</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toFixed(2)}%`]}
                      labelFormatter={(label) => String(label)}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="strategy" stroke="#6366f1" strokeWidth={2}
                      dot={false} name={`策略 (${selectedInfo?.name})`} />
                    <Line type="monotone" dataKey="benchmark" stroke="#94a3b8" strokeWidth={1.5}
                      dot={false} name={`基准 (${benchmarkCode})`} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 调仓信号 */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                调仓信号（{result.signals.length} 次）
              </h3>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-xs text-slate-500 border-b border-slate-200">
                      <th className="text-left py-2 pl-0 w-28 font-medium">日期</th>
                      <th className="text-left py-2 font-medium">调仓目标</th>
                      <th className="text-left py-2 pr-0 font-medium w-32">逻辑</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.signals.slice().reverse().map((s, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pl-0 font-mono text-xs text-slate-600">{s.date}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {s.target_codes.map(code => (
                              <span key={code} className="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {code}
                              </span>
                            ))}
                            {s.target_codes.length === 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                                空仓
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 pr-0 text-xs text-slate-500">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 交易流水 */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                交易流水（{result.trades.length} 笔）
              </h3>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-xs text-slate-500 border-b border-slate-200">
                      <th className="text-left py-2 pl-0 w-24 font-medium">日期</th>
                      <th className="text-left py-2 font-medium">代码</th>
                      <th className="text-left py-2 font-medium">操作</th>
                      <th className="text-right py-2 font-medium">价格</th>
                      <th className="text-right py-2 font-medium">股数</th>
                      <th className="text-right py-2 pr-0 font-medium">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice().reverse().map((t, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pl-0 font-mono text-xs text-slate-600">{t.date}</td>
                        <td className="py-2 font-mono text-xs text-slate-700">{t.code}</td>
                        <td className="py-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                            t.action === "buy"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            {t.action === "buy" ? "买入" : "卖出"}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono text-xs text-slate-700">{t.price.toFixed(4)}</td>
                        <td className="py-2 text-right font-mono text-xs text-slate-700">{t.shares.toLocaleString()}</td>
                        <td className="py-2 text-right pr-0 font-mono text-xs text-slate-700">{t.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {!result && !loading && (
          <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-200 text-center">
            <ArrowRight size={24} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">选择参数后点击"运行回测"查看结果</p>
          </div>
        )}
      </main>
    </div>
  );
}
