import { Sparkles, RefreshCw, Bot, Zap } from "lucide-react";
import type { LLMRecommend as LLMRecommendType } from "../types";

export default function LLMRecommend({ data, onRefresh }: { data: LLMRecommendType[]; onRefresh?: () => void }) {
  const rankStyles = [
    "from-violet-50 to-purple-50 border-violet-200",
    "from-blue-50 to-indigo-50 border-blue-200",
    "from-cyan-50 to-sky-50 border-cyan-200",
  ];

  const rankBadges = [
    "bg-violet-500 text-white",
    "bg-blue-500 text-white",
    "bg-cyan-500 text-white",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="text-violet-600" size={22} />
        <h3 className="text-lg font-semibold text-slate-800">AI 推荐 TOP5</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition"
          >
            <RefreshCw size={12} /> 刷新
          </button>
        )}
      </div>
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div
            key={item.code}
            className={`relative rounded-xl border p-4 bg-gradient-to-br ${rankStyles[idx] || "from-slate-50 to-slate-50 border-slate-200"} transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm shrink-0 ${rankBadges[idx] || "bg-slate-400 text-white"}`}>
                {item.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 text-base">{item.name}</span>
                  <span className="font-mono text-xs text-slate-400">{item.code}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/70 text-slate-500 border border-slate-100">
                    {item.category}
                  </span>
                  {item.source === "llm" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">
                      <Bot size={10} /> AI
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                      <Zap size={10} /> 量化
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
