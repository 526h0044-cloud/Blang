import { Token, TokenType } from './types';

const KEYWORDS: Record<string, TokenType> = {
  print: 'print',
  if: 'if',
  elseif: 'elseif',
  else: 'else',
  for: 'for',
  while: 'while',
  function: 'function',
  end: 'end',
  return: 'return',
  and: 'and',
  or: 'or',
  not: 'not',
  true: 'true',
  false: 'false',
  break: 'break',
  continue: 'continue',
  input: 'input',
  len: 'len',
  type: 'type',
  import: 'import',
  let: 'let',
  in: 'in',
  null: 'NULL',
};

export class Lexer {
  private source: string;
  private pos = 0;
  private line = 1;
  private col = 1;
  private length: number;

  constructor(source: string) {
    this.source = source;
    this.length = source.length;
  }

  private currentChar(): string | null {
    if (this.pos >= this.length) return null;
    return this.source[this.pos];
  }

  private peekChar(offset = 1): string | null {
    const target = this.pos + offset;
    if (target >= this.length) return null;
    return this.source[target];
  }

  private advance(): string | null {
    const ch = this.currentChar();
    this.pos++;
    if (ch === '\n') {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return ch;
  }

  private skipWhitespaceAndComments() {
    while (this.pos < this.length) {
      const ch = this.currentChar();
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        this.advance();
        continue;
      }
      if (ch === '#') {
        while (this.pos < this.length && this.currentChar() !== '\n') {
          this.advance();
        }
        continue;
      }
      if (ch === '/' && this.peekChar() === '/') {
        while (this.pos < this.length && this.currentChar() !== '\n') {
          this.advance();
        }
        continue;
      }
      if (ch === '/' && this.peekChar() === '*') {
        const startL = this.line;
        const startC = this.col;
        this.advance();
        this.advance();
        let closed = false;
        while (this.pos < this.length) {
          if (this.currentChar() === '*' && this.peekChar() === '/') {
            this.advance();
            this.advance();
            closed = true;
            break;
          }
          this.advance();
        }
        if (!closed) {
          throw { stage: 'lexer', message: 'Unterminated multi-line comment', line: startL, col: startC };
        }
        continue;
      }
      break;
    }
  }

  private readIdentifierOrKeyword(): Token {
    const startLine = this.line;
    const startCol = this.col;
    let name = '';

    while (this.pos < this.length) {
      const ch = this.currentChar();
      if (ch && (/[a-zA-Z0-9]/.test(ch) || ch === '_' || ch === '@' || ch === '$')) {
        name += this.advance();
      } else {
        break;
      }
    }

    const kw = KEYWORDS[name];
    if (kw) {
      let val: any = name;
      if (kw === 'true') val = true;
      if (kw === 'false') val = false;
      if (kw === 'NULL') val = null;
      return { type: kw, value: val, line: startLine, col: startCol };
    }

    return { type: 'IDENTIFIER', value: name, line: startLine, col: startCol };
  }

  private readNumber(): Token {
    const startLine = this.line;
    const startCol = this.col;
    let numStr = '';
    let isFloat = false;

    while (this.pos < this.length) {
      const ch = this.currentChar();
      if (ch && /[0-9]/.test(ch)) {
        numStr += this.advance();
      } else if (ch === '.' && !isFloat && this.peekChar() && /[0-9]/.test(this.peekChar()!)) {
        isFloat = true;
        numStr += this.advance();
      } else {
        break;
      }
    }

    const val = isFloat ? parseFloat(numStr) : parseInt(numStr, 10);
    return { type: 'NUMBER', value: val, line: startLine, col: startCol };
  }

  private readString(quote: string): Token {
    const startLine = this.line;
    const startCol = this.col;
    this.advance(); // consume opening quote

    let str = '';
    while (this.pos < this.length) {
      const ch = this.currentChar();
      if (ch === quote) {
        this.advance();
        return { type: 'STRING', value: str, line: startLine, col: startCol };
      }
      if (ch === '\\') {
        this.advance();
        const esc = this.currentChar();
        if (esc === 'n') str += '\n';
        else if (esc === 't') str += '\t';
        else if (esc === 'r') str += '\r';
        else if (esc === '\\') str += '\\';
        else if (esc === '"') str += '"';
        else if (esc === "'") str += "'";
        else str += esc || '';
        this.advance();
      } else if (ch === '\n') {
        str += '\n';
        this.advance();
      } else {
        str += ch;
        this.advance();
      }
    }

    throw {
      stage: 'lexer',
      message: `Unterminated string literal starting at line ${startLine}, col ${startCol}`,
      line: startLine,
      col: startCol,
    };
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.length) break;

      const ch = this.currentChar();
      const line = this.line;
      const col = this.col;

      if (!ch) break;

      if (/[a-zA-Z]/.test(ch) || ch === '_' || ch === '@' || ch === '$') {
        tokens.push(this.readIdentifierOrKeyword());
        continue;
      }

      if (/[0-9]/.test(ch)) {
        tokens.push(this.readNumber());
        continue;
      }

      if (ch === '"' || ch === "'") {
        tokens.push(this.readString(ch));
        continue;
      }

      const next = this.peekChar();
      const two = ch + (next || '');

      if (two === '==') {
        this.advance(); this.advance();
        tokens.push({ type: '==', value: '==', line, col });
        continue;
      }
      if (two === '!=') {
        this.advance(); this.advance();
        tokens.push({ type: '!=', value: '!=', line, col });
        continue;
      }
      if (two === '<=') {
        this.advance(); this.advance();
        tokens.push({ type: '<=', value: '<=', line, col });
        continue;
      }
      if (two === '>=') {
        this.advance(); this.advance();
        tokens.push({ type: '>=', value: '>=', line, col });
        continue;
      }
      if (two === '+=') {
        this.advance(); this.advance();
        tokens.push({ type: '+=', value: '+=', line, col });
        continue;
      }
      if (two === '-=') {
        this.advance(); this.advance();
        tokens.push({ type: '-=', value: '-=', line, col });
        continue;
      }

      const singleOps: Record<string, TokenType> = {
        '+': '+',
        '-': '-',
        '*': '*',
        '/': '/',
        '%': '%',
        '=': '=',
        '<': '<',
        '>': '>',
        '{': '{',
        '}': '}',
        '(': '(',
        ')': ')',
        '[': '[',
        ']': ']',
        ',': ',',
        ';': ';',
        ':': ':',
        '.': '.',
      };

      if (singleOps[ch]) {
        this.advance();
        tokens.push({ type: singleOps[ch], value: ch, line, col });
        continue;
      }

      throw { stage: 'lexer', message: `Unexpected character '${ch}'`, line, col };
    }

    tokens.push({ type: 'EOF', value: null, line: this.line, col: this.col });
    return tokens;
  }
}
