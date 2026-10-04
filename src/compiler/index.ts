import { Lexer } from './lexer';
import { Parser } from './parser';
import { SemanticAnalyzer } from './analyzer';
import { ASTOptimizer } from './optimizer';
import { PythonCodeGenerator } from './codegen-py';
import { JavaScriptCodeGenerator } from './codegen-js';
import { Interpreter } from './interpreter';
import { BytecodeCompiler } from './bytecode';
import { PipelineResult, Token } from './types';

export * from './types';
export { Lexer } from './lexer';
export { Parser } from './parser';
export { SemanticAnalyzer } from './analyzer';
export { ASTOptimizer } from './optimizer';
export { PythonCodeGenerator } from './codegen-py';
export { JavaScriptCodeGenerator } from './codegen-js';
export { Interpreter } from './interpreter';
export { BytecodeCompiler } from './bytecode';
export { formatBLang } from './formatter';
export { highlightBLang, initBLangPrism } from './blangPrism';

function countASTNodes(node: any): number {
  if (!node || typeof node !== 'object') return 0;
  let count = 1;
  for (const key of Object.keys(node)) {
    if (key === 'line' || key === 'col' || key === 'type') continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        count += countASTNodes(item);
      }
    } else if (val && typeof val === 'object') {
      count += countASTNodes(val);
    }
  }
  return count;
}

export function compileBLang(source: string, runInterpreter = true, virtualFiles?: Record<string, string>): PipelineResult {
  let tokens: Token[] = [];
  const tGlobalStart = performance.now();
  try {
    // Layer 1: Lexer
    const t0 = performance.now();
    const lexer = new Lexer(source);
    tokens = lexer.tokenize();
    const t1 = performance.now();

    // Layer 2: Parser
    const parser = new Parser(tokens);
    const rawAST = parser.parse();
    const t2 = performance.now();

    // Layer 3: Semantic Analyzer (Dynamic Typing)
    const analyzer = new SemanticAnalyzer();
    const scopes = analyzer.analyze(rawAST);
    const t3 = performance.now();

    // Layer 4: AST Optimizer (Constant Folding)
    const optimizer = new ASTOptimizer();
    const rawASTClone = JSON.parse(JSON.stringify(rawAST));
    const optimizedAST = optimizer.optimize(rawASTClone);
    const t4 = performance.now();

    // Layer 5A: Standalone BLang Native Bytecode Engine (BVM Virtual Machine)
    const bytecodeCompiler = new BytecodeCompiler();
    const compiledBytecode = bytecodeCompiler.compile(optimizedAST as any);
    const t5 = performance.now();

    // Layer 5B: Python 3.x Codegen
    const pyGen = new PythonCodeGenerator();
    const pythonCode = pyGen.generate(optimizedAST as any);
    const t6 = performance.now();

    // Layer 5C: JavaScript ES6+ Codegen
    const jsGen = new JavaScriptCodeGenerator();
    const javascriptCode = jsGen.generate(optimizedAST as any);
    const t7 = performance.now();

    // Layer 6: Interpreter (Direct in-memory execution)
    let executionOutput: string[] = [];
    let runtimeState = undefined;
    let interpreterInstance: Interpreter | undefined;
    if (runInterpreter) {
      interpreterInstance = new Interpreter(undefined, virtualFiles);
      try {
        interpreterInstance.execute(optimizedAST as any);
      } catch (runErr: any) {
        executionOutput = interpreterInstance.stdout;
        runtimeState = interpreterInstance.getRuntimeState(performance.now() - t7);
        throw {
          ...runErr,
          runtimeState,
        };
      }
      executionOutput = interpreterInstance.stdout;
      runtimeState = interpreterInstance.getRuntimeState(performance.now() - t7);
    }
    const t8 = performance.now();

    const astNodeCount = countASTNodes(optimizedAST);
    const sourceBytes = new TextEncoder().encode(source).length;
    const jsBytes = new TextEncoder().encode(javascriptCode).length;
    const pyBytes = new TextEncoder().encode(pythonCode).length;
    const bytecodeBytes = new TextEncoder().encode(compiledBytecode.disassembly || '').length;

    const round2 = (num: number) => Math.round(num * 100) / 100;

    const metrics = {
      lexerTimeMs: round2(Math.max(0.05, t1 - t0)),
      parserTimeMs: round2(Math.max(0.05, t2 - t1)),
      analyzerTimeMs: round2(Math.max(0.05, t3 - t2)),
      optimizerTimeMs: round2(Math.max(0.05, t4 - t3)),
      bytecodeTimeMs: round2(Math.max(0.05, t5 - t4)),
      pyCodegenTimeMs: round2(Math.max(0.05, t6 - t5)),
      jsCodegenTimeMs: round2(Math.max(0.05, t7 - t6)),
      interpreterTimeMs: round2(Math.max(0.05, t8 - t7)),
      totalTranspileTimeMs: round2(Math.max(0.2, t7 - t0)),
      totalPipelineTimeMs: round2(Math.max(0.2, t8 - tGlobalStart)),
      sourceLines: source.split(/\r?\n/).length,
      sourceBytes,
      tokenCount: tokens.length,
      astNodeCount,
      jsBytes,
      pyBytes,
      bytecodeBytes,
      estimatedMemoryKb: round2((tokens.length * 64 + astNodeCount * 144 + sourceBytes * 3) / 1024),
    };

    return {
      success: true,
      tokens,
      rawAST,
      optimizedAST: optimizedAST as any,
      scopes,
      pythonCode,
      javascriptCode,
      bytecodeDisassembly: compiledBytecode.disassembly,
      bytecodeData: compiledBytecode,
      executionOutput,
      foldedConstants: optimizer.foldedCount,
      metrics,
      runtimeState,
    };
  } catch (err: any) {
    const tErr = performance.now();
    const sourceBytes = new TextEncoder().encode(source).length;
    return {
      success: false,
      tokens,
      scopes: [],
      pythonCode: '',
      javascriptCode: '',
      executionOutput: [],
      foldedConstants: 0,
      runtimeState: err.runtimeState,
      metrics: {
        lexerTimeMs: 0.1,
        parserTimeMs: 0.1,
        analyzerTimeMs: 0.1,
        optimizerTimeMs: 0,
        bytecodeTimeMs: 0,
        pyCodegenTimeMs: 0,
        jsCodegenTimeMs: 0,
        interpreterTimeMs: 0,
        totalTranspileTimeMs: Math.max(0.1, tErr - tGlobalStart),
        totalPipelineTimeMs: Math.max(0.1, tErr - tGlobalStart),
        sourceLines: source.split(/\r?\n/).length,
        sourceBytes,
        tokenCount: tokens.length,
        astNodeCount: 0,
        jsBytes: 0,
        pyBytes: 0,
        bytecodeBytes: 0,
        estimatedMemoryKb: Math.round((tokens.length * 64 + sourceBytes) / 1024),
      },
      error: {
        stage: err.stage || 'semantic',
        message: err.message || String(err),
        line: err.line,
        col: err.col,
      },
    };
  }
}

