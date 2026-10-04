import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';

interface PythonSourceViewProps {
  pythonSource: string;
}

export const PythonSourceView: React.FC<PythonSourceViewProps> = ({ pythonSource }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonSource], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'compiler.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1322] overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            compiler.py — Complete Standalone Single-File Python Engine
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            (All 6 Architecture Layers)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Python Source'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download compiler.py</span>
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto p-4 bg-[#0a0e19]">
        <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre selection:bg-indigo-500/30">
          {pythonSource}
        </pre>
      </div>

      {/* Info Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-[#0a0e19] text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero external dependencies (Pure Python 3 standard library: sys, re, os, dataclasses)</span>
        </div>
        <span>Executable with: <code className="text-slate-300">python3 compiler.py</code></span>
      </div>
    </div>
  );
};
