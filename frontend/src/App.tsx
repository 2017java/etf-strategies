import { useState } from "react";
import Dashboard from './components/Dashboard';
import BacktestRunner from './components/BacktestRunner';
import BacktestCompare from './components/BacktestCompare';
import { LineChart, GitCompare, LayoutDashboard, type LucideIcon } from "lucide-react";

type PageKey = "dashboard" | "backtest" | "compare";

const PAGES: { key: PageKey; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "实时看板", icon: LayoutDashboard },
  { key: "backtest", label: "策略回测", icon: LineChart },
  { key: "compare", label: "策略对比", icon: GitCompare },
];

function App() {
  const [page, setPage] = useState<PageKey>("dashboard");

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-1">
          {PAGES.map(p => {
            const active = page === p.key;
            const Icon = p.icon;
            return (
              <button key={p.key} onClick={() => setPage(p.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-lg transition ${
                  active
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={14} />
                {p.label}
              </button>
            );
          })}
        </div>
      </nav>
      {page === "dashboard" && <Dashboard />}
      {page === "backtest" && <BacktestRunner />}
      {page === "compare" && <BacktestCompare />}
    </div>
  );
}

export default App;
