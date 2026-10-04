import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2, Cpu, Terminal, Shield } from 'lucide-react';

interface CodegenViewProps {
  pythonCode: string;
  javascriptCode: string;
  bytecodeDisassembly?: string;
  bytecodeData?: any;
}

export const CodegenView: React.FC<CodegenViewProps> = ({
  pythonCode,
  javascriptCode,
  bytecodeDisassembly = '; Compiling BLang Bytecode...',
  bytecodeData,
}) => {
  const [activeLang, setActiveLang] = useState<'bytecode' | 'python' | 'javascript' | 'split'>('bytecode');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (filename: string, content: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBytecodeBinary = () => {
    const content = JSON.stringify(bytecodeData || { magic: 'BLANG_BYTECODE_BVM', code: bytecodeDisassembly }, null, 2);
    handleDownload('app.blc', content, 'application/json');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1322] overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-slate-800 bg-slate-900/60 gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">
            BLang Native Runtime &amp; Target Exporters
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 font-mono border border-emerald-500/30">
            Standalone BVM
          </span>
        </div>

        {/* View Segmented Toggle */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs">
          <button
            onClick={() => setActiveLang('bytecode')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeLang === 'bytecode'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>BVM Bytecode (.blc)</span>
          </button>

          <button
            onClick={() => setActiveLang('python')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeLang === 'python'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Python 3.x
          </button>

          <button
            onClick={() => setActiveLang('javascript')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeLang === 'javascript'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JavaScript
          </button>

          <button
            onClick={() => setActiveLang('split')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeLang === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dual View
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. BLANG NATIVE BYTECODE (BVM) */}
        {activeLang === 'bytecode' && (
          <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/40 border-b border-slate-800/80 text-xs shrink-0">
              <span className="font-mono text-indigo-300 font-semibold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                BLang Virtual Machine (BVM) Native Bytecode
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadBytecodeBinary}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition-colors cursor-pointer"
                  title="Tải về file nhị phân trung gian (.blc) độc lập"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .blc</span>
                </button>
                <button
                  onClick={() => handleCopy('bytecode', bytecodeDisassembly)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {copied === 'bytecode' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied === 'bytecode' ? 'Copied' : 'Copy Opcode'}</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-indigo-200/90 bg-[#070b14] select-text">
              {bytecodeDisassembly}
            </pre>
          </div>
        )}

        {/* 2. PYTHON 3.X CODE */}
        {(activeLang === 'python' || activeLang === 'split') && (
          <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/40 border-b border-slate-800/80 text-xs shrink-0">
              <span className="font-mono text-blue-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Python 3.x Target Exporter
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload('output.py', pythonCode)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Tải về file output.py"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Save .py</span>
                </button>
                <button
                  onClick={() => handleCopy('py', pythonCode)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {copied === 'py' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied === 'py' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300 bg-[#070b14] select-text">
              {pythonCode}
            </pre>
          </div>
        )}

        {/* 3. JAVASCRIPT CODE */}
        {(activeLang === 'javascript' || activeLang === 'split') && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/40 border-b border-slate-800/80 text-xs shrink-0">
              <span className="font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                JavaScript ES6+ Target Exporter
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload('output.js', javascriptCode)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Tải về file output.js"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Save .js</span>
                </button>
                <button
                  onClick={() => handleCopy('js', javascriptCode)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {copied === 'js' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied === 'js' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300 bg-[#070b14] select-text">
              {javascriptCode}
            </pre>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 px-4 border-t border-slate-800 bg-[#0a0e19] text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>BLang độc lập hoàn toàn: BVM Bytecode là lõi thực thi chính thức.</span>
        </div>
        <span className="text-slate-400">Target Exporters: Python / JS</span>
      </div>
    </div>
  );
};
