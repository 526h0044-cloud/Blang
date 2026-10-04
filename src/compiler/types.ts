/**
 * BLang TypeScript Core Types & AST Specifications
 */

export type TokenType =
  | 'EOF'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'NULL'
  | 'print'
  | 'if'
  | 'elseif'
  | 'else'
  | 'for'
  | 'while'
  | 'function'
  | 'end'
  | 'return'
  | 'and'
  | 'or'
  | 'not'
  | 'true'
  | 'false'
  | 'break'
  | 'continue'
  | 'input'
  | 'len'
  | 'type'
  | 'import'
  | 'let'
  | 'in'
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '='
  | '+='
  | '-='
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | '{'
  | '}'
  | '('
  | ')'
  | '['
  | ']'
  | ','
  | ';'
  | ':'
  | '.'
  | 'RANDOM_MACRO';

export interface Token {
  type: TokenType;
  value: any;
  line: number;
  col: number;
}

export type ASTNodeType =
  | 'Program'
  | 'Block'
  | 'Literal'
  | 'Identifier'
  | 'VarDecl'
  | 'Assign'
  | 'BinaryOp'
  | 'UnaryOp'
  | 'List'
  | 'Dict'
  | 'DictEntry'
  | 'Index'
  | 'Call'
  | 'If'
  | 'While'
  | 'For'
  | 'FunctionDef'
  | 'Return'
  | 'Break'
  | 'Continue'
  | 'Print'
  | 'Import'
  | 'ExpressionStatement';

export interface BaseASTNode {
  type: ASTNodeType;
  line: number;
  col: number;
}

export interface ProgramNode extends BaseASTNode {
  type: 'Program';
  statements: ASTNode[];
}

export interface BlockNode extends BaseASTNode {
  type: 'Block';
  statements: ASTNode[];
}

export interface LiteralNode extends BaseASTNode {
  type: 'Literal';
  value: any;
  litType: 'number' | 'string' | 'boolean' | 'null';
}

export interface IdentifierNode extends BaseASTNode {
  type: 'Identifier';
  name: string;
}

export interface VarDeclNode extends BaseASTNode {
  type: 'VarDecl';
  name: string;
  initializer?: ASTNode;
}

export interface AssignNode extends BaseASTNode {
  type: 'Assign';
  target: IdentifierNode | IndexNode;
  operator: '=' | '+=' | '-=';
  value: ASTNode;
}

export interface BinaryOpNode extends BaseASTNode {
  type: 'BinaryOp';
  left: ASTNode;
  operator: string;
  right: ASTNode;
}

export interface UnaryOpNode extends BaseASTNode {
  type: 'UnaryOp';
  operator: string;
  operand: ASTNode;
}

export interface ListNode extends BaseASTNode {
  type: 'List';
  elements: ASTNode[];
}

export interface DictEntryNode extends BaseASTNode {
  type: 'DictEntry';
  key: ASTNode;
  value: ASTNode;
}

export interface DictNode extends BaseASTNode {
  type: 'Dict';
  entries: DictEntryNode[];
}

export interface IndexNode extends BaseASTNode {
  type: 'Index';
  target: ASTNode;
  index: ASTNode;
}

export interface CallNode extends BaseASTNode {
  type: 'Call';
  callee: ASTNode;
  arguments: ASTNode[];
}

export interface IfNode extends BaseASTNode {
  type: 'If';
  condition: ASTNode;
  thenBranch: BlockNode;
  elifBranches: Array<{ condition: ASTNode; body: BlockNode }>;
  elseBranch?: BlockNode;
}

export interface WhileNode extends BaseASTNode {
  type: 'While';
  condition: ASTNode;
  body: BlockNode;
}

export interface ForNode extends BaseASTNode {
  type: 'For';
  variable: string;
  iterable: ASTNode;
  body: BlockNode;
}

export interface FunctionDefNode extends BaseASTNode {
  type: 'FunctionDef';
  name: string;
  parameters: string[];
  body: BlockNode;
}

export interface ReturnNode extends BaseASTNode {
  type: 'Return';
  expression?: ASTNode;
}

export interface BreakNode extends BaseASTNode {
  type: 'Break';
}

export interface ContinueNode extends BaseASTNode {
  type: 'Continue';
}

export interface PrintNode extends BaseASTNode {
  type: 'Print';
  arguments: ASTNode[];
}

export interface ExpressionStatementNode extends BaseASTNode {
  type: 'ExpressionStatement';
  expression: ASTNode;
}

export interface ImportNode extends BaseASTNode {
  type: 'Import';
  modulePath: string;
}

export type ASTNode =
  | ProgramNode
  | BlockNode
  | LiteralNode
  | IdentifierNode
  | VarDeclNode
  | AssignNode
  | BinaryOpNode
  | UnaryOpNode
  | ListNode
  | DictNode
  | DictEntryNode
  | IndexNode
  | CallNode
  | IfNode
  | WhileNode
  | ForNode
  | FunctionDefNode
  | ReturnNode
  | BreakNode
  | ContinueNode
  | PrintNode
  | ImportNode
  | ExpressionStatementNode;

export interface SymbolInfo {
  name: string;
  type: string;
  line: number;
  col: number;
  parameters?: string[];
}

export interface ScopeInfo {
  name: string;
  parentName?: string;
  symbols: Record<string, SymbolInfo>;
}

export interface CompilerMetrics {
  lexerTimeMs: number;
  parserTimeMs: number;
  analyzerTimeMs: number;
  optimizerTimeMs: number;
  bytecodeTimeMs: number;
  pyCodegenTimeMs: number;
  jsCodegenTimeMs: number;
  interpreterTimeMs: number;
  totalTranspileTimeMs: number;
  totalPipelineTimeMs: number;
  sourceLines: number;
  sourceBytes: number;
  tokenCount: number;
  astNodeCount: number;
  jsBytes: number;
  pyBytes: number;
  bytecodeBytes: number;
  estimatedMemoryKb: number;
}

export interface CompilerDiagnostic {
  stage: 'lexer' | 'parser' | 'semantic' | 'runtime';
  message: string;
  line?: number;
  col?: number;
}

export interface RuntimeVariable {
  name: string;
  value: any;
  type: string;
  formattedValue: string;
  scopeName: string;
  scopeDepth: number;
  changed?: boolean;
}

export interface RuntimeScope {
  name: string;
  depth: number;
  variables: RuntimeVariable[];
}

export interface ExecutionStep {
  stepNumber: number;
  line: number;
  col: number;
  statementType: string;
  action: string;
  scopes: RuntimeScope[];
  allVariables: RuntimeVariable[];
  changedVariable?: string;
  outputLog?: string;
}

export interface RuntimeExecutionState {
  totalSteps: number;
  steps: ExecutionStep[];
  scopes: RuntimeScope[];
  allVariables: RuntimeVariable[];
  executionTimeMs: number;
}

export interface PipelineResult {
  success: boolean;
  tokens: Token[];
  rawAST?: ProgramNode;
  optimizedAST?: ProgramNode;
  scopes: ScopeInfo[];
  pythonCode: string;
  javascriptCode: string;
  bytecodeDisassembly?: string;
  bytecodeData?: any;
  executionOutput: string[];
  foldedConstants: number;
  metrics?: CompilerMetrics;
  runtimeState?: RuntimeExecutionState;
  error?: CompilerDiagnostic;
}

