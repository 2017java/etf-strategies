import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { GitCompare, Loader2, AlertCircle, Play } from "lucide-react";
import { compareStrategies, listStrategies, getDefaultCodes, listBenchmarks } from "../api";
import type { BacktestResult, StrategyInfo, BenchmarkInfo } from "../types";

const STRATEGY_COLORS = ["#2563EB", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

export default function BacktestCompare() {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [defaultCodes, setDefaultCodes] = useState<string[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkInfo[]>([]);

  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");
  const [benchmarkCode, setBenchmarkCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Record<string, BacktestResult> | null>(null);

  useEffect(() => {
    listStrategies().then(r => {
      setStrategies(r.strategies);
      if (r.strategies.length > 0) setSelectedStrategies([r.strategies[0].id]);
    }).catch(() => {});
    getDefaultCodes().then(r => setDefaultCodes(r.codes)).catch(() => {});
    listBenchmarks().then(r => {
      setBenchmarks(r.benchmarks);
      if (r.benchmarks.length > 0) setBenchmarkCode(r.benchmarks[0].code);
    }).catch(() => {});
  }, []);

  const toggleStrategy = (id: string) => {
    setSelectedStrategies(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (selectedStrategies.length < 2) {
      setError("请至少选择两个策略进行对比");
      return;
    }
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await compareStrategies({
        strategies: selectedStrategies,
        start_date: startDate,
        end_date: endDate,
        benchmark_code: benchmarkCode || undefined,
      });
      setResults(res.results);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const maxNavLen = results
    ? Math.max(...Object.values(results).map(r => r.nav.length), 0)
    : 0;

  const chartData = results
    ? Array.from({ length: maxNavLen }, (_, i) => {
        const point: Record<string, string | number> = {};
        const firstResult = Object.values(results)[0];
        if (firstResult?.nav[i]) point.date = firstResult.nav[i].date.slice(5);
        Object.entries(results).forEach(([key, r]) => {
          const strategyName = strategies.find(s => s.id === key)?.name || key;
          if (r.nav[i]) point[strategyName] = +r.nav[i].nav.toFixed(4);
        });
        const firstBm = Object.values(results)[0];
        if (firstBm?.benchmark_nav?.[i]) point["基准"] = +firstBm.benchmark_nav[i].nav.toFixed(4);
        return point;
      })
    : [];

  const fmt = (v: number) => (v * 100).toFixed(2) + "%";
  const fmtAbs = (v: number) => v.toFixed(2);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
            <GitCompare className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">策略对比</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                选择策略 <span className="text-slate-400">(至少2个)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {strategies.map((s, idx) => {
                  const checked = selectedStrategies.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleStrategy(s.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                        checked
                          ? "border-primary-300 bg-primary-50 text-primary-700 font-medium"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] }}
                      />
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">基准</label>
                <select
                  value={benchmarkCode}
                  onChange={e => setBenchmarkCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">无基准</option>
                  {benchmarks.map(b => (
                    <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCompare}
                disabled={loading || selectedStrategies.length < 2}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-medium hover:from-primary-600 hover:to-primary-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {loading ? "对比中..." : "运行对比"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {results && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">净值对比曲线</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Legend />
                  {selectedStrategies.map((id, idx) => {
                    const name = strategies.find(s => s.id === id)?.name || id;
                    return (
                      <Line
                        key={id}
                        type="monotone"
                        dataKey={name}
                        stroke={STRATEGY_COLORS[idx % STRATEGY_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    );
                  })}
                  {Object.values(results)[0]?.benchmark_nav?.length > 0 && (
                    <Line type="monotone" dataKey="基准" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-x-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">指标对比</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">策略</th>
                    <th className="text-right py-3 px-4 text-slate-500 font-medium">年化收益</th>
                    <th className="text-right py-3 px-4 text-slate-500 font-medium">夏普比率</th>
                    <th className="text-right py-3 px-4 text-slate-500 font-medium">最大回撤</th>
                    <th className="text-right py-3 px-4 text-slate-500 font-medium">卡玛比率</th>
                    <th className="text-right py-3 px-4 text-slate-500 font-medium">月胜率</th>
                    <th className="text-right py-3 px-4 text-slate-500 font-medium">年换手率</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results).map(([key, r], idx) => {
                    const name = strategies.find(s => s.id === key)?.name || key;
                    const m = r.metrics;
                    return (
                      <tr key={key} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-medium text-slate-700">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] }}
                            />
                            {name}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${m.annual_return > 0 ? "text-rise" : "text-fall"}`}>
                          {fmt(m.annual_return)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${m.sharpe > 0 ? "text-rise" : "text-fall"}`}>
                          {fmtAbs(m.sharpe)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-fall">{fmt(m.max_drawdown)}</td>
                        <td className={`py-3 px-4 text-right font-mono ${m.calmar > 0 ? "text-rise" : "text-fall"}`}>
                          {fmtAbs(m.calmar)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{fmt(m.monthly_win_rate)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{fmt(m.annual_turnover)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
