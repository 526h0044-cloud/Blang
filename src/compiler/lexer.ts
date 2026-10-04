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
  try: 'try',
  catch: 'catch',
  throw: 'throw',
  and: 'and',
  or: 'or',
  not: 'not',
  true: 'true',
  True: 'true',
  false: 'false',
  False: 'false',
  break: 'break',
  continue: 'continue',
  input: 'input',
  len: 'len',
  type: 'type',
  import: 'import',
  let: 'let',
  in: 'in',
  null: 'NULL',
  None: 'NULL',
  none: 'NULL',
};

// Pre-allocated ASCII operator lookup table for single-char tokens (index = charCode)
const SINGLE_OPS_TABLE: Array<TokenType | undefined> = new Array(128);
SINGLE_OPS_TABLE[43] = '+';
SINGLE_OPS_TABLE[45] = '-';
SINGLE_OPS_TABLE[42] = '*';
SINGLE_OPS_TABLE[47] = '/';
SINGLE_OPS_TABLE[37] = '%';
SINGLE_OPS_TABLE[61] = '=';
SINGLE_OPS_TABLE[60] = '<';
SINGLE_OPS_TABLE[62] = '>';
SINGLE_OPS_TABLE[123] = '{';
SINGLE_OPS_TABLE[125] = '}';
SINGLE_OPS_TABLE[40] = '(';
SINGLE_OPS_TABLE[41] = ')';
SINGLE_OPS_TABLE[91] = '[';
SINGLE_OPS_TABLE[93] = ']';
SINGLE_OPS_TABLE[44] = ',';
SINGLE_OPS_TABLE[59] = ';';
SINGLE_OPS_TABLE[58] = ':';
SINGLE_OPS_TABLE[46] = '.';

function isDigitCode(code: number): boolean {
  return code >= 48 && code <= 57;
}

function isAlphaCode(code: number): boolean {
  return (
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 || // _
    code === 64 || // @
    code === 36    // $
  );
}

function isAlphaNumCode(code: number): boolean {
  return isAlphaCode(code) || (code >= 48 && code <= 57);
}

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

  private advance(): void {
    const code = this.source.charCodeAt(this.pos);
    this.pos++;
    if (code === 10) { // \n
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.length) {
      const code = this.source.charCodeAt(this.pos);
      if (code === 32 || code === 9 || code === 13 || code === 10) {
        if (code === 10) {
          this.line++;
          this.col = 1;
        } else {
          this.col++;
        }
        this.pos++;
        continue;
      }
      if (code === 35) { // # comment
        while (this.pos < this.length && this.source.charCodeAt(this.pos) !== 10) {
          this.pos++;
          this.col++;
        }
        continue;
      }
      if (code === 47) { // /
        const nextCode = this.source.charCodeAt(this.pos + 1);
        if (nextCode === 47) { // // comment
          while (this.pos < this.length && this.source.charCodeAt(this.pos) !== 10) {
            this.pos++;
            this.col++;
          }
          continue;
        }
        if (nextCode === 42) { // /* comment */
          const startL = this.line;
          const startC = this.col;
          this.pos += 2;
          this.col += 2;
          let closed = false;
          while (this.pos < this.length) {
            if (this.source.charCodeAt(this.pos) === 42 && this.source.charCodeAt(this.pos + 1) === 47) {
              this.pos += 2;
              this.col += 2;
              closed = true;
              break;
            }
            if (this.source.charCodeAt(this.pos) === 10) {
              this.line++;
              this.col = 1;
            } else {
              this.col++;
            }
            this.pos++;
          }
          if (!closed) {
            throw { stage: 'lexer', message: 'Unterminated multi-line comment', line: startL, col: startC };
          }
          continue;
        }
      }
      break;
    }
  }

  private readIdentifierOrKeyword(): Token {
    const startLine = this.line;
    const startCol = this.col;
    const startPos = this.pos;

    while (this.pos < this.length) {
      const code = this.source.charCodeAt(this.pos);
      if (isAlphaNumCode(code)) {
        this.pos++;
        this.col++;
      } else {
        break;
      }
    }

    const name = this.source.slice(startPos, this.pos);
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
    const startPos = this.pos;
    let isFloat = false;

    while (this.pos < this.length) {
      const code = this.source.charCodeAt(this.pos);
      if (isDigitCode(code)) {
        this.pos++;
        this.col++;
      } else if (code === 46 && !isFloat && isDigitCode(this.source.charCodeAt(this.pos + 1))) {
        isFloat = true;
        this.pos++;
        this.col++;
      } else {
        break;
      }
    }

    const numStr = this.source.slice(startPos, this.pos);
    const val = isFloat ? parseFloat(numStr) : parseInt(numStr, 10);
    return { type: 'NUMBER', value: val, line: startLine, col: startCol };
  }

  private readString(quoteCode: number): Token {
    const startLine = this.line;
    const startCol = this.col;
    this.advance(); // consume opening quote
    const contentStart = this.pos;

    // Check fast-path: scan until closing quote without backslash
    let hasEscape = false;
    let scanPos = this.pos;
    while (scanPos < this.length) {
      const c = this.source.charCodeAt(scanPos);
      if (c === 92) { // \
        hasEscape = true;
        break;
      }
      if (c === quoteCode) {
        break;
      }
      if (c === 10) { // \n
        break;
      }
      scanPos++;
    }

    if (!hasEscape && scanPos < this.length && this.source.charCodeAt(scanPos) === quoteCode) {
      // Fast path: direct slice! Zero allocation for characters
      const strVal = this.source.slice(contentStart, scanPos);
      const spanLen = scanPos - contentStart;
      this.col += spanLen;
      this.pos = scanPos;
      this.advance(); // consume closing quote
      return { type: 'STRING', value: strVal, line: startLine, col: startCol };
    }

    // Slow path with escape sequences
    let str = '';
    while (this.pos < this.length) {
      const c = this.source.charCodeAt(this.pos);
      if (c === quoteCode) {
        this.advance();
        return { type: 'STRING', value: str, line: startLine, col: startCol };
      }
      if (c === 92) { // \
        this.advance();
        const escChar = this.source[this.pos];
        if (escChar === 'n') str += '\n';
        else if (escChar === 't') str += '\t';
        else if (escChar === 'r') str += '\r';
        else if (escChar === '\\') str += '\\';
        else if (escChar === '"') str += '"';
        else if (escChar === "'") str += "'";
        else str += escChar || '';
        this.advance();
      } else if (c === 10) {
        str += '\n';
        this.advance();
      } else {
        str += this.source[this.pos];
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
    const src = this.source;
    const len = this.length;

    while (this.pos < len) {
      this.skipWhitespaceAndComments();
      if (this.pos >= len) break;

      const code = src.charCodeAt(this.pos);
      const line = this.line;
      const col = this.col;

      // Identifiers / keywords: A-Z, a-z, _, @, $
      if (isAlphaCode(code)) {
        tokens.push(this.readIdentifierOrKeyword());
        continue;
      }

      // Numbers: 0-9
      if (isDigitCode(code)) {
        tokens.push(this.readNumber());
        continue;
      }

      // String literals: " or '
      if (code === 34 || code === 39) {
        tokens.push(this.readString(code));
        continue;
      }

      // Two-character operators
      if (this.pos + 1 < len) {
        const nextCode = src.charCodeAt(this.pos + 1);

        if (code === 61 && nextCode === 61) { // ==
          this.pos += 2; this.col += 2;
          tokens.push({ type: '==', value: '==', line, col });
          continue;
        }
        if (code === 33 && nextCode === 61) { // !=
          this.pos += 2; this.col += 2;
          tokens.push({ type: '!=', value: '!=', line, col });
          continue;
        }
        if (code === 60 && nextCode === 61) { // <=
          this.pos += 2; this.col += 2;
          tokens.push({ type: '<=', value: '<=', line, col });
          continue;
        }
        if (code === 62 && nextCode === 61) { // >=
          this.pos += 2; this.col += 2;
          tokens.push({ type: '>=', value: '>=', line, col });
          continue;
        }
        if (code === 43 && nextCode === 61) { // +=
          this.pos += 2; this.col += 2;
          tokens.push({ type: '+=', value: '+=', line, col });
          continue;
        }
        if (code === 45 && nextCode === 61) { // -=
          this.pos += 2; this.col += 2;
          tokens.push({ type: '-=', value: '-=', line, col });
          continue;
        }
        if (code === 42 && nextCode === 61) { // *=
          this.pos += 2; this.col += 2;
          tokens.push({ type: '*=', value: '*=', line, col });
          continue;
        }
        if (code === 47 && nextCode === 61) { // /=
          this.pos += 2; this.col += 2;
          tokens.push({ type: '/=', value: '/=', line, col });
          continue;
        }
        if (code === 37 && nextCode === 61) { // %=
          this.pos += 2; this.col += 2;
          tokens.push({ type: '%=', value: '%=', line, col });
          continue;
        }
        if (code === 63 && nextCode === 63) { // ??
          this.pos += 2; this.col += 2;
          tokens.push({ type: '??', value: '??', line, col });
          continue;
        }
      }

      // Macro %random
      if (code === 37 && src.slice(this.pos, this.pos + 7) === '%random') {
        this.pos += 7;
        this.col += 7;
        tokens.push({ type: 'RANDOM_MACRO', value: '%random', line, col });
        continue;
      }

      // Single-character operators via fast ASCII table lookup
      if (code < 128) {
        const op = SINGLE_OPS_TABLE[code];
        if (op) {
          this.pos++;
          this.col++;
          tokens.push({ type: op, value: op, line, col });
          continue;
        }
      }

      const ch = src[this.pos];
      throw { stage: 'lexer', message: `Unexpected character '${ch}'`, line, col };
    }

    tokens.push({ type: 'EOF', value: null, line: this.line, col: this.col });
    return tokens;
  }
}

