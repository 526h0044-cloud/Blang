import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RuntimeExecutionState,
  RuntimeVariable,
  ExecutionStep,
  RuntimeScope,
} from '../compiler/types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Search,
  Layers,
  Variable,
  Activity,
  Terminal,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Cpu,
  ArrowRight,
  RefreshCw,
  Hash,
  Eye,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RuntimeStateViewProps {
  runtimeState?: RuntimeExecutionState;
  sourceCode: string;
  onJumpToLine?: (line: number) => void;
}

export const RuntimeStateView: React.FC<RuntimeStateViewProps> = ({
  runtimeState,
  sourceCode,
  onJumpToLine,
}) => {
  const steps = runtimeState?.steps || [];
  const totalSteps = steps.length;

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(() =>
    totalSteps > 0 ? totalSteps - 1 : 0
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(600); // ms per step
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // When runtime state changes, jump to last step by default
  useEffect(() => {
    if (totalSteps > 0) {
      setCurrentStepIdx(totalSteps - 1);
    } else {
      setCurrentStepIdx(0);
    }
    setIsPlaying(false);
  }, [totalSteps]);

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying || totalSteps <= 1) return;

    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, totalSteps, playSpeed]);

  const currentStep: ExecutionStep | undefined = steps[currentStepIdx];

  // Get active variables at current step, or final variables if no steps
  const activeVariables: RuntimeVariable[] = useMemo(() => {
    if (currentStep) {
      return currentStep.allVariables || [];
    }
    return runtimeState?.allVariables || [];
  }, [currentStep, runtimeState]);

  // Get scopes list
  const availableScopes: string[] = useMemo(() => {
    if (currentStep) {
      return Array.from(new Set(currentStep.scopes.map((s) => s.name)));
    }
    if (runtimeState) {
      return Array.from(new Set(runtimeState.scopes.map((s) => s.name)));
    }
    return [];
  }, [currentStep, runtimeState]);

  // Filtered variables
  const filteredVariables = useMemo(() => {
    return activeVariables.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.formattedValue.toLowerCase().includes(searchQuery.toLowerCase());
      const matchScope = selectedScope === 'all' || v.scopeName === selectedScope;
      const matchType =
        typeFilter === 'all' ||
        (typeFilter === 'number' && v.type === 'number') ||
        (typeFilter === 'string' && v.type === 'string') ||
        (typeFilter === 'boolean' && v.type === 'boolean') ||
        (typeFilter === 'collection' && (v.type.startsWith('list') || v.type === 'dict'));

      return matchSearch && matchScope && matchType;
    });
  }, [activeVariables, searchQuery, selectedScope, typeFilter]);

  // Get code snippet around current step
  const codeLines = useMemo(() => sourceCode.split('\n'), [sourceCode]);
  const activeLineText =
    currentStep && currentStep.line > 0 && currentStep.line <= codeLines.length
      ? codeLines[currentStep.line - 1]
      : '';

  // Sigil styling helper
  const getSigilBadge = (name: string) => {
    if (name.startsWith('@')) {
      return {
        label: '@ Num',
        color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        desc: 'Biến số học / Hình học',
      };
    }
    if (name.startsWith('$')) {
      return {
        label: '$ Str',
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        desc: 'Biến chuỗi ký tự',
      };
    }
    if (name.startsWith('_')) {
      return {
        label: '_ Temp',
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        desc: 'Biến đệm / Vòng lặp',
      };
    }
    return {
      label: 'py-var',
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      desc: 'Biến chuẩn phong cách Python',
    };
  };

  const getTypeBadgeColor = (type: string) => {
    if (type === 'number') return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    if (type === 'string') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (type === 'boolean') return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    if (type.startsWith('list')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (type === 'dict') return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
    if (type === 'function') return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    return 'bg-slate-700/50 text-slate-300 border-slate-600/30';
  };

  if (!runtimeState || totalSteps === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#0d1322] select-none">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-900/20">
          <Variable className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-200 mb-2">Trạng Thái Thực Thi (Runtime State)</h3>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
          Chưa có dữ liệu biến hoặc bước thực thi nào được ghi lại. Hãy nhập mã nguồn BLang trong Editor và nhấn{' '}
          <span className="text-emerald-400 font-semibold">Chạy mã</span> để theo dõi từng biến số và phạm vi (scope) theo từng bước.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Hỗ trợ theo dõi từng bước (step-by-step trace), scopes và sự biến đổi giá trị</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1322] text-slate-200 overflow-hidden font-sans select-none">
      {/* Top Stepper & Playback Controls Bar */}
      <div className="p-3 border-b border-slate-800 bg-[#0a0e19] shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">Runtime State Inspector</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Bước {currentStepIdx + 1}/{totalSteps}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Thời gian thực thi: <span className="font-mono text-slate-300">{runtimeState.executionTimeMs}ms</span> •{' '}
                Tổng số biến: <span className="font-mono text-emerald-400">{activeVariables.length}</span>
              </span>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setCurrentStepIdx(0)}
              disabled={currentStepIdx === 0}
              title="Về bước đầu tiên"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIdx === 0}
              title="Bước trước (Previous step)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Tạm dừng tự động' : 'Tự động chạy từng bước (Auto-play)'}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/30'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span className="text-[11px]">Dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span className="text-[11px]">Chạy</span>
                </>
              )}
            </button>
            <button
              onClick={() => setCurrentStepIdx((prev) => Math.min(totalSteps - 1, prev + 1))}
              disabled={currentStepIdx === totalSteps - 1}
              title="Bước kế tiếp (Next step)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentStepIdx(totalSteps - 1)}
              disabled={currentStepIdx === totalSteps - 1}
              title="Đến bước cuối cùng"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStepIdx}
            onChange={(e) => setCurrentStepIdx(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
          />
          <select
            value={playSpeed}
            onChange={(e) => setPlaySpeed(Number(e.target.value))}
            title="Tốc độ tự động chạy"
            className="bg-slate-800 text-[10px] text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value={1000}>1.0s (Chậm)</option>
            <option value={600}>0.6s (Chuẩn)</option>
            <option value={250}>0.25s (Nhanh)</option>
          </select>
        </div>

        {/* Current Step Action Card */}
        {currentStep && (
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                {currentStep.statementType}
              </span>
              <span className="text-slate-200 truncate font-medium">
                {currentStep.action}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentStep.line > 0 && (
                <button
                  onClick={() => onJumpToLine && onJumpToLine(currentStep.line)}
                  title={`Dòng ${currentStep.line}, Cột ${currentStep.col} trong mã nguồn`}
                  className="font-mono text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-500/30 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>L:{currentStep.line}</span>
                  <span className="text-slate-500">C:{currentStep.col}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Code line preview if available */}
        {activeLineText && (
          <div className="bg-[#050811] px-3 py-1.5 rounded-md border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center gap-2 overflow-x-auto">
            <span className="text-indigo-400 font-bold select-none shrink-0">&gt; L{currentStep?.line}:</span>
            <span className="text-slate-200 truncate">{activeLineText.trim()}</span>
          </div>
        )}

        {/* Log produced at this step */}
        {currentStep?.outputLog && (
          <div className="bg-emerald-950/20 border border-emerald-500/30 px-3 py-1.5 rounded-md text-[11px] font-mono text-emerald-300 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 shrink-0">In ra màn hình:</span>
            <span className="font-bold truncate">{currentStep.outputLog}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="px-3 py-2 border-b border-slate-800 bg-[#090d18] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm biến hoặc giá trị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-md pl-7 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Scope Selector */}
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-slate-400" />
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer max-w-[150px] truncate"
          >
            <option value="all">Tất cả Scopes ({availableScopes.length})</option>
            {availableScopes.map((sc) => (
              <option key={sc} value={sc}>
                {sc}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTypeFilter('number')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              typeFilter === 'number'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Số (Number)
          </button>
          <button
            onClick={() => setTypeFilter('string')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              typeFilter === 'string'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Chuỗi (String)
          </button>
          <button
            onClick={() => setTypeFilter('collection')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              typeFilter === 'collection'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Mảng / Dict
          </button>
        </div>
      </div>

      {/* Variables List / Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {filteredVariables.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Không tìm thấy biến nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            <AnimatePresence>
              {filteredVariables.map((variable) => {
                const sigil = getSigilBadge(variable.name);
                const typeColor = getTypeBadgeColor(variable.type);
                const isJustChanged = variable.changed;

                return (
                  <motion.div
                    key={`${variable.name}-${variable.scopeName}`}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`p-3 rounded-xl border transition-all ${
                      isJustChanged
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {/* Sigil badge */}
                        <span
                          title={sigil.desc}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${sigil.color}`}
                        >
                          {sigil.label}
                        </span>

                        {/* Variable Name */}
                        <span className="font-mono text-sm font-bold text-white tracking-tight">
                          {variable.name}
                        </span>

                        {/* Change Alert */}
                        {isJustChanged && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/40 animate-pulse">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                            Vừa thay đổi
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Type badge */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${typeColor}`}
                        >
                          {variable.type}
                        </span>

                        {/* Scope name badge */}
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                          {variable.scopeName}
                        </span>
                      </div>
                    </div>

                    {/* Value representation */}
                    <div className="bg-[#050811] p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                      <span className="text-slate-500 mr-2 select-none">&gt;</span>
                      <span
                        className={
                          variable.type === 'string'
                            ? 'text-emerald-300'
                            : variable.type === 'number'
                            ? 'text-sky-300'
                            : variable.type === 'boolean'
                            ? 'text-purple-300'
                            : 'text-amber-300'
                        }
                      >
                        {variable.formattedValue}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Scope Hierarchy Footer */}
      <div className="p-2.5 border-t border-slate-800 bg-[#0a0e19] text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-slate-500 font-semibold shrink-0">Phạm vi hiện tại:</span>
          {currentStep?.scopes.map((s, idx) => (
            <React.Fragment key={s.name}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
              <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                {s.name} (Độ sâu: {s.depth})
              </span>
            </React.Fragment>
          ))}
        </div>

        <span className="font-mono text-[10px] text-slate-500 shrink-0">
          BLang Virtual Execution Engine
        </span>
      </div>
    </div>
  );
};
