import { ASTNode, ProgramNode, VarDeclNode, AssignNode, IdentifierNode, FunctionDefNode } from './types';
import { Lexer } from './lexer';
import { Parser } from './parser';

export interface LintProblem {
  id: string;
  rule: string;
  message: string;
  line: number;
  col: number;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  fix?: {
    replaceRange: [number, number];
    replacement: string;
  };
}

export interface LintResult {
  valid: boolean;
  problems: LintProblem[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * BLang Static AST Linter
 * Performs semantic analysis and style checking on BLang code.
 */
export function lintBLang(source: string, ast?: ProgramNode): LintResult {
  const problems: LintProblem[] = [];

  let parsedAST: ProgramNode | undefined = ast;
  if (!parsedAST) {
    try {
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      parsedAST = parser.parse();
    } catch {
      // Syntax errors are handled by parser diagnostics
    }
  }

  if (!parsedAST) {
    return {
      valid: false,
      problems: [
        {
          id: 'syntax-error',
          rule: 'syntax/valid',
          message: 'Mã nguồn có lỗi cú pháp, linter không thể duyệt AST đầy đủ.',
          line: 1,
          col: 1,
          severity: 'error',
        },
      ],
      errorCount: 1,
      warningCount: 0,
      infoCount: 0,
    };
  }

  // 1. Variable declaration tracking and usage analysis (no-unused-vars)
  const declaredVars = new Map<string, { line: number; col: number; reads: number; isParam?: boolean }>();
  const definedFunctions = new Map<string, { line: number; col: number; calls: number }>();

  function collectSymbols(node: ASTNode) {
    if (!node) return;

    if (node.type === 'VarDecl') {
      const decl = node as VarDeclNode;
      if (!declaredVars.has(decl.name)) {
        declaredVars.set(decl.name, { line: decl.line, col: decl.col, reads: 0 });
      }
      // Naming convention prefix check:
      // @ for numbers, $ for strings, _ for counters/temp
      if (!decl.name.startsWith('@') && !decl.name.startsWith('$') && !decl.name.startsWith('_')) {
        problems.push({
          id: `naming-prefix-${decl.name}`,
          rule: 'style/naming-prefix',
          message: `Biến '${decl.name}' nên dùng tiền tố gợi ý kiểu theo chuẩn BLang: '@' (số), '$' (chuỗi), hoặc '_' (biến đếm/tạm).`,
          line: decl.line,
          col: decl.col,
          severity: 'info',
          suggestion: `@${decl.name} hoặc $${decl.name}`,
        });
      }
    } else if (node.type === 'FunctionDef') {
      const fn = node as FunctionDefNode;
      definedFunctions.set(fn.name, { line: fn.line, col: fn.col, calls: 0 });
      for (const param of fn.parameters) {
        declaredVars.set(param, { line: fn.line, col: fn.col, reads: 0, isParam: true });
      }
    }

    // Traverse children
    for (const key of Object.keys(node)) {
      if (key === 'line' || key === 'col' || key === 'type') continue;
      const val = (node as any)[key];
      if (Array.isArray(val)) {
        val.forEach((item) => collectSymbols(item));
      } else if (val && typeof val === 'object' && val.type) {
        collectSymbols(val);
      }
    }
  }

  function collectUsages(node: ASTNode, isLValue = false) {
    if (!node) return;

    if (node.type === 'Identifier') {
      const id = (node as IdentifierNode).name;
      if (!isLValue && declaredVars.has(id)) {
        declaredVars.get(id)!.reads++;
      }
    } else if (node.type === 'Call') {
      const call = node as any;
      if (call.callee?.type === 'Identifier') {
        const fnName = call.callee.name;
        if (definedFunctions.has(fnName)) {
          definedFunctions.get(fnName)!.calls++;
        }
      }
    } else if (node.type === 'Assign') {
      const assign = node as AssignNode;
      // Target is LValue
      if (assign.target.type === 'Identifier') {
        // Compound assignments read the target first
        if (assign.operator !== '=') {
          if (declaredVars.has(assign.target.name)) {
            declaredVars.get(assign.target.name)!.reads++;
          }
        }
      }
      collectUsages(assign.value, false);
      return;
    }

    // Traverse children
    for (const key of Object.keys(node)) {
      if (key === 'line' || key === 'col' || key === 'type') continue;
      const val = (node as any)[key];
      if (Array.isArray(val)) {
        val.forEach((item) => collectUsages(item));
      } else if (val && typeof val === 'object' && val.type) {
        collectUsages(val);
      }
    }
  }

  collectSymbols(parsedAST);
  collectUsages(parsedAST);

  // Check unused variables
  declaredVars.forEach((info, name) => {
    if (!info.isParam && !name.startsWith('_') && info.reads === 0) {
      problems.push({
        id: `unused-var-${name}`,
        rule: 'quality/no-unused-vars',
        message: `Biến '${name}' đã được khai báo nhưng chưa từng được sử dụng. Hãy sử dụng tiền tố '_' nếu là biến bỏ qua.`,
        line: info.line,
        col: info.col,
        severity: 'warning',
      });
    }
  });

  // Check unreachable code in blocks
  function checkUnreachable(node: ASTNode) {
    if (!node) return;
    if (node.type === 'Block' || node.type === 'Program') {
      const stmts: ASTNode[] = (node as any).statements || [];
      let terminatedAt = -1;
      for (let i = 0; i < stmts.length; i++) {
        const st = stmts[i];
        if (terminatedAt !== -1) {
          problems.push({
            id: `unreachable-code-${st.line}-${st.col}`,
            rule: 'quality/no-unreachable-code',
            message: `Mã không thể chạm tới (Unreachable code) sau câu lệnh nhảy thoát tại dòng ${terminatedAt}.`,
            line: st.line,
            col: st.col,
            severity: 'warning',
          });
          break;
        }
        if (st.type === 'Return' || st.type === 'Break' || st.type === 'Continue' || st.type === 'Throw') {
          terminatedAt = st.line;
        }
      }
    }

    for (const key of Object.keys(node)) {
      if (key === 'line' || key === 'col' || key === 'type') continue;
      const val = (node as any)[key];
      if (Array.isArray(val)) {
        val.forEach((item) => checkUnreachable(item));
      } else if (val && typeof val === 'object' && val.type) {
        checkUnreachable(val);
      }
    }
  }

  checkUnreachable(parsedAST);

  const errorCount = problems.filter((p) => p.severity === 'error').length;
  const warningCount = problems.filter((p) => p.severity === 'warning').length;
  const infoCount = problems.filter((p) => p.severity === 'info').length;

  return {
    valid: errorCount === 0,
    problems,
    errorCount,
    warningCount,
    infoCount,
  };
}
