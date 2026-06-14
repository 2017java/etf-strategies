import { useDashboard } from '../DashboardContext';
import { Loader2 } from 'lucide-react';

const PHASE_LABEL: Record<string, string> = {
  idle: '空闲',
  init: '准备中',
  starting: '正在启动并发任务',
  fetching: '正在拉取行情',
  done: '完成',
};

export default function ProgressBar() {
  const { progress, loading } = useDashboard();
  if (!loading || !progress) return null;
  const { done, total, phase, elapsed_sec } = progress;
  const safeDone = total > 0 ? Math.min(done, total) : done;
  const pct = total > 0 ? Math.min(Math.round((safeDone / total) * 100), 100) : 0;
  const phaseLabel = PHASE_LABEL[phase] || phase;

  return (
    <div className="bg-white border border-primary-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3 text-sm">
      <Loader2 className="animate-spin text-primary-600" size={18} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-medium text-slate-700">
            {phaseLabel} <span className="text-slate-400">·</span> {safeDone}/{total}
          </span>
          <span className="text-xs text-slate-400 tabular-nums">{elapsed_sec}s</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
