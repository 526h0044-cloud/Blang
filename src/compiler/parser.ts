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
  FunctionParam,
  ReturnNode,
  BreakNode,
  ContinueNode,
  PrintNode,
  ExpressionStatementNode,
  MatchNode,
  MatchCaseNode,
  RangeNode,
  PipelineNode,
  InterpolatedStringNode,
  DestructureNode,
} from './types';
import { Lexer } from './lexer';

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

  private isDestructureAhead(openType: '[' | '{', closeType: ']' | '}'): boolean {
    if (this.currentToken().type !== openType) return false;
    let depth = 0;
    let i = this.pos;
    const len = this.tokens.length;
    while (i < len) {
      const t = this.tokens[i].type;
      if (t === openType) depth++;
      else if (t === closeType) {
        depth--;
        if (depth === 0) {
          // Check token right after closing bracket
          if (i + 1 < len && this.tokens[i + 1].type === '=') {
            return true;
          }
          return false;
        }
      } else if (t === ';' || t === 'EOF') {
        return false;
      }
      i++;
    }
    return false;
  }

  private parseDestructure(isDeclaration: boolean, line: number, col: number): DestructureNode {
    const isArray = this.match('[');
    const isDict = !isArray && this.match('{');
    if (!isArray && !isDict) {
      throw {
        stage: 'parser',
        message: 'Expected "[" or "{" for destructuring assignment',
        line,
        col,
      };
    }
    const names: string[] = [];
    const closeType = isArray ? ']' : '}';

    if (!this.check(closeType)) {
      names.push(this.expect('IDENTIFIER').value);
      while (this.match(',')) {
        if (this.check(closeType)) break;
        names.push(this.expect('IDENTIFIER').value);
      }
    }
    this.expect(closeType);
    this.expect('=');
    const value = this.parseExpression();

    return {
      type: 'Destructure',
      kind: isArray ? 'array' : 'dict',
      names,
      value,
      isDeclaration,
      line,
      col,
    };
  }

  private parseTypeAnnotation(): string {
    const tok = this.currentToken();
    let typeName = String(tok.value || tok.type);
    this.advance();
    if (this.match('<')) {
      typeName += '<' + this.parseTypeAnnotation();
      while (this.match(',')) {
        typeName += ', ' + this.parseTypeAnnotation();
      }
      this.expect('>');
      typeName += '>';
    }
    return typeName;
  }

  public parseStatement(): ASTNode {
    const tok = this.currentToken();

    if (tok.type === 'let') return this.parseVarDecl();
    if (tok.type === 'function') return this.parseFunctionDef();
    if (tok.type === 'if') return this.parseIf();
    if (tok.type === 'while') return this.parseWhile();
    if (tok.type === 'for') return this.parseFor();

    // Check direct destructuring: [a, b] = arr or {x, y} = dict
    if (tok.type === '[' && this.isDestructureAhead('[', ']')) {
      return this.parseDestructure(false, tok.line, tok.col);
    }
    if (tok.type === '{' && this.isDestructureAhead('{', '}')) {
      return this.parseDestructure(false, tok.line, tok.col);
    }

    // Check direct typed declaration: name: type = expr
    if (tok.type === 'IDENTIFIER' && this.pos + 1 < this.tokens.length && this.tokens[this.pos + 1].type === ':') {
      const idTok = this.advance();
      this.expect(':');
      const typeAnnotation = this.parseTypeAnnotation();
      let init: ASTNode | undefined;
      if (this.match('=')) {
        init = this.parseExpression();
      }
      return {
        type: 'VarDecl',
        name: idTok.value,
        typeAnnotation,
        initializer: init,
        line: idTok.line,
        col: idTok.col,
      };
    }

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

    if (tok.type === 'match') {
      return this.parseMatch();
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

  private parseVarDecl(): ASTNode {
    const letTok = this.expect('let');
    if (this.check('[') || this.check('{')) {
      return this.parseDestructure(true, letTok.line, letTok.col);
    }
    const idTok = this.expect('IDENTIFIER');
    let typeAnnotation: string | undefined;
    if (this.match(':')) {
      typeAnnotation = this.parseTypeAnnotation();
    }
    let init: ASTNode | undefined;
    if (this.match('=')) {
      init = this.parseExpression();
    }
    return {
      type: 'VarDecl',
      name: idTok.value,
      typeAnnotation,
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
    const paramDetails: FunctionParam[] = [];
    if (!this.check(')')) {
      const pName = this.expect('IDENTIFIER').value;
      let pType: string | undefined;
      if (this.match(':')) {
        pType = this.parseTypeAnnotation();
      }
      params.push(pName);
      paramDetails.push({ name: pName, typeAnnotation: pType });
      while (this.match(',')) {
        const nextName = this.expect('IDENTIFIER').value;
        let nextType: string | undefined;
        if (this.match(':')) {
          nextType = this.parseTypeAnnotation();
        }
        params.push(nextName);
        paramDetails.push({ name: nextName, typeAnnotation: nextType });
      }
    }
    this.expect(')');
    let returnType: string | undefined;
    if (this.match(':')) {
      returnType = this.parseTypeAnnotation();
    }
    const body = this.parseBlock();
    return {
      type: 'FunctionDef',
      name: nameTok.value,
      parameters: params,
      paramDetails,
      returnType,
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

  private parseMatch(): MatchNode {
    const matchTok = this.expect('match');
    const discriminant = this.parseExpression();
    this.expect('{');
    const cases: MatchCaseNode[] = [];
    let defaultCase: BlockNode | undefined;

    while (!this.check('}') && !this.check('EOF')) {
      this.consumeSemicolons();
      if (this.check('}') || this.check('EOF')) break;

      if (this.match('case')) {
        const caseLine = this.tokens[this.pos - 1].line;
        const caseCol = this.tokens[this.pos - 1].col;
        const pattern = this.parseExpression();
        const body = this.parseBlock();
        cases.push({
          type: 'MatchCase',
          pattern,
          body,
          line: caseLine,
          col: caseCol,
        });
      } else if (this.match('default')) {
        defaultCase = this.parseBlock();
      } else {
        throw {
          stage: 'parser',
          message: `Expected 'case' or 'default' inside match block, found '${this.currentToken().type}'`,
          line: this.currentToken().line,
          col: this.currentToken().col,
        };
      }
      this.consumeSemicolons();
    }
    this.expect('}');
    return {
      type: 'Match',
      discriminant,
      cases,
      defaultCase,
      line: matchTok.line,
      col: matchTok.col,
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
    return this.parsePipeline();
  }

  private parsePipeline(): ASTNode {
    let left = this.parseRange();
    while (this.match('|>')) {
      const opTok = this.tokens[this.pos - 1];
      const target = this.parsePostfix();
      if (target.type !== 'Call' && target.type !== 'Identifier') {
        throw {
          stage: 'parser',
          message: `Expected function name or call after '|>', found '${target.type}'`,
          line: opTok.line,
          col: opTok.col,
        };
      }
      left = {
        type: 'Pipeline',
        left,
        target: target as CallNode | IdentifierNode,
        line: opTok.line,
        col: opTok.col,
      };
    }
    return left;
  }

  private parseRange(): ASTNode {
    let left = this.parseNullCoalescing();
    if (this.match('..')) {
      const opTok = this.tokens[this.pos - 1];
      const right = this.parseNullCoalescing();
      return {
        type: 'Range',
        start: left,
        end: right,
        inclusive: true,
        line: opTok.line,
        col: opTok.col,
      };
    }
    return left;
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

    if (tok.type === 'FSTRING') {
      const fTok = this.advance();
      return this.parseInterpolatedString(String(fTok.value), fTok.line, fTok.col);
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

  private parseInterpolatedString(raw: string, line: number, col: number): InterpolatedStringNode {
    const parts: ASTNode[] = [];
    let cur = 0;
    const len = raw.length;
    let textAcc = '';

    while (cur < len) {
      if (raw[cur] === '{') {
        if (cur + 1 < len && raw[cur + 1] === '{') {
          // Escaped {{
          textAcc += '{';
          cur += 2;
          continue;
        }
        if (textAcc.length > 0) {
          parts.push({
            type: 'Literal',
            value: textAcc,
            litType: 'string',
            line,
            col,
          });
          textAcc = '';
        }
        cur++; // skip '{'
        let exprStr = '';
        let depth = 1;
        while (cur < len && depth > 0) {
          if (raw[cur] === '{') depth++;
          else if (raw[cur] === '}') {
            depth--;
            if (depth === 0) {
              cur++;
              break;
            }
          }
          exprStr += raw[cur];
          cur++;
        }
        if (exprStr.trim().length > 0) {
          try {
            const subTokens = new Lexer(exprStr).tokenize();
            const subParser = new Parser(subTokens);
            const parsedExpr = subParser.parseExpression();
            parts.push(parsedExpr);
          } catch {
            parts.push({
              type: 'Literal',
              value: '{' + exprStr + '}',
              litType: 'string',
              line,
              col,
            });
          }
        }
        continue;
      } else if (raw[cur] === '}') {
        if (cur + 1 < len && raw[cur + 1] === '}') {
          textAcc += '}';
          cur += 2;
          continue;
        }
        textAcc += raw[cur];
        cur++;
      } else {
        textAcc += raw[cur];
        cur++;
      }
    }

    if (textAcc.length > 0 || parts.length === 0) {
      parts.push({
        type: 'Literal',
        value: textAcc,
        litType: 'string',
        line,
        col,
      });
    }

    return {
      type: 'InterpolatedString',
      parts,
      line,
      col,
    };
  }
}
