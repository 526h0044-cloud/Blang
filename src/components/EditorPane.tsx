import React, { useRef } from 'react';
import { PRESETS } from '../compiler/presets';
import { Sparkles, Copy, Check, RotateCcw, Download, X, FileCode } from 'lucide-react';

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
  const [copied, setCopied] = React.useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  return (
    <div className="flex flex-col h-full bg-[#0d1322] border-r border-slate-800">
      {/* Top File Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0a0e19] select-none overflow-x-auto">
        <div className="flex items-center overflow-x-auto">
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
                <FileCode className="w-3.5 h-3.5" />
                <span>{fname}</span>
                {openFiles.length > 1 && onCloseTab && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(fname);
                    }}
                    className="p-0.5 hover:text-rose-400 text-slate-500 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5 px-3 py-1">
          {/* Preset Selector */}
          <div className="flex items-center gap-1">
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

          <button
            onClick={onDownloadActive}
            title={`Download ${activeFileName}`}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Save .bl</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Copy Source"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Editor Content with Line Numbers & Error Gutter */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs leading-5">
        {/* Line Numbers Column */}
        <div className="w-12 py-3 bg-[#0a0e19] text-slate-600 select-none text-right pr-3 shrink-0 border-r border-slate-800/60 overflow-hidden">
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

        {/* Textarea Area */}
        <div className="relative flex-1 h-full overflow-auto">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="w-full h-full min-h-full p-3 bg-transparent text-slate-200 font-mono text-xs leading-5 resize-none focus:outline-none selection:bg-indigo-500/30 whitespace-pre"
            style={{
              tabSize: 4,
            }}
          />
        </div>
      </div>

      {/* Editor Footer / Info */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-800 bg-[#0a0e19] text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span className="font-mono text-indigo-400">{activeFileName}</span>
          <span>·</span>
          <span>{lines.length} lines</span>
          <span>·</span>
          <span>{code.length} bytes</span>
        </div>
        <div className="flex items-center gap-2">
          <span>BLang Script <code className="text-slate-400">{'*.bl'}</code></span>
          <span>·</span>
          <span>Multi-pass Lexical Scope</span>
        </div>
      </div>
    </div>
  );
};
