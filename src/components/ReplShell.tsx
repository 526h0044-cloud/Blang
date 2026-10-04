import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, RotateCcw, HelpCircle, ShieldCheck } from 'lucide-react';
import { Interpreter } from '../compiler/interpreter';
import { Lexer } from '../compiler/lexer';
import { Parser } from '../compiler/parser';
import { SemanticAnalyzer } from '../compiler/analyzer';
import { ASTOptimizer } from '../compiler/optimizer';

interface ReplEntry {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
}

export const ReplShell: React.FC = () => {
  const [interpreter] = useState<Interpreter>(() => new Interpreter());
  const [inputVal, setInputVal] = useState('');
  const [accumulatedLines, setAccumulatedLines] = useState<string[]>([]);
  const [braceBalance, setBraceBalance] = useState(0);
  const [history, setHistory] = useState<ReplEntry[]>([
    {
      type: 'system',
      content:
        'BLang Interactive REPL Shell v1.0.0\nMulti-Pass Transpiler, Execution Engine & REPL\nType :help for built-in commands, :symbols for runtime bindings.',
    },
  ]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();

    if (trimmed === ':clear') {
      setHistory([]);
      return;
    }

    if (trimmed === ':reset') {
      interpreter.globalEnv.bindings.clear();
      // re-init builtins
      (interpreter as any).initBuiltins();
      setHistory((prev) => [
        ...prev,
        { type: 'input', content: cmd },
        { type: 'system', content: 'Interpreter environment reset to initial state.' },
      ]);
      return;
    }

    if (trimmed === ':help') {
      setHistory((prev) => [
        ...prev,
        { type: 'input', content: cmd },
        {
          type: 'system',
          content:
            'BLang REPL Commands:\n  :symbols    - Inspect current runtime variables and types\n  :clear      - Clear REPL screen\n  :reset      - Reset interpreter environment\n  :help       - Show this command reference',
        },
      ]);
      return;
    }

    if (trimmed === ':symbols') {
      const entries = Array.from(interpreter.currentEnv.bindings.entries());
      const text =
        entries.length === 0
          ? 'No user variables bound.'
          : entries
              .map(([k, v]) => `  ${k.padEnd(16)} : ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
              .join('\n');

      setHistory((prev) => [
        ...prev,
        { type: 'input', content: cmd },
        { type: 'system', content: `Active Environment Symbols:\n${text}` },
      ]);
      return;
    }

    // Process BLang Code
    const newAccum = [...accumulatedLines, cmd];
    const newBalance = braceBalance + (cmd.match(/\{/g) || []).length - (cmd.match(/\}/g) || []).length;

    setHistory((prev) => [
      ...prev,
      { type: 'input', content: (braceBalance > 0 ? '...    ' : 'BLang> ') + cmd },
    ]);

    if (newBalance > 0) {
      setAccumulatedLines(newAccum);
      setBraceBalance(newBalance);
      return;
    }

    const fullSource = newAccum.join('\n');
    setAccumulatedLines([]);
    setBraceBalance(0);

    try {
      // Run pipeline: Lexer -> Parser -> Semantic Analyzer -> Optimizer -> Interpreter
      const lexer = new Lexer(fullSource);
      const tokens = lexer.tokenize();

      const parser = new Parser(tokens);
      const ast = parser.parse();

      const analyzer = new SemanticAnalyzer();
      analyzer.analyze(ast);

      const optimizer = new ASTOptimizer();
      const optAst = optimizer.optimize(ast);

      // capture logs
      const logsBefore = interpreter.stdout.length;
      const res = interpreter.execute(optAst as any);
      const newLogs = interpreter.stdout.slice(logsBefore);

      const newEntries: ReplEntry[] = [];
      for (const log of newLogs) {
        newEntries.push({ type: 'output', content: log });
      }

      if (res !== null && res !== undefined) {
        newEntries.push({
          type: 'output',
          content: `=> ${typeof res === 'object' ? JSON.stringify(res) : String(res)}`,
        });
      }

      setHistory((prev) => [...prev, ...newEntries]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          type: 'error',
          content: `[${err.stage || 'error'}] ${err.message || String(err)}${
            err.line ? ` (line ${err.line}, col ${err.col})` : ''
          }`,
        },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() && braceBalance === 0) return;

    const cmd = inputVal;
    setInputVal('');
    setCmdHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);

    handleCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIdx(-1);
        setInputVal('');
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e19] text-slate-100 font-mono text-xs overflow-hidden">
      {/* REPL Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1322] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">
            BLang Interactive Shell
          </span>
          <span className="text-[11px] text-slate-500">
            {braceBalance > 0 ? '(multi-line input active)' : 'ready'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCommand(':symbols')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>:symbols</span>
          </button>
          <button
            onClick={() => handleCommand(':help')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>:help</span>
          </button>
          <button
            onClick={() => handleCommand(':reset')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>:reset</span>
          </button>
          <button
            onClick={() => handleCommand(':clear')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>:clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-auto p-4 space-y-1.5 select-text">
        {history.map((item, idx) => (
          <div key={idx} className="leading-relaxed">
            {item.type === 'input' && (
              <div className="text-indigo-300 font-semibold">{item.content}</div>
            )}
            {item.type === 'output' && (
              <div className="text-emerald-300 pl-4">{item.content}</div>
            )}
            {item.type === 'error' && (
              <div className="text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-900/40 my-1 pl-3">
                {item.content}
              </div>
            )}
            {item.type === 'system' && (
              <div className="text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800 my-1 whitespace-pre-wrap">
                {item.content}
              </div>
            )}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Prompt Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-3 bg-[#0d1322] border-t border-slate-800"
      >
        <span className="text-emerald-400 font-bold select-none">
          {braceBalance > 0 ? '...    ' : 'BLang> '}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder={braceBalance > 0 ? 'Continue code block...' : 'Enter BLang expression or statement...'}
          className="flex-1 bg-transparent text-slate-100 font-mono text-xs focus:outline-none placeholder:text-slate-600"
        />
        <button
          type="submit"
          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
