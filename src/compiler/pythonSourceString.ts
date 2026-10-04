export const PYTHON_COMPILER_SOURCE = `#!/usr/bin/env python3
"""
================================================================================
BLang: Production-Grade Multi-Pass Transpiler, Execution Engine & REPL Shell
================================================================================
Architecture:
  - Layer 1: Lexer & Tokenizer (Accurate Line/Column tracking)
  - Layer 2: Parser & AST (Recursive descent, precedence climbing, {} blocks)
  - Layer 3: Semantic Analyzer & Strict Type Safety (Lexical Scoping & Strict Type System)
  - Layer 4: AST Optimizer (Constant Folding Pass)
  - Layer 5: Dual-Target Code Generator (Python 3.x -> output.py, JavaScript ES6+ -> output.js)
  - Layer 6: Tree-Walk Interpreter & Interactive REPL Shell

Author: Principal Compiler Engineer
Language: BLang (Curly-brace multi-paradigm language)
================================================================================
"""

import sys
import os
import re
import math
if sys.platform != "win32":
    try:
        import readline
    except ImportError:
        pass
from dataclasses import dataclass, field
from typing import Any, List, Dict, Optional, Tuple, Set, Union


# ==============================================================================
# DIAGNOSTIC EXCEPTIONS & ERROR REPORTING
# ==============================================================================

class BLangError(Exception):
    """Base class for all BLang compiler and runtime diagnostics."""
    def __init__(self, message: str, line: Optional[int] = None, col: Optional[int] = None, source: Optional[str] = None):
        self.message = message
        self.line = line
        self.col = col
        self.source = source
        super().__init__(self.format_error())

    def format_error(self) -> str:
        loc = f"line {self.line}, column {self.col}" if self.line is not None and self.col is not None else "unknown location"
        header = f"[{self.__class__.__name__}] at {loc}: {self.message}"
        if self.source and self.line is not None and self.col is not None:
            lines = self.source.splitlines()
            if 0 <= self.line - 1 < len(lines):
                src_line = lines[self.line - 1]
                pointer = " " * max(0, self.col - 1) + "^"
                return f"\\n{header}\\n    {src_line}\\n    {pointer}\\n"
        return header


class BLangLexerError(BLangError):
    pass

class BLangParseError(BLangError):
    pass

class BLangSemanticError(BLangError):
    pass

class BLangTypeError(BLangSemanticError):
    """Raised when an illegal type operation occurs, especially String and Number arithmetic."""
    pass

class BLangRuntimeError(BLangError):
    pass

class ReturnValue(Exception):
    """Control flow exception to propagate function returns."""
    def __init__(self, value: Any):
        self.value = value

class BreakLoop(Exception):
    """Control flow exception for break statements."""
    pass

class ContinueLoop(Exception):
    """Control flow exception for continue statements."""
    pass


# ==============================================================================
# TẦNG 1: LEXER & TOKENIZER (BÓC TÁCH TỪ VỰNG CHÍNH XÁC CAO)
# ==============================================================================

class TokenType:
    EOF         = "EOF"
    NEWLINE     = "NEWLINE"

    IDENTIFIER  = "IDENTIFIER"
    NUMBER      = "NUMBER"
    STRING      = "STRING"
    BOOLEAN     = "BOOLEAN"
    NULL        = "NULL"

    PRINT       = "print"
    IF          = "if"
    ELSEIF      = "elseif"
    ELSE        = "else"
    FOR         = "for"
    WHILE       = "while"
    FUNCTION    = "function"
    END         = "end"
    RETURN      = "return"
    AND         = "and"
    OR          = "or"
    NOT         = "not"
    TRUE        = "true"
    FALSE       = "false"
    BREAK       = "break"
    CONTINUE    = "continue"
    INPUT       = "input"
    LEN         = "len"
    TYPE        = "type"
    IMPORT      = "import"

    LET         = "let"
    IN          = "in"

    PLUS        = "+"
    MINUS       = "-"
    STAR        = "*"
    SLASH       = "/"
    PERCENT     = "%"
    ASSIGN      = "="
    PLUS_ASSIGN = "+="
    MINUS_ASSIGN= "-="
    EQ          = "=="
    NEQ         = "!="
    LT          = "<"
    LTE         = "<="
    GT          = ">"
    GTE         = ">="

    LBRACE      = "{"
    RBRACE      = "}"
    LPAREN      = "("
    RPAREN      = ")"
    LBRACKET    = "["
    RBRACKET    = "]"
    COMMA       = ","
    SEMICOLON   = ";"
    COLON       = ":"
    DOT         = "."


KEYWORDS: Dict[str, str] = {
    "print":    TokenType.PRINT,
    "if":       TokenType.IF,
    "elseif":   TokenType.ELSEIF,
    "else":     TokenType.ELSE,
    "for":      TokenType.FOR,
    "while":    TokenType.WHILE,
    "function": TokenType.FUNCTION,
    "end":      TokenType.END,
    "return":   TokenType.RETURN,
    "and":      TokenType.AND,
    "or":       TokenType.OR,
    "not":      TokenType.NOT,
    "true":     TokenType.TRUE,
    "false":    TokenType.FALSE,
    "break":    TokenType.BREAK,
    "continue": TokenType.CONTINUE,
    "input":    TokenType.INPUT,
    "len":      TokenType.LEN,
    "type":     TokenType.TYPE,
    "import":   TokenType.IMPORT,
    "let":      TokenType.LET,
    "in":       TokenType.IN,
    "null":     TokenType.NULL,
}


@dataclass
class Token:
    type: str
    value: Any
    line: int
    col: int

    def __repr__(self) -> str:
        return f"Token({self.type}, {repr(self.value)}, line={self.line}, col={self.col})"


class Lexer:
    """
    High-precision Tokenizer tracking exact 1-indexed line and column numbers.
    Supports identifiers with special sigils/characters: letters, digits, _, @, $.
    """
    def __init__(self, source: str):
        self.source = source
        self.pos = 0
        self.line = 1
        self.col = 1
        self.length = len(source)

    def current_char(self) -> Optional[str]:
        if self.pos >= self.length:
            return None
        return self.source[self.pos]

    def peek_char(self, offset: int = 1) -> Optional[str]:
        target = self.pos + offset
        if target >= self.length:
            return None
        return self.source[target]

    def advance(self) -> Optional[str]:
        ch = self.current_char()
        self.pos += 1
        if ch == "\\n":
            self.line += 1
            self.col = 1
        else:
            self.col += 1
        return ch

    def skip_whitespace_and_comments(self):
        while self.pos < self.length:
            ch = self.current_char()
            if ch in (" ", "\\t", "\\r", "\\n"):
                self.advance()
                continue
            if ch == "#":
                while self.pos < self.length and self.current_char() != "\\n":
                    self.advance()
                continue
            if ch == "/" and self.peek_char() == "/":
                while self.pos < self.length and self.current_char() != "\\n":
                    self.advance()
                continue
            if ch == "/" and self.peek_char() == "*":
                start_l, start_c = self.line, self.col
                self.advance()
                self.advance()
                closed = False
                while self.pos < self.length:
                    if self.current_char() == "*" and self.peek_char() == "/":
                        self.advance()
                        self.advance()
                        closed = True
                        break
                    self.advance()
                if not closed:
                    raise BLangLexerError("Unterminated multi-line comment", start_l, start_c, self.source)
                continue
            break

    def read_identifier_or_keyword(self) -> Token:
        start_line = self.line
        start_col = self.col
        chars = []

        while self.pos < self.length:
            ch = self.current_char()
            if ch is not None and (ch.isalnum() or ch in ("_", "@", "$")):
                chars.append(self.advance())
            else:
                break

        name = "".join(chars)
        tok_type = KEYWORDS.get(name, TokenType.IDENTIFIER)
        value = name

        if tok_type == TokenType.TRUE:
            value = True
        elif tok_type == TokenType.FALSE:
            value = False
        elif tok_type == TokenType.NULL:
            value = None

        return Token(tok_type, value, start_line, start_col)

    def read_number(self) -> Token:
        start_line = self.line
        start_col = self.col
        num_str = []
        is_float = False

        while self.pos < self.length:
            ch = self.current_char()
            if ch is not None and ch.isdigit():
                num_str.append(self.advance())
            elif ch == "." and not is_float and (self.peek_char() and self.peek_char().isdigit()):
                is_float = True
                num_str.append(self.advance())
            else:
                break

        raw = "".join(num_str)
        val = float(raw) if is_float else int(raw)
        return Token(TokenType.NUMBER, val, start_line, start_col)

    def read_string(self, quote: str) -> Token:
        start_line = self.line
        start_col = self.col
        self.advance()

        chars = []
        while self.pos < self.length:
            ch = self.current_char()
            if ch == quote:
                self.advance()
                return Token(TokenType.STRING, "".join(chars), start_line, start_col)
            elif ch == "\\\\":
                self.advance()
                esc = self.current_char()
                if esc == "n": chars.append("\\n")
                elif esc == "t": chars.append("\\t")
                elif esc == "r": chars.append("\\r")
                elif esc == "\\\\": chars.append("\\\\")
                elif esc == '"': chars.append('"')
                elif esc == "'": chars.append("'")
                else: chars.append(esc or "")
                self.advance()
            elif ch == "\\n":
                chars.append("\\n")
                self.advance()
            else:
                chars.append(ch)
                self.advance()

        raise BLangLexerError(f"Unterminated string literal starting at line {start_line}, col {start_col}", start_line, start_col, self.source)

    def tokenize(self) -> List[Token]:
        tokens: List[Token] = []
        while self.pos < self.length:
            self.skip_whitespace_and_comments()
            if self.pos >= self.length: break

            ch = self.current_char()
            line = self.line
            col = self.col

            if ch.isalpha() or ch in ("_", "@", "$"):
                tokens.append(self.read_identifier_or_keyword())
                continue
            if ch.isdigit():
                tokens.append(self.read_number())
                continue
            if ch in ('"', "'"):
                tokens.append(self.read_string(ch))
                continue

            next_ch = self.peek_char()
            two_ch = ch + (next_ch or "")
            if two_ch in ("==", "!=", "<=", ">=", "+=", "-="):
                self.advance(); self.advance()
                tokens.append(Token(two_ch, two_ch, line, col))
                continue

            single_tokens = {
                "+": TokenType.PLUS, "-": TokenType.MINUS, "*": TokenType.STAR, "/": TokenType.SLASH, "%": TokenType.PERCENT,
                "=": TokenType.ASSIGN, "<": TokenType.LT, ">": TokenType.GT,
                "{": TokenType.LBRACE, "}": TokenType.RBRACE, "(": TokenType.LPAREN, ")": TokenType.RPAREN,
                "[": TokenType.LBRACKET, "]": TokenType.RBRACKET, ",": TokenType.COMMA, ";": TokenType.SEMICOLON,
                ":": TokenType.COLON, ".": TokenType.DOT,
            }
            if ch in single_tokens:
                self.advance()
                tokens.append(Token(single_tokens[ch], ch, line, col))
                continue

            raise BLangLexerError(f"Unexpected character '{ch}'", line, col, self.source)

        tokens.append(Token(TokenType.EOF, None, self.line, self.col))
        return tokens
`;
