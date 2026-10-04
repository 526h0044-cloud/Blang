import React from 'react';
import { Play, FileCode, Terminal, BookOpen, Download, Cpu, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'workbench' | 'repl' | 'guide' | 'python-source';
  setActiveTab: (tab: 'workbench' | 'repl' | 'guide' | 'python-source') => void;
  onRun: () => void;
  onDownloadOutputs: () => void;
  hasError: boolean;
  foldedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRun,
  onDownloadOutputs,
  hasError,
  foldedCount,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#0d1322] select-none shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-sm">
          B
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
            BLang Studio
            <span className="text-[11px] font-normal text-slate-400 font-mono">v1.0.0</span>
          </span>
        </div>
      </div>

      {/* Zone 2: Clean navigation links */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80">
        <button
          onClick={() => setActiveTab('workbench')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'workbench'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Workbench & Pipeline
        </button>

        <button
          onClick={() => setActiveTab('repl')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'repl'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Interactive REPL Shell
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'guide'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          CLI Guide & Architecture
        </button>

        <button
          onClick={() => setActiveTab('python-source')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'python-source'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          compiler.py Source
        </button>
      </nav>

      {/* Zone 3: Primary action controls */}
      <div className="flex items-center gap-3">
        {hasError ? (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Type/Syntax Alert</span>
          </div>
        ) : foldedCount > 0 ? (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-mono">
            <span>{foldedCount} Constants Folded</span>
          </div>
        ) : null}

        <button
          onClick={onRun}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm shadow-indigo-600/30 whitespace-nowrap cursor-pointer active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Compile & Run
        </button>

        <button
          onClick={onDownloadOutputs}
          title="Download transpiled output.py, output.js and compiler.py"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
