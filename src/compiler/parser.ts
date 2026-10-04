import {
  Token,
  TokenType,
  ASTNode,
  ProgramNode,
  BlockNode,
  LiteralNode,
  IdentifierNode,
  VarDeclNode,
  AssignNode,
  BinaryOpNode,
  UnaryOpNode,
  ListNode,
  DictNode,
  DictEntryNode,
  IndexNode,
  CallNode,
  IfNode,
  WhileNode,
  ForNode,
  FunctionDefNode,
  ReturnNode,
  BreakNode,
  ContinueNode,
  PrintNode,
  ExpressionStatementNode,
} from './types';

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private currentToken(): Token {
    if (this.pos >= this.tokens.length) return this.tokens[this.tokens.length - 1];
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const tok = this.currentToken();
    this.pos++;
    return tok;
  }

  private check(type: TokenType): boolean {
    return this.currentToken().type === type;
  }

  private match(t1: TokenType, t2?: TokenType, t3?: TokenType, t4?: TokenType, t5?: TokenType): boolean {
    const curType = this.currentToken().type;
    if (curType === t1 || (t2 && curType === t2) || (t3 && curType === t3) || (t4 && curType === t4) || (t5 && curType === t5)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(expectedType: TokenType): Token {
    const tok = this.currentToken();
    if (tok.type !== expectedType) {
      throw {
        stage: 'parser',
        message: `Expected '${expectedType}', found '${tok.type}' (${JSON.stringify(tok.value)})`,
        line: tok.line,
        col: tok.col,
      };
    }
    return this.advance();
  }

  private consumeSemicolons() {
    while (this.check(';')) {
      this.advance();
    }
  }

  public errors: any[] = [];

  private synchronize() {
    this.advance();
    while (!this.check('EOF')) {
      if (this.tokens[this.pos - 1]?.type === ';') return;
      if (this.tokens[this.pos - 1]?.type === '}') return;
      switch (this.currentToken().type) {
        case 'function':
        case 'let':
        case 'for':
        case 'if':
        case 'while':
        case 'print':
        case 'return':
        case 'try':
        case 'throw':
          return;
      }
      this.advance();
    }
  }

  public parse(): ProgramNode {
    const statements: ASTNode[] = [];
    this.errors = [];
    while (!this.check('EOF')) {
      this.consumeSemicolons();
      if (this.check('EOF')) break;
      try {
        const stmt = this.parseStatement();
        if (stmt) statements.push(stmt);
      } catch (err: any) {
        this.errors.push(err);
        this.synchronize();
      }
      this.consumeSemicolons();
    }
    if (this.errors.length > 0 && statements.length === 0) {
      throw this.errors[0];
    }
    return { type: 'Program', statements, line: 1, col: 1 };
  }

  public parseBlock(): BlockNode {
    const startTok = this.expect('{');
    const statements: ASTNode[] = [];
    while (!this.check('}') && !this.check('EOF')) {
      this.consumeSemicolons();
      if (this.check('}') || this.check('EOF')) break;
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
      this.consumeSemicolons();
    }
    this.expect('}');
    return { type: 'Block', statements, line: startTok.line, col: startTok.col };
  }

  public parseStatement(): ASTNode {
    const tok = this.currentToken();

    if (tok.type === 'let') return this.parseVarDecl();
    if (tok.type === 'function') return this.parseFunctionDef();
    if (tok.type === 'if') return this.parseIf();
    if (tok.type === 'while') return this.parseWhile();
    if (tok.type === 'for') return this.parseFor();

    if (tok.type === 'return') {
      this.advance();
      let expr: ASTNode | undefined;
      if (!this.check(';') && !this.check('}') && !this.check('EOF')) {
        expr = this.parseExpression();
      }
      return { type: 'Return', expression: expr, line: tok.line, col: tok.col };
    }

    if (tok.type === 'break') {
      this.advance();
      return { type: 'Break', line: tok.line, col: tok.col };
    }

    if (tok.type === 'continue') {
      this.advance();
      return { type: 'Continue', line: tok.line, col: tok.col };
    }

    if (tok.type === 'print') {
      return this.parsePrint();
    }

    if (tok.type === 'try') {
      return this.parseTryCatch();
    }

    if (tok.type === 'throw') {
      return this.parseThrow();
    }

    if (tok.type === 'import') {
      this.advance();
      const pathTok = this.currentToken();
      if (pathTok.type === 'STRING' || pathTok.type === 'IDENTIFIER') {
        this.advance();
        return {
          type: 'Import',
          modulePath: String(pathTok.value),
          line: tok.line,
          col: tok.col,
        };
      }
      throw {
        stage: 'parser',
        message: `Expected module name or string path after import, found '${pathTok.type}'`,
        line: tok.line,
        col: tok.col,
      };
    }

    if (tok.type === '{') {
      return this.parseBlock();
    }

    return this.parseAssignmentOrExpr();
  }

  private parseVarDecl(): VarDeclNode {
    const letTok = this.expect('let');
    const idTok = this.expect('IDENTIFIER');
    let init: ASTNode | undefined;
    if (this.match('=')) {
      init = this.parseExpression();
    }
    return {
      type: 'VarDecl',
      name: idTok.value,
      initializer: init,
      line: letTok.line,
      col: letTok.col,
    };
  }

  private parseFunctionDef(): FunctionDefNode {
    const fnTok = this.expect('function');
    const nameTok = this.expect('IDENTIFIER');
    this.expect('(');
    const params: string[] = [];
    if (!this.check(')')) {
      params.push(this.expect('IDENTIFIER').value);
      while (this.match(',')) {
        params.push(this.expect('IDENTIFIER').value);
      }
    }
    this.expect(')');
    const body = this.parseBlock();
    return {
      type: 'FunctionDef',
      name: nameTok.value,
      parameters: params,
      body,
      line: fnTok.line,
      col: fnTok.col,
    };
  }

  private parseIf(): IfNode {
    const ifTok = this.expect('if');
    const hasParen = this.match('(');
    const cond = this.parseExpression();
    if (hasParen) this.expect(')');
    const thenBranch = this.parseBlock();

    const elifBranches: Array<{ condition: ASTNode; body: BlockNode }> = [];
    while (this.match('elseif')) {
      const hasP = this.match('(');
      const elifCond = this.parseExpression();
      if (hasP) this.expect(')');
      const elifBody = this.parseBlock();
      elifBranches.push({ condition: elifCond, body: elifBody });
    }

    let elseBranch: BlockNode | undefined;
    if (this.match('else')) {
      elseBranch = this.parseBlock();
    }

    return {
      type: 'If',
      condition: cond,
      thenBranch,
      elifBranches,
      elseBranch,
      line: ifTok.line,
      col: ifTok.col,
    };
  }

  private parseWhile(): WhileNode {
    const whileTok = this.expect('while');
    const hasParen = this.match('(');
    const cond = this.parseExpression();
    if (hasParen) this.expect(')');
    const body = this.parseBlock();
    return {
      type: 'While',
      condition: cond,
      body,
      line: whileTok.line,
      col: whileTok.col,
    };
  }

  private parseFor(): ForNode {
    const forTok = this.expect('for');
    const hasParen = this.match('(');
    const varTok = this.expect('IDENTIFIER');
    this.expect('in');
    const iterable = this.parseExpression();
    if (hasParen) this.expect(')');
    const body = this.parseBlock();
    return {
      type: 'For',
      variable: varTok.value,
      iterable,
      body,
      line: forTok.line,
      col: forTok.col,
    };
  }

  private parsePrint(): PrintNode {
    const pTok = this.expect('print');
    const args: ASTNode[] = [];
    if (this.match('(')) {
      if (!this.check(')')) {
        args.push(this.parseExpression());
        while (this.match(',')) {
          args.push(this.parseExpression());
        }
      }
      this.expect(')');
    } else {
      args.push(this.parseExpression());
      while (this.match(',')) {
        args.push(this.parseExpression());
      }
    }
    return {
      type: 'Print',
      arguments: args,
      line: pTok.line,
      col: pTok.col,
    };
  }

  private parseTryCatch(): ASTNode {
    const tryTok = this.expect('try');
    const tryBlock = this.parseBlock();
    this.expect('catch');
    let errorVar: string | undefined;
    if (this.match('(')) {
      const id = this.expect('IDENTIFIER');
      errorVar = id.value;
      this.expect(')');
    }
    const catchBlock = this.parseBlock();
    return {
      type: 'TryCatch',
      tryBlock,
      errorVar,
      catchBlock,
      line: tryTok.line,
      col: tryTok.col,
    };
  }

  private parseThrow(): ASTNode {
    const throwTok = this.expect('throw');
    const expr = this.parseExpression();
    return {
      type: 'Throw',
      expression: expr,
      line: throwTok.line,
      col: throwTok.col,
    };
  }

  private parseAssignmentOrExpr(): ASTNode {
    const expr = this.parseExpression();
    const tok = this.currentToken();

    if (tok.type === '=' || tok.type === '+=' || tok.type === '-=' || tok.type === '*=' || tok.type === '/=' || tok.type === '%=') {
      const op = this.advance().type as '=' | '+=' | '-=' | '*=' | '/=' | '%=';
      const value = this.parseExpression();
      if (expr.type !== 'Identifier' && expr.type !== 'Index') {
        throw {
          stage: 'parser',
          message: `Invalid assignment target at line ${expr.line}, col ${expr.col}`,
          line: expr.line,
          col: expr.col,
        };
      }
      return {
        type: 'Assign',
        target: expr as IdentifierNode | IndexNode,
        operator: op,
        value,
        line: expr.line,
        col: expr.col,
      };
    }

    return {
      type: 'ExpressionStatement',
      expression: expr,
      line: expr.line,
      col: expr.col,
    };
  }

  public parseExpression(): ASTNode {
    return this.parseNullCoalescing();
  }

  private parseNullCoalescing(): ASTNode {
    let left = this.parseLogicalOr();
    while (this.match('??')) {
      const opTok = this.tokens[this.pos - 1];
      const right = this.parseLogicalOr();
      left = { type: 'BinaryOp', left, operator: '??', right, line: opTok.line, col: opTok.col };
    }
    return left;
  }

  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();
    while (this.match('or')) {
      const opTok = this.tokens[this.pos - 1];
      const right = this.parseLogicalAnd();
      left = { type: 'BinaryOp', left, operator: 'or', right, line: opTok.line, col: opTok.col };
    }
    return left;
  }

  private parseLogicalAnd(): ASTNode {
    let left = this.parseEquality();
    while (this.match('and')) {
      const opTok = this.tokens[this.pos - 1];
      const right = this.parseEquality();
      left = { type: 'BinaryOp', left, operator: 'and', right, line: opTok.line, col: opTok.col };
    }
    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseRelational();
    while (this.check('==') || this.check('!=')) {
      const op = this.advance().type;
      const right = this.parseRelational();
      left = { type: 'BinaryOp', left, operator: op, right, line: left.line, col: left.col };
    }
    return left;
  }

  private parseRelational(): ASTNode {
    let left = this.parseAdditive();
    while (this.check('<') || this.check('<=') || this.check('>') || this.check('>=')) {
      const op = this.advance().type;
      const right = this.parseAdditive();
      left = { type: 'BinaryOp', left, operator: op, right, line: left.line, col: left.col };
    }
    return left;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();
    while (this.check('+') || this.check('-')) {
      const op = this.advance().type;
      const right = this.parseMultiplicative();
      left = { type: 'BinaryOp', left, operator: op, right, line: left.line, col: left.col };
    }
    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();
    while (this.check('*') || this.check('/') || this.check('%')) {
      const op = this.advance().type;
      const right = this.parseUnary();
      left = { type: 'BinaryOp', left, operator: op, right, line: left.line, col: left.col };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    const tok = this.currentToken();
    if (tok.type === 'not' || tok.type === '-' || tok.type === '+') {
      const op = this.advance().type;
      const operand = this.parseUnary();
      return { type: 'UnaryOp', operator: op, operand, line: tok.line, col: tok.col };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): ASTNode {
    let expr = this.parsePrimary();
    while (true) {
      if (this.match('(')) {
        const args: ASTNode[] = [];
        if (!this.check(')')) {
          args.push(this.parseExpression());
          while (this.match(',')) {
            args.push(this.parseExpression());
          }
        }
        this.expect(')');
        expr = { type: 'Call', callee: expr, arguments: args, line: expr.line, col: expr.col };
        continue;
      }

      if (this.match('[')) {
        const idx = this.parseExpression();
        this.expect(']');
        expr = { type: 'Index', target: expr, index: idx, line: expr.line, col: expr.col };
        continue;
      }

      break;
    }
    return expr;
  }

  private parsePrimary(): ASTNode {
    const tok = this.currentToken();

    if (tok.type === 'RANDOM_MACRO' || (tok.type === 'IDENTIFIER' && tok.value === '%random')) {
      const startL = tok.line;
      const startC = tok.col;
      this.advance(); // consume %random
      this.expect('(');
      const minArg = this.parseExpression();
      this.expect(',');
      const maxArg = this.parseExpression();
      this.expect(')');
      if (this.check('%')) {
        this.advance(); // consume trailing % in %random(a,b)%
      }
      return {
        type: 'Call',
        callee: { type: 'Identifier', name: 'random', line: startL, col: startC },
        arguments: [minArg, maxArg],
        line: startL,
        col: startC,
      };
    }

    if (tok.type === 'NUMBER') {
      this.advance();
      return { type: 'Literal', value: tok.value, litType: 'number', line: tok.line, col: tok.col };
    }

    if (tok.type === 'STRING') {
      this.advance();
      return { type: 'Literal', value: tok.value, litType: 'string', line: tok.line, col: tok.col };
    }

    if (tok.type === 'true' || tok.type === 'false') {
      this.advance();
      return { type: 'Literal', value: tok.value, litType: 'boolean', line: tok.line, col: tok.col };
    }

    if (tok.type === 'NULL') {
      this.advance();
      return { type: 'Literal', value: null, litType: 'null', line: tok.line, col: tok.col };
    }

    if (tok.type === 'IDENTIFIER' || tok.type === 'len' || tok.type === 'type' || tok.type === 'input') {
      this.advance();
      return { type: 'Identifier', name: tok.value, line: tok.line, col: tok.col };
    }

    if (this.match('(')) {
      const expr = this.parseExpression();
      this.expect(')');
      return expr;
    }

    // List Literal
    if (this.match('[')) {
      const startL = tok.line;
      const startC = tok.col;
      const elements: ASTNode[] = [];
      if (!this.check(']')) {
        elements.push(this.parseExpression());
        while (this.match(',')) {
          if (this.check(']')) break;
          elements.push(this.parseExpression());
        }
      }
      this.expect(']');
      return { type: 'List', elements, line: startL, col: startC };
    }

    // Dict Literal
    if (tok.type === '{') {
      const startL = tok.line;
      const startC = tok.col;
      this.advance(); // {
      const entries: DictEntryNode[] = [];
      if (!this.check('}')) {
        const k = this.parseExpression();
        this.expect(':');
        const v = this.parseExpression();
        entries.push({ type: 'DictEntry', key: k, value: v, line: k.line, col: k.col });
        while (this.match(',')) {
          if (this.check('}')) break;
          const keyNode = this.parseExpression();
          this.expect(':');
          const valNode = this.parseExpression();
          entries.push({ type: 'DictEntry', key: keyNode, value: valNode, line: keyNode.line, col: keyNode.col });
        }
      }
      this.expect('}');
      return { type: 'Dict', entries, line: startL, col: startC };
    }

    throw {
      stage: 'parser',
      message: `Unexpected token '${tok.type}' (${JSON.stringify(tok.value)})`,
      line: tok.line,
      col: tok.col,
    };
  }
}
