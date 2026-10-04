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
} from './types';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { ASTOptimizer } from './optimizer';

class ReturnSignal {
  constructor(public value: any) {}
}

class BreakSignal {}
class ContinueSignal {}

export class Environment {
  public bindings: Map<string, any> = new Map();

  constructor(public parent?: Environment) {}

  public get(name: string, line = 0, col = 0): any {
    if (this.bindings.has(name)) return this.bindings.get(name);
    if (this.parent) return this.parent.get(name, line, col);
    throw {
      stage: 'runtime',
      message: `Undefined variable '${name}'`,
      line,
      col,
    };
  }

  public set(name: string, value: any) {
    let env: Environment | undefined = this;
    while (env) {
      if (env.bindings.has(name)) {
        env.bindings.set(name, value);
        return;
      }
      env = env.parent;
    }
    this.bindings.set(name, value);
  }

  public define(name: string, value: any) {
    this.bindings.set(name, value);
  }
}

export class CallableFunction {
  constructor(
    public name: string,
    public params: string[],
    public body: BlockNode,
    public closure: Environment
  ) {}

  public call(interpreter: Interpreter, args: any[], line: number, col: number): any {
    if (args.length !== this.params.length) {
      throw {
        stage: 'runtime',
        message: `Function '${this.name}' expects ${this.params.length} arguments, but received ${args.length}`,
        line,
        col,
      };
    }
    const callEnv = new Environment(this.closure);
    for (let i = 0; i < this.params.length; i++) {
      callEnv.define(this.params[i], args[i]);
    }

    const prev = interpreter.currentEnv;
    interpreter.currentEnv = callEnv;
    try {
      interpreter.executeBlock(this.body);
    } catch (err) {
      if (err instanceof ReturnSignal) {
        return err.value;
      }
      throw err;
    } finally {
      interpreter.currentEnv = prev;
    }
    return null;
  }
}

export class Interpreter {
  public globalEnv: Environment;
  public currentEnv: Environment;
  public stdout: string[] = [];
  public virtualFiles: Record<string, string> = {};

  constructor(customStdout?: (msg: string) => void, virtualFiles?: Record<string, string>) {
    this.globalEnv = new Environment();
    this.currentEnv = this.globalEnv;
    this.virtualFiles = virtualFiles || {};
    this.initBuiltins(customStdout);
  }

  private initBuiltins(customStdout?: (msg: string) => void) {
    // len
    this.globalEnv.define('len', (args: any[]) => {
      const target = args[0];
      if (target && typeof target === 'object' && 'length' in target) {
        return target.length;
      }
      if (typeof target === 'string') return target.length;
      if (typeof target === 'object' && target !== null) {
        return Object.keys(target).length;
      }
      return 0;
    });

    // type
    this.globalEnv.define('type', (args: any[]) => {
      const v = args[0];
      if (v === null || v === undefined) return 'null';
      if (Array.isArray(v)) return 'list';
      return typeof v;
    });

    // str
    this.globalEnv.define('str', (args: any[]) => String(args[0]));

    // num
    this.globalEnv.define('num', (args: any[]) => Number(args[0]));

    // range
    this.globalEnv.define('range', (args: any[]) => {
      const start = args.length > 1 ? Number(args[0]) : 0;
      const end = args.length > 1 ? Number(args[1]) : Number(args[0]);
      const res: number[] = [];
      for (let i = start; i < end; i++) res.push(i);
      return res;
    });

    // push
    this.globalEnv.define('push', (args: any[]) => {
      const list = args[0];
      if (Array.isArray(list)) {
        list.push(args[1]);
        return list;
      }
      throw { stage: 'runtime', message: 'push() expects a list as first argument' };
    });

    // Constants
    this.globalEnv.define('PI', Math.PI);
    this.globalEnv.define('E', Math.E);

    // Trigonometric functions
    this.globalEnv.define('sin', (args: any[]) => Math.sin(Number(args[0])));
    this.globalEnv.define('cos', (args: any[]) => Math.cos(Number(args[0])));
    this.globalEnv.define('tan', (args: any[]) => Math.tan(Number(args[0])));
    this.globalEnv.define('cotan', (args: any[]) => 1 / Math.tan(Number(args[0])));
    this.globalEnv.define('cot', (args: any[]) => 1 / Math.tan(Number(args[0])));

    // Degree <-> Radian conversions & Degree trig functions
    this.globalEnv.define('deg_to_rad', (args: any[]) => Number(args[0]) * (Math.PI / 180));
    this.globalEnv.define('rad_to_deg', (args: any[]) => Number(args[0]) * (180 / Math.PI));
    this.globalEnv.define('sind', (args: any[]) => Math.sin(Number(args[0]) * (Math.PI / 180)));
    this.globalEnv.define('cosd', (args: any[]) => Math.cos(Number(args[0]) * (Math.PI / 180)));
    this.globalEnv.define('tand', (args: any[]) => Math.tan(Number(args[0]) * (Math.PI / 180)));
    this.globalEnv.define('cotand', (args: any[]) => 1 / Math.tan(Number(args[0]) * (Math.PI / 180)));

    // Logarithmic & Exponential
    this.globalEnv.define('log', (args: any[]) => {
      const x = Number(args[0]);
      if (args.length > 1) {
        return Math.log(x) / Math.log(Number(args[1]));
      }
      return Math.log10(x);
    });
    this.globalEnv.define('ln', (args: any[]) => Math.log(Number(args[0])));
    this.globalEnv.define('log10', (args: any[]) => Math.log10(Number(args[0])));
    this.globalEnv.define('log2', (args: any[]) => Math.log2(Number(args[0])));

    // Roots & Powers
    this.globalEnv.define('sqrt', (args: any[]) => Math.sqrt(Number(args[0])));
    this.globalEnv.define('cbrt', (args: any[]) => (Math.cbrt ? Math.cbrt(Number(args[0])) : Math.pow(Number(args[0]), 1 / 3)));
    this.globalEnv.define('root', (args: any[]) => Math.pow(Number(args[0]), 1 / Number(args[1])));
    this.globalEnv.define('pow', (args: any[]) => Math.pow(Number(args[0]), Number(args[1])));
    this.globalEnv.define('power', (args: any[]) => Math.pow(Number(args[0]), Number(args[1])));
    this.globalEnv.define('abs', (args: any[]) => Math.abs(Number(args[0])));
    this.globalEnv.define('round', (args: any[]) => {
      const v = Number(args[0]);
      if (args.length > 1) {
        const factor = Math.pow(10, Number(args[1]));
        return Math.round(v * factor) / factor;
      }
      return Math.round(v);
    });
    this.globalEnv.define('floor', (args: any[]) => Math.floor(Number(args[0])));
    this.globalEnv.define('ceil', (args: any[]) => Math.ceil(Number(args[0])));

    // Geometry: Hình tròn, Cầu, Trụ, Nón (Circle, Sphere, Cylinder, Cone)
    this.globalEnv.define('circle_perimeter', (args: any[]) => 2 * Math.PI * Number(args[0]));
    this.globalEnv.define('circle_circumference', (args: any[]) => 2 * Math.PI * Number(args[0]));
    this.globalEnv.define('circle_area', (args: any[]) => Math.PI * Math.pow(Number(args[0]), 2));
    this.globalEnv.define('sphere_volume', (args: any[]) => (4 / 3) * Math.PI * Math.pow(Number(args[0]), 3));
    this.globalEnv.define('cylinder_volume', (args: any[]) => Math.PI * Math.pow(Number(args[0]), 2) * Number(args[1]));
    this.globalEnv.define('cone_volume', (args: any[]) => (1 / 3) * Math.PI * Math.pow(Number(args[0]), 2) * Number(args[1]));

    // Geometry: Hình vuông & Lập phương (Square & Cube)
    this.globalEnv.define('square_perimeter', (args: any[]) => 4 * Number(args[0]));
    this.globalEnv.define('square_area', (args: any[]) => Number(args[0]) * Number(args[0]));
    this.globalEnv.define('cube_volume', (args: any[]) => Math.pow(Number(args[0]), 3));

    // Geometry: Hình chữ nhật & Hình hộp (Rectangle & Cuboid)
    this.globalEnv.define('rect_perimeter', (args: any[]) => 2 * (Number(args[0]) + Number(args[1])));
    this.globalEnv.define('rect_area', (args: any[]) => Number(args[0]) * Number(args[1]));
    this.globalEnv.define('cuboid_volume', (args: any[]) => Number(args[0]) * Number(args[1]) * Number(args[2]));

    // Geometry: Hình thang (Trapezoid) & Đa giác đều (Regular Polygon) & Tam giác (Triangle)
    this.globalEnv.define('trapezoid_area', (args: any[]) => ((Number(args[0]) + Number(args[1])) * Number(args[2])) / 2);
    this.globalEnv.define('trapezoid_perimeter', (args: any[]) => Number(args[0]) + Number(args[1]) + Number(args[2]) + Number(args[3]));
    this.globalEnv.define('polygon_perimeter', (args: any[]) => Number(args[0]) * Number(args[1]));
    this.globalEnv.define('polygon_area', (args: any[]) => {
      const n = Number(args[0]);
      const s = Number(args[1]);
      return (n * s * s) / (4 * Math.tan(Math.PI / n));
    });
    this.globalEnv.define('triangle_area', (args: any[]) => 0.5 * Number(args[0]) * Number(args[1]));
    this.globalEnv.define('triangle_perimeter', (args: any[]) => Number(args[0]) + Number(args[1]) + Number(args[2]));
  }

  public log(...items: any[]) {
    const text = items.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(' ');
    this.stdout.push(text);
  }

  public execute(ast: ProgramNode): any {
    let res: any = null;
    for (const stmt of ast.statements) {
      res = this.executeStatement(stmt);
    }
    return res;
  }

  public executeBlock(block: BlockNode): any {
    let res: any = null;
    for (const stmt of block.statements) {
      res = this.executeStatement(stmt);
    }
    return res;
  }

  public executeStatement(node: ASTNode): any {
    switch (node.type) {
      case 'VarDecl': {
        const decl = node as VarDeclNode;
        const val = decl.initializer ? this.evaluate(decl.initializer) : null;
        this.currentEnv.define(decl.name, val);
        return val;
      }

      case 'Assign': {
        const assign = node as AssignNode;
        const val = this.evaluate(assign.value);

        if (assign.target.type === 'Identifier') {
          const id = (assign.target as IdentifierNode).name;
          if (assign.operator === '=') {
            this.currentEnv.set(id, val);
          } else if (assign.operator === '+=') {
            const cur = this.currentEnv.get(id, assign.line, assign.col);
            this.currentEnv.set(id, cur + val);
          } else if (assign.operator === '-=') {
            const cur = this.currentEnv.get(id, assign.line, assign.col);
            this.currentEnv.set(id, cur - val);
          }
        } else if (assign.target.type === 'Index') {
          const indexNode = assign.target as IndexNode;
          const tgt = this.evaluate(indexNode.target);
          const idx = this.evaluate(indexNode.index);
          if (assign.operator === '=') {
            tgt[idx] = val;
          } else if (assign.operator === '+=') {
            tgt[idx] = tgt[idx] + val;
          } else if (assign.operator === '-=') {
            tgt[idx] = tgt[idx] - val;
          }
        }
        return val;
      }

      case 'FunctionDef': {
        const fn = node as FunctionDefNode;
        const callable = new CallableFunction(fn.name, fn.parameters, fn.body, this.currentEnv);
        this.currentEnv.define(fn.name, callable);
        return callable;
      }

      case 'If': {
        const ifNode = node as IfNode;
        const cond = this.evaluate(ifNode.condition);
        if (Boolean(cond)) {
          const sub = new Environment(this.currentEnv);
          const prev = this.currentEnv;
          this.currentEnv = sub;
          try {
            return this.executeBlock(ifNode.thenBranch);
          } finally {
            this.currentEnv = prev;
          }
        }

        let ranElif = false;
        for (const branch of ifNode.elifBranches) {
          if (Boolean(this.evaluate(branch.condition))) {
            const sub = new Environment(this.currentEnv);
            const prev = this.currentEnv;
            this.currentEnv = sub;
            try {
              ranElif = true;
              return this.executeBlock(branch.body);
            } finally {
              this.currentEnv = prev;
            }
          }
        }

        if (!ranElif && ifNode.elseBranch) {
          const sub = new Environment(this.currentEnv);
          const prev = this.currentEnv;
          this.currentEnv = sub;
          try {
            return this.executeBlock(ifNode.elseBranch);
          } finally {
            this.currentEnv = prev;
          }
        }
        return null;
      }

      case 'While': {
        const w = node as WhileNode;
        while (Boolean(this.evaluate(w.condition))) {
          const sub = new Environment(this.currentEnv);
          const prev = this.currentEnv;
          this.currentEnv = sub;
          try {
            this.executeBlock(w.body);
          } catch (err) {
            if (err instanceof BreakSignal) break;
            if (err instanceof ContinueSignal) continue;
            throw err;
          } finally {
            this.currentEnv = prev;
          }
        }
        return null;
      }

      case 'For': {
        const f = node as ForNode;
        const iter = this.evaluate(f.iterable);
        if (!iter || typeof iter[Symbol.iterator] !== 'function') {
          throw {
            stage: 'runtime',
            message: `Target is not iterable at line ${f.line}, col ${f.col}`,
            line: f.line,
            col: f.col,
          };
        }
        for (const item of iter) {
          const sub = new Environment(this.currentEnv);
          sub.define(f.variable, item);
          const prev = this.currentEnv;
          this.currentEnv = sub;
          try {
            this.executeBlock(f.body);
          } catch (err) {
            if (err instanceof BreakSignal) break;
            if (err instanceof ContinueSignal) continue;
            throw err;
          } finally {
            this.currentEnv = prev;
          }
        }
        return null;
      }

      case 'Return': {
        const ret = node as ReturnNode;
        const val = ret.expression ? this.evaluate(ret.expression) : null;
        throw new ReturnSignal(val);
      }

      case 'Break':
        throw new BreakSignal();

      case 'Continue':
        throw new ContinueSignal();

      case 'Print': {
        const p = node as PrintNode;
        const vals = p.arguments.map((a) => this.evaluate(a));
        this.log(...vals);
        return null;
      }

      case 'Import': {
        const imp = node as any;
        let modPath = imp.modulePath;
        if (!modPath.endsWith('.bl')) modPath += '.bl';
        if (this.virtualFiles[modPath]) {
          const modSource = this.virtualFiles[modPath];
          const modLexer = new Lexer(modSource);
          const modTokens = modLexer.tokenize();
          const modParser = new Parser(modTokens);
          const modAST = modParser.parse();
          const modOpt = new ASTOptimizer().optimize(modAST);
          this.execute(modOpt as ProgramNode);
        }
        return null;
      }

      case 'Block': {
        const sub = new Environment(this.currentEnv);
        const prev = this.currentEnv;
        this.currentEnv = sub;
        try {
          return this.executeBlock(node as BlockNode);
        } finally {
          this.currentEnv = prev;
        }
      }

      case 'ExpressionStatement':
        return this.evaluate((node as ExpressionStatementNode).expression);

      default:
        return null;
    }
  }

  public evaluate(node: ASTNode): any {
    switch (node.type) {
      case 'Literal':
        return (node as LiteralNode).value;

      case 'Identifier':
        return this.currentEnv.get((node as IdentifierNode).name, node.line, node.col);

      case 'List':
        return (node as ListNode).elements.map((e) => this.evaluate(e));

      case 'Dict': {
        const d = node as DictNode;
        const obj: Record<string, any> = {};
        for (const entry of d.entries) {
          const k = String(this.evaluate(entry.key));
          const v = this.evaluate(entry.value);
          obj[k] = v;
        }
        return obj;
      }

      case 'Index': {
        const idx = node as IndexNode;
        const target = this.evaluate(idx.target);
        const indexVal = this.evaluate(idx.index);
        return target[indexVal];
      }

      case 'Call': {
        const call = node as CallNode;
        const callee = this.evaluate(call.callee);
        const args = call.arguments.map((a) => this.evaluate(a));
        if (callee instanceof CallableFunction) {
          return callee.call(this, args, call.line, call.col);
        }
        if (typeof callee === 'function') {
          return callee(args);
        }
        throw {
          stage: 'runtime',
          message: `'${typeof callee}' is not callable at line ${call.line}, col ${call.col}`,
          line: call.line,
          col: call.col,
        };
      }

      case 'UnaryOp': {
        const un = node as UnaryOpNode;
        const val = this.evaluate(un.operand);
        if (un.operator === 'not') return !Boolean(val);
        if (un.operator === '-') return -val;
        if (un.operator === '+') return +val;
        return val;
      }

      case 'BinaryOp': {
        const bin = node as BinaryOpNode;
        const left = this.evaluate(bin.left);
        const right = this.evaluate(bin.right);
        const op = bin.operator;

        // Strict Type Check in runtime
        if (['+', '-', '*', '/', '%'].includes(op)) {
          if (
            (typeof left === 'string' && typeof right === 'number') ||
            (typeof left === 'number' && typeof right === 'string')
          ) {
            throw {
              stage: 'runtime',
              message: `BLang Strict TypeError: Cannot combine string and number using arithmetic operator '${op}'`,
              line: bin.line,
              col: bin.col,
            };
          }
        }

        if (op === '+') return left + right;
        if (op === '-') return left - right;
        if (op === '*') return left * right;
        if (op === '/') {
          if (right === 0) throw { stage: 'runtime', message: 'Division by zero', line: bin.line, col: bin.col };
          return left / right;
        }
        if (op === '%') return left % right;
        if (op === '==') return left === right;
        if (op === '!=') return left !== right;
        if (op === '<') return left < right;
        if (op === '<=') return left <= right;
        if (op === '>') return left > right;
        if (op === '>=') return left >= right;
        if (op === 'and') return left && right;
        if (op === 'or') return left || right;
        return null;
      }

      default:
        return null;
    }
  }
}
