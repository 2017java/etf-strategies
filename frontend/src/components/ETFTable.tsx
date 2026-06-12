import { useState, useMemo } from 'react';
import type { ETFItem } from '../types';
import { ArrowUpDown, TrendingUp, TrendingDown, Filter } from 'lucide-react';

type SortKey = keyof ETFItem | null;
type SortOrder = 'asc' | 'desc';

function formatVolume(vol: number): string {
  if (vol >= 100000000) return (vol / 100000000).toFixed(2) + '亿';
  if (vol >= 10000) return (vol / 10000).toFixed(2) + '万';
  return vol.toString();
}

function ChangeCell({ value }: { value: number }) {
  const isUp = value > 0;
  const isFlat = value === 0;
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${isFlat ? 'text-slate-400' : isUp ? 'text-rise' : 'text-fall'}`}>
      {isUp ? <TrendingUp size={14} /> : isFlat ? null : <TrendingDown size={14} />}
      {value > 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

export default function ETFTable({ data, onEtfClick }: { data: ETFItem[]; onEtfClick?: (etf: ETFItem) => void }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');
  const [sortKey, setSortKey] = useState<SortKey>('composite_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const categories = useMemo(() => {
    const set = new Set(data.map(d => d.category));
    return ['全部', ...Array.from(set)];
  }, [data]);

  const filtered = useMemo(() => {
    let list = categoryFilter === '全部' ? data : data.filter(d => d.category === categoryFilter);
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const va = a[sortKey] as number;
        const vb = b[sortKey] as number;
        return sortOrder === 'asc' ? va - vb : vb - va;
      });
    }
    return list;
  }, [data, categoryFilter, sortKey, sortOrder]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  }

  function SortIcon({ target }: { target: SortKey }) {
    if (sortKey !== target) return <ArrowUpDown size={14} className="text-slate-300" />;
    return <ArrowUpDown size={14} className="text-primary-600" />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-slate-800">ETF全量跟踪</h3>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-left">
              <th className="px-5 py-3 font-medium">代码</th>
              <th className="px-5 py-3 font-medium">名称</th>
              <th className="px-5 py-3 font-medium">类别</th>
              <th className="px-5 py-3 font-medium text-right">当前价</th>
              <th className="px-5 py-3 font-medium text-right cursor-pointer select-none" onClick={() => handleSort('current_change_pct')}>
                <span className="inline-flex items-center gap-1">涨跌幅 <SortIcon target="current_change_pct" /></span>
              </th>
              <th className="px-5 py-3 font-medium text-right cursor-pointer select-none" onClick={() => handleSort('two_day_change_pct')}>
                <span className="inline-flex items-center gap-1">两日累计涨幅 <SortIcon target="two_day_change_pct" /></span>
              </th>
              <th className="px-5 py-3 font-medium text-right cursor-pointer select-none" onClick={() => handleSort('volume_expand_pct')}>
                <span className="inline-flex items-center gap-1">成交量放大 <SortIcon target="volume_expand_pct" /></span>
              </th>
              <th className="px-5 py-3 font-medium text-right cursor-pointer select-none" onClick={() => handleSort('change_30d')}>
                <span className="inline-flex items-center gap-1">30日涨跌幅 <SortIcon target="change_30d" /></span>
              </th>
              <th className="px-5 py-3 font-medium text-right cursor-pointer select-none" onClick={() => handleSort('change_30d_score')}>
                <span className="inline-flex items-center gap-1">30日标准分 <SortIcon target="change_30d_score" /></span>
              </th>
              <th className="px-5 py-3 font-medium text-right cursor-pointer select-none" onClick={() => handleSort('composite_score')}>
                <span className="inline-flex items-center gap-1">综合得分 <SortIcon target="composite_score" /></span>
              </th>
              <th className="px-5 py-3 font-medium text-right">成交量</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr
                key={item.code}
                className={`border-b border-slate-50 hover:bg-primary-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
              >
                <td className="px-5 py-3 font-mono text-slate-700">
                  {onEtfClick ? (
                    <button onClick={() => onEtfClick(item)} className="hover:text-primary-600 hover:underline">{item.code}</button>
                  ) : item.code}
                </td>
                <td className="px-5 py-3 font-medium text-slate-800">
                  {onEtfClick ? (
                    <button onClick={() => onEtfClick(item)} className="hover:text-primary-600 hover:underline">{item.name}</button>
                  ) : item.name}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    item.category === '宽基ETF' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'
                  }`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-mono text-slate-700">{item.current_price.toFixed(3)}</td>
                <td className="px-5 py-3 text-right"><ChangeCell value={item.current_change_pct} /></td>
                <td className="px-5 py-3 text-right"><ChangeCell value={item.two_day_change_pct} /></td>
                <td className="px-5 py-3 text-right"><ChangeCell value={item.volume_expand_pct} /></td>
                <td className="px-5 py-3 text-right">{item.change_30d != null ? <ChangeCell value={item.change_30d} /> : <span className="text-slate-300">-</span>}</td>
                <td className="px-5 py-3 text-right">
                  {item.change_30d_score != null ? (
                    <span className={`font-semibold ${item.change_30d_score >= 25 ? 'text-orange-600' : item.change_30d_score >= 10 ? 'text-amber-600' : 'text-slate-500'}`}>
                      +{item.change_30d_score.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={`font-semibold ${item.composite_score > 0 ? 'text-rise' : item.composite_score < 0 ? 'text-fall' : 'text-slate-400'}`}>
                    {item.composite_score > 0 ? '+' : ''}{item.composite_score.toFixed(2)}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-slate-500">{formatVolume(item.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
