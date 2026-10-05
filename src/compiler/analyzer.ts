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
      // Trigonometric & Angles (degrees by default, plus rad conversions)
      'sin', 'cos', 'tan', 'cotan', 'cot', 'deg_to_rad', 'rad_to_deg',
      'sind', 'cosd', 'tand', 'cotand',
      'sin_rad', 'cos_rad', 'tan_rad', 'cotan_rad',
      // Geometry: Circle (circle / cir, c / C / perimeter, s / S / area)
      'circle_c', 'circle_C', 'cir_c', 'cir_C',
      'circle_s', 'circle_S', 'cir_s', 'cir_S',
      'circle_perimeter', 'circle_circumference', 'circle_area',
      'cir_perimeter', 'cir_circumference', 'cir_area',
      // Geometry: Sphere (sphere, v / V / volume, s / S / area)
      'sphere_v', 'sphere_V', 'sphere_volume',
      'sphere_s', 'sphere_S', 'sphere_area',
      // Geometry: Cylinder (cylinder, v / V / volume)
      'cylinder_v', 'cylinder_V', 'cylinder_volume',
      // Geometry: Cone (cone, v / V / volume)
      'cone_v', 'cone_V', 'cone_volume',
      // Geometry: Square (square / sq, c / C / perimeter, s / S / area)
      'square_c', 'square_C', 'sq_c', 'sq_C',
      'square_s', 'square_S', 'sq_s', 'sq_S',
      'square_perimeter', 'square_area',
      'sq_perimeter', 'sq_area',
      // Geometry: Cube (cube, v / V / volume, s / S / area)
      'cube_v', 'cube_V', 'cube_volume',
      'cube_s', 'cube_S', 'cube_area',
      // Geometry: Rectangle (rect / rectangle, c / C / perimeter, s / S / area)
      'rect_c', 'rect_C', 'rectangle_c', 'rectangle_C',
      'rect_s', 'rect_S', 'rectangle_s', 'rectangle_S',
      'rect_perimeter', 'rect_area', 'rectangle_perimeter', 'rectangle_area',
      // Geometry: Cuboid (cuboid, v / V / volume)
      'cuboid_v', 'cuboid_V', 'cuboid_volume',
      // Geometry: Trapezoid (trapezoid, c / C / perimeter, s / S / area)
      'trapezoid_c', 'trapezoid_C', 'trapezoid_perimeter',
      'trapezoid_s', 'trapezoid_S', 'trapezoid_area',
      // Geometry: Regular Polygon (polygon, c / C / perimeter, s / S / area)
      'polygon_c', 'polygon_C', 'polygon_perimeter',
      'polygon_s', 'polygon_S', 'polygon_area',
      // Geometry: Triangle (triangle / tri, c / C / perimeter, s / S / area)
      'triangle_c', 'triangle_C', 'triangle_perimeter',
      'triangle_s', 'triangle_S', 'triangle_area',
      'tri_c', 'tri_C', 'tri_perimeter',
      'tri_s', 'tri_S', 'tri_area',
      // Standard Library: String Operations
      'upper', 'lower', 'trim', 'replace', 'split', 'join', 'contains',
      // Standard Library: List & Aggregation
      'sum', 'min_val', 'max_val', 'avg', 'reverse',
      // Standard Library: Higher-Order Collections
      'map', 'filter', 'reduce', 'find', 'slice', 'pop', 'push', 'keys', 'values', 'entries',
      // Standard Library: Unicode & UTF-8 Vietnamese
      'utf8_len', 'unicode_slice', 'char_at', 'normalize_vn', 'is_alpha_vn',
      // Standard Library: JSON & Virtual File I/O
      'json_parse', 'json_stringify', 'file_read', 'file_write', 'file_exists',
      // Standard Library: Python & Native Interop FFI
      'py_import', 'py_eval',
      // Standard Library: System & Time
      'time_now',
      // Random Generator
      'random',
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
        const symType = decl.typeAnnotation || inferredType;

        this.currentScope.define({
          name: decl.name,
          type: symType,
          line: decl.line,
          col: decl.col,
        });
        break;
      }

      case 'Destructure': {
        const d = node as any;
        this.inferType(d.value);
        for (const name of d.names) {
          this.currentScope.define({
            name,
            type: 'any',
            line: d.line,
            col: d.col,
          });
        }
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
            // Flexible dynamic assignment without strict type blocking
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

        const paramSig = fn.paramDetails && fn.paramDetails.length > 0
          ? fn.paramDetails.map((p) => p.name + (p.typeAnnotation ? ': ' + p.typeAnnotation : '')).join(', ')
          : fn.parameters.join(', ');
        const retSig = fn.returnType ? ': ' + fn.returnType : '';

        this.currentScope.define({
          name: fn.name,
          type: `(${paramSig})${retSig}`,
          line: fn.line,
          col: fn.col,
          parameters: fn.parameters,
        });

        const fnScope = this.enterScope(`function_${fn.name}`);
        this.inFunctionDepth++;

        const seen = new Set<string>();
        if (fn.paramDetails) {
          for (const p of fn.paramDetails) {
            if (seen.has(p.name)) {
              throw {
                stage: 'semantic',
                message: `Duplicate parameter name '${p.name}' in function '${fn.name}'`,
                line: fn.line,
                col: fn.col,
              };
            }
            seen.add(p.name);
            fnScope.define({ name: p.name, type: p.typeAnnotation || 'any', line: fn.line, col: fn.col });
          }
        } else {
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

      case 'TryCatch': {
        const tc = node as any;
        this.enterScope('try_block');
        for (const s of tc.tryBlock.statements) this.visitStatement(s);
        this.exitScope();

        const catchScope = this.enterScope('catch_block');
        if (tc.errorVar) {
          catchScope.define({ name: tc.errorVar, type: 'string', line: tc.line, col: tc.col });
        }
        for (const s of tc.catchBlock.statements) this.visitStatement(s);
        this.exitScope();
        break;
      }

      case 'Throw': {
        const th = node as any;
        this.inferType(th.expression);
        break;
      }

      case 'Match': {
        const m = node as any;
        this.inferType(m.discriminant);
        for (const c of m.cases) {
          this.inferType(c.pattern);
          this.enterScope('match_case');
          for (const s of c.body.statements) this.visitStatement(s);
          this.exitScope();
        }
        if (m.defaultCase) {
          this.enterScope('match_default');
          for (const s of m.defaultCase.statements) this.visitStatement(s);
          this.exitScope();
        }
        break;
      }

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
        this.inferType(un.operand);
        if (un.operator === 'not') return 'boolean';
        if (un.operator === '-' || un.operator === '+') {
          return 'number';
        }
        return 'any';
      }

      case 'Range': {
        const r = node as any;
        this.inferType(r.start);
        this.inferType(r.end);
        return 'list';
      }

      case 'Pipeline': {
        const p = node as any;
        this.inferType(p.left);
        this.inferType(p.target);
        return 'any';
      }

      case 'InterpolatedString': {
        const isNode = node as any;
        for (const p of isNode.parts) {
          this.inferType(p);
        }
        return 'string';
      }

      case 'BinaryOp': {
        const bin = node as BinaryOpNode;
        const tLeft = this.inferType(bin.left);
        const tRight = this.inferType(bin.right);
        const op = bin.operator;

        // Dynamic typing for operators: +, -, *, /, %
        if (['+', '-', '*', '/', '%'].includes(op)) {
          const isLeftStr = tLeft === 'string';
          const isRightStr = tRight === 'string';
          const isLeftNum = tLeft === 'number';
          const isRightNum = tRight === 'number';

          // In flexible dynamic typing, addition involving a string coerces to string concatenation
          if (op === '+') {
            if (isLeftStr || isRightStr) {
              return 'string';
            }
            if (isLeftNum && isRightNum) {
              return 'number';
            }
            return 'any';
          }

          if (isLeftNum && isRightNum) return 'number';
          return 'number';
        }

        if (['==', '!=', '<', '<=', '>', '>='].includes(op)) return 'boolean';
        if (['and', 'or'].includes(op)) return 'boolean';
        if (op === '??') return tLeft !== 'null' && tLeft !== 'unknown' ? tLeft : tRight;
        return 'any';
      }

      default:
        return 'unknown';
    }
  }
}
