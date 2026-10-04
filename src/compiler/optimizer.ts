import {
  ASTNode,
  ProgramNode,
  BlockNode,
  LiteralNode,
  VarDeclNode,
  AssignNode,
  BinaryOpNode,
  UnaryOpNode,
  ListNode,
  DictNode,
  IndexNode,
  CallNode,
  IfNode,
  WhileNode,
  ForNode,
  FunctionDefNode,
  ReturnNode,
  PrintNode,
  ExpressionStatementNode,
} from './types';

export class ASTOptimizer {
  public foldedCount = 0;

  public optimize(node: ASTNode): ASTNode {
    switch (node.type) {
      case 'Program': {
        const prog = node as ProgramNode;
        return {
          ...prog,
          statements: prog.statements.map((s) => this.optimize(s)),
        };
      }

      case 'Block': {
        const blk = node as BlockNode;
        return {
          ...blk,
          statements: blk.statements.map((s) => this.optimize(s)),
        };
      }

      case 'VarDecl': {
        const decl = node as VarDeclNode;
        return {
          ...decl,
          initializer: decl.initializer ? this.optimize(decl.initializer) : undefined,
        };
      }

      case 'Assign': {
        const assign = node as AssignNode;
        return {
          ...assign,
          target: this.optimize(assign.target) as any,
          value: this.optimize(assign.value),
        };
      }

      case 'If': {
        const ifNode = node as IfNode;
        return {
          ...ifNode,
          condition: this.optimize(ifNode.condition),
          thenBranch: this.optimize(ifNode.thenBranch) as BlockNode,
          elifBranches: ifNode.elifBranches.map((b) => ({
            condition: this.optimize(b.condition),
            body: this.optimize(b.body) as BlockNode,
          })),
          elseBranch: ifNode.elseBranch ? (this.optimize(ifNode.elseBranch) as BlockNode) : undefined,
        };
      }

      case 'While': {
        const w = node as WhileNode;
        return {
          ...w,
          condition: this.optimize(w.condition),
          body: this.optimize(w.body) as BlockNode,
        };
      }

      case 'For': {
        const f = node as ForNode;
        return {
          ...f,
          iterable: this.optimize(f.iterable),
          body: this.optimize(f.body) as BlockNode,
        };
      }

      case 'FunctionDef': {
        const fn = node as FunctionDefNode;
        return {
          ...fn,
          body: this.optimize(fn.body) as BlockNode,
        };
      }

      case 'Return': {
        const ret = node as ReturnNode;
        return {
          ...ret,
          expression: ret.expression ? this.optimize(ret.expression) : undefined,
        };
      }

      case 'Print': {
        const p = node as PrintNode;
        return {
          ...p,
          arguments: p.arguments.map((a) => this.optimize(a)),
        };
      }

      case 'Import':
        return node;

      case 'ExpressionStatement': {
        const expr = node as ExpressionStatementNode;
        return {
          ...expr,
          expression: this.optimize(expr.expression),
        };
      }

      case 'List': {
        const l = node as ListNode;
        return {
          ...l,
          elements: l.elements.map((e) => this.optimize(e)),
        };
      }

      case 'Dict': {
        const d = node as DictNode;
        return {
          ...d,
          entries: d.entries.map((entry) => ({
            ...entry,
            key: this.optimize(entry.key),
            value: this.optimize(entry.value),
          })),
        };
      }

      case 'Index': {
        const idx = node as IndexNode;
        return {
          ...idx,
          target: this.optimize(idx.target),
          index: this.optimize(idx.index),
        };
      }

      case 'Call': {
        const call = node as CallNode;
        return {
          ...call,
          callee: this.optimize(call.callee),
          arguments: call.arguments.map((a) => this.optimize(a)),
        };
      }

      case 'UnaryOp': {
        const un = node as UnaryOpNode;
        const operand = this.optimize(un.operand);
        if (operand.type === 'Literal') {
          const lit = operand as LiteralNode;
          if (un.operator === '-' && lit.litType === 'number') {
            this.foldedCount++;
            return {
              type: 'Literal',
              value: -lit.value,
              litType: 'number',
              line: un.line,
              col: un.col,
            };
          }
          if (un.operator === '+' && lit.litType === 'number') {
            this.foldedCount++;
            return {
              type: 'Literal',
              value: +lit.value,
              litType: 'number',
              line: un.line,
              col: un.col,
            };
          }
          if (un.operator === 'not' && lit.litType === 'boolean') {
            this.foldedCount++;
            return {
              type: 'Literal',
              value: !lit.value,
              litType: 'boolean',
              line: un.line,
              col: un.col,
            };
          }
        }
        return { ...un, operand };
      }

      case 'BinaryOp': {
        const bin = node as BinaryOpNode;
        const left = this.optimize(bin.left);
        const right = this.optimize(bin.right);

        if (left.type === 'Literal' && right.type === 'Literal') {
          const lLit = left as LiteralNode;
          const rLit = right as LiteralNode;

          if (lLit.litType === 'number' && rLit.litType === 'number') {
            let res: any = null;
            const lv = lLit.value;
            const rv = rLit.value;

            if (bin.operator === '+') res = lv + rv;
            else if (bin.operator === '-') res = lv - rv;
            else if (bin.operator === '*') res = lv * rv;
            else if (bin.operator === '/') {
              if (rv !== 0) res = lv / rv;
            } else if (bin.operator === '%') {
              if (rv !== 0) res = lv % rv;
            } else if (bin.operator === '==') res = lv === rv;
            else if (bin.operator === '!=') res = lv !== rv;
            else if (bin.operator === '<') res = lv < rv;
            else if (bin.operator === '<=') res = lv <= rv;
            else if (bin.operator === '>') res = lv > rv;
            else if (bin.operator === '>=') res = lv >= rv;

            if (res !== null) {
              this.foldedCount++;
              return {
                type: 'Literal',
                value: res,
                litType: typeof res === 'boolean' ? 'boolean' : 'number',
                line: bin.line,
                col: bin.col,
              };
            }
          }

          if (lLit.litType === 'string' && rLit.litType === 'string' && bin.operator === '+') {
            this.foldedCount++;
            return {
              type: 'Literal',
              value: lLit.value + rLit.value,
              litType: 'string',
              line: bin.line,
              col: bin.col,
            };
          }
        }

        return { ...bin, left, right };
      }

      default:
        return node;
    }
  }
}
