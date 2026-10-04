import React from 'react';
import { ScopeInfo } from '../compiler/types';
import { ShieldCheck, Info } from 'lucide-react';

interface SymbolTableViewProps {
  scopes: ScopeInfo[];
}

export const SymbolTableView: React.FC<SymbolTableViewProps> = ({ scopes }) => {
  return (
    <div className="flex flex-col h-full bg-[#0d1322] overflow-hidden">
      {/* Top Banner explaining Layer 3 Scoping & Type System */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Layer 3: Lexical Scopes & Strict Type Safety</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {scopes.length} active scope(s)
        </span>
      </div>

      <div className="p-3 bg-amber-500/5 border-b border-slate-800 text-[11px] text-amber-200/80 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300">Strict Type Safety Invariant:</strong> BLang strictly prohibits mixing Strings and Numbers in mathematical operations (<code className="text-amber-200">+</code>, <code className="text-amber-200">-</code>, <code className="text-amber-200">*</code>, <code className="text-amber-200">/</code>). Variable re-declaration within the same scope is also prohibited.
        </div>
      </div>

      {/* Scopes Display */}
      <div className="flex-1 overflow-auto p-4 space-y-5">
        {scopes.map((scope, idx) => {
          const symbolEntries = Object.entries(scope.symbols);
          return (
            <div
              key={idx}
              className="rounded-lg border border-slate-800 bg-[#0a0e19] overflow-hidden"
            >
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/80 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    Scope: {scope.name}
                  </span>
                  {scope.parentName && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      (parent: {scope.parentName})
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {symbolEntries.length} symbols
                </span>
              </div>

              <div className="divide-y divide-slate-800/40">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[11px] text-slate-500 bg-slate-900/30">
                    <tr>
                      <th className="py-1.5 px-3">Symbol Identifier</th>
                      <th className="py-1.5 px-3">Inferred Type</th>
                      <th className="py-1.5 px-3">Declared At</th>
                      <th className="py-1.5 px-3">Sigil / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {symbolEntries.map(([name, sym]) => {
                      const isSpecial = name.startsWith('@') || name.startsWith('$') || name.startsWith('_');
                      return (
                        <tr key={name} className="hover:bg-slate-800/20">
                          <td className="py-1.5 px-3 font-semibold text-slate-200 flex items-center gap-1.5">
                            {name}
                          </td>
                          <td className="py-1.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                sym.type === 'number'
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                  : sym.type === 'string'
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  : sym.type === 'function'
                                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                  : sym.type === 'boolean'
                                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {sym.type}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-slate-400 tabular-nums">
                            {sym.line > 0 ? `L${sym.line}:C${sym.col}` : 'builtin'}
                          </td>
                          <td className="py-1.5 px-3 text-slate-400 text-[11px]">
                            {name.startsWith('@')
                              ? 'At-Sigil (@)'
                              : name.startsWith('$')
                              ? 'Dollar-Sigil ($)'
                              : name.startsWith('_')
                              ? 'Underscore (_)'
                              : 'Standard'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
