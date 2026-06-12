import { useState } from "react";
import { useDashboard } from "../DashboardContext";
import ETFTable from "./ETFTable";
import QuantRanking from "./QuantRanking";
import LLMRecommend from "./LLMRecommend";
import SimPortfolio from "./SimPortfolio";
import ETFDetail from "./ETFDetail";
import { RefreshCw, BarChart3, Wallet, Activity, Trophy, TrendingUp, Zap } from "lucide-react";
import type { ETFItem } from "../types";

function MetricCard({
  title, etf, sub, icon: Icon, gradient,
}: {
  title: string; etf: ETFItem; sub: string;
  icon: React.ElementType; gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} border border-white/40 shadow-sm`}>
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
          <Icon size={16} /> {title}
        </div>
        <div className="text-xl font-bold text-slate-800">{etf.name}</div>
        <div className="text-xs text-slate-500 mt-0.5 font-mono">{etf.code}</div>
        <div className="mt-3 text-sm text-slate-600">{sub}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, load } = useDashboard();
  const [activeTab, setActiveTab] = useState<"market" | "sim">("market");
  const [selectedEtf, setSelectedEtf] = useState<ETFItem | null>(null);

  const topScore = data?.etf_list.reduce(
    (prev, curr) => (curr.composite_score > prev.composite_score ? curr : prev), data.etf_list[0]
  );
  const topTwoDay = data?.etf_list.reduce(
    (prev, curr) => (curr.two_day_change_pct > prev.two_day_change_pct ? curr : prev), data.etf_list[0]
  );
  const topVolume = data?.etf_list.reduce(
    (prev, curr) => (curr.volume_expand_pct > prev.volume_expand_pct ? curr : prev), data.etf_list[0]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
                <BarChart3 className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">ETF操盘看板</h1>
                <p className="text-xs text-slate-400">
                  {data ? (
                    <>
                      {data.data_time}{" "}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        data.data_type === "realtime" ? "bg-rose-50 text-rose-600"
                          : data.data_type === "closed_today" ? "bg-amber-50 text-amber-600"
                            : "bg-slate-100 text-slate-500"
                      }`}>
                        {data.data_type === "realtime" ? "盘中(实时)"
                          : data.data_type === "closed_today" ? "今日收盘" : "收盘"}
                      </span>
                    </>
                  ) : "--"}
                </p>
              </div>
            </div>
            {/* Tab 切换 */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("market")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "market"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <BarChart3 size={14} /> 行情看板
              </button>
              <button
                onClick={() => setActiveTab("sim")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "sim"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Wallet size={14} /> 模拟盘
              </button>
            </div>
          </div>
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary-200"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "运算中..." : "刷新运算"}
          </button>
        </div>
      </header>

      <main className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 text-sm">{error}</div>
        )}

        {/* 行情看板页面 */}
        {activeTab === "market" && (
          <>
            {data && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QuantRanking data={data.quant_top5} onEtfClick={(etf) => {
                  const found = data.etf_list.find(e => e.code === etf.code);
                  if (found) setSelectedEtf(found);
                }} />
                <LLMRecommend data={data.llm_top5} onEtfClick={(etf) => {
                  const found = data.etf_list.find(e => e.code === etf.code);
                  if (found) setSelectedEtf(found);
                }} />
              </div>
            )}

            {data && topScore && topTwoDay && topVolume && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard title="量化评分第1名" etf={topScore} sub={`综合得分 ${topScore.composite_score > 0 ? "+" : ""}${topScore.composite_score.toFixed(2)}`} icon={Trophy} gradient="from-blue-50 to-indigo-50" />
                <MetricCard title="两日累计涨幅最高" etf={topTwoDay} sub={`两日累计 +${topTwoDay.two_day_change_pct.toFixed(2)}%`} icon={TrendingUp} gradient="from-rose-50 to-red-50" />
                <MetricCard title="成交量放大最显著" etf={topVolume} sub={`成交量放大 +${topVolume.volume_expand_pct.toFixed(2)}%`} icon={Zap} gradient="from-amber-50 to-orange-50" />
              </div>
            )}

            {data && <ETFTable data={data.etf_list} onEtfClick={(etf) => setSelectedEtf(etf)} />}

            {!data && !loading && !error && (
              <div className="text-center py-20 text-slate-400 text-sm">点击右上角"刷新运算"加载数据</div>
            )}
          </>
        )}

        {/* 模拟盘页面 */}
        {activeTab === "sim" && (
          <SimPortfolio />
        )}
      </main>

      {selectedEtf && (
        <ETFDetail
          code={selectedEtf.code}
          name={selectedEtf.name}
          etfData={selectedEtf}
          onClose={() => setSelectedEtf(null)}
        />
      )}
    </div>
  );
}
