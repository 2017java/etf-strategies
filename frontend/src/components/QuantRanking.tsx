import type { QuantRecommend } from '../types';
import { Trophy, TrendingUp, BarChart3, Activity } from 'lucide-react';

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.min(Math.max((score / max) * 100, 0), 100);
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function QuantRanking({ data, onEtfClick }: { data: QuantRecommend[]; onEtfClick?: (etf: QuantRecommend) => void }) {
  const maxScore = Math.max(...data.map(d => d.composite_score), 1);

  const rankStyles = [
    'from-amber-50 to-orange-50 border-amber-200',
    'from-slate-50 to-slate-100 border-slate-200',
    'from-orange-50 to-amber-50 border-orange-200',
  ];

  const rankBadges = [
    'bg-amber-500 text-white',
    'bg-slate-500 text-white',
    'bg-orange-500 text-white',
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="text-primary-600" size={22} />
        <h3 className="text-lg font-semibold text-slate-800">量化评分 TOP5</h3>
        <span className="hidden md:inline ml-auto text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
         今日涨跌幅×2 + 两日累计×3 + 成交量放大×0.5 + MA20确认(+50) + 30日标准分×1
        </span>
      </div>
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div
            key={item.code}
            className={`relative rounded-xl border p-4 bg-gradient-to-br ${rankStyles[idx]} transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${rankBadges[idx]}`}>
                  {item.rank}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-base">
                      {onEtfClick ? (
                        <button onClick={() => onEtfClick(item)} className="hover:text-primary-600 hover:underline">{item.name}</button>
                      ) : item.name}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {onEtfClick ? (
                        <button onClick={() => onEtfClick(item)} className="hover:text-primary-600">{item.code}</button>
                      ) : item.code}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/70 text-slate-500 border border-slate-100">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Activity size={12} className={item.current_change_pct >= 0 ? 'text-rise' : 'text-fall'} />
                      涨跌 {item.current_change_pct > 0 ? '+' : ''}{item.current_change_pct.toFixed(2)}%
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp size={12} className={item.two_day_change_pct >= 0 ? 'text-rise' : 'text-fall'} />
                      两日累计 {item.two_day_change_pct > 0 ? '+' : ''}{item.two_day_change_pct.toFixed(2)}%
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BarChart3 size={12} className={item.volume_expand_pct >= 0 ? 'text-primary-500' : 'text-slate-400'} />
                      成交量放大 {item.volume_expand_pct > 0 ? '+' : ''}{item.volume_expand_pct.toFixed(2)}%
                    </span>
                    {item.ma20_confirmed ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        MA20确认 +50
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        MA20未确认
                      </span>
                    )}
                    {item.change_30d_score != null && (
                      <span className={`inline-flex items-center gap-1 ${item.change_30d_score >= 25 ? 'text-orange-600 font-medium' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.change_30d_score >= 25 ? 'bg-orange-500' : 'bg-slate-400'}`} />
                        30日标准分 +{item.change_30d_score.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-2xl font-bold ${item.composite_score >= 0 ? 'text-rise' : 'text-fall'}`}>
                  {item.composite_score > 0 ? '+' : ''}{item.composite_score.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">综合得分</div>
              </div>
            </div>
            <ScoreBar score={item.composite_score} max={maxScore} />
          </div>
        ))}
      </div>
    </div>
  );
}
