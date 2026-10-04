import React, { useState } from 'react';
import { ProgramNode, ASTNode } from '../compiler/types';
import { ChevronRight, ChevronDown, Sparkles } from 'lucide-react';

interface ASTViewProps {
  rawAST?: ProgramNode;
  optimizedAST?: ProgramNode;
  foldedCount: number;
}

const NodeRenderer: React.FC<{ node: ASTNode; label?: string; depth?: number }> = ({
  node,
  label,
  depth = 0,
}) => {
  const [collapsed, setCollapsed] = useState(depth > 3);

  if (!node) return null;

  const hasChildren = (n: ASTNode): boolean => {
    switch (n.type) {
      case 'Program':
      case 'Block':
        return (n as any).statements?.length > 0;
      case 'If':
        return true;
      case 'BinaryOp':
      case 'UnaryOp':
      case 'Call':
      case 'List':
      case 'Dict':
      case 'FunctionDef':
      case 'VarDecl':
      case 'Assign':
        return true;
      default:
        return false;
    }
  };

  const isFoldable = hasChildren(node);

  return (
    <div className="font-mono text-xs select-none">
      <div
        onClick={() => isFoldable && setCollapsed(!collapsed)}
        className={`flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-slate-800/60 cursor-pointer ${
          node.type === 'Literal' ? 'text-amber-300' : 'text-slate-300'
        }`}
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {isFoldable ? (
          collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )
        ) : (
          <span className="w-3.5 h-3.5 inline-block shrink-0 text-slate-700">·</span>
        )}

        {label && <span className="text-slate-400 font-semibold">{label}:</span>}
        <span className="text-indigo-400 font-bold">{node.type}</span>

        {/* Node detail properties */}
        {(node as any).name && (
          <span className="text-cyan-300 font-semibold">"{(node as any).name}"</span>
        )}
        {(node as any).operator && (
          <span className="text-rose-400 font-semibold">`{(node as any).operator}`</span>
        )}
        {(node as any).value !== undefined && (
          <span className="text-amber-400 font-semibold">
            {JSON.stringify((node as any).value)}
          </span>
        )}

        <span className="text-[10px] text-slate-600 font-sans ml-auto">
          L{node.line}:C{node.col}
        </span>
      </div>

      {!collapsed && isFoldable && (
        <div className="border-l border-slate-800/80 ml-2">
          {node.type === 'Program' &&
            (node as any).statements.map((s: ASTNode, i: number) => (
              <NodeRenderer key={i} node={s} label={`[${i}]`} depth={depth + 1} />
            ))}

          {node.type === 'Block' &&
            (node as any).statements.map((s: ASTNode, i: number) => (
              <NodeRenderer key={i} node={s} label={`[${i}]`} depth={depth + 1} />
            ))}

          {node.type === 'VarDecl' && (node as any).initializer && (
            <NodeRenderer node={(node as any).initializer} label="initializer" depth={depth + 1} />
          )}

          {node.type === 'Assign' && (
            <>
              <NodeRenderer node={(node as any).target} label="target" depth={depth + 1} />
              <NodeRenderer node={(node as any).value} label="value" depth={depth + 1} />
            </>
          )}

          {node.type === 'BinaryOp' && (
            <>
              <NodeRenderer node={(node as any).left} label="left" depth={depth + 1} />
              <NodeRenderer node={(node as any).right} label="right" depth={depth + 1} />
            </>
          )}

          {node.type === 'UnaryOp' && (
            <NodeRenderer node={(node as any).operand} label="operand" depth={depth + 1} />
          )}

          {node.type === 'FunctionDef' && (
            <NodeRenderer node={(node as any).body} label="body" depth={depth + 1} />
          )}

          {node.type === 'If' && (
            <>
              <NodeRenderer node={(node as any).condition} label="condition" depth={depth + 1} />
              <NodeRenderer node={(node as any).thenBranch} label="then" depth={depth + 1} />
              {(node as any).elseBranch && (
                <NodeRenderer node={(node as any).elseBranch} label="else" depth={depth + 1} />
              )}
            </>
          )}

          {node.type === 'Call' && (
            <>
              <NodeRenderer node={(node as any).callee} label="callee" depth={depth + 1} />
              {(node as any).arguments.map((a: ASTNode, i: number) => (
                <NodeRenderer key={i} node={a} label={`arg[${i}]`} depth={depth + 1} />
              ))}
            </>
          )}

          {node.type === 'List' &&
            (node as any).elements.map((el: ASTNode, i: number) => (
              <NodeRenderer key={i} node={el} label={`item[${i}]`} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  );
};

export const ASTView: React.FC<ASTViewProps> = ({ rawAST, optimizedAST, foldedCount }) => {
  const [viewMode, setViewMode] = useState<'optimized' | 'raw' | 'json'>('optimized');

  const activeAST = viewMode === 'raw' ? rawAST : optimizedAST;

  return (
    <div className="flex flex-col h-full bg-[#0d1322] overflow-hidden">
      {/* Mode Controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded border border-slate-700/80 text-xs">
          <button
            onClick={() => setViewMode('optimized')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'optimized'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Optimized AST (Folded)
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'raw'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw AST (Parsed)
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'json'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JSON Spec
          </button>
        </div>

        {foldedCount > 0 && viewMode === 'optimized' && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Layer 4 Constant Folding Active ({foldedCount} folded)</span>
          </div>
        )}
      </div>

      {/* AST Render Area */}
      <div className="flex-1 overflow-auto p-4">
        {!activeAST ? (
          <div className="text-xs text-slate-500 font-mono p-4">No AST generated.</div>
        ) : viewMode === 'json' ? (
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(activeAST, null, 2)}
          </pre>
        ) : (
          <div className="space-y-1">
            <NodeRenderer node={activeAST} label="Root" />
          </div>
        )}
      </div>
    </div>
  );
};
