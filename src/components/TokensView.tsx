import React, { useState } from 'react';
import { Token } from '../compiler/types';
import { Search, Filter } from 'lucide-react';

interface TokensViewProps {
  tokens: Token[];
}

export const TokensView: React.FC<TokensViewProps> = ({ tokens }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = tokens.filter((t) => {
    if (filterType === 'keywords') {
      const kw = ['print', 'if', 'elseif', 'else', 'for', 'while', 'function', 'return', 'let', 'and', 'or', 'not', 'true', 'false', 'break', 'continue'];
      if (!kw.includes(t.type)) return false;
    } else if (filterType === 'identifiers') {
      if (t.type !== 'IDENTIFIER') return false;
    } else if (filterType === 'literals') {
      if (!['NUMBER', 'STRING', 'BOOLEAN', 'NULL', 'true', 'false'].includes(t.type)) return false;
    } else if (filterType === 'operators') {
      if (!['+', '-', '*', '/', '%', '==', '!=', '<', '<=', '>', '>=', '=', '+=', '-='].includes(t.type)) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.type.toLowerCase().includes(q) ||
        String(t.value).toLowerCase().includes(q) ||
        String(t.line).includes(q) ||
        String(t.col).includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0d1322] overflow-hidden">
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/60 gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search token, value, line..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded border border-slate-700/80 text-xs">
          {['all', 'identifiers', 'keywords', 'literals', 'operators'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                filterType === f ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          <span>{filtered.length} / {tokens.length} tokens</span>
        </div>
      </div>

      {/* Tokens Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-[#0a0e19] text-slate-400 sticky top-0 border-b border-slate-800 z-10">
            <tr>
              <th className="py-2 px-3 w-16 text-slate-500">#</th>
              <th className="py-2 px-3 w-32">Token Type</th>
              <th className="py-2 px-3">Literal Value</th>
              <th className="py-2 px-3 w-20 text-right">Line</th>
              <th className="py-2 px-3 w-20 text-right">Column</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((tok, idx) => {
              const isKeyword = ['print', 'if', 'elseif', 'else', 'for', 'while', 'function', 'return', 'let', 'and', 'or', 'not', 'true', 'false', 'break', 'continue'].includes(tok.type);
              const isIdent = tok.type === 'IDENTIFIER';
              const isNum = tok.type === 'NUMBER';
              const isStr = tok.type === 'STRING';

              return (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-1.5 px-3 text-slate-600">{idx + 1}</td>
                  <td className="py-1.5 px-3">
                    <span
                      className={`font-semibold ${
                        isKeyword
                          ? 'text-purple-400'
                          : isIdent
                          ? 'text-cyan-400'
                          : isNum
                          ? 'text-amber-400'
                          : isStr
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {tok.type}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-slate-200 truncate max-w-xs">
                    {tok.value === null ? (
                      <span className="text-slate-500 italic">null</span>
                    ) : (
                      JSON.stringify(tok.value)
                    )}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-400 tabular-nums">
                    {tok.line}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-400 tabular-nums">
                    {tok.col}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
