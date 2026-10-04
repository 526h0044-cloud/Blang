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

export function compileBLang(source: string, runInterpreter = true, virtualFiles?: Record<string, string>): PipelineResult {
  let tokens: Token[] = [];
  try {
    // Layer 1: Lexer
    const lexer = new Lexer(source);
    tokens = lexer.tokenize();

    // Layer 2: Parser
    const parser = new Parser(tokens);
    const rawAST = parser.parse();

    // Layer 3: Semantic Analyzer & Strict Type Safety
    const analyzer = new SemanticAnalyzer();
    const scopes = analyzer.analyze(rawAST);

    // Layer 4: AST Optimizer (Constant Folding)
    const optimizer = new ASTOptimizer();
    // deep clone AST for optimizer
    const rawASTClone = JSON.parse(JSON.stringify(rawAST));
    const optimizedAST = optimizer.optimize(rawASTClone);

    // Layer 5A: Standalone BLang Native Bytecode Engine (BVM Virtual Machine)
    const bytecodeCompiler = new BytecodeCompiler();
    const compiledBytecode = bytecodeCompiler.compile(optimizedAST as any);

    // Layer 5B: Python 3.x Codegen (Optional Export Target)
    const pyGen = new PythonCodeGenerator();
    const pythonCode = pyGen.generate(optimizedAST as any);

    // Layer 5C: JavaScript ES6+ Codegen (Optional Export Target)
    const jsGen = new JavaScriptCodeGenerator();
    const javascriptCode = jsGen.generate(optimizedAST as any);

    // Layer 6: Interpreter (Direct in-memory execution)
    let executionOutput: string[] = [];
    if (runInterpreter) {
      const interpreter = new Interpreter(undefined, virtualFiles);
      interpreter.execute(optimizedAST as any);
      executionOutput = interpreter.stdout;
    }

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
    };
  } catch (err: any) {
    return {
      success: false,
      tokens,
      scopes: [],
      pythonCode: '',
      javascriptCode: '',
      executionOutput: [],
      foldedConstants: 0,
      error: {
        stage: err.stage || 'semantic',
        message: err.message || String(err),
        line: err.line,
        col: err.col,
      },
    };
  }
}
