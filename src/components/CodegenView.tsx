import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';

interface CodegenViewProps {
  pythonCode: string;
  javascriptCode: string;
}

export const CodegenView: React.FC<CodegenViewProps> = ({
  pythonCode,
  javascriptCode,
}) => {
  const [activeLang, setActiveLang] = useState<'python' | 'javascript' | 'split'>('split');
  const [copiedPy, setCopiedPy] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);

  const handleCopyPy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedPy(true);
    setTimeout(() => setCopiedPy(false), 2000);
  };

  const handleCopyJs = () => {
    navigator.clipboard.writeText(javascriptCode);
    setCopiedJs(true);
    setTimeout(() => setCopiedJs(false), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
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
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">
            Layer 5: Dual-Target Code Generator
          </span>
        </div>

        {/* View Segmented Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded border border-slate-700/80 text-xs">
          <button
            onClick={() => setActiveLang('split')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeLang === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Split View (Both)
          </button>
          <button
            onClick={() => setActiveLang('python')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeLang === 'python'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Python 3.x (output.py)
          </button>
          <button
            onClick={() => setActiveLang('javascript')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeLang === 'javascript'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JavaScript ES6+ (output.js)
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Python Pane */}
        {(activeLang === 'split' || activeLang === 'python') && (
          <div className="flex-1 flex flex-col border-r border-slate-800 h-full overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-mono font-bold text-blue-300">
                  output.py (Python 3.8+)
                </span>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  PEP 8 Compliant
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyPy}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {copiedPy ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPy ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => handleDownload('output.py', pythonCode)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#0a0e19]">
              <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre selection:bg-blue-500/30">
                {pythonCode}
              </pre>
            </div>
          </div>
        )}

        {/* JavaScript Pane */}
        {(activeLang === 'split' || activeLang === 'javascript') && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-mono font-bold text-amber-300">
                  output.js (ES6+ Modern JS)
                </span>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  Node.js & Browsers
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyJs}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {copiedJs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJs ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => handleDownload('output.js', javascriptCode)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#0a0e19]">
              <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre selection:bg-amber-500/30">
                {javascriptCode}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
