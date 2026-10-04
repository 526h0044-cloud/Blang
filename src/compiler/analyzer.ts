import {
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
  SymbolInfo,
  ScopeInfo,
} from './types';

export class SemanticScope {
  public name: string;
  public parent?: SemanticScope;
  public symbols: Map<string, SymbolInfo> = new Map();

  constructor(name: string, parent?: SemanticScope) {
    this.name = name;
    this.parent = parent;
  }

  public define(symbol: SymbolInfo) {
    this.symbols.set(symbol.name, symbol);
  }

  public existsInCurrent(name: string): boolean {
    return this.symbols.has(name);
  }

  public resolve(name: string): SymbolInfo | undefined {
    if (this.symbols.has(name)) return this.symbols.get(name);
    if (this.parent) return this.parent.resolve(name);
    return undefined;
  }

  public toScopeInfo(): ScopeInfo {
    const syms: Record<string, SymbolInfo> = {};
    for (const [k, v] of this.symbols.entries()) {
      syms[k] = v;
    }
    return {
      name: this.name,
      parentName: this.parent ? this.parent.name : undefined,
      symbols: syms,
    };
  }
}

export class SemanticAnalyzer {
  public globalScope: SemanticScope;
  public currentScope: SemanticScope;
  public allScopes: SemanticScope[] = [];
  private inLoopDepth = 0;
  private inFunctionDepth = 0;

  constructor() {
    this.globalScope = new SemanticScope('global');
    this.currentScope = this.globalScope;
    this.allScopes.push(this.globalScope);

    // Predefine standard built-in functions
    const builtins = [
      'print', 'len', 'type', 'input', 'str', 'num', 'range', 'push',
      // Logarithmic & Exponential
      'log', 'log10', 'log2', 'ln',
      // Roots & Powers
      'sqrt', 'cbrt', 'root', 'pow', 'power', 'abs', 'round', 'floor', 'ceil',
      // Trigonometric & Angles
      'sin', 'cos', 'tan', 'cotan', 'cot', 'deg_to_rad', 'rad_to_deg',
      'sind', 'cosd', 'tand', 'cotand',
      // Geometry: Circle, Sphere, Cylinder, Cone
      'circle_perimeter', 'circle_circumference', 'circle_area',
      'sphere_volume', 'cylinder_volume', 'cone_volume',
      // Geometry: Square & Cube
      'square_perimeter', 'square_area', 'cube_volume',
      // Geometry: Rectangle & Cuboid
      'rect_perimeter', 'rect_area', 'cuboid_volume',
      // Geometry: Trapezoid & Regular Polygon & Triangle
      'trapezoid_area', 'trapezoid_perimeter',
      'polygon_perimeter', 'polygon_area',
      'triangle_area', 'triangle_perimeter',
    ];
    for (const b of builtins) {
      this.globalScope.define({ name: b, type: 'function', line: 0, col: 0 });
    }

    this.globalScope.define({ name: 'PI', type: 'number', line: 0, col: 0 });
    this.globalScope.define({ name: 'E', type: 'number', line: 0, col: 0 });
  }

  private enterScope(name: string): SemanticScope {
    const s = new SemanticScope(name, this.currentScope);
    this.allScopes.push(s);
    this.currentScope = s;
    return s;
  }

  private exitScope() {
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    }
  }

  public analyze(ast: ProgramNode): ScopeInfo[] {
    for (const stmt of ast.statements) {
      this.visitStatement(stmt);
    }
    return this.allScopes.map((s) => s.toScopeInfo());
  }

  private visitStatement(node: ASTNode) {
    switch (node.type) {
      case 'VarDecl': {
        const decl = node as VarDeclNode;
        if (this.currentScope.existsInCurrent(decl.name)) {
          const prev = this.currentScope.symbols.get(decl.name)!;
          throw {
            stage: 'semantic',
            message: `Duplicate variable declaration: Variable '${decl.name}' is already declared in scope '${this.currentScope.name}' (first declared at line ${prev.line}, col ${prev.col})`,
            line: decl.line,
            col: decl.col,
          };
        }

        let inferredType = 'any';
        if (decl.initializer) {
          inferredType = this.inferType(decl.initializer);
        }

        this.currentScope.define({
          name: decl.name,
          type: inferredType,
          line: decl.line,
          col: decl.col,
        });
        break;
      }

      case 'Assign': {
        const assign = node as AssignNode;
        if (assign.target.type === 'Identifier') {
          const id = assign.target as IdentifierNode;
          const sym = this.currentScope.resolve(id.name);
          const valType = this.inferType(assign.value);

          if (!sym) {
            // Implicit declaration in current scope
            this.currentScope.define({
              name: id.name,
              type: valType,
              line: assign.line,
              col: assign.col,
            });
          } else {
            // Strict compound assignment check
            if (assign.operator === '+=' || assign.operator === '-=') {
              if (
                (sym.type === 'string' && valType === 'number') ||
                (sym.type === 'number' && valType === 'string')
              ) {
                throw {
                  stage: 'semantic',
                  message: `Illegal compound assignment '${assign.operator}' between string variable '${sym.name}' and number. BLang strictly prohibits string-number arithmetic coercion.`,
                  line: assign.line,
                  col: assign.col,
                };
              }
            }
            if (valType !== 'unknown') {
              sym.type = valType;
            }
          }
        } else {
          this.inferType(assign.target);
          this.inferType(assign.value);
        }
        break;
      }

      case 'FunctionDef': {
        const fn = node as FunctionDefNode;
        if (this.currentScope.existsInCurrent(fn.name)) {
          const prev = this.currentScope.symbols.get(fn.name)!;
          throw {
            stage: 'semantic',
            message: `Duplicate function definition: Function '${fn.name}' is already defined in scope '${this.currentScope.name}' (line ${prev.line}, col ${prev.col})`,
            line: fn.line,
            col: fn.col,
          };
        }

        this.currentScope.define({
          name: fn.name,
          type: 'function',
          line: fn.line,
          col: fn.col,
          parameters: fn.parameters,
        });

        const fnScope = this.enterScope(`function_${fn.name}`);
        this.inFunctionDepth++;

        const seen = new Set<string>();
        for (const p of fn.parameters) {
          if (seen.has(p)) {
            throw {
              stage: 'semantic',
              message: `Duplicate parameter name '${p}' in function '${fn.name}'`,
              line: fn.line,
              col: fn.col,
            };
          }
          seen.add(p);
          fnScope.define({ name: p, type: 'any', line: fn.line, col: fn.col });
        }

        for (const s of fn.body.statements) {
          this.visitStatement(s);
        }

        this.inFunctionDepth--;
        this.exitScope();
        break;
      }

      case 'If': {
        const ifNode = node as IfNode;
        this.inferType(ifNode.condition);
        this.enterScope('if_block');
        for (const s of ifNode.thenBranch.statements) this.visitStatement(s);
        this.exitScope();

        for (const branch of ifNode.elifBranches) {
          this.inferType(branch.condition);
          this.enterScope('elseif_block');
          for (const s of branch.body.statements) this.visitStatement(s);
          this.exitScope();
        }

        if (ifNode.elseBranch) {
          this.enterScope('else_block');
          for (const s of ifNode.elseBranch.statements) this.visitStatement(s);
          this.exitScope();
        }
        break;
      }

      case 'While': {
        const w = node as WhileNode;
        this.inferType(w.condition);
        this.inLoopDepth++;
        this.enterScope('while_block');
        for (const s of w.body.statements) this.visitStatement(s);
        this.exitScope();
        this.inLoopDepth--;
        break;
      }

      case 'For': {
        const f = node as ForNode;
        this.inferType(f.iterable);
        this.inLoopDepth++;
        const loopScope = this.enterScope('for_block');
        loopScope.define({ name: f.variable, type: 'any', line: f.line, col: f.col });
        for (const s of f.body.statements) this.visitStatement(s);
        this.exitScope();
        this.inLoopDepth--;
        break;
      }

      case 'Return': {
        const ret = node as ReturnNode;
        if (this.inFunctionDepth === 0) {
          throw {
            stage: 'semantic',
            message: 'Return statement used outside of any function definition',
            line: ret.line,
            col: ret.col,
          };
        }
        if (ret.expression) this.inferType(ret.expression);
        break;
      }

      case 'Break': {
        const b = node as BreakNode;
        if (this.inLoopDepth === 0) {
          throw {
            stage: 'semantic',
            message: 'Break statement used outside of any loop construct',
            line: b.line,
            col: b.col,
          };
        }
        break;
      }

      case 'Continue': {
        const c = node as ContinueNode;
        if (this.inLoopDepth === 0) {
          throw {
            stage: 'semantic',
            message: 'Continue statement used outside of any loop construct',
            line: c.line,
            col: c.col,
          };
        }
        break;
      }

      case 'Print': {
        const p = node as PrintNode;
        for (const arg of p.arguments) this.inferType(arg);
        break;
      }

      case 'Import':
        break;

      case 'Block': {
        const b = node as BlockNode;
        this.enterScope('block');
        for (const s of b.statements) this.visitStatement(s);
        this.exitScope();
        break;
      }

      case 'ExpressionStatement': {
        const expr = (node as ExpressionStatementNode).expression;
        this.inferType(expr);
        break;
      }
    }
  }

  public inferType(node: ASTNode): string {
    switch (node.type) {
      case 'Literal': {
        return (node as LiteralNode).litType;
      }

      case 'Identifier': {
        const id = node as IdentifierNode;
        const sym = this.currentScope.resolve(id.name);
        return sym ? sym.type : 'any';
      }

      case 'List': {
        const l = node as ListNode;
        for (const el of l.elements) this.inferType(el);
        return 'list';
      }

      case 'Dict': {
        const d = node as DictNode;
        for (const entry of d.entries) {
          this.inferType(entry.key);
          this.inferType(entry.value);
        }
        return 'dict';
      }

      case 'Index': {
        const idx = node as IndexNode;
        this.inferType(idx.target);
        this.inferType(idx.index);
        return 'any';
      }

      case 'Call': {
        const call = node as CallNode;
        this.inferType(call.callee);
        for (const a of call.arguments) this.inferType(a);
        return 'any';
      }

      case 'UnaryOp': {
        const un = node as UnaryOpNode;
        const sub = this.inferType(un.operand);
        if (un.operator === 'not') return 'boolean';
        if (un.operator === '-' || un.operator === '+') {
          if (sub === 'string') {
            throw {
              stage: 'semantic',
              message: `Illegal unary operator '${un.operator}' on string operand. Mathematical operations on strings are strictly prohibited.`,
              line: un.line,
              col: un.col,
            };
          }
          return 'number';
        }
        return 'any';
      }

      case 'BinaryOp': {
        const bin = node as BinaryOpNode;
        const tLeft = this.inferType(bin.left);
        const tRight = this.inferType(bin.right);
        const op = bin.operator;

        // Arithmetic operators: +, -, *, /, %
        if (['+', '-', '*', '/', '%'].includes(op)) {
          const isLeftStr = tLeft === 'string';
          const isRightStr = tRight === 'string';
          const isLeftNum = tLeft === 'number';
          const isRightNum = tRight === 'number';

          // STRICT TYPE SAFETY: String cannot participate in math (+, -, *, /, %) with Number
          if ((isLeftStr && isRightNum) || (isLeftNum && isRightStr)) {
            let leftDesc = `'${tLeft}'`;
            if (bin.left.type === 'Identifier') leftDesc = `variable '${(bin.left as IdentifierNode).name}' (type '${tLeft}')`;
            else if (bin.left.type === 'Literal') leftDesc = `literal '${(bin.left as LiteralNode).value}' (type '${tLeft}')`;

            let rightDesc = `'${tRight}'`;
            if (bin.right.type === 'Identifier') rightDesc = `variable '${(bin.right as IdentifierNode).name}' (type '${tRight}')`;
            else if (bin.right.type === 'Literal') rightDesc = `literal '${(bin.right as LiteralNode).value}' (type '${tRight}')`;

            throw {
              stage: 'semantic',
              message: `Illegal arithmetic operation '${op}' between ${leftDesc} and ${rightDesc}. BLang enforces strict type safety: strings and numbers CANNOT be combined in arithmetic operations.`,
              line: bin.line,
              col: bin.col,
            };
          }

          if (['-', '*', '/', '%'].includes(op) && (isLeftStr || isRightStr)) {
            throw {
              stage: 'semantic',
              message: `Illegal mathematical operator '${op}' applied to string. Strings only support string formatting or standard function calls, not math arithmetic.`,
              line: bin.line,
              col: bin.col,
            };
          }

          if (isLeftStr && isRightStr && op === '+') {
            return 'string';
          }

          if (isLeftNum && isRightNum) return 'number';
          return isLeftNum || isRightNum ? 'number' : 'any';
        }

        if (['==', '!=', '<', '<=', '>', '>='].includes(op)) return 'boolean';
        if (['and', 'or'].includes(op)) return 'boolean';
        return 'any';
      }

      default:
        return 'unknown';
    }
  }
}
