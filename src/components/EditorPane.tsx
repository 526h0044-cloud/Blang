import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { formatBLang } from '../compiler/formatter';
import { highlightBLang } from '../compiler/blangPrism';
import {
  Copy,
  Check,
  Download,
  X,
  FileCode,
  Wand2,
  AlertCircle,
  AlertTriangle,
  Bookmark,
  Hash,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditorPaneProps {
  code: string;
  onChange: (val: string) => void;
  onSelectPreset?: (presetId: string) => void;
  currentPresetId?: string;
  errorLine?: number;
  errorMessage?: string;
  errorStage?: string;
  activeFileName: string;
  openFiles?: string[];
  onSelectTab?: (name: string) => void;
  onCloseTab?: (name: string) => void;
  onDownloadActive?: () => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  code,
  onChange,
  onSelectPreset,
  currentPresetId,
  errorLine,
  errorMessage,
  errorStage,
  activeFileName,
  openFiles = [activeFileName],
  onSelectTab,
  onCloseTab,
  onDownloadActive,
}) => {
  const [copied, setCopied] = useState(false);
  const [formatted, setFormatted] = useState(false);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [isGoToOpen, setIsGoToOpen] = useState(false);
  const [goToVal, setGoToVal] = useState('');
  const enableHighlight = true;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => code.split('\n'), [code]);

  // Compute Prism-highlighted HTML
  const highlightedHtml = useMemo(() => {
    if (!enableHighlight) return '';
    const html = highlightBLang(code);
    // In HTML pre/code, trailing newline requires a break to match textarea height
    return code.endsWith('\n') ? html + '<br />&nbsp;' : html;
  }, [code, enableHighlight]);

  // Track cursor position (Line & Column)
  const updateCursorPos = useCallback(() => {
    if (!textareaRef.current) return;
    const selStart = textareaRef.current.selectionStart || 0;
    const textBefore = code.slice(0, selStart);
    const lineArr = textBefore.split('\n');
    const curL = lineArr.length;
    const curC = lineArr[lineArr.length - 1].length + 1;
    setCursorLine(curL);
    setCursorCol(curC);
  }, [code]);

  // Auto-scroll to error line smoothly when compile error happens
  useEffect(() => {
    if (errorLine && textareaRef.current) {
      const lineH = 20; // 20px line-height
      const targetY = Math.max(0, (errorLine - 4) * lineH);
      textareaRef.current.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = targetY;
      }
    }
  }, [errorLine]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    const formattedCode = formatBLang(code);
    if (formattedCode !== code) {
      onChange(formattedCode);
    }
    setFormatted(true);
    setTimeout(() => setFormatted(false), 2000);
  };

  // Jump to specific line number in textarea
  const jumpToLine = useCallback(
    (targetLine: number) => {
      const clamped = Math.max(1, Math.min(lines.length, targetLine));
      if (textareaRef.current) {
        let charPos = 0;
        for (let i = 0; i < clamped - 1 && i < lines.length; i++) {
          charPos += lines[i].length + 1;
        }
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(charPos, charPos);
        const targetY = Math.max(0, (clamped - 4) * 20);
        textareaRef.current.scrollTo({ top: targetY, behavior: 'smooth' });
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = targetY;
        }
        setCursorLine(clamped);
        setCursorCol(1);
      }
    },
    [lines]
  );

  // Toggle visual debug breakpoint
  const toggleBreakpoint = (lineNum: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  // Keyboard navigation & shortcuts inside editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Format Code shortcut: Shift+Alt+F or Ctrl+Shift+F / Cmd+Shift+F
    if (
      (e.shiftKey && e.altKey && e.key.toLowerCase() === 'f') ||
      (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f')
    ) {
      e.preventDefault();
      handleFormat();
      return;
    }

    // Go to line shortcut: Ctrl+G / Cmd+G
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      setIsGoToOpen(true);
      return;
    }

    // Tab key inserts 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          updateCursorPos();
        }
      }, 0);
    }
  };

  // Synchronize Prism layer and Line Numbers when scrolling
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.style.transform = `translate3d(-${scrollLeft}px, -${scrollTop}px, 0)`;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  };

  // Sync scroll positions when content changes
  useEffect(() => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (preRef.current) {
        preRef.current.style.transform = `translate3d(-${scrollLeft}px, -${scrollTop}px, 0)`;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
    }
  }, [code, enableHighlight]);

  const sharedEditorStyle: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '12px',
    lineHeight: '20px',
    tabSize: 4,
    letterSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    whiteSpace: 'pre',
    boxSizing: 'border-box',
  };

  // Compute responsive gutter width based on digit count
  const gutterWidth = useMemo(() => {
    const digits = Math.max(2, String(lines.length).length);
    return Math.max(52, digits * 8.5 + 32);
  }, [lines.length]);

  return (
    <div className="flex flex-col h-full bg-[#0d1322] border-r border-slate-800">
      {/* Top File Tabs Bar & Quick Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0a0e19] select-none overflow-x-auto shrink-0">
        {/* Open Files Tabs */}
        <div className="flex items-center overflow-x-auto scrollbar-none">
          {openFiles.map((fname) => {
            const isActive = fname === activeFileName;
            return (
              <div
                key={fname}
                onClick={() => onSelectTab && onSelectTab(fname)}
                className={`flex items-center gap-2 px-3.5 py-2 border-r border-slate-800 text-xs font-mono cursor-pointer transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0d1322] text-indigo-300 font-bold border-t-2 border-t-indigo-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>{fname}</span>
                {openFiles.length > 1 && onCloseTab && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(fname);
                    }}
                    title={`Đóng tab ${fname}`}
                    className="p-0.5 hover:text-rose-400 text-slate-500 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 px-3 py-1 shrink-0">
          {/* Quick Go to Line button */}
          <button
            onClick={() => setIsGoToOpen(true)}
            title="Nhảy đến dòng (Ctrl+G)"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Hash className="w-3 h-3 text-indigo-400" />
            <span className="hidden xl:inline">Dòng {cursorLine}</span>
          </button>

          {/* Prettify Code Button */}
          <button
            onClick={handleFormat}
            title="Prettify Code: Tự động định dạng mã nguồn BLang với thụt lề chuẩn, khoảng cách và ngoặc khối (Shift+Alt+F)"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer shadow-sm ${
              formatted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/35 border border-indigo-500/30 hover:border-indigo-500/60'
            }`}
          >
            {formatted ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Đã làm đẹp!</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 text-indigo-400" />
                <span className="font-semibold">Prettify Code</span>
              </>
            )}
          </button>

          {/* Save / Download .bl button */}
          <button
            onClick={onDownloadActive}
            title={`Tải về file ${activeFileName} (.bl)`}
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span className="hidden md:inline">Save .bl</span>
          </button>

          {/* Copy Source */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
            title="Sao chép toàn bộ mã nguồn"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden md:inline">{copied ? 'Đã copy' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Body: Line Numbers Gutter & Code Workspace */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs leading-5">
        {/* ========================================================================= */}
        {/* LINE NUMBER GUTTER                                                        */}
        {/* Features: Breakpoint click, Error pin with tooltip, Active line highlight */}
        {/* ========================================================================= */}
        <div
          ref={lineNumbersRef}
          onWheel={(e) => {
            if (textareaRef.current) {
              textareaRef.current.scrollTop += e.deltaY;
            }
          }}
          className="py-3 bg-[#080d19] select-none shrink-0 border-r border-slate-800/80 overflow-hidden relative z-20 transition-all"
          style={{ width: `${gutterWidth}px`, scrollbarWidth: 'none' }}
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isError = errorLine === lineNum;
            const isCurrent = cursorLine === lineNum;
            const hasBreakpoint = breakpoints.has(lineNum);
            const isHovered = hoveredLine === lineNum;

            return (
              <div
                key={i}
                onClick={() => jumpToLine(lineNum)}
                onMouseEnter={() => setHoveredLine(lineNum)}
                onMouseLeave={() => setHoveredLine(null)}
                title={
                  isError
                    ? `⚠️ Lỗi biên dịch tại dòng ${lineNum}: ${errorMessage || 'Lỗi cú pháp'}`
                    : hasBreakpoint
                    ? `Điểm dừng (Breakpoint) tại dòng ${lineNum} (Click để bỏ)`
                    : `Dòng ${lineNum} (Click để nhảy tới, double-click để đặt breakpoint)`
                }
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  toggleBreakpoint(lineNum);
                }}
                className={`group relative h-5 flex items-center justify-between px-2 cursor-pointer transition-colors ${
                  isError
                    ? 'bg-rose-950/60 border-l-2 border-rose-500 text-rose-300 font-bold'
                    : isCurrent
                    ? 'bg-indigo-500/15 border-l-2 border-indigo-400 text-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                {/* Left Gutter Margin: Breakpoint / Error Indicator */}
                <div
                  className="w-3.5 h-3.5 flex items-center justify-center shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBreakpoint(lineNum);
                  }}
                  title={hasBreakpoint ? 'Bỏ điểm dừng' : 'Đặt điểm dừng (Breakpoint)'}
                >
                  {isError ? (
                    <motion.div
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 fill-rose-500/20" />
                    </motion.div>
                  ) : hasBreakpoint ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/60 border border-rose-300" />
                  ) : isHovered ? (
                    <div className="w-2 h-2 rounded-full bg-slate-700 hover:bg-rose-500/70 transition-colors" />
                  ) : null}
                </div>

                {/* Line Number Text */}
                <span
                  className={`text-[11px] font-mono text-right flex-1 select-none pr-0.5 ${
                    isError
                      ? 'text-rose-300 font-bold'
                      : isCurrent
                      ? 'text-indigo-300 font-bold'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {lineNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* CODE WORKSPACE CONTAINER                                                  */}
        {/* ========================================================================= */}
        <div className="relative flex-1 h-full overflow-hidden bg-[#070b14]">
          {/* Active Line & Error Line Background Highlights synced in code viewport */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {errorLine && errorLine <= lines.length && (
              <div
                style={{
                  top: `${(errorLine - 1) * 20 + 12 - (lineNumbersRef.current?.scrollTop || 0)}px`,
                }}
                className="absolute left-0 right-0 h-5 bg-rose-500/10 border-y border-rose-500/25 pointer-events-none flex items-center justify-end pr-4"
              >
                <span className="text-[10px] text-rose-400 font-mono bg-rose-950/80 px-1.5 rounded border border-rose-500/30">
                  {errorStage ? `[${errorStage.toUpperCase()} ERROR]` : 'SYNTAX ERROR'}
                </span>
              </div>
            )}
          </div>

          {/* 1. Underlying Syntax-Highlighted Layer (GPU Transformed on scroll) */}
          {enableHighlight && (
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
              <pre
                ref={preRef}
                aria-hidden="true"
                style={sharedEditorStyle}
                className="m-0 p-3 pointer-events-none select-none text-slate-200 whitespace-pre will-change-transform"
              >
                <code
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                  className="font-mono text-xs leading-5"
                />
              </pre>
            </div>
          )}

          {/* 2. Top-level Fully Scrollable Editable Textarea (Handles Wheel, Touch, Drag, Keys) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              onChange(e.target.value);
              updateCursorPos();
            }}
            onKeyUp={updateCursorPos}
            onClick={updateCursorPos}
            onSelect={updateCursorPos}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            style={sharedEditorStyle}
            className={`absolute inset-0 w-full h-full m-0 p-3 z-10 resize-none focus:outline-none selection:bg-indigo-500/35 overflow-auto whitespace-pre ${
              enableHighlight
                ? 'bg-transparent text-transparent caret-indigo-400'
                : 'bg-transparent text-slate-200 caret-white'
            }`}
          />

          {/* Floating Error Jump Banner if compiler error exists */}
          <AnimatePresence>
            {errorLine && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                onClick={() => jumpToLine(errorLine)}
                className="absolute bottom-3 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs shadow-xl shadow-rose-950/50 backdrop-blur-sm cursor-pointer hover:bg-rose-900 transition-colors"
                title="Nhấn để di chuyển con trỏ đến vị trí lỗi"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-rose-300">Dòng {errorLine}:</span>
                  <span className="truncate max-w-[240px] text-[11px] text-slate-200">
                    {errorMessage || 'Lỗi cú pháp'}
                  </span>
                </div>
                <span className="text-[10px] text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded font-sans border border-rose-500/30 ml-1">
                  Nhảy tới dòng &rarr;
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Editor Footer / Info Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-800 bg-[#0a0e19] text-[11px] text-slate-400 select-none shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-indigo-400 font-semibold">Dòng {cursorLine}</span>,
            <span>Cột {cursorCol}</span>
          </div>
          <span>·</span>
          <span>{lines.length} dòng</span>
          <span>·</span>
          <span>{code.length} ký tự</span>
          {breakpoints.size > 0 && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                {breakpoints.size} điểm dừng
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {errorLine ? (
            <button
              onClick={() => jumpToLine(errorLine)}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 cursor-pointer transition-colors"
            >
              <AlertCircle className="w-3 h-3 text-rose-400 animate-pulse" />
              <span>Lỗi tại dòng {errorLine}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Sẵn sàng
            </span>
          )}
          <span>·</span>
          <span className="text-slate-500">UTF-8</span>
          <span>·</span>
          <span className="text-slate-500">Spaces: 4</span>
        </div>
      </div>

      {/* Go to Line Modal / Popup (Ctrl+G) */}
      <AnimatePresence>
        {isGoToOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setIsGoToOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-4 text-slate-100"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-400" />
                  <span>Đi đến dòng (Go to Line)</span>
                </h3>
                <button
                  onClick={() => setIsGoToOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mb-2">
                Nhập số dòng từ 1 đến {lines.length}:
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = parseInt(goToVal, 10);
                  if (!isNaN(target)) {
                    jumpToLine(target);
                    setIsGoToOpen(false);
                    setGoToVal('');
                  }
                }}
                className="space-y-3"
              >
                <input
                  type="number"
                  min={1}
                  max={lines.length}
                  autoFocus
                  placeholder={`1 - ${lines.length}`}
                  value={goToVal}
                  onChange={(e) => setGoToVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGoToOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-sm"
                  >
                    Đi đến dòng
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
