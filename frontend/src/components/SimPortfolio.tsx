import { useState, useEffect, useCallback } from "react";
import { useDashboard } from "../DashboardContext";
import type { SimPortfolio, SimPosition, SimTrade, QuantRecommend, ETFItem } from "../types";
import {
  getSimPortfolio, batchBuySim, clearAllSim,
  upsertPositionSim, removePositionSim,
  upsertTradeSim, removeTradeSim, resetSim,
  updateInitialCashSim,
} from "../api";
import {
  Wallet, TrendingUp, TrendingDown, Package, Plus, Trash2, Edit2,
  ShoppingCart, X, Save, RotateCcw,
} from "lucide-react";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
function fmtPct(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

// ── 分类买入弹窗 ────────────────────────────────────────────
function BatchBuyModal({
  quantTop5,
  allEtfs,
  availableCash,
  onClose,
  onSuccess,
}: {
  quantTop5: QuantRecommend[];
  allEtfs: ETFItem[];
  availableCash: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<'even' | 'custom'>('even');
  const [selected, setSelected] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wideBase = allEtfs.filter((e) => e.category === "宽基ETF");
  const industryBase = allEtfs.filter((e) => e.category === "行业ETF");

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      // 初次选中时，预填均分金额（向下取整 100）
      if (!prev.includes(code) && mode === 'custom' && !amounts[code]) {
        const even = Math.floor((availableCash / (next.length || 1)) / 100) * 100;
        setAmounts((a) => ({ ...a, [code]: even }));
      }
      return next;
    });
  };

  const totalAllocated = selected.reduce((sum, c) => sum + (amounts[c] || 0), 0);
  const overBudget = totalAllocated > availableCash;
  const evenHint = selected.length > 0 ? Math.floor((availableCash / selected.length) / 100) * 100 : 0;

  const applyEvenDistribution = () => {
    const even = selected.length > 0 ? Math.floor((availableCash / selected.length) / 100) * 100 : 0;
    const next: Record<string, number> = {};
    selected.forEach((c) => { next[c] = even; });
    setAmounts(next);
  };

  const confirm = async () => {
    if (selected.length === 0) {
      setError("请至少选择一只ETF");
      return;
    }
    if (mode === 'custom' && overBudget) {
      setError(`自定义金额合计 ${totalAllocated.toFixed(2)} 超过可用资金 ${availableCash.toFixed(2)}`);
      return;
    }
    const items = selected.map((code) => {
      const quantEtf = quantTop5.find((e) => e.code === code);
      const etfItem = allEtfs.find((e) => e.code === code);
      if (!etfItem || !etfItem.current_price) {
        throw new Error("所选ETF行情缺失，请刷新页面重试");
      }
      if (mode === 'custom') {
        return { code, name: quantEtf?.name || etfItem.name, price: etfItem.current_price, shares: 0, amount: amounts[code] || 0 };
      }
      return { code, name: quantEtf?.name || etfItem.name, price: etfItem.current_price, shares: 0 };
    });
    setLoading(true);
    setError("");
    try {
      await batchBuySim(items);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "买入失败");
    } finally {
      setLoading(false);
    }
  };

  function EtfCheckbox({
    code,
    name,
    price,
    changePct,
  }: {
    code: string;
    name: string;
    price: number;
    changePct?: number;
  }) {
    const isSelected = selected.includes(code);
    const isUp = (changePct ?? 0) >= 0;
    return (
      <div
        className={
          "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all flex-shrink-0 " +
          (isSelected
            ? "border-primary-400 bg-primary-50 text-primary-700"
            : "border-slate-200 hover:border-slate-300 text-slate-600")
        }
      >
        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggle(code)}
            className="accent-primary-600"
          />
          <span className="font-medium truncate max-w-[80px]">{name}</span>
          <span className="text-xs text-slate-400 font-mono">{code}</span>
        </label>
        {changePct !== undefined && (
          <span
            className={"text-xs font-mono " + (isUp ? "text-rise" : "text-fall")}
          >
            {isUp ? "+" : ""}
            {changePct.toFixed(2)}%
          </span>
        )}
        {isSelected && mode === 'custom' && (
          <input
            type="number"
            step="100"
            min="0"
            value={amounts[code] || 0}
            onChange={(e) => setAmounts({ ...amounts, [code]: Number(e.target.value) })}
            onClick={(e) => e.stopPropagation()}
            className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-300"
            placeholder="元"
          />
        )}
      </div>
    );
  }

  function Section({
    title,
    etfs,
  }: {
    title: string;
    etfs: Array<{ code: string; name: string; current_price: number; current_change_pct?: number }>;
  }) {
    if (etfs.length === 0) return null;
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <span className="text-xs text-slate-400">{etfs.length} 只</span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
          {etfs.map((etf) => (
            <EtfCheckbox
              key={etf.code}
              code={etf.code}
              name={etf.name}
              price={etf.current_price}
              changePct={etf.current_change_pct}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart size={20} className="text-primary-600" />
              批量买入
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              可用资金 ¥{availableCash.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* 模式切换 */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2">
          <button
            onClick={() => setMode('even')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              mode === 'even'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            均分模式
          </button>
          <button
            onClick={() => {
              setMode('custom');
              applyEvenDistribution();
            }}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              mode === 'custom'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            自定义金额
          </button>
          {mode === 'custom' && (
            <span className={`ml-auto text-xs font-medium ${overBudget ? 'text-rose-600' : 'text-slate-500'}`}>
              已分配 ¥{totalAllocated.toLocaleString("zh-CN", { maximumFractionDigits: 0 })} /
              剩余 ¥{Math.max(0, availableCash - totalAllocated).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
            </span>
          )}
          {mode === 'even' && selected.length > 0 && (
            <span className="ml-auto text-xs text-slate-500">
              均分后每只 ¥{evenHint.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <Section
            title="⭐ 行情推荐 ETF TOP5"
            etfs={quantTop5.map((e) => {
              const etfItem = allEtfs.find(x => x.code === e.code);
              return {
                code: e.code,
                name: e.name,
                current_price: etfItem?.current_price ?? 0,
                current_change_pct: e.current_change_pct,
              };
            })}
          />
          <Section
            title="🏭 行业 ETF"
            etfs={industryBase.map((e) => ({
              code: e.code,
              name: e.name,
              current_price: e.current_price,
              current_change_pct: e.current_change_pct,
            }))}
          />
          <Section
            title="📊 宽基 ETF"
            etfs={wideBase.map((e) => ({
              code: e.code,
              name: e.name,
              current_price: e.current_price,
              current_change_pct: e.current_change_pct,
            }))}
          />
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <span className="text-sm text-slate-500">
            {selected.length === 0
              ? "请从下方选择ETF"
              : mode === 'even'
                ? "资金将均分到 " + selected.length + " 只ETF"
                : "自定义金额分配到 " + selected.length + " 只ETF"}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={confirm}
              disabled={loading || selected.length === 0 || (mode === 'custom' && overBudget)}
              className="px-5 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "买入中..." : "确认买入 (" + selected.length + ")"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ETF 选择子弹窗 ────────────────────────────────────────────
function EtfPickerModal({
  allEtfs,
  currentCode,
  onSelect,
  onClose,
}: {
  allEtfs: ETFItem[];
  currentCode: string;
  onSelect: (etf: { code: string; name: string; current_price: number }) => void;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const wideBase = allEtfs.filter((e) => e.category === "宽基ETF");
  const industryBase = allEtfs.filter((e) => e.category === "行业ETF");
  const filterFn = (e: ETFItem) =>
    !keyword ||
    e.name.toLowerCase().includes(keyword.toLowerCase()) ||
    e.code.includes(keyword);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">选择 ETF</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索代码或名称"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {[
            { title: "📊 宽基 ETF", list: wideBase.filter(filterFn) },
            { title: "🏭 行业 ETF", list: industryBase.filter(filterFn) },
          ].map((group) => (
            <div key={group.title}>
              <div className="text-xs font-semibold text-slate-500 mb-1.5 px-2">
                {group.title} · {group.list.length}
              </div>
              {group.list.length === 0 ? (
                <div className="text-xs text-slate-300 px-2 py-1">无匹配</div>
              ) : (
                <div className="space-y-0.5">
                  {group.list.map((e) => (
                    <button
                      key={e.code}
                      onClick={() => onSelect({ code: e.code, name: e.name, current_price: e.current_price })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                        currentCode === e.code
                          ? "bg-primary-50 text-primary-700"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="font-medium">{e.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{e.code}</span>
                      <span className="ml-auto text-xs font-mono text-slate-500">
                        ¥{e.current_price.toFixed(3)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 持仓编辑弹窗 ────────────────────────────────────────────
function PositionEditModal({
  position,
  allEtfs,
  onClose,
  onSuccess,
}: {
  position?: SimPosition;
  allEtfs: ETFItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    code: position?.code || "",
    name: position?.name || "",
    shares: position?.shares || 0,
    avg_cost: position?.avg_cost || 0,
    current_price: position?.current_price || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const save = async () => {
    if (!form.code || form.shares <= 0 || form.avg_cost <= 0) {
      setError("请填写完整且有效的数据");
      return;
    }
    setLoading(true);
    try {
      await upsertPositionSim(form as SimPosition);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePick = (etf: { code: string; name: string; current_price: number }) => {
    setForm({
      ...form,
      code: etf.code,
      name: etf.name,
      current_price: etf.current_price || form.current_price,
    });
    setShowPicker(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">
              {position ? "编辑持仓" : "新增持仓"}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">ETF代码</label>
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="如 510300"
                />
                <button
                  onClick={() => setShowPicker(true)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 flex items-center gap-1"
                  type="button"
                >
                  🔍 选择
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">ETF名称</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="如 沪深300ETF"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">持仓份额</label>
                <input
                  type="number"
                  value={form.shares}
                  onChange={(e) => setForm({ ...form, shares: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">持仓均价</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.avg_cost}
                  onChange={(e) => setForm({ ...form, avg_cost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">当前市价（快照）</label>
              <input
                type="number"
                step="0.001"
                value={form.current_price}
                onChange={(e) => setForm({ ...form, current_price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2 text-sm">
                {error}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={save}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={14} />
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
      {showPicker && (
        <EtfPickerModal
          allEtfs={allEtfs}
          currentCode={form.code}
          onSelect={handlePick}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ── 成交记录编辑弹窗 ────────────────────────────────────────
function TradeEditModal({
  trade,
  onClose,
  onSuccess,
}: {
  trade?: SimTrade;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const defaultTime =
    now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) +
    " " + pad(now.getHours()) + ":" + pad(now.getMinutes());
  const [form, setForm] = useState({
    id: trade?.id || "",
    time: trade?.time || defaultTime,
    action: trade?.action || ("buy" as "buy" | "sell"),
    code: trade?.code || "",
    name: trade?.name || "",
    price: trade?.price || 0,
    shares: trade?.shares || 0,
    note: trade?.note || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.code || form.shares <= 0 || form.price <= 0) {
      setError("请填写完整且有效的数据");
      return;
    }
    setLoading(true);
    try {
      const amount = Number((form.shares * form.price).toFixed(2));
      await upsertTradeSim({ ...form, amount } as SimTrade);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {trade ? "编辑成交记录" : "新增成交记录"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">操作方向</label>
              <select
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value as "buy" | "sell" })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="buy">买入</option>
                <option value="sell">卖出</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">时间</label>
              <input
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">ETF代码</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">ETF名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">成交价</label>
              <input
                type="number" step="0.001" value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">成交份额</label>
              <input
                type="number" value={form.shares}
                onChange={(e) => setForm({ ...form, shares: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">备注</label>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="可选"
            />
          </div>
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">取消</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            <Save size={14} />{loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 持仓行组件 ──────────────────────────────────────────────
function PositionRow({
  pos, onEdit, onDelete,
}: {
  pos: SimPosition & { profit: number; profit_pct: number; market_value: number };
  onEdit: () => void; onDelete: () => void;
}) {
  const isProfit = pos.profit >= 0;
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="py-3 pl-4">
        <div className="font-medium text-slate-800 text-sm">{pos.name}</div>
        <div className="text-xs text-slate-400 font-mono">{pos.code}</div>
      </td>
      <td className="py-3 px-3 text-right text-sm font-mono">{pos.shares.toLocaleString()}</td>
      <td className="py-3 px-3 text-right text-sm font-mono">{pos.avg_cost.toFixed(3)}</td>
      <td className="py-3 px-3 text-right text-sm font-mono">{pos.current_price.toFixed(3)}</td>
      <td className="py-3 px-3 text-right text-sm font-mono font-medium">{fmt(pos.market_value)}</td>
      <td className={"py-3 px-3 text-right text-sm font-mono font-medium " + (isProfit ? "text-rise" : "text-fall")}>
        {isProfit ? "+" : ""}{fmt(pos.profit)}<br /><span className="text-xs">{fmtPct(pos.profit_pct)}</span>
      </td>
      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-colors"><Edit2 size={14} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );
}

// ── 成交记录行组件 ──────────────────────────────────────────
function TradeRow({
  trade, onEdit, onDelete,
}: {
  trade: SimTrade; onEdit: () => void; onDelete: () => void;
}) {
  const isBuy = trade.action === "buy";
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="py-3 pl-4 text-xs text-slate-400">{trade.time}</td>
      <td className="py-3 px-3">
        <span className={"inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium " + (isBuy ? "text-rise bg-rose-50" : "text-fall bg-emerald-50")}>
          {isBuy ? "买入" : "卖出"}
        </span>
      </td>
      <td className="py-3 px-3">
        <div className="font-medium text-slate-800 text-sm">{trade.name}</div>
        <div className="text-xs text-slate-400 font-mono">{trade.code}</div>
      </td>
      <td className="py-3 px-3 text-right text-sm font-mono">{trade.price.toFixed(3)}</td>
      <td className="py-3 px-3 text-right text-sm font-mono">{trade.shares.toLocaleString()}</td>
      <td className="py-3 px-3 text-right text-sm font-mono font-medium">{fmt(trade.amount)}</td>
      <td className="py-3 px-3 text-xs text-slate-400">{trade.note || "—"}</td>
      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-colors"><Edit2 size={14} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );
}

// ── 主组件 ──────────────────────────────────────────────────
export default function SimPortfolio() {
  const { data } = useDashboard();
  const [portfolio, setPortfolio] = useState<SimPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [editingPosition, setEditingPosition] = useState<SimPosition | null>(null);
  const [showPosEdit, setShowPosEdit] = useState(false);
  const [showTradeEdit, setShowTradeEdit] = useState<SimTrade | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"positions" | "trades">("positions");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [editingInitialCash, setEditingInitialCash] = useState(false);
  const [draftInitialCash, setDraftInitialCash] = useState("");
  const [cashErr, setCashErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setPortfolio(await getSimPortfolio()); }
    catch { setPortfolio(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const p = portfolio;
  const isTotalProfit = p ? p.total_profit >= 0 : true;
  const isUnrealProfit = p ? p.profit >= 0 : true;

  const handleClearAll = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    await clearAllSim();
    setClearConfirm(false);
    load();
  };

  const handleReset = async () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    await resetSim();
    setResetConfirm(false);
    load();
  };

  const handleSaveInitialCash = async () => {
    setCashErr("");
    const v = Number(draftInitialCash);
    if (!Number.isFinite(v) || v <= 0) {
      setCashErr("请输入大于0的金额");
      return;
    }
    try {
      await updateInitialCashSim(v);
      setEditingInitialCash(false);
      load();
    } catch (e: any) {
      setCashErr(e.message || "保存失败");
    }
  };

  const handleDeletePos = async (code: string) => {
    if (!window.confirm("确认删除该持仓？")) return;
    await removePositionSim(code);
    load();
  };

  const handleDeleteTrade = async (id: string) => {
    if (!window.confirm("确认删除该条成交记录？")) return;
    await removeTradeSim(id);
    load();
  };

  const enrichedPositions = p?.positions.map((pos) => ({
    ...pos,
    profit: (pos.current_price - pos.avg_cost) * pos.shares,
    profit_pct: pos.avg_cost > 0 ? ((pos.current_price / pos.avg_cost - 1) * 100) : 0,
    market_value: pos.shares * pos.current_price,
  })) || [];

  const totalShares = p?.positions.reduce((s, x) => s + x.shares, 0) || 0;

  return (
    <div className="space-y-4">
      {/* 资金卡片 6列 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-3 text-white">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-0.5">
            <Wallet size={12} /> 初始资金
            {!editingInitialCash ? (
              <button
                onClick={() => { setDraftInitialCash(p ? String(p.initial_cash) : ""); setCashErr(""); setEditingInitialCash(true); }}
                className="ml-auto p-0.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                title="编辑初始资金"
              >
                <Edit2 size={11} />
              </button>
            ) : (
              <span className="ml-auto flex items-center gap-1">
                <button
                  onClick={handleSaveInitialCash}
                  className="p-0.5 rounded hover:bg-slate-700 text-emerald-300 hover:text-emerald-200"
                  title="保存"
                >
                  <Save size={11} />
                </button>
                <button
                  onClick={() => { setEditingInitialCash(false); setCashErr(""); }}
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="取消"
                >
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
          {editingInitialCash ? (
            <input
              type="number"
              step="0.01"
              value={draftInitialCash}
              onChange={(e) => setDraftInitialCash(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveInitialCash(); if (e.key === "Escape") { setEditingInitialCash(false); setCashErr(""); } }}
              autoFocus
              className="w-full mt-1 px-2 py-1 rounded-lg bg-slate-700/60 border border-slate-600 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          ) : (
            <div className="text-lg font-bold">{p ? fmt(p.initial_cash) : "—"}</div>
          )}
          {editingInitialCash && cashErr && (
            <div className="mt-1 text-[10px] text-rose-300">{cashErr}</div>
          )}
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-3">
          <div className="flex items-center gap-1.5 text-blue-500 text-xs mb-0.5"><Package size={12} /> 可用资金</div>
          <div className="text-lg font-bold text-blue-700">{p ? fmt(p.available_cash) : "—"}</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 p-3">
          <div className="flex items-center gap-1.5 text-purple-500 text-xs mb-0.5"><TrendingUp size={12} /> 持仓市值</div>
          <div className="text-lg font-bold text-purple-700">{p ? fmt(p.total_value) : "—"}</div>
        </div>
        <div className={"rounded-2xl border p-3 " + (isTotalProfit ? "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200" : "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200")}>
          <div className={"flex items-center gap-1.5 text-xs mb-0.5 " + (isTotalProfit ? "text-rise" : "text-fall")}>
            {isTotalProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 已实现盈亏
          </div>
          <div className={"text-lg font-bold " + (isTotalProfit ? "text-rise" : "text-fall")}>
            {p != null ? (isTotalProfit ? "+" : "") + fmt(p.realized_profit) : "—"}
          </div>
          <div className={"text-xs font-medium " + (isTotalProfit ? "text-rise" : "text-fall")}>
            {p ? fmtPct(p.total_profit_pct) : "—"}
          </div>
        </div>
        <div className={"rounded-2xl border p-3 " + (isUnrealProfit ? "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200" : "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200")}>
          <div className={"flex items-center gap-1.5 text-xs mb-0.5 " + (isUnrealProfit ? "text-rise" : "text-fall")}>
            {isUnrealProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 持仓浮动盈亏
          </div>
          <div className={"text-lg font-bold " + (isUnrealProfit ? "text-rise" : "text-fall")}>
            {p ? (isUnrealProfit ? "+" : "") + fmt(p.profit) : "—"}
          </div>
          <div className={"text-xs font-medium " + (isUnrealProfit ? "text-rise" : "text-fall")}>
            {p ? fmtPct(p.profit_pct) : "—"}
          </div>
        </div>
        <div className={"rounded-2xl border p-3 " + (isTotalProfit ? "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200" : "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200")}>
          <div className={"flex items-center gap-1.5 text-xs mb-0.5 " + (isTotalProfit ? "text-rise" : "text-fall")}>
            {isTotalProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 累计总盈亏
          </div>
          <div className={"text-lg font-bold " + (isTotalProfit ? "text-rise" : "text-fall")}>
            {p != null ? (isTotalProfit ? "+" : "") + fmt(p.total_profit) : "—"}
          </div>
          <div className={"text-xs font-medium " + (isTotalProfit ? "text-rise" : "text-fall")}>
            {p ? fmtPct(p.total_profit_pct) : "—"}
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowBuy(true)} disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 shadow-sm">
          <ShoppingCart size={15} /> 批量买入
        </button>
        <button onClick={handleClearAll} disabled={loading || !p?.positions.length}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 disabled:opacity-40">
          <Trash2 size={15} />{clearConfirm ? "再次点击确认清仓" : "一键清仓"}
        </button>
        <button onClick={() => { setEditingPosition(null); setShowPosEdit(true); }} disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
          <Plus size={15} /> 新增持仓
        </button>
        <div className="ml-auto">
          <button onClick={handleReset} disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-400 text-xs hover:bg-slate-50 disabled:opacity-50">
            <RotateCcw size={13} />{resetConfirm ? "确认重置账户" : "重置模拟仓"}
          </button>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          <button onClick={() => setActiveTab("positions")}
            className={"px-4 py-2.5 text-sm font-medium border-b-2 transition-colors " + (activeTab === "positions" ? "border-primary-600 text-primary-700" : "border-transparent text-slate-400 hover:text-slate-600")}>
            当前持仓 {p ? "(" + p.positions.length + ")" : ""}
          </button>
          <button onClick={() => setActiveTab("trades")}
            className={"px-4 py-2.5 text-sm font-medium border-b-2 transition-colors " + (activeTab === "trades" ? "border-primary-600 text-primary-700" : "border-transparent text-slate-400 hover:text-slate-600")}>
            成交记录 {p ? "(" + p.trades.length + ")" : ""}
          </button>
        </div>
      </div>

      {/* 持仓表格 */}
      {activeTab === "positions" && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 pl-4 text-xs font-medium text-slate-500">ETF</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">持仓份额</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">持仓均价</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">当前价</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">市值</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">浮动盈亏</th>
                  <th className="w-20 py-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {enrichedPositions.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">暂无持仓，点击「批量买入」或「新增持仓」开始</td></tr>
                ) : enrichedPositions.map((pos) => (
                  <PositionRow key={pos.code} pos={pos} onEdit={() => { setEditingPosition(pos); setShowPosEdit(true); }} onDelete={() => handleDeletePos(pos.code)} />
                ))}
              </tbody>
              {enrichedPositions.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200 font-medium">
                  <tr>
                    <td className="py-3 pl-4 text-sm text-slate-600">合计</td>
                    <td className="py-3 px-3 text-right font-mono text-sm">{totalShares.toLocaleString()}</td>
                    <td colSpan={2}></td>
                    <td className="py-3 px-3 text-right font-mono text-sm">{p ? fmt(p.total_value) : "—"}</td>
                    <td className={"py-3 px-3 text-right font-mono text-sm " + (isUnrealProfit ? "text-rise" : "text-fall")}>
                      {p ? (isUnrealProfit ? "+" : "") + fmt(p.profit) : "—"}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* 成交记录表格 */}
      {activeTab === "trades" && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 pl-4 text-xs font-medium text-slate-500">时间</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">方向</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">ETF</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">价格</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">份额</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">金额</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">备注</th>
                  <th className="w-20 py-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {!p?.trades || p.trades.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">暂无成交记录</td></tr>
                ) : [...p.trades].reverse().map((trade) => (
                  <TradeRow key={trade.id} trade={trade} onEdit={() => setShowTradeEdit(trade)} onDelete={() => handleDeleteTrade(trade.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 弹窗 */}
      {showBuy && data && (
        <BatchBuyModal
          quantTop5={data.quant_top5}
          allEtfs={data.etf_list}
          availableCash={portfolio?.available_cash ?? 0}
          onClose={() => setShowBuy(false)}
          onSuccess={load}
        />
      )}
      {showPosEdit && data && (
        <PositionEditModal
          position={editingPosition || undefined}
          allEtfs={data.etf_list}
          onClose={() => setShowPosEdit(false)}
          onSuccess={load}
        />
      )}
      {showTradeEdit !== undefined && (
        <TradeEditModal trade={showTradeEdit} onClose={() => setShowTradeEdit(undefined)} onSuccess={load} />
      )}
    </div>
  );
}
