import { useState, useEffect, useCallback } from "react";
import type { ETFItem, KlinePoint, KlineResponse } from "../types";
import { getEtfKline } from "../api";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { X, TrendingUp, TrendingDown, Activity, Trophy, BarChart3, RotateCcw } from "lucide-react";

type RangeOption = 60 | 120 | 250;

function formatVolume(vol: number): string {
  if (vol >= 100000000) return (vol / 100000000).toFixed(2) + "亿";
  if (vol >= 10000) return (vol / 10000).toFixed(2) + "万";
  return vol.toString();
}

export default function ETFDetail({
  code,
  name,
  etfData,
  onClose,
}: {
  code: string;
  name?: string;
  etfData?: ETFItem;
  onClose: () => void;
}) {
  const [klineData, setKlineData] = useState<KlinePoint[]>([]);
  const [klineName, setKlineName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState<RangeOption>(120);

  const loadKline = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res: KlineResponse = await getEtfKline(code, range);
      setKlineData(res.kline);
      setKlineName(res.name);
    } catch (e: any) {
      setError(e.message || "加载K线数据失败");
    } finally {
      setLoading(false);
    }
  }, [code, range]);

  useEffect(() => {
    loadKline();
  }, [loadKline]);

  const displayName = name || klineName || code;

  const isUp = (etfData?.current_change_pct ?? 0) >= 0;
  const changeClass = isUp ? "text-rise" : "text-fall";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary-600" />
              {displayName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{code}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {etfData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <Activity size={12} /> 当前价
                </div>
                <div className="text-lg font-bold text-slate-800 font-mono">
                  {etfData.current_price.toFixed(3)}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 涨跌幅
                </div>
                <div className={`text-lg font-bold font-mono ${changeClass}`}>
                  {isUp ? "+" : ""}{etfData.current_change_pct.toFixed(2)}%
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <BarChart3 size={12} /> 成交量
                </div>
                <div className="text-lg font-bold text-slate-800 font-mono">
                  {formatVolume(etfData.volume)}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  {etfData.change_30d != null && etfData.change_30d >= 0
                    ? <TrendingUp size={12} />
                    : <TrendingDown size={12} />}
                  30日涨跌
                </div>
                <div className={`text-lg font-bold font-mono ${
                  etfData.change_30d == null
                    ? "text-slate-400"
                    : etfData.change_30d >= 0 ? "text-rise" : "text-fall"
                }`}>
                  {etfData.change_30d != null
                    ? `${etfData.change_30d >= 0 ? "+" : ""}${etfData.change_30d.toFixed(2)}%`
                    : "--"}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <Trophy size={12} /> 综合得分
                </div>
                <div className={`text-lg font-bold font-mono ${
                  etfData.composite_score > 0
                    ? "text-rise"
                    : etfData.composite_score < 0
                      ? "text-fall"
                      : "text-slate-400"
                }`}>
                  {etfData.composite_score > 0 ? "+" : ""}{etfData.composite_score.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">K线走势</h3>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {([60, 120, 250] as RangeOption[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setRange(d)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      range === d
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {d}日
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-sm text-rose-600">{error}</p>
                <button
                  onClick={loadKline}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                >
                  <RotateCcw size={14} /> 重试
                </button>
              </div>
            )}

            {!loading && !error && klineData.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">暂无K线数据</div>
            )}

            {!loading && !error && klineData.length > 0 && (
              <div className="space-y-0">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={klineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#94A3B8" }}
                        tickFormatter={(v: any) => String(v).slice(5)}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fontSize: 10, fill: "#94A3B8" }}
                        tickFormatter={(v: any) => Number(v).toFixed(3)}
                      />
                      <Tooltip
                        labelFormatter={(label: any) => String(label)}
                        formatter={(value: any) => Number(value).toFixed(3)}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="close"
                        fill="#3B82F6"
                        fillOpacity={0.08}
                        stroke="none"
                        name="收盘价(区域)"
                      />
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke="#3B82F6"
                        strokeWidth={1.5}
                        dot={false}
                        name="收盘价"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={klineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#94A3B8" }}
                        tickFormatter={(v: any) => String(v).slice(5)}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#94A3B8" }}
                        tickFormatter={(v: any) => formatVolume(Number(v))}
                      />
                      <Tooltip
                        labelFormatter={(label: any) => String(label)}
                        formatter={(value: any) => Number(value).toFixed()}
                      />
                      <Bar
                        dataKey="volume"
                        fill="#94A3B8"
                        radius={[2, 2, 0, 0]}
                        name="成交量"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
