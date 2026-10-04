import React from 'react';
import { Play, FileCode, Terminal, BookOpen, Download, Cpu, AlertTriangle, Activity, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  activeTab: 'workbench' | 'repl' | 'guide' | 'python-source' | 'metrics';
  setActiveTab: (tab: 'workbench' | 'repl' | 'guide' | 'python-source' | 'metrics') => void;
  onRun: () => void;
  onDownloadOutputs: () => void;
  onDownloadSdk?: () => void;
  hasError: boolean;
  foldedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRun,
  onDownloadOutputs,
  onDownloadSdk,
  hasError,
  foldedCount,
}) => {
  const navItems = [
    { id: 'workbench', label: 'Workbench & Pipeline', icon: Cpu },
    { id: 'repl', label: 'Interactive REPL Shell', icon: Terminal },
    { id: 'guide', label: 'Tài Liệu & Hướng Dẫn', icon: BookOpen },
    { id: 'metrics', label: 'Hiệu Năng & So Sánh (Python/JS)', icon: Activity },
    { id: 'python-source', label: 'compiler.py Source', icon: FileCode },
  ] as const;

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#0d1322] select-none shrink-0 shadow-sm relative z-30">
      {/* Zone 1: Single text element wordmark with glowing badge */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.05, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-bold text-sm cursor-pointer"
        >
          B
        </motion.div>
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
            BLang Studio
            <span className="text-[10px] font-normal text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
              v1.0.0
            </span>
          </span>
        </div>
      </div>

      {/* Zone 2: Animated Navigation tabs with sliding background pill */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 shadow-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer z-10 ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-indigo-600 rounded-lg shadow-sm shadow-indigo-600/30"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary action controls with micro-animations */}
      <div className="flex items-center gap-2.5">
        {hasError ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="hidden sm:flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 font-mono"
          >
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            <span>Syntax/Parse Alert</span>
          </motion.div>
        ) : foldedCount > 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-mono"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{foldedCount} Constants Folded</span>
          </motion.div>
        ) : null}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDownloadSdk}
          title="Tải về bộ cài đặt BLang Runtime & CLI SDK (chạy file .bl như Python)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 rounded-lg border border-emerald-500/35 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cài Đặt BLang SDK</span>
          <span className="sm:hidden">SDK</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onRun}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-lg hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Biên Dịch &amp; Chạy</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDownloadOutputs}
          title="Download transpiled output.py, output.js and compiler.py"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </motion.button>
      </div>
    </header>
  );
};
