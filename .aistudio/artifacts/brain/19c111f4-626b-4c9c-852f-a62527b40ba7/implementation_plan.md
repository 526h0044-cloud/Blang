# BLang: Production-Grade Multi-Pass Transpiler, Execution Engine & Studio IDE

A complete compiler engineering implementation and interactive developer workbench for **BLang**, a modern curly-brace scripting language designed for web, app, game logic, automation, and scientific computing. BLang features lexical scoping, strict compile-time type safety preventing string-number arithmetic coercion, an AST constant-folding optimizer, dual code emission targeting Python 3.x (`output.py`) and JavaScript ES6+ (`output.js`), an internal tree-walk interpreter, and an interactive REPL shell.

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural design and user requirements are synthesized below based on your explicit preferences:

- **Confirmed Language Identity**: **BLang** — sleek, expressive curly-bracket syntax (`{}`) with support for identifiers featuring special sigils/characters (`_`, `@`, `$`), first-class functions, lists, dicts, and nested control flow.
- **Confirmed Presentation Format**: Full Studio IDE featuring live Code Editor, Token Inspector with line & column metrics, Interactive Visual AST, Scoped Symbol Table Inspector, Optimized AST viewer, Dual Codegen viewers (Python + JavaScript), Python Engine Viewer, and an in-browser Interactive REPL Shell.
- **Confirmed Local Delivery**: Standalone, clean, fully commented single-file script `compiler.py` ready to run with Python 3.x via CLI (`python compiler.py run script.bl`, `python compiler.py transpile script.bl`, or `python compiler.py repl`), alongside one-click export of `output.py` and `output.js`.

---

## 1. Overview & Core Concept

BLang is an expressive, multi-paradigm programming language engineered for cross-platform portability. It compiles cleanly to both standard Python 3.x (ideal for AI, data science, and backend microservices) and modern JavaScript ES6+ (ideal for web browsers, Node.js runtimes, and casual game engines).

### 6-Layer Architecture Pipeline

```
   ┌─────────────────────────────────────────────────────────────┐
   │                     BLang Source Code                       │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ Layer 1: Lexer & Tokenizer                                  │
   │ - Tracks Line & Column numbers for every Token              │
   │ - Identifiers: Letters, digits, _, @, $                     │
   │ - Keywords: print, if, elseif, else, for, while,            │
   │             function, end, return, and, or, not,            │
   │             true, false, break, continue, input, len, etc.  │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ Token Stream
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ Layer 2: Parser & AST Generator                             │
   │ - Recursive descent with operator precedence climbing       │
   │ - C/JS-style curly braces `{}` block delimiters             │
   │ - Lists `[...]`, Dictionaries `{k: v}`, Function definitions│
   └──────────────────────────────┬──────────────────────────────┘
                                  │ Raw AST
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ Layer 3: Semantic Analyzer & Strict Type Safety             │
   │ - Hierarchical Lexical Scoping (Global & Local Tables)      │
   │ - No duplicate variable re-declarations in same scope       │
   │ - Strict Type Enforcement: String + Number math -> TypeError │
   │   with exact Line & Column tracking                         │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ Checked AST & Symbol Table
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ Layer 4: AST Constant-Folding Optimizer                     │
   │ - Pre-computes deterministic compile-time literal math      │
   │ - e.g., (10 * 5) + 2 -> 52 before code generation           │
   └──────────────┬───────────────────────────────┬──────────────┘
                  │                               │
       ┌──────────┴───────────────┐   ┌───────────┴──────────────┐
       ▼                          ▼   ▼                          ▼
┌──────────────┐          ┌──────────────┐               ┌──────────────┐
│ Layer 5A:    │          │ Layer 5B:    │               │ Layer 6:     │
│ Python 3.x   │          │ JS (ES6+)    │               │ Interpreter  │
│ Generator    │          │ Generator    │               │ & REPL Shell │
│ (output.py)  │          │ (output.js)  │               │ (Live Eval)  │
└──────────────┘          └──────────────┘               └──────────────┘
```

---

## 2. Technical Architecture & Grammar Specification

### Grammar Highlights
- **Blocks**: Defined with curly braces `{ ... }`.
- **Functions**: `function calculate(@base, $rate) { return @base * $rate; }`
- **Variables**: Identifiers can contain alphanumeric characters, `_`, `@`, `$`. For example: `let @score = 100;`, `$user = "Alice";`, `_counter = 0;`.
- **Conditionals**: `if (condition) { ... } elseif (other) { ... } else { ... }`
- **Loops**: `while (condition) { ... }` and `for (item in list) { ... }` with `break` and `continue`.
- **Data Structures**: Lists `[1, 2, "three", true]` and Dictionaries `{"name": "BLang", "version": 1.0}`.
- **Built-in Functions**: `print(...)`, `len(collection)`, `type(value)`, `input(prompt)`.
- **Boolean Logic**: `and`, `or`, `not`, `true`, `false`.

### Strict Type Safety Invariant
The Semantic Analyzer maintains type states for variables. If a binary arithmetic operator (`+`, `-`, `*`, `/`) operates on an operand known to be `String` and another known to be `Number`, the compilation pipeline halts immediately with:
```
BLangSemanticError: TypeError at line 14, column 11:
Illegal arithmetic operation between 'string' ("Total: ") and 'number' ($score).
BLang enforces strict type safety: strings and numbers cannot be combined with '+', '-', '*', '/'.
```

### AST Constant Folding
Static binary expressions consisting of numeric literals (e.g. `10 * 5 + 2`) are simplified directly into a single `LiteralNumber(52)` node in Layer 4 before reaching the code generators.

---

## 3. Web Studio Interface Design & User Experience

The application is structured into a high-productivity compiler IDE with zero fluff:

### Workspace Sections
1. **Header Bar**:
   - Single-line wordmark: **BLang Studio**
   - Clean navigation tabs: *Editor & Pipeline*, *REPL Shell*, *Architecture & Guide*, *Python Engine Script*
   - Action controls: *Compile & Transpile*, *Run in Engine*, *Sample Programs Dropdown*, *Download Artifacts (.py, .js, compiler.py)*
2. **Main Workspace Layout**:
   - **Left Pane (Source Code Editor)**:
     - Syntax-highlighted code editor with line numbers, error gutter markers, and code presets:
       1. *Comprehensive Tour* (All features: functions, loops, dicts, lists, boolean logic, sigils)
       2. *Strict Type Error Trigger* (Demonstrates the strict `TypeError` halt on string + number)
       3. *Scientific Simulation* (Math calculations, constant folding verification)
       4. *Game Loop Logic* (Entities, state updates, break/continue)
   - **Right Pane (Multi-Stage Inspection Panels)**:
     - **Stage 1: Lexer (Token Stream)**: Tabular display of token index, token type, literal value, line number, column number.
     - **Stage 2 & 4: AST Visualizer**: Tree view comparing Raw AST and Optimized AST (highlighting folded constant expressions).
     - **Stage 3: Symbol Table & Scopes**: Tree view showing global scope, function scopes, declared variables, and inferred types.
     - **Stage 5: Dual Codegen**:
       - Side-by-side or tabbed view of generated `output.py` (Python 3.x) and `output.js` (JavaScript ES6+).
       - One-click copy, download buttons.
     - **Stage 6: Internal Interpreter Console**: Formatted execution console displaying stdout, return values, and execution metrics.
3. **Dedicated Interactive REPL Shell Tab**:
   - Live terminal emulator with prompt `BLang> ` supporting multi-line entry, command history (Up/Down arrow keys), built-in commands (`:help`, `:symbols`, `:ast`, `:reset`, `:clear`), and instantaneous evaluation.
4. **Python Engine Script & Local Execution Guide**:
   - Pristine, complete view of the Python single-file script `compiler.py` with one-click download.
   - Exact terminal instructions for macOS, Linux, and Windows to run CLI commands, generate files, and launch the terminal REPL.

---

## 4. Implementation Steps Planned

1. **Standalone Python Core (`compiler.py`)**:
   - Complete standard-library Python 3.8+ implementation (no external dependencies required):
     - `Token`, `TokenType`, `Lexer` with exact line/col tracking.
     - `ASTNode` classes (`Program`, `FunctionDef`, `Block`, `IfStatement`, `WhileStatement`, `ForStatement`, `ReturnStatement`, `BreakStatement`, `ContinueStatement`, `PrintStatement`, `BinaryOp`, `UnaryOp`, `Literal`, `Identifier`, `ListLiteral`, `DictLiteral`, `CallExpr`, `IndexExpr`, `AssignStmt`).
     - `Parser` with operator precedence climbing and `{}` block support.
     - `SymbolTable`, `Scope`, `SemanticAnalyzer` with variable uniqueness checks and strict string-number arithmetic `TypeError`.
     - `ASTOptimizer` with constant folding.
     - `PythonCodeGenerator` and `JavaScriptCodeGenerator`.
     - `Interpreter` (tree-walk evaluation with environment scopes).
     - `REPL` interactive CLI loop with banner, prompt, history, and command dispatch.
     - CLI entry point supporting `python compiler.py [transpile|run|repl] [file.bl]`.
2. **Browser Engine Port in TypeScript**:
   - Mirror the identical 6-stage architecture in TypeScript so the web app can run the full compilation pipeline, semantic verification, optimization, dual codegen, and evaluation natively in-browser without network latency.
3. **React Studio IDE Components**:
   - Editor with line numbering, syntax highlighting, and status feedback.
   - Stage inspectors (Tokens, AST visualizer, Symbol Table, Python Codegen, JS Codegen, Runtime Output).
   - REPL Shell interactive component with keyboard navigation and command history.
   - File download manager allowing instant download of `output.py`, `output.js`, `sample.bl`, and `compiler.py`.
4. **Verification & Delivery**:
   - Verification through automated compile checks, sample execution, and strict type error validation.
