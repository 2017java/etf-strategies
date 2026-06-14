import type { LLMRecommend } from '../types';
import { Sparkles, ChevronRight, Bot, BarChart3 } from 'lucide-react';

const rankColors = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-cyan-500',
];

export default function LLMRecommend({ data, onEtfClick }: { data: LLMRecommend[]; onEtfClick?: (etf: LLMRecommend) => void }) {
  const isLLM = data.length > 0 && data[0].source === 'llm';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="text-warm" size={22} />
        <h3 className="text-lg font-semibold text-slate-800">热点推荐 TOP5</h3>
        <span className={`ml-auto text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
          isLLM
            ? 'text-indigo-600 bg-indigo-50'
            : 'text-amber-600 bg-amber-50'
        }`}>
          {isLLM ? (
            <><Bot size={12} />AI 分析</>
          ) : (
            <><BarChart3 size={12} />量化兜底</>
          )}
        </span>
      </div>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div
            key={item.code}
            className="relative flex items-start gap-4 rounded-xl border border-slate-100 p-4 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all group"
          >
            <div className={`w-1 self-stretch rounded-full ${rankColors[idx]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-800">
                  {onEtfClick ? (
                    <button onClick={() => onEtfClick(item)} className="hover:text-primary-600 hover:underline">{item.name}</button>
                  ) : item.name}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {onEtfClick ? (
                    <button onClick={() => onEtfClick(item)} className="hover:text-primary-600">{item.code}</button>
                  ) : item.code}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-white border border-slate-100 text-slate-500">
                  {item.category}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.reason}</p>
            </div>
            <div className="flex items-center self-center">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${rankColors[idx]}`}>
                {item.rank}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
