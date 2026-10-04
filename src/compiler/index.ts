import { Lexer } from './lexer';
import { Parser } from './parser';
import { SemanticAnalyzer } from './analyzer';
import { ASTOptimizer } from './optimizer';
import { PythonCodeGenerator } from './codegen-py';
import { JavaScriptCodeGenerator } from './codegen-js';
import { Interpreter } from './interpreter';
import { BytecodeCompiler, VirtualMachine } from './bytecode';
import { lintBLang } from './linter';
import { BLangLSPService } from './lsp';
import { PipelineResult, Token, CompileOptions, CompilerMetrics } from './types';

export * from './types';
export { Lexer } from './lexer';
export { Parser } from './parser';
export { SemanticAnalyzer } from './analyzer';
export { ASTOptimizer } from './optimizer';
export { PythonCodeGenerator } from './codegen-py';
export { JavaScriptCodeGenerator } from './codegen-js';
export { Interpreter } from './interpreter';
export { BytecodeCompiler, VirtualMachine } from './bytecode';
export { formatBLang } from './formatter';
export { lintBLang } from './linter';
export { BLangLSPService } from './lsp';
export { highlightBLang, initBLangPrism } from './blangPrism';

// Shared static TextEncoder to avoid garbage collection and instantiation overhead
const staticTextEncoder = new TextEncoder();

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

export function compileBLang(
  source: string,
  optionsOrRunInterpreter: boolean | CompileOptions = true,
  legacyVirtualFiles?: Record<string, string>
): PipelineResult {
  const options: CompileOptions =
    typeof optionsOrRunInterpreter === 'boolean'
      ? {
          runInterpreter: optionsOrRunInterpreter,
          virtualFiles: legacyVirtualFiles,
          runVM: optionsOrRunInterpreter,
          runLinter: true,
          target: 'all',
          turbo: false,
        }
      : {
          runInterpreter: true,
          runVM: true,
          runLinter: true,
          target: 'all',
          turbo: false,
          ...optionsOrRunInterpreter,
        };

  const isTurbo = Boolean(options.turbo);
  const targetMode = options.target || 'all';
  let tokens: Token[] = [];
  const tGlobalStart = performance.now();

  try {
    // Layer 1: Lexer (Zero-Regex Direct CharCode Scanner)
    const t0 = performance.now();
    const lexer = new Lexer(source);
    tokens = lexer.tokenize();
    const t1 = performance.now();

    // Layer 2: Parser (Zero-Alloc recursive descent)
    const parser = new Parser(tokens);
    const rawAST = parser.parse();
    const t2 = performance.now();

    // Layer 3: Semantic Analyzer (Dynamic Typing)
    const analyzer = new SemanticAnalyzer();
    const scopes = analyzer.analyze(rawAST);
    const t3 = performance.now();

    // Layer 4: AST Optimizer (Constant Folding)
    const optimizer = new ASTOptimizer();
    const optimizedAST = optimizer.optimize(rawAST);
    const t4 = performance.now();

    // Layer 5A: Standalone BLang Native Bytecode Engine (BVM Virtual Machine)
    let compiledBytecode: any = { instructions: [], constants: [], lineMap: [], disassembly: '' };
    if (targetMode === 'all' || targetMode === 'bytecode' || options.runVM) {
      const bytecodeCompiler = new BytecodeCompiler();
      compiledBytecode = bytecodeCompiler.compile(optimizedAST as any);
    }
    const t5 = performance.now();

    // Layer 5B: Python 3.x Codegen
    let pythonCode = '';
    if (targetMode === 'all' || targetMode === 'py') {
      const pyGen = new PythonCodeGenerator();
      pythonCode = pyGen.generate(optimizedAST as any);
    }
    const t6 = performance.now();

    // Layer 5C: JavaScript ES6+ Codegen
    let javascriptCode = '';
    if (targetMode === 'all' || targetMode === 'js') {
      const jsGen = new JavaScriptCodeGenerator();
      javascriptCode = jsGen.generate(optimizedAST as any);
    }
    const t7 = performance.now();

    // Layer 6: Interpreter (Direct in-memory execution)
    let executionOutput: string[] = [];
    let runtimeState = undefined;
    let interpreterInstance: Interpreter | undefined;
    if (options.runInterpreter) {
      interpreterInstance = new Interpreter(undefined, options.virtualFiles);
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
    const sourceBytes = staticTextEncoder.encode(source).length;
    const jsBytes = javascriptCode ? staticTextEncoder.encode(javascriptCode).length : 0;
    const pyBytes = pythonCode ? staticTextEncoder.encode(pythonCode).length : 0;
    const bytecodeBytes = compiledBytecode.disassembly
      ? staticTextEncoder.encode(compiledBytecode.disassembly).length
      : 0;

    const round2 = (num: number) => Math.round(num * 100) / 100;
    const round3 = (num: number) => Math.round(num * 1000) / 1000;

    const actualTranspile = Math.max(0.005, t7 - t0);
    const actualPipeline = Math.max(0.01, t8 - tGlobalStart);
    const lineCount = source.split(/\r?\n/).length;

    // Direct Throughput (Lines per second)
    const linesPerSec = Math.round((lineCount / (actualTranspile / 1000)));
    // Projected Turbo throughput (single-target stream)
    const turboTranspileTime = Math.max(0.002, (t2 - t0) + (t4 - t3) + (targetMode === 'bytecode' ? (t5 - t4) : (t7 - t6)));
    const turboLinesPerSec = Math.round((lineCount / (turboTranspileTime / 1000)));

    const metrics: CompilerMetrics = {
      lexerTimeMs: round3(Math.max(0.005, t1 - t0)),
      parserTimeMs: round3(Math.max(0.005, t2 - t1)),
      analyzerTimeMs: round3(Math.max(0.005, t3 - t2)),
      optimizerTimeMs: round3(Math.max(0.005, t4 - t3)),
      bytecodeTimeMs: round3(Math.max(0.005, t5 - t4)),
      pyCodegenTimeMs: round3(Math.max(0.005, t6 - t5)),
      jsCodegenTimeMs: round3(Math.max(0.005, t7 - t6)),
      interpreterTimeMs: round3(Math.max(0.01, t8 - t7)),
      totalTranspileTimeMs: round3(actualTranspile),
      totalPipelineTimeMs: round3(actualPipeline),
      sourceLines: lineCount,
      sourceBytes,
      tokenCount: tokens.length,
      astNodeCount,
      jsBytes,
      pyBytes,
      bytecodeBytes,
      estimatedMemoryKb: round2((tokens.length * 64 + astNodeCount * 144 + sourceBytes * 3) / 1024),
      linesPerSec,
      turboLinesPerSec,
    };

    // Layer 5A-2: Execute VirtualMachine (Stack BVM) if requested and not in turbo bench
    let vmResult = undefined;
    if (options.runVM && compiledBytecode.instructions?.length > 0) {
      try {
        const vm = new VirtualMachine();
        vmResult = vm.run(compiledBytecode);
      } catch {
        // Safe fallback if VM encounters unsupported experimental op
      }
    }

    // Static Linter check (skip in turbo benchmark mode)
    const lintResult = options.runLinter !== false ? lintBLang(source, optimizedAST as any) : undefined;

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
      vmResult,
      lintResult,
      executionOutput,
      foldedConstants: optimizer.foldedCount,
      metrics,
      runtimeState,
    };
  } catch (err: any) {
    const tErr = performance.now();
    const sourceBytes = staticTextEncoder.encode(source).length;
    const lineCount = source.split(/\r?\n/).length;
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
        sourceLines: lineCount,
        sourceBytes,
        tokenCount: tokens.length,
        astNodeCount: 0,
        jsBytes: 0,
        pyBytes: 0,
        bytecodeBytes: 0,
        estimatedMemoryKb: Math.round((tokens.length * 64 + sourceBytes) / 1024),
        linesPerSec: 0,
        turboLinesPerSec: 0,
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

/**
 * Dedicated Throughput Benchmark Engine
 * Runs multiple passes with JIT warm-up to accurately measure peak Lines/Sec
 */
export function benchmarkCompilerThroughput(
  code: string,
  passes = 25,
  mode: 'standard' | 'turbo' | 'bytecode' = 'standard'
): {
  minMs: number;
  avgMs: number;
  maxMs: number;
  p95Ms: number;
  linesPerSec: number;
  passes: number[];
  lineCount: number;
} {
  const lineCount = Math.max(1, code.split(/\r?\n/).length);

  // Warm up V8 JIT compiler
  for (let w = 0; w < 3; w++) {
    compileBLang(code, {
      runInterpreter: false,
      runVM: false,
      runLinter: false,
      target: mode === 'bytecode' ? 'bytecode' : mode === 'turbo' ? 'js' : 'all',
      turbo: mode !== 'standard',
    });
  }

  const times: number[] = [];
  for (let i = 0; i < passes; i++) {
    const t0 = performance.now();
    compileBLang(code, {
      runInterpreter: false,
      runVM: false,
      runLinter: false,
      target: mode === 'bytecode' ? 'bytecode' : mode === 'turbo' ? 'js' : 'all',
      turbo: mode !== 'standard',
    });
    const elapsed = performance.now() - t0;
    times.push(Math.round(elapsed * 100) / 100);
  }

  const sorted = [...times].sort((a, b) => a - b);
  const minMs = sorted[0];
  const maxMs = sorted[sorted.length - 1];
  const avgMs = Math.round((sorted.reduce((a, b) => a + b, 0) / sorted.length) * 100) / 100;
  const p95Ms = sorted[Math.floor(sorted.length * 0.95)];

  // Lines per second based on average warm transpile time
  const linesPerSec = Math.round((lineCount / Math.max(0.0001, (avgMs / 1000))));

  return {
    minMs,
    avgMs,
    maxMs,
    p95Ms,
    linesPerSec,
    passes: times,
    lineCount,
  };
}


