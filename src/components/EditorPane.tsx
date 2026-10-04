import React, { useRef, useState, useMemo, useEffect } from 'react';
import { PRESETS } from '../compiler/presets';
import { formatBLang } from '../compiler/formatter';
import { highlightBLang } from '../compiler/blangPrism';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  X,
  FileCode,
  Wand2,
  Code2,
} from 'lucide-react';

interface EditorPaneProps {
  code: string;
  onChange: (val: string) => void;
  onSelectPreset: (presetId: string) => void;
  currentPresetId: string;
  errorLine?: number;
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
  activeFileName,
  openFiles = [activeFileName],
  onSelectTab,
  onCloseTab,
  onDownloadActive,
}) => {
  const [copied, setCopied] = useState(false);
  const [formatted, setFormatted] = useState(false);
  const [enableHighlight, setEnableHighlight] = useState(true);

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

  // Keyboard navigation & shortcuts inside editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Format Code shortcut: Shift+Alt+F or Ctrl+Shift+F / Cmd+Shift+F
    if ((e.shiftKey && e.altKey && e.key.toLowerCase() === 'f') ||
        (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f')) {
      e.preventDefault();
      handleFormat();
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
        }
      }, 0);
    }
  };

  // Native textarea scroll event handler: synchronizes Prism layer and Line Numbers
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
          {/* Preset Selector */}
          <div className="flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={currentPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="bg-slate-800/90 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-700 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer max-w-[130px] truncate"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prettify Code Button */}
          <button
            onClick={handleFormat}
            title="Prettify Code: Tự động định dạng mã nguồn BLang với thụt lề chuẩn, khoảng cách và ngoặc khối (Ctrl+Shift+F)"
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

          {/* Syntax Highlighting Toggle */}
          <button
            onClick={() => setEnableHighlight(!enableHighlight)}
            title={`Bật/Tắt tô màu cú pháp Prism.js (Hiện tại: ${enableHighlight ? 'Đang BẬT' : 'Đang TẮT'})`}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
              enableHighlight
                ? 'bg-indigo-950/50 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">Prism</span>
            <span className={`w-1.5 h-1.5 rounded-full ${enableHighlight ? 'bg-emerald-400' : 'bg-slate-500'}`} />
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

      {/* Editor Main Body: Line Numbers & Code Workspace */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs leading-5">
        {/* Line Numbers Column (Scroll synced with editor via onWheel & textarea onScroll) */}
        <div
          ref={lineNumbersRef}
          onWheel={(e) => {
            if (textareaRef.current) {
              textareaRef.current.scrollTop += e.deltaY;
            }
          }}
          className="w-12 py-3 bg-[#0a0e19] text-slate-600 select-none text-right pr-3 shrink-0 border-r border-slate-800/70 overflow-hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isError = errorLine === lineNum;
            return (
              <div
                key={i}
                className={`relative h-5 transition-colors ${
                  isError ? 'text-rose-400 font-bold bg-rose-500/20 rounded-l' : ''
                }`}
              >
                {lineNum}
                {isError && (
                  <span className="absolute -left-1 top-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Code Container with Full Native Scrolling & GPU-Accelerated Prism.js Overlay */}
        <div className="relative flex-1 h-full overflow-hidden bg-[#070b14]">
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
            onChange={(e) => onChange(e.target.value)}
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
        </div>
      </div>

      {/* Editor Footer / Info Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-800 bg-[#0a0e19] text-[11px] text-slate-500 select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-indigo-400">{activeFileName}</span>
          <span>·</span>
          <span>{lines.length} lines</span>
          <span>·</span>
          <span>{code.length} bytes</span>
          <span>·</span>
          <span className="text-slate-400">Ctrl+Shift+F để format</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Prism.js BLang Highlighter
          </span>
          <span>·</span>
          <span>Multi-pass Lexical Scope</span>
        </div>
      </div>
    </div>
  );
};
