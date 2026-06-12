import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Play, Loader2, AlertCircle, TrendingUp, BarChart3, Activity, ArrowDownUp } from "lucide-react";
import { runBacktest, listStrategies, getDefaultCodes, listBenchmarks, type BacktestRunParams } from "../api";
import type { BacktestResult, StrategyInfo, BenchmarkInfo } from "../types";

export default function BacktestRunner() {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [defaultCodes, setDefaultCodes] = useState<string[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkInfo[]>([]);

  const [strategy, setStrategy] = useState("");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");
  const [codes, setCodes] = useState("");
  const [benchmarkCode, setBenchmarkCode] = useState("");
  const [initialCash, setInitialCash] = useState(1000000);
  const [costRate, setCostRate] = useState(0.001);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BacktestResult | null>(null);

  useEffect(() => {
    listStrategies().then(r => {
      setStrategies(r.strategies);
      if (r.strategies.length > 0) setStrategy(r.strategies[0].id);
    }).catch(() => {});
    getDefaultCodes().then(r => {
      setDefaultCodes(r.codes);
      setCodes(r.codes.join(", "));
    }).catch(() => {});
    listBenchmarks().then(r => {
      setBenchmarks(r.benchmarks);
      if (r.benchmarks.length > 0) setBenchmarkCode(r.benchmarks[0].code);
    }).catch(() => {});
  }, []);

  const handleRun = async () => {
    if (!strategy) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params: BacktestRunParams = {
        strategy,
        start_date: startDate,
        end_date: endDate,
        codes: codes.split(",").map(s => s.trim()).filter(Boolean),
        benchmark_code: benchmarkCode || undefined,
        initial_cash: initialCash,
        cost_rate: costRate,
      };
      const res = await runBacktest(params);
      if (res.status === "error") {
        setError(res.message || "回测失败");
      } else {
        setResult(res);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? result.nav.map((n, i) => {
        const bm = result.benchmark_nav?.[i];
        return {
          date: n.date.slice(5),
          策略净值: +n.nav.toFixed(4),
          ...(bm ? { 基准净值: +bm.nav.toFixed(4) } : {}),
        };
      })
    : [];

  const fmt = (v: number) => (v * 100).toFixed(2) + "%";
  const fmtAbs = (v: number) => v.toFixed(2);

  const metrics = result?.metrics;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
            <BarChart3 className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">策略回测</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">策略</label>
              <select
                value={strategy}
                onChange={e => setStrategy(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                ETF代码 <span className="text-slate-400">(逗号分隔，留空用默认池)</span>
              </label>
              <input
                type="text"
                value={codes}
                onChange={e => setCodes(e.target.value)}
                placeholder={defaultCodes.join(", ")}
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

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">初始资金</label>
              <input
                type="number"
                value={initialCash}
                onChange={e => setInitialCash(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">交易费率</label>
              <input
                type="number"
                step="0.0001"
                value={costRate}
                onChange={e => setCostRate(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRun}
                disabled={loading || !strategy}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-medium hover:from-primary-600 hover:to-primary-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {loading ? "回测中..." : "运行回测"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {result && metrics && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCard
                title="年化收益"
                value={fmt(metrics.annual_return)}
                positive={metrics.annual_return > 0}
                icon={TrendingUp}
                gradient="from-blue-50 to-indigo-50"
              />
              <MetricCard
                title="夏普比率"
                value={fmtAbs(metrics.sharpe)}
                positive={metrics.sharpe > 0}
                icon={Activity}
                gradient="from-violet-50 to-purple-50"
              />
              <MetricCard
                title="最大回撤"
                value={fmt(metrics.max_drawdown)}
                positive={false}
                icon={ArrowDownUp}
                gradient="from-rose-50 to-red-50"
              />
              <MetricCard
                title="卡玛比率"
                value={fmtAbs(metrics.calmar)}
                positive={metrics.calmar > 0}
                icon={BarChart3}
                gradient="from-emerald-50 to-green-50"
              />
              <MetricCard
                title="年化换手率"
                value={fmt(metrics.annual_turnover)}
                positive={true}
                icon={ArrowDownUp}
                gradient="from-amber-50 to-orange-50"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">净值曲线</h3>
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
                  <Line type="monotone" dataKey="策略净值" stroke="#2563EB" strokeWidth={2} dot={false} />
                  {result.benchmark_nav?.length > 0 && (
                    <Line type="monotone" dataKey="基准净值" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title, value, positive, icon: Icon, gradient,
}: {
  title: string; value: string; positive: boolean;
  icon: React.ElementType; gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} border border-white/40 shadow-sm`}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
        <Icon size={16} /> {title}
      </div>
      <div className={`text-xl font-bold ${positive ? "text-rise" : "text-fall"}`}>{value}</div>
    </div>
  );
}
