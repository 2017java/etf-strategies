import { useState, useEffect } from "react";
import { compareStrategies, listStrategies, getDefaultCodes, listBenchmarks } from "../api";
import type { BacktestResult, StrategyInfo, BenchmarkInfo } from "../types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { GitCompare, Calendar, Scale, TrendingUp, BarChart2 } from "lucide-react";

const STRATEGY_COLORS: Record<string, string> = {
  l1: "#6366f1",
  l2: "#10b981",
  l3: "#f59e0b",
};

const METRIC_LABELS: { key: keyof BacktestResult["metrics"]; label: string; higherBetter: boolean; digits?: number; isRatio?: boolean }[] = [
  { key: "annual_return", label: "年化收益", higherBetter: true },
  { key: "max_drawdown", label: "最大回撤", higherBetter: false },
  { key: "sharpe", label: "夏普比率", higherBetter: true, digits: 3, isRatio: true },
  { key: "calmar", label: "卡玛比率", higherBetter: true, digits: 3, isRatio: true },
  { key: "monthly_win_rate", label: "月胜率", higherBetter: true },
  { key: "annual_turnover", label: "年化换手", higherBetter: false, digits: 3, isRatio: true },
];

function fmtPct(v: number | undefined, digits = 2): string {
  if (v === undefined || v === null || isNaN(v)) return "-";
  return `${(v * 100).toFixed(digits)}%`;
}

export default function BacktestCompare() {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState("2024-01-02");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [benchmarkCode, setBenchmarkCode] = useState("510300");
  const [benchmarks, setBenchmarks] = useState<BenchmarkInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, BacktestResult> | null>(null);

  useEffect(() => {
    listStrategies().then(d => {
      setStrategies(d.strategies);
      setSelected(new Set(d.strategies.map(s => s.id)));
    }).catch(() => {});
    getDefaultCodes().then(() => {}).catch(() => {});
    listBenchmarks().then(d => setBenchmarks(d.benchmarks)).catch(() => {});
  }, []);

  useEffect(() => {
    if (benchmarks.length === 0) return;
    if (benchmarks.some(b => b.code === benchmarkCode)) return;
    setBenchmarkCode(benchmarks[0].code);
  }, [benchmarks, benchmarkCode]);

  function toggleStrategy(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleRun() {
    if (selected.size === 0) {
      setError("请至少选择一个策略");
      return;
    }
    setLoading(true);
    setError(null);
    compareStrategies({
      strategies: Array.from(selected),
      start_date: startDate,
      end_date: endDate,
      benchmark_code: benchmarkCode,
    }).then(d => {
      setResults(d.results);
      setLoading(false);
    }).catch(e => {
      setError(String(e));
      setLoading(false);
    });
  }

  // 组装走势图数据：合并所有策略 + 基准的净值日期
  let chartData: { date: string; [key: string]: number | string }[] = [];
  if (results) {
    const allDates = new Set<string>();
    Object.values(results).forEach(r => r.nav.forEach(p => allDates.add(p.date)));
    const sortedDates = Array.from(allDates).sort();
    chartData = sortedDates.map(d => {
      const row: { date: string; [key: string]: number | string } = { date: d };
      Object.entries(results).forEach(([sid, r]) => {
        const p = r.nav.find(x => x.date === d);
        row[sid] = p !== undefined ? +((p.nav * 100 - 100).toFixed(2)) : 0;
      });
      // 基准：取第一个结果的基准
      const first = Object.values(results)[0];
      const bp = first?.benchmark_nav.find(x => x.date === d);
      if (bp !== undefined) row["benchmark"] = +((bp.nav * 100 - 100).toFixed(2));
      return row;
    });
  }

  const hasAnyResult = results && Object.values(results).some(r => r.status === "ok");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
              <GitCompare size={18} />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">策略对比</div>
              <div className="text-xs text-slate-400">多策略并排 · 历史业绩横向比较</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-amber-600" />
            <h2 className="text-base font-semibold text-slate-800">对比配置</h2>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-2">选择策略（多选）</label>
            <div className="flex flex-wrap gap-2">
              {strategies.length === 0 && (
                <span className="text-xs text-slate-400 px-3 py-2">加载中...</span>
              )}
              {strategies.map(s => {
                const active = selected.has(s.id);
                return (
                  <button
                    key={s.id} onClick={() => toggleStrategy(s.id)}
                    className={`px-3 py-2 text-xs rounded-xl border transition ${
                      active
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 border-amber-600 text-white font-semibold shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                <Calendar size={12} /> 起始
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                <Calendar size={12} /> 结束
              </label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">基准代码</label>
              <select
                value={benchmarkCode} onChange={e => setBenchmarkCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition"
              >
                {benchmarks.length === 0 && (
                  <option value={benchmarkCode}>{benchmarkCode} - 加载中...</option>
                )}
                {benchmarks.map(b => (
                  <option key={b.code} value={b.code}>{`${b.code} - ${b.name}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleRun} disabled={loading || selected.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 transition"
            >
              {loading ? <TrendingUp size={16} className="animate-spin" /> : <Scale size={16} />}
              {loading ? "对比中..." : "开始对比"}
            </button>
          </div>
          {error && <div className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
        </section>

        {hasAnyResult && results && (
          <>
            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">累计收益曲线（%）</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toFixed(2)}%`]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {Array.from(selected).map(sid => {
                      const info = strategies.find(s => s.id === sid);
                      return (
                        <Line key={sid} type="monotone" dataKey={sid} stroke={STRATEGY_COLORS[sid] || "#6366f1"}
                          strokeWidth={2} dot={false} name={info?.name || sid}
                        />
                      );
                    })}
                    <Line type="monotone" dataKey="benchmark" stroke="#94a3b8" strokeWidth={1.5}
                      dot={false} name={`基准 (${benchmarkCode})`} strokeDasharray="4 4"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">指标对比</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-200">
                      <th className="text-left py-2 pl-0 font-medium">指标</th>
                      {Array.from(selected).map(sid => {
                        const info = strategies.find(s => s.id === sid);
                        return (
                          <th key={sid} className="text-right py-2 pr-0 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ background: STRATEGY_COLORS[sid] || "#6366f1" }} />
                              {info?.name || sid}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {METRIC_LABELS.map(m => (
                      <tr key={m.key} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 pl-0 text-xs text-slate-500">{m.label}</td>
                        {Array.from(selected).map(sid => {
                          const r = results[sid];
                          const val = r?.metrics[m.key];
                          const values = Array.from(selected).map(s => {
                            const rv = results[s]?.metrics[m.key];
                            return typeof rv === "number" && !isNaN(rv) ? rv : null;
                          }).filter((v): v is number => v !== null);
                          const best = values.length
                            ? (m.higherBetter ? Math.max(...values) : Math.min(...values))
                            : null;
                          const isBest = best !== null && val === best && typeof val === "number";
                          const display = m.isRatio
                            ? (typeof val === "number" ? val.toFixed(m.digits || 2) : "-")
                            : fmtPct(val, m.digits ?? 2);
                          return (
                            <td key={sid} className="py-2.5 pr-0 text-right font-mono text-xs">
                              {isBest ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-semibold border border-amber-100">
                                  {display}
                                </span>
                              ) : (
                                <span className="text-slate-700">{display}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">每策略信号数</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {Array.from(selected).map(sid => {
                  const info = strategies.find(s => s.id === sid);
                  const r = results[sid];
                  return (
                    <div key={sid} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: STRATEGY_COLORS[sid] || "#6366f1" }} />
                        <span className="text-sm font-semibold text-slate-800">{info?.name || sid}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        调仓信号：<span className="font-mono text-slate-800">{r?.signals.length ?? 0} 次</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        交易笔数：<span className="font-mono text-slate-800">{r?.trades.length ?? 0} 笔</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {!results && !loading && (
          <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-200 text-center">
            <Scale size={24} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">选择策略和日期范围后点击"开始对比"</p>
          </div>
        )}
      </main>
    </div>
  );
}
