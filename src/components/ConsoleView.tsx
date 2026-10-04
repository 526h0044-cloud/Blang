import React from 'react';
import { Terminal, AlertOctagon, CheckCircle2, Play } from 'lucide-react';
import { CompilerDiagnostic } from '../compiler/types';

interface ConsoleViewProps {
  logs: string[];
  error?: CompilerDiagnostic;
  foldedCount: number;
  sourceCode: string;
  onRun: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({
  logs,
  error,
  foldedCount,
  sourceCode,
  onRun,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0d1322] overflow-hidden">
      {/* Console Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            Layer 6: Internal Tree-Walk Execution Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          {error ? (
            <span className="text-xs text-rose-400 font-mono flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              Pipeline Terminated ({error.stage.toUpperCase()})
            </span>
          ) : (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Execution Finished Cleanly
            </span>
          )}

          <button
            onClick={onRun}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            Re-run
          </button>
        </div>
      </div>

      {/* Console Log Area */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed space-y-2">
        {error ? (
          <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
              <AlertOctagon className="w-4 h-4" />
              <span>
                {error.stage === 'semantic'
                  ? 'BLangTypeError / Semantic Violation'
                  : error.stage === 'lexer'
                  ? 'BLangLexerError'
                  : error.stage === 'parser'
                  ? 'BLangParseError'
                  : 'BLangRuntimeError'}
              </span>
            </div>

            <div className="text-slate-200 font-sans text-xs">
              {error.message}
            </div>

            {error.line && error.col && (
              <div className="p-3 bg-black/50 rounded border border-rose-900/50 font-mono text-xs">
                <div className="text-slate-400 mb-1">
                  Location: Line {error.line}, Column {error.col}
                </div>
                {(() => {
                  const lines = sourceCode.split('\n');
                  if (error.line <= lines.length) {
                    const srcLine = lines[error.line - 1];
                    const pointer = ' '.repeat(Math.max(0, error.col - 1)) + '^';
                    return (
                      <div className="text-rose-300 whitespace-pre">
                        <div>{srcLine}</div>
                        <div className="text-rose-500 font-bold">{pointer}</div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            <div className="text-[11px] text-slate-400 font-sans">
              <strong>Compiler Diagnostic:</strong> The compiler successfully aborted code generation to uphold strict safety invariants. Fix the error above and re-compile.
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-slate-500 italic p-2">
            No stdout generated. Call <code className="text-indigo-400">print(...)</code> in your BLang script to inspect values.
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-200 hover:bg-slate-800/30 px-1.5 py-0.5 rounded">
                <span className="text-slate-600 select-none text-[10px] w-6 shrink-0 mt-0.5 text-right font-mono">
                  {idx + 1}
                </span>
                <span className="text-emerald-400 select-none shrink-0 font-bold">&gt;</span>
                <span className="whitespace-pre-wrap">{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-[#0a0e19] text-[11px] text-slate-500 font-mono select-none">
        <div>
          Stdout Lines: <span className="text-slate-300 tabular-nums">{logs.length}</span>
        </div>
        <div>
          Folded Constants: <span className="text-slate-300 tabular-nums">{foldedCount}</span>
        </div>
        <div>
          Status: <span className={error ? 'text-rose-400' : 'text-emerald-400'}>{error ? 'HALTED' : 'READY'}</span>
        </div>
      </div>
    </div>
  );
};
