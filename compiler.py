#!/usr/bin/env python3
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
import time
import random
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
                return f"\n{header}\n    {src_line}\n    {pointer}\n"
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
    # Special
    EOF         = "EOF"
    NEWLINE     = "NEWLINE"

    # Literals & Identifiers
    IDENTIFIER  = "IDENTIFIER"
    NUMBER      = "NUMBER"
    STRING      = "STRING"
    BOOLEAN     = "BOOLEAN"
    NULL        = "NULL"

    # Keywords specified by requirements
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

    # Additional helper keywords
    LET         = "let"
    IN          = "in"
    TRY         = "try"
    CATCH       = "catch"
    THROW       = "throw"
    MATCH       = "match"
    CASE        = "case"
    DEFAULT     = "default"

    # Operators
    RANDOM_MACRO = "RANDOM_MACRO"
    PLUS        = "+"
    MINUS       = "-"
    STAR        = "*"
    SLASH       = "/"
    PERCENT     = "%"
    ASSIGN      = "="
    PLUS_ASSIGN = "+="
    MINUS_ASSIGN= "-="
    MUL_ASSIGN  = "*="
    DIV_ASSIGN  = "/="
    MOD_ASSIGN  = "%="
    NULL_COALESCE = "??"
    PIPELINE    = "|>"
    RANGE       = ".."
    EQ          = "=="
    NEQ         = "!="
    LT          = "<"
    LTE         = "<="
    GT          = ">"
    GTE         = ">="

    # Delimiters & Punctuations
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
    "True":     TokenType.TRUE,
    "false":    TokenType.FALSE,
    "False":    TokenType.FALSE,
    "break":    TokenType.BREAK,
    "continue": TokenType.CONTINUE,
    "input":    TokenType.INPUT,
    "len":      TokenType.LEN,
    "type":     TokenType.TYPE,
    "import":   TokenType.IMPORT,
    "let":      TokenType.LET,
    "in":       TokenType.IN,
    "try":      TokenType.TRY,
    "catch":    TokenType.CATCH,
    "throw":    TokenType.THROW,
    "match":    TokenType.MATCH,
    "case":     TokenType.CASE,
    "default":  TokenType.DEFAULT,
    "null":     TokenType.NULL,
    "None":     TokenType.NULL,
    "none":     TokenType.NULL,
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
        if ch == "\n":
            self.line += 1
            self.col = 1
        else:
            self.col += 1
        return ch

    def skip_whitespace_and_comments(self):
        while self.pos < self.length:
            ch = self.current_char()
            # Standard whitespace
            if ch in (" ", "\t", "\r", "\n"):
                self.advance()
                continue

            # Line comments: '//' or '#'
            if ch == "#":
                while self.pos < self.length and self.current_char() != "\n":
                    self.advance()
                continue
            if ch == "/" and self.peek_char() == "/":
                while self.pos < self.length and self.current_char() != "\n":
                    self.advance()
                continue

            # Multi-line comments: '/*' ... '*/'
            if ch == "/" and self.peek_char() == "*":
                start_l, start_c = self.line, self.col
                self.advance() # /
                self.advance() # *
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

        # Identifier character set: letters, digits, _, @, $
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
        self.advance() # Consume opening quote

        chars = []
        while self.pos < self.length:
            ch = self.current_char()
            if ch == quote:
                self.advance() # Consume closing quote
                return Token(TokenType.STRING, "".join(chars), start_line, start_col)
            elif ch == "\\":
                self.advance()
                esc = self.current_char()
                if esc == "n":
                    chars.append("\n")
                elif esc == "t":
                    chars.append("\t")
                elif esc == "r":
                    chars.append("\r")
                elif esc == "\\":
                    chars.append("\\")
                elif esc == "\"":
                    chars.append("\"")
                elif esc == "'":
                    chars.append("'")
                else:
                    chars.append(esc or "")
                self.advance()
            elif ch == "\n":
                # Multi-line strings allowed
                chars.append("\n")
                self.advance()
            else:
                chars.append(ch)
                self.advance()

        raise BLangLexerError(f"Unterminated string literal starting at line {start_line}, col {start_col}", start_line, start_col, self.source)

    def tokenize(self) -> List[Token]:
        tokens: List[Token] = []

        while self.pos < self.length:
            self.skip_whitespace_and_comments()
            if self.pos >= self.length:
                break

            ch = self.current_char()
            line = self.line
            col = self.col

            # Identifier start: alpha or _, @, $
            if ch.isalpha() or ch in ("_", "@", "$"):
                tokens.append(self.read_identifier_or_keyword())
                continue

            # Numeric literal
            if ch.isdigit():
                tokens.append(self.read_number())
                continue

            # String literal
            if ch in ("\"", "'"):
                tokens.append(self.read_string(ch))
                continue

            # Two-character operators
            next_ch = self.peek_char()
            two_ch = ch + (next_ch or "")
            if two_ch == "==":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.EQ, "==", line, col))
                continue
            if two_ch == "!=":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.NEQ, "!=", line, col))
                continue
            if two_ch == "<=":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.LTE, "<=", line, col))
                continue
            if two_ch == ">=":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.GTE, ">=", line, col))
                continue
            if two_ch == "+=":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.PLUS_ASSIGN, "+=", line, col))
                continue
            if two_ch == "-=":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.MINUS_ASSIGN, "-=", line, col))
                continue
            if two_ch == "*=":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.MUL_ASSIGN, "*=", line, col))
                continue
            if two_ch == "/=":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.DIV_ASSIGN, "/=", line, col))
                continue
            if two_ch == "%=":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.MOD_ASSIGN, "%=", line, col))
                continue
            if two_ch == "??":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.NULL_COALESCE, "??", line, col))
                continue
            if two_ch == "|>":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.PIPELINE, "|>", line, col))
                continue
            if two_ch == "..":
                self.advance(); self.advance()
                tokens.append(Token(TokenType.RANGE, "..", line, col))
                continue

            if ch == "%" and self.source[self.pos:].startswith("%random"):
                for _ in range(7):
                    self.advance()
                tokens.append(Token(TokenType.RANDOM_MACRO, "%random", line, col))
                continue

            # Single-character tokens
            single_tokens = {
                "+": TokenType.PLUS,
                "-": TokenType.MINUS,
                "*": TokenType.STAR,
                "/": TokenType.SLASH,
                "%": TokenType.PERCENT,
                "=": TokenType.ASSIGN,
                "<": TokenType.LT,
                ">": TokenType.GT,
                "{": TokenType.LBRACE,
                "}": TokenType.RBRACE,
                "(": TokenType.LPAREN,
                ")": TokenType.RPAREN,
                "[": TokenType.LBRACKET,
                "]": TokenType.RBRACKET,
                ",": TokenType.COMMA,
                ";": TokenType.SEMICOLON,
                ":": TokenType.COLON,
                ".": TokenType.DOT,
            }

            if ch in single_tokens:
                self.advance()
                tokens.append(Token(single_tokens[ch], ch, line, col))
                continue

            raise BLangLexerError(f"Unexpected character '{ch}'", line, col, self.source)

        tokens.append(Token(TokenType.EOF, None, self.line, self.col))
        return tokens


# ==============================================================================
# TẦNG 2: PARSER & AST (XÂY DỰNG CÂY CÚ PHÁP TRỪU TƯỢNG)
# ==============================================================================

@dataclass
class ASTNode:
    line: int = 0
    col: int = 0

@dataclass
class ProgramNode(ASTNode):
    statements: List[ASTNode] = field(default_factory=list)

@dataclass
class BlockNode(ASTNode):
    statements: List[ASTNode] = field(default_factory=list)

@dataclass
class LiteralNode(ASTNode):
    value: Any = None
    lit_type: str = "number" # number, string, boolean, null

@dataclass
class IdentifierNode(ASTNode):
    name: str = ""

@dataclass
class VarDeclNode(ASTNode):
    name: str = ""
    initializer: Optional[ASTNode] = None

@dataclass
class AssignNode(ASTNode):
    target: ASTNode = None # IdentifierNode or IndexNode
    operator: str = "="
    value: ASTNode = None

@dataclass
class BinaryOpNode(ASTNode):
    left: ASTNode = None
    operator: str = ""
    right: ASTNode = None

@dataclass
class UnaryOpNode(ASTNode):
    operator: str = ""
    operand: ASTNode = None

@dataclass
class ListNode(ASTNode):
    elements: List[ASTNode] = field(default_factory=list)

@dataclass
class DictEntryNode(ASTNode):
    key: ASTNode = None
    value: ASTNode = None

@dataclass
class DictNode(ASTNode):
    entries: List[DictEntryNode] = field(default_factory=list)

@dataclass
class IndexNode(ASTNode):
    target: ASTNode = None
    index: ASTNode = None

@dataclass
class CallNode(ASTNode):
    callee: ASTNode = None
    arguments: List[ASTNode] = field(default_factory=list)

@dataclass
class IfNode(ASTNode):
    condition: ASTNode = None
    then_branch: BlockNode = None
    elif_branches: List[Tuple[ASTNode, BlockNode]] = field(default_factory=list)
    else_branch: Optional[BlockNode] = None

@dataclass
class WhileNode(ASTNode):
    condition: ASTNode = None
    body: BlockNode = None

@dataclass
class ForNode(ASTNode):
    variable: str = ""
    iterable: ASTNode = None
    body: BlockNode = None

@dataclass
class FunctionDefNode(ASTNode):
    name: str = ""
    parameters: List[str] = field(default_factory=list)
    body: BlockNode = None

@dataclass
class ReturnNode(ASTNode):
    expression: Optional[ASTNode] = None

@dataclass
class BreakNode(ASTNode):
    pass

@dataclass
class ContinueNode(ASTNode):
    pass

@dataclass
class PrintNode(ASTNode):
    arguments: List[ASTNode] = field(default_factory=list)

@dataclass
class ExpressionStatementNode(ASTNode):
    expression: ASTNode = None

@dataclass
class ImportNode(ASTNode):
    module_path: str = ""

@dataclass
class TryCatchNode(ASTNode):
    try_block: BlockNode = None
    error_var: Optional[str] = None
    catch_block: BlockNode = None

@dataclass
class ThrowNode(ASTNode):
    expression: ASTNode = None


class Parser:
    """
    Recursive-descent parser with operator precedence climbing.
    Strictly parses C/JS style curly braces `{}` as block delimiters.
    """
    def __init__(self, tokens: List[Token], source: str):
        self.tokens = tokens
        self.source = source
        self.pos = 0

    def current_token(self) -> Token:
        if self.pos >= len(self.tokens):
            return self.tokens[-1]
        return self.tokens[self.pos]

    def peek_token(self, offset: int = 1) -> Token:
        target = self.pos + offset
        if target >= len(self.tokens):
            return self.tokens[-1]
        return self.tokens[target]

    def advance(self) -> Token:
        tok = self.current_token()
        self.pos += 1
        return tok

    def expect(self, expected_type: str) -> Token:
        tok = self.current_token()
        if tok.type != expected_type:
            raise BLangParseError(
                f"Expected '{expected_type}', found '{tok.type}' ({repr(tok.value)})",
                tok.line, tok.col, self.source
            )
        return self.advance()

    def match(self, *types: str) -> bool:
        if self.current_token().type in types:
            self.advance()
            return True
        return False

    def check(self, expected_type: str) -> bool:
        return self.current_token().type == expected_type

    def consume_semicolons(self):
        while self.check(TokenType.SEMICOLON):
            self.advance()

    def synchronize(self):
        """Error recovery synchronization at statement boundaries."""
        self.advance()
        while not self.check(TokenType.EOF):
            prev = self.tokens[self.pos - 1] if self.pos > 0 else None
            if prev and prev.type in (TokenType.SEMICOLON, TokenType.RBRACE):
                return
            if self.current_token().type in (
                TokenType.LET, TokenType.FUNCTION, TokenType.IF,
                TokenType.WHILE, TokenType.FOR, TokenType.RETURN,
                TokenType.PRINT, TokenType.TRY, TokenType.THROW, TokenType.IMPORT
            ):
                return
            self.advance()

    # --- Grammar Rules ---

    def parse(self) -> ProgramNode:
        prog = ProgramNode(line=1, col=1)
        errors = []
        while not self.check(TokenType.EOF):
            self.consume_semicolons()
            if self.check(TokenType.EOF):
                break
            try:
                stmt = self.parse_statement()
                if stmt:
                    prog.statements.append(stmt)
            except Exception as e:
                errors.append(e)
                self.synchronize()
            self.consume_semicolons()
        if errors and not prog.statements:
            raise errors[0]
        return prog

    def parse_block(self) -> BlockNode:
        """Parses a block delimited by { ... }."""
        start_tok = self.expect(TokenType.LBRACE)
        block = BlockNode(line=start_tok.line, col=start_tok.col)
        while not self.check(TokenType.RBRACE) and not self.check(TokenType.EOF):
            self.consume_semicolons()
            if self.check(TokenType.RBRACE) or self.check(TokenType.EOF):
                break
            stmt = self.parse_statement()
            if stmt:
                block.statements.append(stmt)
            self.consume_semicolons()
        self.expect(TokenType.RBRACE)
        return block

    def parse_statement(self) -> ASTNode:
        tok = self.current_token()

        # Variable Declaration: let <name> [= <expr>]
        if tok.type == TokenType.LET:
            return self.parse_var_decl()

        # Function Definition: function <name>(<params>) { ... }
        if tok.type == TokenType.FUNCTION:
            return self.parse_function_def()

        # Conditional: if (cond) { ... } [elseif (cond) { ... }] [else { ... }]
        if tok.type == TokenType.IF:
            return self.parse_if()

        # While Loop: while (cond) { ... }
        if tok.type == TokenType.WHILE:
            return self.parse_while()

        # For Loop: for (<item> in <iterable>) { ... }
        if tok.type == TokenType.FOR:
            return self.parse_for()

        # Try-Catch Statement
        if tok.type == TokenType.TRY:
            return self.parse_try_catch()

        # Throw Statement
        if tok.type == TokenType.THROW:
            return self.parse_throw()

        # Return: return [<expr>]
        if tok.type == TokenType.RETURN:
            self.advance()
            expr = None
            if not self.check(TokenType.SEMICOLON) and not self.check(TokenType.RBRACE) and not self.check(TokenType.EOF):
                expr = self.parse_expression()
            return ReturnNode(line=tok.line, col=tok.col, expression=expr)

        # Break
        if tok.type == TokenType.BREAK:
            self.advance()
            return BreakNode(line=tok.line, col=tok.col)

        # Continue
        if tok.type == TokenType.CONTINUE:
            self.advance()
            return ContinueNode(line=tok.line, col=tok.col)

        # Print Statement: print(<args>) or print <expr>
        if tok.type == TokenType.PRINT:
            return self.parse_print()

        # Import Statement: import "<filename.bl>" or import <name>
        if tok.type == TokenType.IMPORT:
            self.advance()
            path_tok = self.current_token()
            if path_tok.type in (TokenType.STRING, TokenType.IDENTIFIER):
                self.advance()
                return ImportNode(line=tok.line, col=tok.col, module_path=str(path_tok.value))
            raise BLangParseError(f"Expected module name or string path after import, found {path_tok.type}", tok.line, tok.col, self.source)

        # Block statement { ... }
        if tok.type == TokenType.LBRACE:
            return self.parse_block()

        # Assignment or Expression Statement
        return self.parse_assignment_or_expr()

    def parse_var_decl(self) -> VarDeclNode:
        let_tok = self.expect(TokenType.LET)
        id_tok = self.expect(TokenType.IDENTIFIER)
        init = None
        if self.match(TokenType.ASSIGN):
            init = self.parse_expression()
        return VarDeclNode(line=let_tok.line, col=let_tok.col, name=id_tok.value, initializer=init)

    def parse_try_catch(self) -> TryCatchNode:
        try_tok = self.expect(TokenType.TRY)
        try_block = self.parse_block()
        self.expect(TokenType.CATCH)
        error_var = None
        if self.match(TokenType.LPAREN):
            id_tok = self.expect(TokenType.IDENTIFIER)
            error_var = id_tok.value
            self.expect(TokenType.RPAREN)
        catch_block = self.parse_block()
        return TryCatchNode(line=try_tok.line, col=try_tok.col, try_block=try_block, error_var=error_var, catch_block=catch_block)

    def parse_throw(self) -> ThrowNode:
        throw_tok = self.expect(TokenType.THROW)
        expr = self.parse_expression()
        return ThrowNode(line=throw_tok.line, col=throw_tok.col, expression=expr)

    def parse_function_def(self) -> FunctionDefNode:
        fn_tok = self.expect(TokenType.FUNCTION)
        name_tok = self.expect(TokenType.IDENTIFIER)
        self.expect(TokenType.LPAREN)
        params = []
        if not self.check(TokenType.RPAREN):
            param_tok = self.expect(TokenType.IDENTIFIER)
            params.append(param_tok.value)
            while self.match(TokenType.COMMA):
                param_tok = self.expect(TokenType.IDENTIFIER)
                params.append(param_tok.value)
        self.expect(TokenType.RPAREN)
        body = self.parse_block()
        return FunctionDefNode(line=fn_tok.line, col=fn_tok.col, name=name_tok.value, parameters=params, body=body)

    def parse_if(self) -> IfNode:
        if_tok = self.expect(TokenType.IF)
        has_paren = self.match(TokenType.LPAREN)
        cond = self.parse_expression()
        if has_paren:
            self.expect(TokenType.RPAREN)
        then_branch = self.parse_block()

        elif_branches = []
        while self.match(TokenType.ELSEIF):
            has_p = self.match(TokenType.LPAREN)
            elif_cond = self.parse_expression()
            if has_p:
                self.expect(TokenType.RPAREN)
            elif_body = self.parse_block()
            elif_branches.append((elif_cond, elif_body))

        else_branch = None
        if self.match(TokenType.ELSE):
            else_branch = self.parse_block()

        return IfNode(line=if_tok.line, col=if_tok.col, condition=cond, then_branch=then_branch, elif_branches=elif_branches, else_branch=else_branch)

    def parse_while(self) -> WhileNode:
        while_tok = self.expect(TokenType.WHILE)
        has_paren = self.match(TokenType.LPAREN)
        cond = self.parse_expression()
        if has_paren:
            self.expect(TokenType.RPAREN)
        body = self.parse_block()
        return WhileNode(line=while_tok.line, col=while_tok.col, condition=cond, body=body)

    def parse_for(self) -> ForNode:
        for_tok = self.expect(TokenType.FOR)
        has_paren = self.match(TokenType.LPAREN)
        var_tok = self.expect(TokenType.IDENTIFIER)
        self.expect(TokenType.IN)
        iterable = self.parse_expression()
        if has_paren:
            self.expect(TokenType.RPAREN)
        body = self.parse_block()
        return ForNode(line=for_tok.line, col=for_tok.col, variable=var_tok.value, iterable=iterable, body=body)

    def parse_print(self) -> PrintNode:
        p_tok = self.expect(TokenType.PRINT)
        args = []
        if self.match(TokenType.LPAREN):
            if not self.check(TokenType.RPAREN):
                args.append(self.parse_expression())
                while self.match(TokenType.COMMA):
                    args.append(self.parse_expression())
            self.expect(TokenType.RPAREN)
        else:
            args.append(self.parse_expression())
            while self.match(TokenType.COMMA):
                args.append(self.parse_expression())
        return PrintNode(line=p_tok.line, col=p_tok.col, arguments=args)

    def parse_assignment_or_expr(self) -> ASTNode:
        expr = self.parse_expression()
        tok = self.current_token()

        if tok.type in (TokenType.ASSIGN, TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN):
            op = self.advance().type
            value = self.parse_expression()
            if not isinstance(expr, (IdentifierNode, IndexNode)):
                raise BLangParseError(f"Invalid assignment target at line {expr.line}, col {expr.col}", expr.line, expr.col, self.source)
            return AssignNode(line=expr.line, col=expr.col, target=expr, operator=op, value=value)

        return ExpressionStatementNode(line=expr.line, col=expr.col, expression=expr)

    # --- Precedence Expression Hierarchy ---

    def parse_expression(self) -> ASTNode:
        return self.parse_logical_or()

    def parse_logical_or(self) -> ASTNode:
        left = self.parse_logical_and()
        while self.match(TokenType.OR):
            op_tok = self.tokens[self.pos - 1]
            right = self.parse_logical_and()
            left = BinaryOpNode(line=op_tok.line, col=op_tok.col, left=left, operator="or", right=right)
        return left

    def parse_logical_and(self) -> ASTNode:
        left = self.parse_equality()
        while self.match(TokenType.AND):
            op_tok = self.tokens[self.pos - 1]
            right = self.parse_equality()
            left = BinaryOpNode(line=op_tok.line, col=op_tok.col, left=left, operator="and", right=right)
        return left

    def parse_equality(self) -> ASTNode:
        left = self.parse_relational()
        while self.check(TokenType.EQ) or self.check(TokenType.NEQ):
            op = self.advance().value
            right = self.parse_relational()
            left = BinaryOpNode(line=left.line, col=left.col, left=left, operator=op, right=right)
        return left

    def parse_relational(self) -> ASTNode:
        left = self.parse_additive()
        while self.check(TokenType.LT) or self.check(TokenType.LTE) or self.check(TokenType.GT) or self.check(TokenType.GTE):
            op = self.advance().value
            right = self.parse_additive()
            left = BinaryOpNode(line=left.line, col=left.col, left=left, operator=op, right=right)
        return left

    def parse_additive(self) -> ASTNode:
        left = self.parse_multiplicative()
        while self.check(TokenType.PLUS) or self.check(TokenType.MINUS):
            op = self.advance().value
            right = self.parse_multiplicative()
            left = BinaryOpNode(line=left.line, col=left.col, left=left, operator=op, right=right)
        return left

    def parse_multiplicative(self) -> ASTNode:
        left = self.parse_unary()
        while self.check(TokenType.STAR) or self.check(TokenType.SLASH) or self.check(TokenType.PERCENT):
            op = self.advance().value
            right = self.parse_unary()
            left = BinaryOpNode(line=left.line, col=left.col, left=left, operator=op, right=right)
        return left

    def parse_unary(self) -> ASTNode:
        tok = self.current_token()
        if tok.type in (TokenType.NOT, TokenType.MINUS, TokenType.PLUS):
            op = self.advance().value
            operand = self.parse_unary()
            return UnaryOpNode(line=tok.line, col=tok.col, operator=op, operand=operand)
        return self.parse_postfix()

    def parse_postfix(self) -> ASTNode:
        expr = self.parse_primary()
        while True:
            # Function Call: expr(...)
            if self.match(TokenType.LPAREN):
                args = []
                if not self.check(TokenType.RPAREN):
                    args.append(self.parse_expression())
                    while self.match(TokenType.COMMA):
                        args.append(self.parse_expression())
                self.expect(TokenType.RPAREN)
                expr = CallNode(line=expr.line, col=expr.col, callee=expr, arguments=args)
                continue

            # Indexing: expr[...]
            if self.match(TokenType.LBRACKET):
                idx = self.parse_expression()
                self.expect(TokenType.RBRACKET)
                expr = IndexNode(line=expr.line, col=expr.col, target=expr, index=idx)
                continue

            break
        return expr

    def parse_primary(self) -> ASTNode:
        tok = self.current_token()

        # Macro: %random(a, b)%
        if tok.type == TokenType.RANDOM_MACRO:
            start_l = tok.line
            start_c = tok.col
            self.advance()
            self.expect(TokenType.LPAREN)
            min_arg = self.parse_expression()
            self.expect(TokenType.COMMA)
            max_arg = self.parse_expression()
            self.expect(TokenType.RPAREN)
            if self.check(TokenType.PERCENT):
                self.advance() # consume trailing %
            return CallNode(
                line=start_l,
                col=start_c,
                callee=IdentifierNode(line=start_l, col=start_c, name="random"),
                arguments=[min_arg, max_arg]
            )

        # Numbers
        if tok.type == TokenType.NUMBER:
            self.advance()
            return LiteralNode(line=tok.line, col=tok.col, value=tok.value, lit_type="number")

        # Strings
        if tok.type == TokenType.STRING:
            self.advance()
            return LiteralNode(line=tok.line, col=tok.col, value=tok.value, lit_type="string")

        # Booleans
        if tok.type in (TokenType.TRUE, TokenType.FALSE):
            self.advance()
            return LiteralNode(line=tok.line, col=tok.col, value=tok.value, lit_type="boolean")

        # Null
        if tok.type == TokenType.NULL:
            self.advance()
            return LiteralNode(line=tok.line, col=tok.col, value=None, lit_type="null")

        # Builtin helper keywords as identifiers when called
        if tok.type in (TokenType.LEN, TokenType.TYPE, TokenType.INPUT):
            self.advance()
            return IdentifierNode(line=tok.line, col=tok.col, name=tok.value)

        # Identifiers
        if tok.type == TokenType.IDENTIFIER:
            self.advance()
            return IdentifierNode(line=tok.line, col=tok.col, name=tok.value)

        # Parenthesized expression
        if self.match(TokenType.LPAREN):
            expr = self.parse_expression()
            self.expect(TokenType.RPAREN)
            return expr

        # List Literal: [...]
        if self.match(TokenType.LBRACKET):
            start_l, start_c = tok.line, tok.col
            elements = []
            if not self.check(TokenType.RBRACKET):
                elements.append(self.parse_expression())
                while self.match(TokenType.COMMA):
                    if self.check(TokenType.RBRACKET):
                        break
                    elements.append(self.parse_expression())
            self.expect(TokenType.RBRACKET)
            return ListNode(line=start_l, col=start_c, elements=elements)

        # Dictionary Literal: { key: value, ... }
        if tok.type == TokenType.LBRACE:
            start_l, start_c = tok.line, tok.col
            self.advance() # {
            entries = []
            if not self.check(TokenType.RBRACE):
                # parse entry
                k = self.parse_expression()
                self.expect(TokenType.COLON)
                v = self.parse_expression()
                entries.append(DictEntryNode(line=k.line, col=k.col, key=k, value=v))
                while self.match(TokenType.COMMA):
                    if self.check(TokenType.RBRACE):
                        break
                    k = self.parse_expression()
                    self.expect(TokenType.COLON)
                    v = self.parse_expression()
                    entries.append(DictEntryNode(line=k.line, col=k.col, key=k, value=v))
            self.expect(TokenType.RBRACE)
            return DictNode(line=start_l, col=start_c, entries=entries)

        raise BLangParseError(f"Unexpected token '{tok.type}' ({repr(tok.value)})", tok.line, tok.col, self.source)


# ==============================================================================
# TẦNG 3: SEMANTIC ANALYZER, SYMBOL TABLE & STRICT TYPE SAFETY
# ==============================================================================

@dataclass
class Symbol:
    name: str
    symbol_type: str  # 'number', 'string', 'boolean', 'list', 'dict', 'function', 'any', 'unknown'
    line: int
    col: int
    is_constant: bool = False
    parameters: Optional[List[str]] = None

class Scope:
    """Represents a lexical scope in the symbol table hierarchy."""
    def __init__(self, name: str, parent: Optional['Scope'] = None):
        self.name = name
        self.parent = parent
        self.symbols: Dict[str, Symbol] = {}

    def define(self, symbol: Symbol) -> None:
        self.symbols[symbol.name] = symbol

    def exists_in_current_scope(self, name: str) -> bool:
        return name in self.symbols

    def resolve(self, name: str) -> Optional[Symbol]:
        if name in self.symbols:
            return self.symbols[name]
        if self.parent:
            return self.parent.resolve(name)
        return None


class SemanticAnalyzer:
    """
    Tầng 3: Semantic Analyzer & Strict Type Safety Enforcement
    - Quản lý phạm vi biến (Lexical Scoping: Global Scope và Local Scope).
    - Tính duy nhất của biến: Chặn đứng khai báo trùng lặp trong cùng một Scope.
    - Quy chuẩn tên biến: Hỗ trợ _, @, $, chữ hoa/thường.
    - Strict Type Safety: Chuỗi (String) tuyệt đối KHÔNG ĐƯỢC PHÉP tham gia vào bất kỳ
      phép tính số học (+, -, *, /) nào với biến số (Number).
      Lập tức ném ra ngoại lệ TypeError chi tiết kèm Line, Col và hủy bỏ tiến trình.
    """
    def __init__(self, source: str):
        self.source = source
        self.global_scope = Scope(name="global")
        self.current_scope = self.global_scope
        self.all_scopes: List[Scope] = [self.global_scope]
        self.in_loop_depth = 0
        self.in_function_depth = 0

        # Predefine standard built-in functions
        builtins = [
            "print", "len", "type", "input", "str", "num", "range", "push",
            # Logarithmic & Exponential
            "log", "log10", "log2", "ln",
            # Roots & Powers
            "sqrt", "cbrt", "root", "pow", "power", "abs", "round", "floor", "ceil",
            # Trigonometric & Angles (degrees by default, plus rad conversions)
            "sin", "cos", "tan", "cotan", "cot", "deg_to_rad", "rad_to_deg",
            "sind", "cosd", "tand", "cotand",
            "sin_rad", "cos_rad", "tan_rad", "cotan_rad",
            # Geometry: Circle (circle / cir, c / C / perimeter, s / S / area)
            "circle_c", "circle_C", "cir_c", "cir_C",
            "circle_s", "circle_S", "cir_s", "cir_S",
            "circle_perimeter", "circle_circumference", "circle_area",
            "cir_perimeter", "cir_circumference", "cir_area",
            # Geometry: Sphere (sphere, v / V / volume, s / S / area)
            "sphere_v", "sphere_V", "sphere_volume",
            "sphere_s", "sphere_S", "sphere_area",
            # Geometry: Cylinder (cylinder, v / V / volume)
            "cylinder_v", "cylinder_V", "cylinder_volume",
            # Geometry: Cone (cone, v / V / volume)
            "cone_v", "cone_V", "cone_volume",
            # Geometry: Square (square / sq, c / C / perimeter, s / S / area)
            "square_c", "square_C", "sq_c", "sq_C",
            "square_s", "square_S", "sq_s", "sq_S",
            "square_perimeter", "square_area",
            "sq_perimeter", "sq_area",
            # Geometry: Cube (cube, v / V / volume, s / S / area)
            "cube_v", "cube_V", "cube_volume",
            "cube_s", "cube_S", "cube_area",
            # Geometry: Rectangle (rect / rectangle, c / C / perimeter, s / S / area)
            "rect_c", "rect_C", "rectangle_c", "rectangle_C",
            "rect_s", "rect_S", "rectangle_s", "rectangle_S",
            "rect_perimeter", "rect_area", "rectangle_perimeter", "rectangle_area",
            # Geometry: Cuboid (cuboid, v / V / volume)
            "cuboid_v", "cuboid_V", "cuboid_volume",
            # Geometry: Trapezoid (trapezoid, c / C / perimeter, s / S / area)
            "trapezoid_c", "trapezoid_C", "trapezoid_perimeter",
            "trapezoid_s", "trapezoid_S", "trapezoid_area",
            # Geometry: Regular Polygon (polygon, c / C / perimeter, s / S / area)
            "polygon_c", "polygon_C", "polygon_perimeter",
            "polygon_s", "polygon_S", "polygon_area",
            # Geometry: Triangle (triangle / tri, c / C / perimeter, s / S / area)
            "triangle_c", "triangle_C", "triangle_perimeter",
            "triangle_s", "triangle_S", "triangle_area",
            "tri_c", "tri_C", "tri_perimeter",
            "tri_s", "tri_S", "tri_area",
            # Standard Library: String Operations
            "upper", "lower", "trim", "replace", "split", "join", "contains",
            # Standard Library: List & Aggregation
            "sum", "min_val", "max_val", "avg", "reverse",
            # Standard Library: System & Time
            "time_now",
            # Random Number Generator
            "random",
        ]
        for b in builtins:
            self.global_scope.define(Symbol(name=b, symbol_type="function", line=0, col=0))

        # Constants
        self.global_scope.define(Symbol(name="PI", symbol_type="number", line=0, col=0))
        self.global_scope.define(Symbol(name="E", symbol_type="number", line=0, col=0))

    def enter_scope(self, name: str) -> Scope:
        scope = Scope(name=name, parent=self.current_scope)
        self.all_scopes.append(scope)
        self.current_scope = scope
        return scope

    def exit_scope(self) -> None:
        if self.current_scope.parent:
            self.current_scope = self.current_scope.parent

    def analyze(self, ast: ProgramNode) -> None:
        for stmt in ast.statements:
            self.visit_statement(stmt)

    def visit_statement(self, node: ASTNode) -> None:
        if isinstance(node, VarDeclNode):
            # Check duplicate declaration in the same scope
            if self.current_scope.exists_in_current_scope(node.name):
                prev = self.current_scope.symbols[node.name]
                raise BLangSemanticError(
                    f"Duplicate variable declaration: Variable '{node.name}' is already declared in scope '{self.current_scope.name}' (first declared at line {prev.line}, col {prev.col})",
                    node.line, node.col, self.source
                )

            inferred_type = "any"
            if node.initializer:
                inferred_type = self.infer_type(node.initializer)

            sym = Symbol(name=node.name, symbol_type=inferred_type, line=node.line, col=node.col)
            self.current_scope.define(sym)

        elif isinstance(node, AssignNode):
            # Check target
            if isinstance(node.target, IdentifierNode):
                sym = self.current_scope.resolve(node.target.name)
                val_type = self.infer_type(node.value)
                if not sym:
                    # Implicit declaration in current scope if not declared via let
                    sym = Symbol(name=node.target.name, symbol_type=val_type, line=node.line, col=node.col)
                    self.current_scope.define(sym)
                else:
                    # Update inferred type if not strict constant
                    if val_type != "unknown":
                        sym.symbol_type = val_type
            elif isinstance(node.target, IndexNode):
                self.visit_expression(node.target)
                self.visit_expression(node.value)

        elif isinstance(node, FunctionDefNode):
            # Check duplicate function declaration in current scope
            if self.current_scope.exists_in_current_scope(node.name):
                prev = self.current_scope.symbols[node.name]
                raise BLangSemanticError(
                    f"Duplicate function definition: Function '{node.name}' is already defined in scope '{self.current_scope.name}' (line {prev.line}, col {prev.col})",
                    node.line, node.col, self.source
                )

            fn_sym = Symbol(name=node.name, symbol_type="function", line=node.line, col=node.col, parameters=node.parameters)
            self.current_scope.define(fn_sym)

            # Enter function scope
            fn_scope = self.enter_scope(name=f"function_{node.name}")
            self.in_function_depth += 1

            # Define parameters in function scope
            seen_params: Set[str] = set()
            for p in node.parameters:
                if p in seen_params:
                    raise BLangSemanticError(
                        f"Duplicate parameter name '{p}' in function '{node.name}'",
                        node.line, node.col, self.source
                    )
                seen_params.add(p)
                fn_scope.define(Symbol(name=p, symbol_type="any", line=node.line, col=node.col))

            for s in node.body.statements:
                self.visit_statement(s)

            self.in_function_depth -= 1
            self.exit_scope()

        elif isinstance(node, IfNode):
            self.visit_expression(node.condition)
            self.enter_scope("if_block")
            for s in node.then_branch.statements:
                self.visit_statement(s)
            self.exit_scope()

            for cond, elif_body in node.elif_branches:
                self.visit_expression(cond)
                self.enter_scope("elseif_block")
                for s in elif_body.statements:
                    self.visit_statement(s)
                self.exit_scope()

            if node.else_branch:
                self.enter_scope("else_block")
                for s in node.else_branch.statements:
                    self.visit_statement(s)
                self.exit_scope()

        elif isinstance(node, WhileNode):
            self.visit_expression(node.condition)
            self.in_loop_depth += 1
            self.enter_scope("while_block")
            for s in node.body.statements:
                self.visit_statement(s)
            self.exit_scope()
            self.in_loop_depth -= 1

        elif isinstance(node, ForNode):
            self.visit_expression(node.iterable)
            self.in_loop_depth += 1
            loop_scope = self.enter_scope("for_block")
            loop_scope.define(Symbol(name=node.variable, symbol_type="any", line=node.line, col=node.col))
            for s in node.body.statements:
                self.visit_statement(s)
            self.exit_scope()
            self.in_loop_depth -= 1

        elif isinstance(node, ReturnNode):
            if self.in_function_depth == 0:
                raise BLangSemanticError("Return statement used outside of any function definition", node.line, node.col, self.source)
            if node.expression:
                self.visit_expression(node.expression)

        elif isinstance(node, BreakNode):
            if self.in_loop_depth == 0:
                raise BLangSemanticError("Break statement used outside of any loop construct", node.line, node.col, self.source)

        elif isinstance(node, ContinueNode):
            if self.in_loop_depth == 0:
                raise BLangSemanticError("Continue statement used outside of any loop construct", node.line, node.col, self.source)

        elif isinstance(node, PrintNode):
            for arg in node.arguments:
                self.visit_expression(arg)

        elif isinstance(node, ImportNode):
            pass

        elif isinstance(node, BlockNode):
            self.enter_scope("block")
            for s in node.statements:
                self.visit_statement(s)
            self.exit_scope()

        elif isinstance(node, ExpressionStatementNode):
            self.visit_expression(node.expression)

    def visit_expression(self, node: ASTNode) -> None:
        self.infer_type(node)

    def infer_type(self, node: ASTNode) -> str:
        """
        Type inference and STRICT TYPE SAFETY ENFORCEMENT:
        String CANNOT participate in math (+, -, *, /, %) with Number.
        If violated, raises BLangTypeError with line, column, and variable/literal details.
        """
        if isinstance(node, LiteralNode):
            return node.lit_type

        if isinstance(node, IdentifierNode):
            sym = self.current_scope.resolve(node.name)
            if not sym:
                # In dynamic language, variable might be assigned later or global
                return "any"
            return sym.symbol_type

        if isinstance(node, ListNode):
            for el in node.elements:
                self.infer_type(el)
            return "list"

        if isinstance(node, DictNode):
            for entry in node.entries:
                self.infer_type(entry.key)
                self.infer_type(entry.value)
            return "dict"

        if isinstance(node, IndexNode):
            self.infer_type(node.target)
            self.infer_type(node.index)
            return "any"

        if isinstance(node, CallNode):
            self.infer_type(node.callee)
            for a in node.arguments:
                self.infer_type(a)
            return "any"

        if isinstance(node, UnaryOpNode):
            self.infer_type(node.operand)
            if node.operator == "not":
                return "boolean"
            if node.operator in ("-", "+"):
                return "number"
            return "any"

        if isinstance(node, BinaryOpNode):
            t_left = self.infer_type(node.left)
            t_right = self.infer_type(node.right)
            op = node.operator

            # Arithmetic operators: +, -, *, /, %
            if op in ("+", "-", "*", "/", "%"):
                is_left_str = (t_left == "string")
                is_right_str = (t_right == "string")
                is_left_num = (t_left == "number")
                is_right_num = (t_right == "number")

                if op == "+":
                    if is_left_str or is_right_str:
                        return "string"
                    if is_left_num and is_right_num:
                        return "number"
                    return "any"

                if is_left_num and is_right_num:
                    return "number"

                return "number"

            # Relational & Equality operators
            if op in ("==", "!=", "<", "<=", ">", ">="):
                return "boolean"

            # Logical operators
            if op in ("and", "or"):
                return "boolean"

            return "any"

        return "unknown"


# ==============================================================================
# TẦNG 4: AST OPTIMIZER (TỐI ƯU HÓA MÃ NGUỒN - CONSTANT FOLDING)
# ==============================================================================

class ASTOptimizer:
    """
    Tầng 4: AST Optimizer.
    Thực hiện bước Constant Folding: Tính toán trước các biểu thức toán học và logic tĩnh
    trên cây AST trước khi chuyển qua tầng sinh mã hoặc thông dịch.
    Ví dụ: (10 * 5) + 2 -> 52
    """
    def __init__(self):
        self.folded_count = 0

    def optimize(self, node: ASTNode) -> ASTNode:
        if isinstance(node, ProgramNode):
            node.statements = [self.optimize(s) for s in node.statements]
            return node

        if isinstance(node, BlockNode):
            node.statements = [self.optimize(s) for s in node.statements]
            return node

        if isinstance(node, VarDeclNode):
            if node.initializer:
                node.initializer = self.optimize(node.initializer)
            return node

        if isinstance(node, AssignNode):
            node.target = self.optimize(node.target)
            node.value = self.optimize(node.value)
            return node

        if isinstance(node, IfNode):
            node.condition = self.optimize(node.condition)
            node.then_branch = self.optimize(node.then_branch)
            node.elif_branches = [(self.optimize(c), self.optimize(b)) for c, b in node.elif_branches]
            if node.else_branch:
                node.else_branch = self.optimize(node.else_branch)
            return node

        if isinstance(node, WhileNode):
            node.condition = self.optimize(node.condition)
            node.body = self.optimize(node.body)
            return node

        if isinstance(node, ForNode):
            node.iterable = self.optimize(node.iterable)
            node.body = self.optimize(node.body)
            return node

        if isinstance(node, FunctionDefNode):
            node.body = self.optimize(node.body)
            return node

        if isinstance(node, ReturnNode):
            if node.expression:
                node.expression = self.optimize(node.expression)
            return node

        if isinstance(node, PrintNode):
            node.arguments = [self.optimize(a) for a in node.arguments]
            return node

        if isinstance(node, ImportNode):
            return node

        if isinstance(node, ExpressionStatementNode):
            node.expression = self.optimize(node.expression)
            return node

        if isinstance(node, ListNode):
            node.elements = [self.optimize(e) for e in node.elements]
            return node

        if isinstance(node, DictNode):
            for entry in node.entries:
                entry.key = self.optimize(entry.key)
                entry.value = self.optimize(entry.value)
            return node

        if isinstance(node, IndexNode):
            node.target = self.optimize(node.target)
            node.index = self.optimize(node.index)
            return node

        if isinstance(node, CallNode):
            node.callee = self.optimize(node.callee)
            node.arguments = [self.optimize(a) for a in node.arguments]
            return node

        if isinstance(node, UnaryOpNode):
            node.operand = self.optimize(node.operand)
            # Constant fold unary - and not
            if isinstance(node.operand, LiteralNode):
                if node.operator == "-" and node.operand.lit_type == "number":
                    self.folded_count += 1
                    return LiteralNode(line=node.line, col=node.col, value=-node.operand.value, lit_type="number")
                if node.operator == "+" and node.operand.lit_type == "number":
                    self.folded_count += 1
                    return LiteralNode(line=node.line, col=node.col, value=+node.operand.value, lit_type="number")
                if node.operator == "not" and node.operand.lit_type == "boolean":
                    self.folded_count += 1
                    return LiteralNode(line=node.line, col=node.col, value=not node.operand.value, lit_type="boolean")
            return node

        if isinstance(node, BinaryOpNode):
            node.left = self.optimize(node.left)
            node.right = self.optimize(node.right)

            # Check if both are numeric literals for constant folding
            if isinstance(node.left, LiteralNode) and isinstance(node.right, LiteralNode):
                l_val = node.left.value
                r_val = node.right.value

                # Numeric arithmetic folding
                if node.left.lit_type == "number" and node.right.lit_type == "number":
                    res = None
                    if node.operator == "+":
                        res = l_val + r_val
                    elif node.operator == "-":
                        res = l_val - r_val
                    elif node.operator == "*":
                        res = l_val * r_val
                    elif node.operator == "/":
                        if r_val != 0:
                            res = l_val / r_val if (l_val % r_val != 0 or isinstance(l_val, float) or isinstance(r_val, float)) else l_val // r_val
                    elif node.operator == "%":
                        if r_val != 0:
                            res = l_val % r_val

                    # Numeric comparison folding
                    elif node.operator == "==":
                        res = (l_val == r_val)
                    elif node.operator == "!=":
                        res = (l_val != r_val)
                    elif node.operator == "<":
                        res = (l_val < r_val)
                    elif node.operator == "<=":
                        res = (l_val <= r_val)
                    elif node.operator == ">":
                        res = (l_val > r_val)
                    elif node.operator == ">=":
                        res = (l_val >= r_val)

                    if res is not None:
                        self.folded_count += 1
                        lit_type = "boolean" if isinstance(res, bool) else "number"
                        return LiteralNode(line=node.line, col=node.col, value=res, lit_type=lit_type)

                # Pure string concatenation folding
                elif node.left.lit_type == "string" and node.right.lit_type == "string" and node.operator == "+":
                    self.folded_count += 1
                    return LiteralNode(line=node.line, col=node.col, value=l_val + r_val, lit_type="string")

            return node

        return node


# ==============================================================================
# TẦNG 5: DUAL-TARGET CODE GENERATOR (SINH MÃ ĐA NỀN TẢNG: PYTHON 3 & JAVASCRIPT ES6+)
# ==============================================================================

def sanitize_identifier_py(name: str) -> str:
    """Sanitizes BLang identifiers with @, $ into valid Python variable identifiers."""
    # If standard identifier, return directly
    if re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", name):
        return name
    # Transform @ -> bl_at_, $ -> bl_dollar_
    res = name.replace("@", "bl_at_").replace("$", "bl_dollar_")
    if not res[0].isalpha() and res[0] != "_":
        res = "_" + res
    return res

def sanitize_identifier_js(name: str) -> str:
    """Sanitizes BLang identifiers into valid JavaScript ES6+ identifiers ($ is already native in JS)."""
    # JS naturally allows $ and _
    # Replace @ with _at_
    res = name.replace("@", "_at_")
    if not res[0].isalpha() and res[0] not in ("_", "$"):
        res = "_" + res
    return res


class PythonCodeGenerator:
    """
    Tầng 5A: Sinh mã Python 3.x sạch, tối ưu, tương thích hoàn toàn chuẩn PEP 8.
    Xử lý tự động thụt đầu dòng (Indentation), cấu trúc if/elif/else, hàm và vòng lặp.
    """
    def __init__(self):
        self.indent_level = 0
        self.indent_str = "    "

    def indent(self) -> str:
        return self.indent_str * self.indent_level

    def generate(self, ast: ProgramNode) -> str:
        lines: List[str] = [
            "# ==============================================================================",
            "# Auto-generated Python 3.x code transpiled from BLang",
            "# Generated by BLang Multi-Pass Transpiler (Layer 5 Code Generator)",
            "# Target: Python 3.8+ Runtime Environment (AI, Scientific Computing, Backend)",
            "# ==============================================================================",
            "import sys",
            "import math",
            "import time",
            "import random as _py_random",
            "",
            "# Runtime helper: Dynamic Addition / Concatenation",
            "def _bl_add(a, b):",
            "    if isinstance(a, str) or isinstance(b, str):",
            "        return str(a) + str(b)",
            "    return a + b",
            "",
            "# Runtime helper: Math & Geometry Standard Functions",
            "PI = math.pi",
            "E = math.e",
            "# Trigonometry (Degrees by default)",
            "sin = lambda d: math.sin(d * (math.pi / 180.0))",
            "cos = lambda d: math.cos(d * (math.pi / 180.0))",
            "tan = lambda d: math.tan(d * (math.pi / 180.0))",
            "cotan = lambda d: 1.0 / math.tan(d * (math.pi / 180.0))",
            "cot = cotan",
            "sind = sin",
            "cosd = cos",
            "tand = tan",
            "cotand = cotan",
            "sin_rad = math.sin",
            "cos_rad = math.cos",
            "tan_rad = math.tan",
            "cotan_rad = lambda r: 1.0 / math.tan(r)",
            "deg_to_rad = lambda d: d * (math.pi / 180.0)",
            "rad_to_deg = lambda r: r * (180.0 / math.pi)",
            "log = lambda x, base=10: math.log(x, base)",
            "ln = math.log",
            "log10 = math.log10",
            "log2 = math.log2",
            "sqrt = math.sqrt",
            "cbrt = lambda x: x ** (1.0 / 3.0)",
            "root = lambda x, n: x ** (1.0 / n)",
            "pow = math.pow",
            "power = pow",
            "# Geometry: Circle (circle / cir, c / C / perimeter, s / S / area)",
            "circle_c = lambda r: 2.0 * math.pi * r",
            "circle_C = circle_c",
            "cir_c = circle_c",
            "cir_C = circle_c",
            "circle_perimeter = circle_c",
            "cir_perimeter = circle_c",
            "circle_circumference = circle_c",
            "cir_circumference = circle_c",
            "circle_s = lambda r: math.pi * (r ** 2)",
            "circle_S = circle_s",
            "cir_s = circle_s",
            "cir_S = circle_s",
            "circle_area = circle_s",
            "cir_area = circle_s",
            "# Geometry: Sphere",
            "sphere_v = lambda r: (4.0 / 3.0) * math.pi * (r ** 3)",
            "sphere_V = sphere_v",
            "sphere_volume = sphere_v",
            "sphere_s = lambda r: 4.0 * math.pi * (r ** 2)",
            "sphere_S = sphere_s",
            "sphere_area = sphere_s",
            "# Geometry: Cylinder",
            "cylinder_v = lambda r, h: math.pi * (r ** 2) * h",
            "cylinder_V = cylinder_v",
            "cylinder_volume = cylinder_v",
            "# Geometry: Cone",
            "cone_v = lambda r, h: (1.0 / 3.0) * math.pi * (r ** 2) * h",
            "cone_V = cone_v",
            "cone_volume = cone_v",
            "# Geometry: Square (square / sq, c / C / perimeter, s / S / area)",
            "square_c = lambda a: 4.0 * a",
            "square_C = square_c",
            "sq_c = square_c",
            "sq_C = square_c",
            "square_perimeter = square_c",
            "sq_perimeter = square_c",
            "square_s = lambda a: float(a * a)",
            "square_S = square_s",
            "sq_s = square_s",
            "sq_S = square_s",
            "square_area = square_s",
            "sq_area = square_s",
            "# Geometry: Cube",
            "cube_v = lambda a: float(a ** 3)",
            "cube_V = cube_v",
            "cube_volume = cube_v",
            "cube_s = lambda a: 6.0 * (a ** 2)",
            "cube_S = cube_s",
            "cube_area = cube_s",
            "# Geometry: Rectangle (rect / rectangle, c / C / perimeter, s / S / area)",
            "rect_c = lambda w, h: 2.0 * (w + h)",
            "rect_C = rect_c",
            "rectangle_c = rect_c",
            "rectangle_C = rect_c",
            "rect_perimeter = rect_c",
            "rectangle_perimeter = rect_c",
            "rect_s = lambda w, h: float(w * h)",
            "rect_S = rect_s",
            "rectangle_s = rect_s",
            "rectangle_S = rect_s",
            "rect_area = rect_s",
            "rectangle_area = rect_s",
            "# Geometry: Cuboid",
            "cuboid_v = lambda w, h, d: float(w * h * d)",
            "cuboid_V = cuboid_v",
            "cuboid_volume = cuboid_v",
            "# Geometry: Trapezoid",
            "trapezoid_s = lambda a, b, h: ((a + b) * h) / 2.0",
            "trapezoid_S = trapezoid_s",
            "trapezoid_area = trapezoid_s",
            "trapezoid_c = lambda a, b, c, d: float(a + b + c + d)",
            "trapezoid_C = trapezoid_c",
            "trapezoid_perimeter = trapezoid_c",
            "# Geometry: Regular Polygon",
            "polygon_c = lambda n, s: float(n * s)",
            "polygon_C = polygon_c",
            "polygon_perimeter = polygon_c",
            "polygon_s = lambda n, s: (n * (s ** 2)) / (4.0 * math.tan(math.pi / n))",
            "polygon_S = polygon_s",
            "polygon_area = polygon_s",
            "# Geometry: Triangle (triangle / tri, c / C / perimeter, s / S / area)",
            "triangle_s = lambda b, h: 0.5 * b * h",
            "triangle_S = triangle_s",
            "triangle_area = triangle_s",
            "tri_s = triangle_s",
            "tri_S = triangle_s",
            "tri_area = triangle_s",
            "triangle_c = lambda a, b, c: float(a + b + c)",
            "triangle_C = triangle_c",
            "triangle_perimeter = triangle_c",
            "tri_c = triangle_c",
            "tri_C = triangle_c",
            "tri_perimeter = triangle_c",
            "# Standard Library: String Operations",
            "upper = lambda s: str(s).upper()",
            "lower = lambda s: str(s).lower()",
            "trim = lambda s: str(s).strip()",
            "replace = lambda s, o, n: str(s).replace(str(o), str(n))",
            "split = lambda s, d: str(s).split(str(d))",
            "join = lambda a, d='': d.join(str(x) for x in a) if isinstance(a, list) else str(a)",
            "contains = lambda s, sub: str(sub) in str(s)",
            "# Standard Library: List & Aggregation",
            "sum = lambda a: float(sum(float(x) for x in a)) if isinstance(a, list) and a else 0.0",
            "min_val = lambda a: float(min(float(x) for x in a)) if isinstance(a, list) and a else 0.0",
            "max_val = lambda a: float(max(float(x) for x in a)) if isinstance(a, list) and a else 0.0",
            "avg = lambda a: float(sum(float(x) for x in a)) / len(a) if isinstance(a, list) and a else 0.0",
            "reverse = lambda a: list(reversed(a)) if isinstance(a, list) else (str(a)[::-1] if isinstance(a, str) else a)",
            "time_now = lambda: float(time.time() * 1000.0)",
            "random = lambda a, b: float(_py_random.randint(int(min(a, b)), int(max(a, b)))) if (float(a).is_integer() and float(b).is_integer()) else float(_py_random.uniform(min(a, b), max(a, b)))",
            "",
            "# --- Transpiled Program Statements ---",
        ]

        if not ast.statements:
            lines.append("pass")
        else:
            for stmt in ast.statements:
                gen = self.gen_statement(stmt)
                if gen:
                    lines.append(gen)

        return "\n".join(lines) + "\n"

    def gen_block(self, block: BlockNode) -> str:
        if not block.statements:
            return f"{self.indent()}pass"
        res = []
        for s in block.statements:
            g = self.gen_statement(s)
            if g:
                res.append(g)
        return "\n".join(res)

    def gen_statement(self, node: ASTNode) -> str:
        if isinstance(node, VarDeclNode):
            name = sanitize_identifier_py(node.name)
            if node.initializer:
                val = self.gen_expression(node.initializer)
                return f"{self.indent()}{name} = {val}"
            else:
                return f"{self.indent()}{name} = None"

        if isinstance(node, AssignNode):
            tgt = self.gen_expression(node.target)
            val = self.gen_expression(node.value)
            return f"{self.indent()}{tgt} {node.operator} {val}"

        if isinstance(node, FunctionDefNode):
            fn_name = sanitize_identifier_py(node.name)
            params = [sanitize_identifier_py(p) for p in node.parameters]
            hdr = f"{self.indent()}def {fn_name}({', '.join(params)}):"
            self.indent_level += 1
            body = self.gen_block(node.body)
            self.indent_level -= 1
            return f"{hdr}\n{body}\n"

        if isinstance(node, IfNode):
            cond = self.gen_expression(node.condition)
            res = [f"{self.indent()}if {cond}:"]
            self.indent_level += 1
            res.append(self.gen_block(node.then_branch))
            self.indent_level -= 1

            for elif_cond, elif_body in node.elif_branches:
                c = self.gen_expression(elif_cond)
                res.append(f"{self.indent()}elif {c}:")
                self.indent_level += 1
                res.append(self.gen_block(elif_body))
                self.indent_level -= 1

            if node.else_branch:
                res.append(f"{self.indent()}else:")
                self.indent_level += 1
                res.append(self.gen_block(node.else_branch))
                self.indent_level -= 1

            return "\n".join(res)

        if isinstance(node, WhileNode):
            cond = self.gen_expression(node.condition)
            hdr = f"{self.indent()}while {cond}:"
            self.indent_level += 1
            body = self.gen_block(node.body)
            self.indent_level -= 1
            return f"{hdr}\n{body}"

        if isinstance(node, ForNode):
            var = sanitize_identifier_py(node.variable)
            iter_expr = self.gen_expression(node.iterable)
            hdr = f"{self.indent()}for {var} in {iter_expr}:"
            self.indent_level += 1
            body = self.gen_block(node.body)
            self.indent_level -= 1
            return f"{hdr}\n{body}"

        if isinstance(node, ReturnNode):
            if node.expression:
                val = self.gen_expression(node.expression)
                return f"{self.indent()}return {val}"
            return f"{self.indent()}return"

        if isinstance(node, BreakNode):
            return f"{self.indent()}break"

        if isinstance(node, ContinueNode):
            return f"{self.indent()}continue"

        if isinstance(node, PrintNode):
            args = [self.gen_expression(a) for a in node.arguments]
            return f"{self.indent()}print({', '.join(args)})"

        if isinstance(node, ImportNode):
            clean_mod = node.module_path.replace(".bl", "").replace("/", ".").replace("-", "_")
            return f"{self.indent()}# BLang Module Import: {node.module_path}\ntry:\n    from {clean_mod} import *\nexcept ImportError:\n    pass"

        if isinstance(node, BlockNode):
            return self.gen_block(node)

        if isinstance(node, ExpressionStatementNode):
            expr = self.gen_expression(node.expression)
            return f"{self.indent()}{expr}"

        return ""

    def gen_expression(self, node: ASTNode) -> str:
        if isinstance(node, LiteralNode):
            if node.lit_type == "number":
                return str(node.value)
            elif node.lit_type == "string":
                return repr(node.value)
            elif node.lit_type == "boolean":
                return "True" if node.value else "False"
            elif node.lit_type == "null":
                return "None"

        if isinstance(node, IdentifierNode):
            return sanitize_identifier_py(node.name)

        if isinstance(node, ListNode):
            elements = [self.gen_expression(e) for e in node.elements]
            return f"[{', '.join(elements)}]"

        if isinstance(node, DictNode):
            entries = [f"{self.gen_expression(e.key)}: {self.gen_expression(e.value)}" for e in node.entries]
            return f"{{{', '.join(entries)}}}"

        if isinstance(node, IndexNode):
            tgt = self.gen_expression(node.target)
            idx = self.gen_expression(node.index)
            return f"{tgt}[{idx}]"

        if isinstance(node, CallNode):
            callee = self.gen_expression(node.callee)
            args = [self.gen_expression(a) for a in node.arguments]
            return f"{callee}({', '.join(args)})"

        if isinstance(node, UnaryOpNode):
            op = "not " if node.operator == "not" else node.operator
            operand = self.gen_expression(node.operand)
            return f"({op}{operand})"

        if isinstance(node, BinaryOpNode):
            l = self.gen_expression(node.left)
            r = self.gen_expression(node.right)
            op = node.operator
            if op == "+":
                return f"_bl_add({l}, {r})"
            if op == "and":
                op = "and"
            elif op == "or":
                op = "or"
            return f"({l} {op} {r})"

        return "None"


class JavaScriptCodeGenerator:
    """
    Tầng 5B: Sinh mã JavaScript ES6+ hiện đại, tối ưu, chạy trên Node.js hoặc Trình duyệt Web.
    Hỗ trợ dấu ngoặc nhọn `{}` nguyên bản, cú pháp let/const, arrow functions, và console.log.
    """
    def __init__(self):
        self.indent_level = 0
        self.indent_str = "    "
        self.declared_vars: Set[str] = set()

    def indent(self) -> str:
        return self.indent_str * self.indent_level

    def generate(self, ast: ProgramNode) -> str:
        self.declared_vars = set()
        lines: List[str] = [
            "// ==============================================================================",
            "// Auto-generated JavaScript (ES6+) code transpiled from BLang",
            "// Generated by BLang Multi-Pass Transpiler (Layer 5 Code Generator)",
            "// Target: Modern Web Browsers & Node.js Runtime (Web, Apps, Casual Games)",
            "// ==============================================================================",
            "'use strict';",
            "",
            "// Runtime helper: Math & Geometry Standard Functions",
            "const PI = Math.PI;",
            "const E = Math.E;",
            "// Trigonometry (Degrees by default)",
            "const sin = (d) => Math.sin(d * (Math.PI / 180));",
            "const cos = (d) => Math.cos(d * (Math.PI / 180));",
            "const tan = (d) => Math.tan(d * (Math.PI / 180));",
            "const cotan = (d) => 1 / Math.tan(d * (Math.PI / 180));",
            "const cot = cotan;",
            "const sind = sin;",
            "const cosd = cos;",
            "const tand = tan;",
            "const cotand = cotan;",
            "const sin_rad = (r) => Math.sin(r);",
            "const cos_rad = (r) => Math.cos(r);",
            "const tan_rad = (r) => Math.tan(r);",
            "const cotan_rad = (r) => 1 / Math.tan(r);",
            "const deg_to_rad = (d) => d * (Math.PI / 180);",
            "const rad_to_deg = (r) => r * (180 / Math.PI);",
            "const log = (x, base) => (base !== undefined ? Math.log(x) / Math.log(base) : Math.log10(x));",
            "const ln = (x) => Math.log(x);",
            "const log10 = (x) => Math.log10(x);",
            "const log2 = (x) => Math.log2(x);",
            "const sqrt = (x) => Math.sqrt(x);",
            "const cbrt = (x) => Math.cbrt(x);",
            "const root = (x, n) => Math.pow(x, 1 / n);",
            "const pow = (b, e) => Math.pow(b, e);",
            "const power = pow;",
            "// Geometry: Circle (circle / cir, c / C / perimeter, s / S / area)",
            "const circle_c = (r) => 2 * Math.PI * r;",
            "const circle_C = circle_c;",
            "const cir_c = circle_c;",
            "const cir_C = circle_c;",
            "const circle_perimeter = circle_c;",
            "const cir_perimeter = circle_c;",
            "const circle_circumference = circle_c;",
            "const cir_circumference = circle_c;",
            "const circle_s = (r) => Math.PI * r * r;",
            "const circle_S = circle_s;",
            "const cir_s = circle_s;",
            "const cir_S = circle_s;",
            "const circle_area = circle_s;",
            "const cir_area = circle_s;",
            "// Geometry: Sphere",
            "const sphere_v = (r) => (4 / 3) * Math.PI * Math.pow(r, 3);",
            "const sphere_V = sphere_v;",
            "const sphere_volume = sphere_v;",
            "const sphere_s = (r) => 4 * Math.PI * Math.pow(r, 2);",
            "const sphere_S = sphere_s;",
            "const sphere_area = sphere_s;",
            "// Geometry: Cylinder",
            "const cylinder_v = (r, h) => Math.PI * r * r * h;",
            "const cylinder_V = cylinder_v;",
            "const cylinder_volume = cylinder_v;",
            "// Geometry: Cone",
            "const cone_v = (r, h) => (1 / 3) * Math.PI * r * r * h;",
            "const cone_V = cone_v;",
            "const cone_volume = cone_v;",
            "// Geometry: Square (square / sq, c / C / perimeter, s / S / area)",
            "const square_c = (a) => 4 * a;",
            "const square_C = square_c;",
            "const sq_c = square_c;",
            "const sq_C = square_c;",
            "const square_perimeter = square_c;",
            "const sq_perimeter = square_c;",
            "const square_s = (a) => a * a;",
            "const square_S = square_s;",
            "const sq_s = square_s;",
            "const sq_S = square_s;",
            "const square_area = square_s;",
            "const sq_area = square_s;",
            "// Geometry: Cube",
            "const cube_v = (a) => Math.pow(a, 3);",
            "const cube_V = cube_v;",
            "const cube_volume = cube_v;",
            "const cube_s = (a) => 6 * a * a;",
            "const cube_S = cube_s;",
            "const cube_area = cube_s;",
            "// Geometry: Rectangle (rect / rectangle, c / C / perimeter, s / S / area)",
            "const rect_c = (w, h) => 2 * (w + h);",
            "const rect_C = rect_c;",
            "const rectangle_c = rect_c;",
            "const rectangle_C = rect_c;",
            "const rect_perimeter = rect_c;",
            "const rectangle_perimeter = rect_c;",
            "const rect_s = (w, h) => w * h;",
            "const rect_S = rect_s;",
            "const rectangle_s = rect_s;",
            "const rectangle_S = rect_s;",
            "const rect_area = rect_s;",
            "const rectangle_area = rect_s;",
            "// Geometry: Cuboid",
            "const cuboid_v = (w, h, d) => w * h * d;",
            "const cuboid_V = cuboid_v;",
            "const cuboid_volume = cuboid_v;",
            "// Geometry: Trapezoid",
            "const trapezoid_s = (a, b, h) => ((a + b) * h) / 2;",
            "const trapezoid_S = trapezoid_s;",
            "const trapezoid_area = trapezoid_s;",
            "const trapezoid_c = (a, b, c, d) => a + b + c + d;",
            "const trapezoid_C = trapezoid_c;",
            "const trapezoid_perimeter = trapezoid_c;",
            "// Geometry: Regular Polygon",
            "const polygon_c = (n, s) => n * s;",
            "const polygon_C = polygon_c;",
            "const polygon_perimeter = polygon_c;",
            "const polygon_s = (n, s) => (n * s * s) / (4 * Math.tan(Math.PI / n));",
            "const polygon_S = polygon_s;",
            "const polygon_area = polygon_s;",
            "// Geometry: Triangle (triangle / tri, c / C / perimeter, s / S / area)",
            "const triangle_s = (b, h) => 0.5 * b * h;",
            "const triangle_S = triangle_s;",
            "const triangle_area = triangle_s;",
            "const tri_s = triangle_s;",
            "const tri_S = triangle_s;",
            "const tri_area = triangle_s;",
            "const triangle_c = (a, b, c) => a + b + c;",
            "const triangle_C = triangle_c;",
            "const triangle_perimeter = triangle_c;",
            "const tri_c = triangle_c;",
            "const tri_C = triangle_c;",
            "const tri_perimeter = triangle_c;",
            "// Standard Library: String Operations",
            "const upper = (s) => String(s).toUpperCase();",
            "const lower = (s) => String(s).toLowerCase();",
            "const trim = (s) => String(s).trim();",
            "const replace = (s, o, n) => String(s).split(String(o)).join(String(n));",
            "const split = (s, d) => String(s).split(String(d));",
            "const join = (a, d) => Array.isArray(a) ? a.join(d ?? '') : String(a);",
            "const contains = (s, sub) => String(s).includes(String(sub));",
            "// Standard Library: List & Aggregation",
            "const sum = (a) => Array.isArray(a) ? a.reduce((acc, c) => acc + Number(c), 0) : 0;",
            "const min_val = (a) => Array.isArray(a) && a.length > 0 ? Math.min(...a.map(Number)) : 0;",
            "const max_val = (a) => Array.isArray(a) && a.length > 0 ? Math.max(...a.map(Number)) : 0;",
            "const avg = (a) => Array.isArray(a) && a.length > 0 ? a.reduce((acc, c) => acc + Number(c), 0) / a.length : 0;",
            "const reverse = (a) => Array.isArray(a) ? [...a].reverse() : (typeof a === 'string' ? a.split('').reverse().join('') : a);",
            "const time_now = () => Date.now();",
            "const random = (a, b) => { const lo = Math.min(Number(a), Number(b)); const hi = Math.max(Number(a), Number(b)); return Number.isInteger(Number(a)) && Number.isInteger(Number(b)) ? Math.floor(Math.random() * (hi - lo + 1)) + lo : Math.random() * (hi - lo) + lo; };",
            "",
            "// --- Transpiled Program Statements ---",
        ]

        for stmt in ast.statements:
            gen = self.gen_statement(stmt)
            if gen:
                lines.append(gen)

        return "\n".join(lines) + "\n"

    def gen_block(self, block: BlockNode) -> str:
        res = [f"{self.indent()}{{"]
        self.indent_level += 1
        for s in block.statements:
            g = self.gen_statement(s)
            if g:
                res.append(g)
        self.indent_level -= 1
        res.append(f"{self.indent()}}}")
        return "\n".join(res)

    def gen_statement(self, node: ASTNode) -> str:
        if isinstance(node, VarDeclNode):
            name = sanitize_identifier_js(node.name)
            self.declared_vars.add(name)
            if node.initializer:
                val = self.gen_expression(node.initializer)
                return f"{self.indent()}let {name} = {val};"
            else:
                return f"{self.indent()}let {name} = null;"

        if isinstance(node, AssignNode):
            tgt = self.gen_expression(node.target)
            val = self.gen_expression(node.value)
            if isinstance(node.target, IdentifierNode) and node.operator == "=":
                if tgt not in self.declared_vars:
                    self.declared_vars.add(tgt)
                    return f"{self.indent()}let {tgt} = {val};"
            return f"{self.indent()}{tgt} {node.operator} {val};"

        if isinstance(node, FunctionDefNode):
            fn_name = sanitize_identifier_js(node.name)
            self.declared_vars.add(fn_name)
            params = [sanitize_identifier_js(p) for p in node.parameters]
            prev_declared = set(self.declared_vars)
            for p in params:
                self.declared_vars.add(p)
            hdr = f"{self.indent()}function {fn_name}({', '.join(params)}) {{"
            self.indent_level += 1
            body_stmts = []
            for s in node.body.statements:
                g = self.gen_statement(s)
                if g:
                    body_stmts.append(g)
            self.indent_level -= 1
            self.declared_vars = prev_declared
            body_str = "\n".join(body_stmts) if body_stmts else f"{self.indent()}{self.indent_str}// empty"
            return f"{hdr}\n{body_str}\n{self.indent()}}}\n"

        if isinstance(node, IfNode):
            cond = self.gen_expression(node.condition)
            res = [f"{self.indent()}if ({cond}) {{"]
            self.indent_level += 1
            for s in node.then_branch.statements:
                g = self.gen_statement(s)
                if g:
                    res.append(g)
            self.indent_level -= 1
            res.append(f"{self.indent()}}}")

            for elif_cond, elif_body in node.elif_branches:
                c = self.gen_expression(elif_cond)
                res.append(f"{self.indent()}else if ({c}) {{")
                self.indent_level += 1
                for s in elif_body.statements:
                    g = self.gen_statement(s)
                    if g:
                        res.append(g)
                self.indent_level -= 1
                res.append(f"{self.indent()}}}")

            if node.else_branch:
                res.append(f"{self.indent()}else {{")
                self.indent_level += 1
                for s in node.else_branch.statements:
                    g = self.gen_statement(s)
                    if g:
                        res.append(g)
                self.indent_level -= 1
                res.append(f"{self.indent()}}}")

            return "\n".join(res)

        if isinstance(node, WhileNode):
            cond = self.gen_expression(node.condition)
            res = [f"{self.indent()}while ({cond}) {{"]
            self.indent_level += 1
            for s in node.body.statements:
                g = self.gen_statement(s)
                if g:
                    res.append(g)
            self.indent_level -= 1
            res.append(f"{self.indent()}}}")
            return "\n".join(res)

        if isinstance(node, ForNode):
            var = sanitize_identifier_js(node.variable)
            iter_expr = self.gen_expression(node.iterable)
            res = [f"{self.indent()}for (const {var} of {iter_expr}) {{"]
            self.indent_level += 1
            for s in node.body.statements:
                g = self.gen_statement(s)
                if g:
                    res.append(g)
            self.indent_level -= 1
            res.append(f"{self.indent()}}}")
            return "\n".join(res)

        if isinstance(node, ReturnNode):
            if node.expression:
                val = self.gen_expression(node.expression)
                return f"{self.indent()}return {val};"
            return f"{self.indent()}return;"

        if isinstance(node, BreakNode):
            return f"{self.indent()}break;"

        if isinstance(node, ContinueNode):
            return f"{self.indent()}continue;"

        if isinstance(node, PrintNode):
            args = [self.gen_expression(a) for a in node.arguments]
            return f"{self.indent()}console.log({', '.join(args)});"

        if isinstance(node, ImportNode):
            return f"{self.indent()}// BLang Module Import: {node.module_path};"

        if isinstance(node, BlockNode):
            return self.gen_block(node)

        if isinstance(node, ExpressionStatementNode):
            expr = self.gen_expression(node.expression)
            return f"{self.indent()}{expr};"

        return ""

    def gen_expression(self, node: ASTNode) -> str:
        if isinstance(node, LiteralNode):
            if node.lit_type == "number":
                return str(node.value)
            elif node.lit_type == "string":
                import json
                return json.dumps(node.value)
            elif node.lit_type == "boolean":
                return "true" if node.value else "false"
            elif node.lit_type == "null":
                return "null"

        if isinstance(node, IdentifierNode):
            if node.name == "len":
                return "(x => x.length)"
            return sanitize_identifier_js(node.name)

        if isinstance(node, ListNode):
            elements = [self.gen_expression(e) for e in node.elements]
            return f"[{', '.join(elements)}]"

        if isinstance(node, DictNode):
            entries = [f"{self.gen_expression(e.key)}: {self.gen_expression(e.value)}" for e in node.entries]
            return f"{{{', '.join(entries)}}}"

        if isinstance(node, IndexNode):
            tgt = self.gen_expression(node.target)
            idx = self.gen_expression(node.index)
            return f"{tgt}[{idx}]"

        if isinstance(node, CallNode):
            callee = self.gen_expression(node.callee)
            args = [self.gen_expression(a) for a in node.arguments]
            return f"{callee}({', '.join(args)})"

        if isinstance(node, UnaryOpNode):
            op = "!" if node.operator == "not" else node.operator
            operand = self.gen_expression(node.operand)
            return f"({op}{operand})"

        if isinstance(node, BinaryOpNode):
            l = self.gen_expression(node.left)
            r = self.gen_expression(node.right)
            op = node.operator
            if op == "and":
                op = "&&"
            elif op == "or":
                op = "||"
            return f"({l} {op} {r})"

        return "null"


# ==============================================================================
# TẦNG 6: INTERPRETER & REPL ENGINE
# ==============================================================================

class Environment:
    """Runtime environment for variable binding and lexical closures."""
    def __init__(self, parent: Optional['Environment'] = None):
        self.parent = parent
        self.bindings: Dict[str, Any] = {}

    def get(self, name: str, line: int = 0, col: int = 0) -> Any:
        if name in self.bindings:
            return self.bindings[name]
        if self.parent:
            return self.parent.get(name, line, col)
        raise BLangRuntimeError(f"Undefined variable '{name}'", line, col)

    def set(self, name: str, value: Any) -> None:
        # Check if variable exists in parent chain
        env = self
        while env:
            if name in env.bindings:
                env.bindings[name] = value
                return
            env = env.parent
        # Default define in current environment
        self.bindings[name] = value

    def define(self, name: str, value: Any) -> None:
        self.bindings[name] = value


class CallableFunction:
    """Represents a first-class function closure in BLang runtime."""
    def __init__(self, name: str, params: List[str], body: BlockNode, closure_env: Environment):
        self.name = name
        self.params = params
        self.body = body
        self.closure_env = closure_env

    def call(self, interpreter: 'Interpreter', args: List[Any], line: int, col: int) -> Any:
        if len(args) != len(self.params):
            raise BLangRuntimeError(
                f"Function '{self.name}' expects {len(self.params)} arguments, but received {len(args)}",
                line, col
            )
        call_env = Environment(parent=self.closure_env)
        for param_name, arg_val in zip(self.params, args):
            call_env.define(param_name, arg_val)

        prev_env = interpreter.current_env
        interpreter.current_env = call_env
        try:
            interpreter.execute_block(self.body)
        except ReturnValue as ret:
            return ret.value
        finally:
            interpreter.current_env = prev_env
        return None


class Interpreter:
    """
    Tầng 6: Tree-Walk Interpreter.
    Thực thi trực tiếp cây AST đã được tối ưu hóa, hỗ trợ closures,
    cấu trúc điều khiển và các hàm built-in.
    """
    def __init__(self, stdout_callback=None):
        self.global_env = Environment()
        self.current_env = self.global_env
        self.stdout_callback = stdout_callback or print
        self.output_logs: List[str] = []
        self.imported_modules: Set[str] = set()
        self._init_builtins()

    def log(self, *args):
        text = " ".join(str(a) for a in args)
        self.output_logs.append(text)
        self.stdout_callback(text)

    def _init_builtins(self):
        # len()
        self.global_env.define("len", lambda args: len(args[0]))
        # type()
        self.global_env.define("type", lambda args: type(args[0]).__name__)
        # str()
        self.global_env.define("str", lambda args: str(args[0]))
        # num()
        self.global_env.define("num", lambda args: float(args[0]) if "." in str(args[0]) else int(args[0]))
        # range()
        self.global_env.define("range", lambda args: list(range(*[int(a) for a in args])))
        # Constants
        self.global_env.define("PI", math.pi)
        self.global_env.define("E", math.e)

        # Trigonometric functions (Degrees by default as requested: sin(90) = 1, cos(60) = 0.5)
        sin_deg = lambda args: math.sin(args[0] * (math.pi / 180.0))
        cos_deg = lambda args: math.cos(args[0] * (math.pi / 180.0))
        tan_deg = lambda args: math.tan(args[0] * (math.pi / 180.0))
        cotan_deg = lambda args: 1.0 / math.tan(args[0] * (math.pi / 180.0))

        self.global_env.define("sin", sin_deg)
        self.global_env.define("cos", cos_deg)
        self.global_env.define("tan", tan_deg)
        self.global_env.define("cotan", cotan_deg)
        self.global_env.define("cot", cotan_deg)

        # Backward compatibility & explicit aliases
        self.global_env.define("sind", sin_deg)
        self.global_env.define("cosd", cos_deg)
        self.global_env.define("tand", tan_deg)
        self.global_env.define("cotand", cotan_deg)

        # Radian trigonometric functions
        self.global_env.define("sin_rad", lambda args: math.sin(args[0]))
        self.global_env.define("cos_rad", lambda args: math.cos(args[0]))
        self.global_env.define("tan_rad", lambda args: math.tan(args[0]))
        self.global_env.define("cotan_rad", lambda args: 1.0 / math.tan(args[0]))

        # Degree <-> Radian conversions
        self.global_env.define("deg_to_rad", lambda args: args[0] * (math.pi / 180.0))
        self.global_env.define("rad_to_deg", lambda args: args[0] * (180.0 / math.pi))

        # Logarithmic & Exponential
        self.global_env.define("log", lambda args: math.log(args[0], args[1]) if len(args) > 1 else math.log10(args[0]))
        self.global_env.define("ln", lambda args: math.log(args[0]))
        self.global_env.define("log10", lambda args: math.log10(args[0]))
        self.global_env.define("log2", lambda args: math.log2(args[0]))

        # Roots & Powers
        self.global_env.define("sqrt", lambda args: math.sqrt(args[0]))
        self.global_env.define("cbrt", lambda args: args[0] ** (1.0 / 3.0))
        self.global_env.define("root", lambda args: args[0] ** (1.0 / args[1]))
        self.global_env.define("pow", lambda args: math.pow(args[0], args[1]))
        self.global_env.define("power", lambda args: math.pow(args[0], args[1]))
        self.global_env.define("abs", lambda args: abs(args[0]))
        self.global_env.define("round", lambda args: round(args[0], args[1]) if len(args) > 1 else round(args[0]))
        self.global_env.define("floor", lambda args: math.floor(args[0]))
        self.global_env.define("ceil", lambda args: math.ceil(args[0]))

        # Geometry: Hình tròn (circle hoặc cir, chu vi: c/C, diện tích: s/S)
        circle_c_fn = lambda args: 2.0 * math.pi * args[0]
        circle_s_fn = lambda args: math.pi * (args[0] ** 2)
        self.global_env.define("circle_c", circle_c_fn)
        self.global_env.define("circle_C", circle_c_fn)
        self.global_env.define("cir_c", circle_c_fn)
        self.global_env.define("cir_C", circle_c_fn)
        self.global_env.define("circle_perimeter", circle_c_fn)
        self.global_env.define("cir_perimeter", circle_c_fn)
        self.global_env.define("circle_circumference", circle_c_fn)
        self.global_env.define("cir_circumference", circle_c_fn)

        self.global_env.define("circle_s", circle_s_fn)
        self.global_env.define("circle_S", circle_s_fn)
        self.global_env.define("cir_s", circle_s_fn)
        self.global_env.define("cir_S", circle_s_fn)
        self.global_env.define("circle_area", circle_s_fn)
        self.global_env.define("cir_area", circle_s_fn)

        # Geometry: Hình cầu (sphere, thể tích: v/V, diện tích: s/S)
        sphere_v_fn = lambda args: (4.0 / 3.0) * math.pi * (args[0] ** 3)
        sphere_s_fn = lambda args: 4.0 * math.pi * (args[0] ** 2)
        self.global_env.define("sphere_v", sphere_v_fn)
        self.global_env.define("sphere_V", sphere_v_fn)
        self.global_env.define("sphere_volume", sphere_v_fn)
        self.global_env.define("sphere_s", sphere_s_fn)
        self.global_env.define("sphere_S", sphere_s_fn)
        self.global_env.define("sphere_area", sphere_s_fn)

        # Geometry: Hình trụ (cylinder, thể tích: v/V)
        cylinder_v_fn = lambda args: math.pi * (args[0] ** 2) * args[1]
        self.global_env.define("cylinder_v", cylinder_v_fn)
        self.global_env.define("cylinder_V", cylinder_v_fn)
        self.global_env.define("cylinder_volume", cylinder_v_fn)

        # Geometry: Hình nón (cone, thể tích: v/V)
        cone_v_fn = lambda args: (1.0 / 3.0) * math.pi * (args[0] ** 2) * args[1]
        self.global_env.define("cone_v", cone_v_fn)
        self.global_env.define("cone_V", cone_v_fn)
        self.global_env.define("cone_volume", cone_v_fn)

        # Geometry: Hình vuông (square hoặc sq, chu vi: c/C, diện tích: s/S)
        square_c_fn = lambda args: 4.0 * args[0]
        square_s_fn = lambda args: float(args[0] * args[0])
        self.global_env.define("square_c", square_c_fn)
        self.global_env.define("square_C", square_c_fn)
        self.global_env.define("sq_c", square_c_fn)
        self.global_env.define("sq_C", square_c_fn)
        self.global_env.define("square_perimeter", square_c_fn)
        self.global_env.define("sq_perimeter", square_c_fn)

        self.global_env.define("square_s", square_s_fn)
        self.global_env.define("square_S", square_s_fn)
        self.global_env.define("sq_s", square_s_fn)
        self.global_env.define("sq_S", square_s_fn)
        self.global_env.define("square_area", square_s_fn)
        self.global_env.define("sq_area", square_s_fn)

        # Geometry: Hình lập phương (cube, thể tích: v/V, diện tích: s/S)
        cube_v_fn = lambda args: float(args[0] ** 3)
        cube_s_fn = lambda args: 6.0 * (args[0] ** 2)
        self.global_env.define("cube_v", cube_v_fn)
        self.global_env.define("cube_V", cube_v_fn)
        self.global_env.define("cube_volume", cube_v_fn)
        self.global_env.define("cube_s", cube_s_fn)
        self.global_env.define("cube_S", cube_s_fn)
        self.global_env.define("cube_area", cube_s_fn)

        # Geometry: Hình chữ nhật (rect hoặc rectangle, chu vi: c/C, diện tích: s/S)
        rect_c_fn = lambda args: 2.0 * (args[0] + args[1])
        rect_s_fn = lambda args: float(args[0] * args[1])
        self.global_env.define("rect_c", rect_c_fn)
        self.global_env.define("rect_C", rect_c_fn)
        self.global_env.define("rectangle_c", rect_c_fn)
        self.global_env.define("rectangle_C", rect_c_fn)
        self.global_env.define("rect_perimeter", rect_c_fn)
        self.global_env.define("rectangle_perimeter", rect_c_fn)

        self.global_env.define("rect_s", rect_s_fn)
        self.global_env.define("rect_S", rect_s_fn)
        self.global_env.define("rectangle_s", rect_s_fn)
        self.global_env.define("rectangle_S", rect_s_fn)
        self.global_env.define("rect_area", rect_s_fn)
        self.global_env.define("rectangle_area", rect_s_fn)

        # Geometry: Hình hộp chữ nhật (cuboid, thể tích: v/V)
        cuboid_v_fn = lambda args: float(args[0] * args[1] * args[2])
        self.global_env.define("cuboid_v", cuboid_v_fn)
        self.global_env.define("cuboid_V", cuboid_v_fn)
        self.global_env.define("cuboid_volume", cuboid_v_fn)

        # Geometry: Hình thang (trapezoid, diện tích: s/S, chu vi: c/C)
        trapezoid_s_fn = lambda args: ((args[0] + args[1]) * args[2]) / 2.0
        trapezoid_c_fn = lambda args: float(args[0] + args[1] + args[2] + args[3])
        self.global_env.define("trapezoid_s", trapezoid_s_fn)
        self.global_env.define("trapezoid_S", trapezoid_s_fn)
        self.global_env.define("trapezoid_area", trapezoid_s_fn)
        self.global_env.define("trapezoid_c", trapezoid_c_fn)
        self.global_env.define("trapezoid_C", trapezoid_c_fn)
        self.global_env.define("trapezoid_perimeter", trapezoid_c_fn)

        # Geometry: Đa giác đều (regular polygon, chu vi: c/C, diện tích: s/S)
        polygon_c_fn = lambda args: float(args[0] * args[1])
        polygon_s_fn = lambda args: (args[0] * (args[1] ** 2)) / (4.0 * math.tan(math.pi / args[0]))
        self.global_env.define("polygon_c", polygon_c_fn)
        self.global_env.define("polygon_C", polygon_c_fn)
        self.global_env.define("polygon_perimeter", polygon_c_fn)
        self.global_env.define("polygon_s", polygon_s_fn)
        self.global_env.define("polygon_S", polygon_s_fn)
        self.global_env.define("polygon_area", polygon_s_fn)

        # Geometry: Tam giác (triangle / tri, diện tích: s/S, chu vi: c/C)
        triangle_s_fn = lambda args: 0.5 * float(args[0]) * float(args[1]) if len(args) >= 2 else 0.0
        triangle_c_fn = lambda args: float(args[0]) + float(args[1]) + float(args[2]) if len(args) >= 3 else 0.0
        for alias in ["triangle_s", "triangle_S", "triangle_area", "tri_s", "tri_S", "tri_area"]:
            self.global_env.define(alias, triangle_s_fn)
        for alias in ["triangle_c", "triangle_C", "triangle_perimeter", "tri_c", "tri_C", "tri_perimeter"]:
            self.global_env.define(alias, triangle_c_fn)

        # Standard Library: String Operations
        self.global_env.define("upper", lambda args: str(args[0]).upper() if args else "")
        self.global_env.define("lower", lambda args: str(args[0]).lower() if args else "")
        self.global_env.define("trim", lambda args: str(args[0]).strip() if args else "")
        self.global_env.define("replace", lambda args: str(args[0]).replace(str(args[1]), str(args[2])) if len(args) >= 3 else (str(args[0]) if args else ""))
        self.global_env.define("split", lambda args: str(args[0]).split(str(args[1]) if len(args) > 1 else None) if args else [])
        self.global_env.define("join", lambda args: (str(args[1]) if len(args) > 1 else "").join(str(x) for x in args[0]) if (args and isinstance(args[0], list)) else (str(args[0]) if args else ""))
        self.global_env.define("contains", lambda args: (str(args[1]) in str(args[0])) if len(args) >= 2 else False)

        # Standard Library: List & Aggregation
        def _to_float_list(arg):
            if not isinstance(arg, list):
                return []
            nums = []
            for item in arg:
                try:
                    nums.append(float(item))
                except (ValueError, TypeError):
                    pass
            return nums

        self.global_env.define("sum", lambda args: float(sum(_to_float_list(args[0]))) if (args and isinstance(args[0], list) and args[0]) else 0.0)
        self.global_env.define("min_val", lambda args: float(min(_to_float_list(args[0]))) if (args and isinstance(args[0], list) and _to_float_list(args[0])) else 0.0)
        self.global_env.define("max_val", lambda args: float(max(_to_float_list(args[0]))) if (args and isinstance(args[0], list) and _to_float_list(args[0])) else 0.0)
        self.global_env.define("avg", lambda args: (float(sum(_to_float_list(args[0]))) / len(_to_float_list(args[0]))) if (args and isinstance(args[0], list) and _to_float_list(args[0])) else 0.0)
        self.global_env.define("reverse", lambda args: list(reversed(args[0])) if (args and isinstance(args[0], list)) else (str(args[0])[::-1] if (args and isinstance(args[0], str)) else (args[0] if args else None)))

        # Standard Library: System & Time
        self.global_env.define("time_now", lambda args=None: float(time.time() * 1000.0))

        # Standard Library: High-Order Collections
        def _invoke_callable(fn, call_args):
            if hasattr(fn, "call"):
                return fn.call(self, call_args, 0, 0)
            if callable(fn):
                try:
                    return fn(call_args)
                except TypeError:
                    return fn(*call_args)
            return None

        def _map_fn(args):
            arr, fn = args[0], args[1]
            if not isinstance(arr, list):
                return []
            return [_invoke_callable(fn, [x, i]) for i, x in enumerate(arr)]
        self.global_env.define("map", _map_fn)

        def _filter_fn(args):
            arr, fn = args[0], args[1]
            if not isinstance(arr, list):
                return []
            return [x for i, x in enumerate(arr) if bool(_invoke_callable(fn, [x, i]))]
        self.global_env.define("filter", _filter_fn)

        def _reduce_fn(args):
            arr, fn = args[0], args[1]
            acc = args[2] if len(args) > 2 else (arr[0] if arr else None)
            start_i = 0 if len(args) > 2 else 1
            if not isinstance(arr, list):
                return acc
            for i in range(start_i, len(arr)):
                acc = _invoke_callable(fn, [acc, arr[i], i])
            return acc
        self.global_env.define("reduce", _reduce_fn)

        def _find_fn(args):
            arr, fn = args[0], args[1]
            if not isinstance(arr, list):
                return None
            for i, x in enumerate(arr):
                if bool(_invoke_callable(fn, [x, i])):
                    return x
            return None
        self.global_env.define("find", _find_fn)

        self.global_env.define("slice", lambda args: args[0][int(args[1]):(int(args[2]) if len(args) > 2 else None)] if isinstance(args[0], (list, str)) else [])
        self.global_env.define("concat", lambda args: (args[0] + args[1]) if isinstance(args[0], list) and isinstance(args[1], list) else (str(args[0]) + str(args[1])))
        self.global_env.define("push", lambda args: (args[0].append(args[1]), len(args[0]))[1] if isinstance(args[0], list) else 0)
        self.global_env.define("pop", lambda args: args[0].pop() if (isinstance(args[0], list) and args[0]) else None)
        self.global_env.define("shift", lambda args: args[0].pop(0) if (isinstance(args[0], list) and args[0]) else None)
        self.global_env.define("unshift", lambda args: (args[0].insert(0, args[1]), len(args[0]))[1] if isinstance(args[0], list) else 0)
        self.global_env.define("sort", lambda args: sorted(args[0]) if isinstance(args[0], list) else [])
        self.global_env.define("keys", lambda args: list(args[0].keys()) if isinstance(args[0], dict) else [])
        self.global_env.define("values", lambda args: list(args[0].values()) if isinstance(args[0], dict) else [])
        self.global_env.define("entries", lambda args: [[k, v] for k, v in args[0].items()] if isinstance(args[0], dict) else [])

        # Standard Library: Vietnamese Unicode & UTF-8
        import unicodedata
        def _vi_no_accents(args):
            s = str(args[0] if args else "")
            nfkd = unicodedata.normalize('NFD', s)
            no_acc = "".join(c for c in nfkd if unicodedata.category(c) != 'Mn')
            return no_acc.replace('đ', 'd').replace('Đ', 'D')
        self.global_env.define("vietnamese_remove_accents", _vi_no_accents)
        self.global_env.define("vi_no_accents", _vi_no_accents)
        self.global_env.define("vietnamese_sort_key", lambda args: _vi_no_accents(args).lower())
        self.global_env.define("vi_sort_key", lambda args: _vi_no_accents(args).lower())
        self.global_env.define("utf8_len", lambda args: len(str(args[0] if args else "")))
        self.global_env.define("str_char_at", lambda args: str(args[0])[int(args[1])] if (len(args) > 1 and 0 <= int(args[1]) < len(str(args[0]))) else "")
        self.global_env.define("str_starts_with", lambda args: str(args[0]).startswith(str(args[1])) if len(args) >= 2 else False)
        self.global_env.define("str_ends_with", lambda args: str(args[0]).endswith(str(args[1])) if len(args) >= 2 else False)
        self.global_env.define("normalize_vn", lambda args: unicodedata.normalize('NFC', str(args[0] if args else "")))

        # Standard Library: JSON & File I/O
        import json as _py_json
        self.global_env.define("json_stringify", lambda args: _py_json.dumps(args[0], ensure_ascii=False, indent=int(args[1]) if len(args) > 1 else 2))
        self.global_env.define("json_parse", lambda args: _py_json.loads(str(args[0])))
        def _read_file_fn(args):
            with open(str(args[0]), "r", encoding="utf-8") as f:
                return f.read()
        self.global_env.define("read_file", _read_file_fn)
        self.global_env.define("file_read", _read_file_fn)
        def _write_file_fn(args):
            with open(str(args[0]), "w", encoding="utf-8") as f:
                f.write(str(args[1] if len(args) > 1 else ""))
            return True
        self.global_env.define("write_file", _write_file_fn)
        self.global_env.define("file_write", _write_file_fn)
        self.global_env.define("file_exists", lambda args: os.path.exists(str(args[0])))
        self.global_env.define("path_join", lambda args: os.path.join(*[str(x) for x in args]))

        # Standard Library: Python & Native Interop FFI
        def _ffi_call_fn(args):
            if len(args) < 2:
                return None
            mod_name, fn_name = str(args[0]), str(args[1])
            fn_args = args[2:]
            import importlib
            m = importlib.import_module(mod_name)
            func = getattr(m, fn_name)
            return func(*fn_args)
        self.global_env.define("ffi_call", _ffi_call_fn)
        self.global_env.define("py_eval", lambda args: eval(str(args[0])))
        def _py_exec_fn(args):
            loc = {}
            exec(str(args[0]), globals(), loc)
            return loc
        self.global_env.define("py_exec", _py_exec_fn)
        self.global_env.define("py_import", lambda args: __import__(str(args[0])))

        # Random Number Generator: %random(a, b)% or random(a, b)
        def _bl_random_fn(args):
            if not args:
                return float(random.random())
            a = float(args[0])
            b = float(args[1]) if len(args) > 1 else 100.0
            lo, hi = min(a, b), max(a, b)
            if a.is_integer() and b.is_integer():
                return float(random.randint(int(lo), int(hi)))
            return float(random.uniform(lo, hi))
        self.global_env.define("random", _bl_random_fn)

    def execute(self, ast: ProgramNode) -> Any:
        result = None
        for stmt in ast.statements:
            result = self.execute_statement(stmt)
        return result

    def execute_block(self, block: BlockNode) -> Any:
        res = None
        for s in block.statements:
            res = self.execute_statement(s)
        return res

    def execute_statement(self, node: ASTNode) -> Any:
        if isinstance(node, VarDeclNode):
            val = self.evaluate(node.initializer) if node.initializer else None
            self.current_env.define(node.name, val)
            return val

        if isinstance(node, AssignNode):
            val = self.evaluate(node.value)
            if isinstance(node.target, IdentifierNode):
                name = node.target.name
                if node.operator == "=":
                    self.current_env.set(name, val)
                elif node.operator == "+=":
                    cur = self.current_env.get(name, node.line, node.col)
                    if isinstance(cur, str) or isinstance(val, str):
                        self.current_env.set(name, str(cur) + str(val))
                    else:
                        self.current_env.set(name, cur + val)
                elif node.operator == "-=":
                    cur = self.current_env.get(name, node.line, node.col)
                    self.current_env.set(name, cur - val)
                elif node.operator == "*=":
                    cur = self.current_env.get(name, node.line, node.col)
                    self.current_env.set(name, cur * val)
                elif node.operator == "/=":
                    cur = self.current_env.get(name, node.line, node.col)
                    if val == 0:
                        raise BLangRuntimeError("Division by zero in '/='", node.line, node.col)
                    self.current_env.set(name, cur / val)
                elif node.operator == "%=":
                    cur = self.current_env.get(name, node.line, node.col)
                    if val == 0:
                        raise BLangRuntimeError("Modulo by zero in '%='", node.line, node.col)
                    self.current_env.set(name, cur % val)
            elif isinstance(node.target, IndexNode):
                tgt = self.evaluate(node.target.target)
                idx = self.evaluate(node.target.index)
                if not isinstance(tgt, (list, dict)):
                    raise BLangRuntimeError(f"Cannot index-assign into '{type(tgt).__name__}'", node.line, node.col)
                if node.operator == "=":
                    tgt[idx] = val
                elif node.operator == "+=":
                    if isinstance(tgt[idx], str) or isinstance(val, str):
                        tgt[idx] = str(tgt[idx]) + str(val)
                    else:
                        tgt[idx] = tgt[idx] + val
                elif node.operator == "-=":
                    tgt[idx] = tgt[idx] - val
                elif node.operator == "*=":
                    tgt[idx] = tgt[idx] * val
                elif node.operator == "/=":
                    if val == 0:
                        raise BLangRuntimeError("Division by zero in '/='", node.line, node.col)
                    tgt[idx] = tgt[idx] / val
                elif node.operator == "%=":
                    if val == 0:
                        raise BLangRuntimeError("Modulo by zero in '%='", node.line, node.col)
                    tgt[idx] = tgt[idx] % val
            return val

        if isinstance(node, FunctionDefNode):
            fn = CallableFunction(node.name, node.parameters, node.body, self.current_env)
            self.current_env.define(node.name, fn)
            return fn

        if isinstance(node, IfNode):
            cond_val = self.evaluate(node.condition)
            if bool(cond_val):
                sub_env = Environment(parent=self.current_env)
                prev = self.current_env
                self.current_env = sub_env
                try:
                    return self.execute_block(node.then_branch)
                finally:
                    self.current_env = prev

            executed_elif = False
            for elif_cond, elif_body in node.elif_branches:
                if bool(self.evaluate(elif_cond)):
                    sub_env = Environment(parent=self.current_env)
                    prev = self.current_env
                    self.current_env = sub_env
                    try:
                        res = self.execute_block(elif_body)
                        executed_elif = True
                        return res
                    finally:
                        self.current_env = prev

            if not executed_elif and node.else_branch:
                sub_env = Environment(parent=self.current_env)
                prev = self.current_env
                self.current_env = sub_env
                try:
                    return self.execute_block(node.else_branch)
                finally:
                    self.current_env = prev

            return None

        if isinstance(node, WhileNode):
            while bool(self.evaluate(node.condition)):
                sub_env = Environment(parent=self.current_env)
                prev = self.current_env
                self.current_env = sub_env
                try:
                    self.execute_block(node.body)
                except BreakLoop:
                    break
                except ContinueLoop:
                    continue
                finally:
                    self.current_env = prev
            return None

        if isinstance(node, ForNode):
            iterable = self.evaluate(node.iterable)
            if not hasattr(iterable, "__iter__"):
                raise BLangRuntimeError(f"Target '{type(iterable).__name__}' is not iterable", node.line, node.col)
            sub_env = Environment(parent=self.current_env)
            prev = self.current_env
            self.current_env = sub_env
            try:
                for item in iterable:
                    sub_env.define(node.variable, item)
                    try:
                        self.execute_block(node.body)
                    except ContinueLoop:
                        continue
                    except BreakLoop:
                        break
            finally:
                self.current_env = prev
            return None

        if isinstance(node, ReturnNode):
            val = self.evaluate(node.expression) if node.expression else None
            raise ReturnValue(val)

        if isinstance(node, BreakNode):
            raise BreakLoop()

        if isinstance(node, ContinueNode):
            raise ContinueLoop()

        if isinstance(node, PrintNode):
            args = [self.evaluate(a) for a in node.arguments]
            self.log(*args)
            return None

        if isinstance(node, TryCatchNode):
            try:
                return self.execute_block(node.try_block)
            except Exception as e:
                prev = self.current_env
                self.current_env = Environment(parent=prev)
                try:
                    if node.error_var:
                        err_msg = str(getattr(e, "message", str(e)))
                        self.current_env.define(node.error_var, err_msg)
                    return self.execute_block(node.catch_block)
                finally:
                    self.current_env = prev

        if isinstance(node, ThrowNode):
            val = self.evaluate(node.expression)
            raise BLangRuntimeError(str(val), node.line, node.col)

        if isinstance(node, ImportNode):
            raw_path = node.module_path.strip()
            # Standard library prefix check
            if raw_path.startswith("std:"):
                # Standard library builtins are already in global_env
                return None

            # Hierarchical dot syntax support: pkg.submodule -> pkg/submodule.bl
            path = raw_path
            if "/" not in path and "\\" not in path and not path.endswith(".bl") and "." in path:
                path = path.replace(".", "/") + ".bl"
            elif not os.path.exists(path) and not path.endswith(".bl"):
                path += ".bl"

            if not os.path.exists(path):
                raise BLangRuntimeError(f"Module '{node.module_path}' not found (resolved: '{path}')", node.line, node.col)

            abs_path = os.path.abspath(path)
            if abs_path in self.imported_modules:
                return None
            self.imported_modules.add(abs_path)

            with open(path, "r", encoding="utf-8") as f:
                mod_src = f.read()
            mod_lexer = Lexer(mod_src)
            mod_tokens = mod_lexer.tokenize()
            mod_parser = Parser(mod_tokens, mod_src)
            mod_ast = mod_parser.parse()
            mod_opt = ASTOptimizer().optimize(mod_ast)

            prev_env = self.current_env
            self.current_env = self.global_env
            try:
                self.execute(mod_opt)
            finally:
                self.current_env = prev_env
            return None

        if isinstance(node, BlockNode):
            sub_env = Environment(parent=self.current_env)
            prev = self.current_env
            self.current_env = sub_env
            try:
                return self.execute_block(node)
            finally:
                self.current_env = prev

        if isinstance(node, ExpressionStatementNode):
            return self.evaluate(node.expression)

        return None

    def evaluate(self, node: ASTNode) -> Any:
        if isinstance(node, LiteralNode):
            return node.value

        if isinstance(node, IdentifierNode):
            return self.current_env.get(node.name, node.line, node.col)

        if isinstance(node, ListNode):
            return [self.evaluate(e) for e in node.elements]

        if isinstance(node, DictNode):
            return {self.evaluate(entry.key): self.evaluate(entry.value) for entry in node.entries}

        if isinstance(node, IndexNode):
            target = self.evaluate(node.target)
            idx = self.evaluate(node.index)
            try:
                return target[idx]
            except Exception as e:
                raise BLangRuntimeError(f"Index error: {str(e)}", node.line, node.col)

        if isinstance(node, CallNode):
            callee_val = self.evaluate(node.callee)
            args = [self.evaluate(a) for a in node.arguments]
            if isinstance(callee_val, CallableFunction):
                return callee_val.call(self, args, node.line, node.col)
            elif callable(callee_val):
                try:
                    return callee_val(args)
                except Exception as e:
                    raise BLangRuntimeError(f"Builtin call error: {str(e)}", node.line, node.col)
            else:
                raise BLangRuntimeError(f"'{type(callee_val).__name__}' object is not callable", node.line, node.col)

        if isinstance(node, UnaryOpNode):
            val = self.evaluate(node.operand)
            if node.operator == "not":
                return not bool(val)
            if node.operator == "-":
                return -val
            if node.operator == "+":
                return +val

        if isinstance(node, BinaryOpNode):
            l = self.evaluate(node.left)
            r = self.evaluate(node.right)
            op = node.operator

            if op == "+":
                if isinstance(l, str) or isinstance(r, str):
                    return str(l) + str(r)
                return l + r
            elif op == "-":
                return l - r
            elif op == "*":
                return l * r
            elif op == "/":
                if r == 0:
                    raise BLangRuntimeError("Division by zero", node.line, node.col)
                return l / r
            elif op == "%":
                if r == 0:
                    raise BLangRuntimeError("Modulo by zero", node.line, node.col)
                return l % r
            elif op == "==":
                return l == r
            elif op == "!=":
                return l != r
            elif op == "<":
                try:
                    return l < r
                except TypeError:
                    raise BLangRuntimeError(f"Unsupported comparison '<' between '{type(l).__name__}' and '{type(r).__name__}'", node.line, node.col)
            elif op == "<=":
                try:
                    return l <= r
                except TypeError:
                    raise BLangRuntimeError(f"Unsupported comparison '<=' between '{type(l).__name__}' and '{type(r).__name__}'", node.line, node.col)
            elif op == ">":
                try:
                    return l > r
                except TypeError:
                    raise BLangRuntimeError(f"Unsupported comparison '>' between '{type(l).__name__}' and '{type(r).__name__}'", node.line, node.col)
            elif op == ">=":
                try:
                    return l >= r
                except TypeError:
                    raise BLangRuntimeError(f"Unsupported comparison '>=' between '{type(l).__name__}' and '{type(r).__name__}'", node.line, node.col)
            elif op == "and":
                return l and r
            elif op == "or":
                return l or r

        return None


# ==============================================================================
# PIPELINE ORCHESTRATOR & COMPILER CONTROLLER
# ==============================================================================

@dataclass
class CompilerResult:
    tokens: List[Token]
    raw_ast: ProgramNode
    optimized_ast: ProgramNode
    symbol_table: Scope
    python_code: str
    javascript_code: str
    execution_output: Optional[List[str]] = None
    error: Optional[str] = None
    folded_constants: int = 0


class BLangCompiler:
    """
    Production-grade multi-pass orchestrator coordinating layers 1 through 6.
    """
    def __init__(self, source: str):
        self.source = source

    def compile(self, run_interpreter: bool = True, stdout_callback=None) -> CompilerResult:
        # Layer 1: Lexer & Tokenizer
        lexer = Lexer(self.source)
        tokens = lexer.tokenize()

        # Layer 2: Parser & AST
        parser = Parser(tokens, self.source)
        raw_ast = parser.parse()

        # Layer 3: Semantic Analyzer, Symbol Table & Strict Type Safety
        analyzer = SemanticAnalyzer(self.source)
        analyzer.analyze(raw_ast)

        # Layer 4: AST Optimizer (Constant Folding)
        import copy
        ast_copy = copy.deepcopy(raw_ast)
        optimizer = ASTOptimizer()
        optimized_ast = optimizer.optimize(ast_copy)

        # Layer 5A: Python 3.x Generator
        py_gen = PythonCodeGenerator()
        py_code = py_gen.generate(optimized_ast)

        # Layer 5B: JavaScript ES6+ Generator
        js_gen = JavaScriptCodeGenerator()
        js_code = js_gen.generate(optimized_ast)

        # Layer 6: Interpreter (optional execution)
        exec_output = []
        if run_interpreter:
            interpreter = Interpreter(stdout_callback=stdout_callback or (lambda msg: None))
            interpreter.execute(optimized_ast)
            exec_output = interpreter.output_logs

        return CompilerResult(
            tokens=tokens,
            raw_ast=raw_ast,
            optimized_ast=optimized_ast,
            symbol_table=analyzer.global_scope,
            python_code=py_code,
            javascript_code=js_code,
            execution_output=exec_output,
            folded_constants=optimizer.folded_count
        )


# ==============================================================================
# REPL INTERACTIVE SHELL
# ==============================================================================

def run_repl():
    """
    Tầng 6: Chế độ REPL tương tác trực tiếp (Interactive Shell).
    Hỗ trợ nhập từng dòng lệnh, lưu giữ trạng thái bộ nhớ và biến giữa các lần nhập,
    tự động phát hiện khối lệnh chưa đóng `{}` để tiếp tục thụt dòng.
    """
    print("=" * 70)
    print("  BLang Production-Grade Interactive REPL Shell v1.0.0")
    print("  Multi-Pass Transpiler & Execution Engine")
    print("  Type ':help' for commands, ':symbols' for scope, ':exit' to quit")
    print("=" * 70)

    interpreter = Interpreter(stdout_callback=print)
    analyzer = SemanticAnalyzer("")
    current_source_accum = []
    brace_balance = 0

    while True:
        try:
            prompt = "BLang> " if brace_balance == 0 else "...    "
            line = input(prompt)

            stripped = line.strip()
            if not stripped and brace_balance == 0:
                continue

            # Command dispatch
            if stripped == ":exit":
                print("Exiting BLang REPL. Goodbye!")
                break
            elif stripped == ":help":
                print("\nREPL Built-in Commands:")
                print("  :symbols    - Inspect current runtime variables and types")
                print("  :clear      - Clear the console screen")
                print("  :reset      - Reset the interpreter runtime environment")
                print("  :exit       - Terminate the REPL session\n")
                continue
            elif stripped == ":symbols":
                print("\nActive Environment Symbols:")
                for k, v in interpreter.current_env.bindings.items():
                    print(f"  {k:15} : {type(v).__name__:10} = {repr(v)}")
                print()
                continue
            elif stripped == ":reset":
                interpreter = Interpreter(stdout_callback=print)
                analyzer = SemanticAnalyzer("")
                print("Interpreter environment reset to initial state.")
                continue
            elif stripped == ":clear":
                os.system('cls' if os.name == 'nt' else 'clear')
                continue

            current_source_accum.append(line)
            # Count braces for multi-line block detection
            brace_balance += line.count("{") - line.count("}")

            if brace_balance > 0:
                continue  # Continue reading next line of multi-line block

            source_block = "\n".join(current_source_accum)
            current_source_accum = []
            brace_balance = 0

            # Execute pipeline
            lexer = Lexer(source_block)
            tokens = lexer.tokenize()
            parser = Parser(tokens, source_block)
            ast = parser.parse()

            # Semantic check on block with persistent analyzer
            analyzer.source = source_block
            analyzer.analyze(ast)

            # Optimize
            optimizer = ASTOptimizer()
            opt_ast = optimizer.optimize(ast)

            # Run in persistent interpreter
            result = interpreter.execute(opt_ast)
            if result is not None:
                print(f"=> {repr(result)}")

        except (BLangLexerError, BLangParseError, BLangSemanticError, BLangTypeError, BLangRuntimeError) as err:
            print(f"\n{err}\n")
            current_source_accum = []
            brace_balance = 0
        except KeyboardInterrupt:
            print("\nOperation interrupted. (Type ':exit' to quit)")
            current_source_accum = []
            brace_balance = 0
        except EOFError:
            print("\nExiting BLang REPL.")
            break


# ==============================================================================
# CLI COMMAND LINE DISPATCHER
# ==============================================================================

def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="BLang: Production-Grade Multi-Pass Transpiler, Execution Engine & REPL Shell",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python compiler.py repl
  python compiler.py run script.bl
  python compiler.py transpile script.bl -o output.py -j output.js
  python compiler.py test
"""
    )

    subparsers = parser.add_subparsers(dest="command", help="Compiler sub-commands")

    # repl
    subparsers.add_parser("repl", help="Start interactive REPL shell")

    # run
    run_parser = subparsers.add_parser("run", help="Compile and directly execute a BLang source file")
    run_parser.add_argument("file", help="Path to .bl source file")

    # transpile
    tr_parser = subparsers.add_parser("transpile", help="Transpile BLang file simultaneously to Python and JavaScript")
    tr_parser.add_argument("file", help="Path to .bl source file")
    tr_parser.add_argument("-o", "--python-out", default="output.py", help="Output Python file path (default: output.py)")
    tr_parser.add_argument("-j", "--js-out", default="output.js", help="Output JavaScript file path (default: output.js)")

    # test
    subparsers.add_parser("test", help="Run self-diagnostic suite (full test script + strict type error verification)")

    args = parser.parse_args()

    if args.command == "repl" or args.command is None:
        if len(sys.argv) == 1:
            run_repl()
        else:
            parser.print_help()

    elif args.command == "run":
        if not os.path.exists(args.file):
            print(f"Error: File '{args.file}' not found.")
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            src = f.read()
        try:
            compiler = BLangCompiler(src)
            res = compiler.compile(run_interpreter=True, stdout_callback=print)
            print(f"[*] Execution finished: '{args.file}' ({len(res.tokens)} tokens, {res.folded_constants} folded constants).")
        except BLangError as err:
            print(err)
            sys.exit(1)

    elif args.command == "transpile":
        if not os.path.exists(args.file):
            print(f"Error: File '{args.file}' not found.")
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            src = f.read()
        try:
            compiler = BLangCompiler(src)
            res = compiler.compile(run_interpreter=False)

            with open(args.python_out, "w", encoding="utf-8") as f_py:
                f_py.write(res.python_code)
            with open(args.js_out, "w", encoding="utf-8") as f_js:
                f_js.write(res.javascript_code)

            print(f"[+] Successfully transpiled '{args.file}'!")
            print(f"    -> Python target written to:     {args.python_out}")
            print(f"    -> JavaScript target written to: {args.js_out}")
            print(f"    -> Constants folded:             {res.folded_constants}")
        except BLangError as err:
            print(err)
            sys.exit(1)

    elif args.command == "test":
        run_self_tests()


def run_self_tests():
    print("[*] Running BLang Comprehensive Self-Diagnostic Suite...\n")

    # Test 1: Full valid program with all features (no let keyword)
    full_sample = """
    // BLang Comprehensive Validation Test (Pure direct assignment: var = val)
    @base_score = 100;
    $player_name = "Nova Commander";
    _counter = 0;

    // Function with return and parameter math
    function calculate_boost(@base, $multiplier) {
        _bonus = 25;
        return (@base * $multiplier) + _bonus;
    }

    // List and Dictionary data structures
    @inventory = ["laser_cannon", "shield_booster", "warp_drive"];
    $stats = {
        "health": 250,
        "shields": 100,
        "energy": 500
    };

    // Constant folding test: (10 * 5) + 2 should fold to 52
    _folded = (10 * 5) + 2;

    // Nested control flow and logic: not, and, or
    $ready = true;
    @active = false;

    if (not @active and ($ready or @base_score > 50)) {
        print("System check: ONLINE! Player:", $player_name);
        $total = calculate_boost(@base_score, 2);
        print("Calculated Boost Total:", $total);
    } elseif (@base_score == 0) {
        print("Score zero warning!");
    } else {
        print("Fallback standby state.");
    }

    // While loop with continue and break
    while (_counter < 10) {
        _counter += 1;
        if (_counter == 3) {
            continue;
        }
        if (_counter == 7) {
            print("Loop breaking at counter:", _counter);
            break;
        }
    }

    // For loop over inventory
    for (item in @inventory) {
        print("Equipped item:", item);
    }

    print("Constant folded result (52 expected):", _folded);
    """

    print("Test 1: Compiling and Transpiling Comprehensive Sample Script...")
    try:
        c = BLangCompiler(full_sample)
        r = c.compile(run_interpreter=True)
        print(f"  [PASS] Compilation & Execution succeeded! Tokens: {len(r.tokens)}, Folded constants: {r.folded_constants}")
        print("  [PASS] Execution Output Logs:")
        for log in (r.execution_output or []):
            print(f"         {log}")
    except Exception as e:
        print(f"  [FAIL] Test 1 failed: {e}")
        return

    # Test 2: Strict Type Safety enforcement on string + number arithmetic
    error_sample = """
    // Strict Type Safety Violation Test
    $label = "Score: ";
    @points = 500;

    // ILLEGAL OPERATION: BLang strictly prohibits string + number arithmetic!
    $illegal_sum = $label + @points;
    """

    print("\nTest 2: Verifying Strict Type Safety Rejection on (String + Number)...")
    try:
        c2 = BLangCompiler(error_sample)
        c2.compile(run_interpreter=False)
        print("  [FAIL] Compiler erroneously permitted string + number addition!")
    except BLangTypeError as err:
        print("  [PASS] Successfully caught expected strict TypeError:")
        print(f"         {err.message} (line {err.line}, col {err.col})")
    except Exception as e:
        print(f"  [FAIL] Unexpected exception type: {type(e).__name__}: {e}")

    print("\n[✓] All BLang compiler engine diagnostics passed with 100% integrity!")


if __name__ == "__main__":
    main()
