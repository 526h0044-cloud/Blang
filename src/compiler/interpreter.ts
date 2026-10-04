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
  private stepCount = 0;
  public static readonly MAX_STEPS = 100000;

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

    // Trigonometric functions (Degrees by default as requested: sin(90) = 1, cos(60) = 0.5)
    const sinDeg = (args: any[]) => Math.sin(Number(args[0]) * (Math.PI / 180));
    const cosDeg = (args: any[]) => Math.cos(Number(args[0]) * (Math.PI / 180));
    const tanDeg = (args: any[]) => Math.tan(Number(args[0]) * (Math.PI / 180));
    const cotanDeg = (args: any[]) => 1 / Math.tan(Number(args[0]) * (Math.PI / 180));

    this.globalEnv.define('sin', sinDeg);
    this.globalEnv.define('cos', cosDeg);
    this.globalEnv.define('tan', tanDeg);
    this.globalEnv.define('cotan', cotanDeg);
    this.globalEnv.define('cot', cotanDeg);

    // Backward compatible & explicit aliases
    this.globalEnv.define('sind', sinDeg);
    this.globalEnv.define('cosd', cosDeg);
    this.globalEnv.define('tand', tanDeg);
    this.globalEnv.define('cotand', cotanDeg);

    // Radian trigonometric functions
    this.globalEnv.define('sin_rad', (args: any[]) => Math.sin(Number(args[0])));
    this.globalEnv.define('cos_rad', (args: any[]) => Math.cos(Number(args[0])));
    this.globalEnv.define('tan_rad', (args: any[]) => Math.tan(Number(args[0])));
    this.globalEnv.define('cotan_rad', (args: any[]) => 1 / Math.tan(Number(args[0])));

    // Degree <-> Radian conversions
    this.globalEnv.define('deg_to_rad', (args: any[]) => Number(args[0]) * (Math.PI / 180));
    this.globalEnv.define('rad_to_deg', (args: any[]) => Number(args[0]) * (180 / Math.PI));

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

    // Geometry: Hình tròn (circle hoặc cir, chu vi: c/C, diện tích: s/S)
    const fnCircleC = (args: any[]) => 2 * Math.PI * Number(args[0]);
    const fnCircleS = (args: any[]) => Math.PI * Math.pow(Number(args[0]), 2);
    this.globalEnv.define('circle_c', fnCircleC);
    this.globalEnv.define('circle_C', fnCircleC);
    this.globalEnv.define('cir_c', fnCircleC);
    this.globalEnv.define('cir_C', fnCircleC);
    this.globalEnv.define('circle_perimeter', fnCircleC);
    this.globalEnv.define('cir_perimeter', fnCircleC);
    this.globalEnv.define('circle_circumference', fnCircleC);
    this.globalEnv.define('cir_circumference', fnCircleC);

    this.globalEnv.define('circle_s', fnCircleS);
    this.globalEnv.define('circle_S', fnCircleS);
    this.globalEnv.define('cir_s', fnCircleS);
    this.globalEnv.define('cir_S', fnCircleS);
    this.globalEnv.define('circle_area', fnCircleS);
    this.globalEnv.define('cir_area', fnCircleS);

    // Geometry: Hình cầu (sphere, thể tích: v/V, diện tích: s/S)
    const fnSphereV = (args: any[]) => (4 / 3) * Math.PI * Math.pow(Number(args[0]), 3);
    const fnSphereS = (args: any[]) => 4 * Math.PI * Math.pow(Number(args[0]), 2);
    this.globalEnv.define('sphere_v', fnSphereV);
    this.globalEnv.define('sphere_V', fnSphereV);
    this.globalEnv.define('sphere_volume', fnSphereV);
    this.globalEnv.define('sphere_s', fnSphereS);
    this.globalEnv.define('sphere_S', fnSphereS);
    this.globalEnv.define('sphere_area', fnSphereS);

    // Geometry: Hình trụ (cylinder, thể tích: v/V)
    const fnCylinderV = (args: any[]) => Math.PI * Math.pow(Number(args[0]), 2) * Number(args[1]);
    this.globalEnv.define('cylinder_v', fnCylinderV);
    this.globalEnv.define('cylinder_V', fnCylinderV);
    this.globalEnv.define('cylinder_volume', fnCylinderV);

    // Geometry: Hình nón (cone, thể tích: v/V)
    const fnConeV = (args: any[]) => (1 / 3) * Math.PI * Math.pow(Number(args[0]), 2) * Number(args[1]);
    this.globalEnv.define('cone_v', fnConeV);
    this.globalEnv.define('cone_V', fnConeV);
    this.globalEnv.define('cone_volume', fnConeV);

    // Geometry: Hình vuông (square hoặc sq, chu vi: c/C, diện tích: s/S)
    const fnSquareC = (args: any[]) => 4 * Number(args[0]);
    const fnSquareS = (args: any[]) => Number(args[0]) * Number(args[0]);
    this.globalEnv.define('square_c', fnSquareC);
    this.globalEnv.define('square_C', fnSquareC);
    this.globalEnv.define('sq_c', fnSquareC);
    this.globalEnv.define('sq_C', fnSquareC);
    this.globalEnv.define('square_perimeter', fnSquareC);
    this.globalEnv.define('sq_perimeter', fnSquareC);

    this.globalEnv.define('square_s', fnSquareS);
    this.globalEnv.define('square_S', fnSquareS);
    this.globalEnv.define('sq_s', fnSquareS);
    this.globalEnv.define('sq_S', fnSquareS);
    this.globalEnv.define('square_area', fnSquareS);
    this.globalEnv.define('sq_area', fnSquareS);

    // Geometry: Hình lập phương (cube, thể tích: v/V, diện tích: s/S)
    const fnCubeV = (args: any[]) => Math.pow(Number(args[0]), 3);
    const fnCubeS = (args: any[]) => 6 * Math.pow(Number(args[0]), 2);
    this.globalEnv.define('cube_v', fnCubeV);
    this.globalEnv.define('cube_V', fnCubeV);
    this.globalEnv.define('cube_volume', fnCubeV);
    this.globalEnv.define('cube_s', fnCubeS);
    this.globalEnv.define('cube_S', fnCubeS);
    this.globalEnv.define('cube_area', fnCubeS);

    // Geometry: Hình chữ nhật (rect hoặc rectangle, chu vi: c/C, diện tích: s/S)
    const fnRectC = (args: any[]) => 2 * (Number(args[0]) + Number(args[1]));
    const fnRectS = (args: any[]) => Number(args[0]) * Number(args[1]);
    this.globalEnv.define('rect_c', fnRectC);
    this.globalEnv.define('rect_C', fnRectC);
    this.globalEnv.define('rectangle_c', fnRectC);
    this.globalEnv.define('rectangle_C', fnRectC);
    this.globalEnv.define('rect_perimeter', fnRectC);
    this.globalEnv.define('rectangle_perimeter', fnRectC);

    this.globalEnv.define('rect_s', fnRectS);
    this.globalEnv.define('rect_S', fnRectS);
    this.globalEnv.define('rectangle_s', fnRectS);
    this.globalEnv.define('rectangle_S', fnRectS);
    this.globalEnv.define('rect_area', fnRectS);
    this.globalEnv.define('rectangle_area', fnRectS);

    // Geometry: Hình hộp chữ nhật (cuboid, thể tích: v/V)
    const fnCuboidV = (args: any[]) => Number(args[0]) * Number(args[1]) * Number(args[2]);
    this.globalEnv.define('cuboid_v', fnCuboidV);
    this.globalEnv.define('cuboid_V', fnCuboidV);
    this.globalEnv.define('cuboid_volume', fnCuboidV);

    // Geometry: Hình thang (trapezoid, diện tích: s/S, chu vi: c/C)
    const fnTrapezoidS = (args: any[]) => ((Number(args[0]) + Number(args[1])) * Number(args[2])) / 2;
    const fnTrapezoidC = (args: any[]) => Number(args[0]) + Number(args[1]) + Number(args[2]) + Number(args[3]);
    this.globalEnv.define('trapezoid_s', fnTrapezoidS);
    this.globalEnv.define('trapezoid_S', fnTrapezoidS);
    this.globalEnv.define('trapezoid_area', fnTrapezoidS);
    this.globalEnv.define('trapezoid_c', fnTrapezoidC);
    this.globalEnv.define('trapezoid_C', fnTrapezoidC);
    this.globalEnv.define('trapezoid_perimeter', fnTrapezoidC);

    // Geometry: Đa giác đều (regular polygon, chu vi: c/C, diện tích: s/S)
    const fnPolygonC = (args: any[]) => Number(args[0]) * Number(args[1]);
    const fnPolygonS = (args: any[]) => {
      const n = Number(args[0]);
      const s = Number(args[1]);
      return (n * s * s) / (4 * Math.tan(Math.PI / n));
    };
    this.globalEnv.define('polygon_c', fnPolygonC);
    this.globalEnv.define('polygon_C', fnPolygonC);
    this.globalEnv.define('polygon_perimeter', fnPolygonC);
    this.globalEnv.define('polygon_s', fnPolygonS);
    this.globalEnv.define('polygon_S', fnPolygonS);
    this.globalEnv.define('polygon_area', fnPolygonS);

    // Geometry: Tam giác (triangle / tri, diện tích: s/S, chu vi: c/C)
    const fnTriangleS = (args: any[]) => 0.5 * Number(args[0]) * Number(args[1]);
    const fnTriangleC = (args: any[]) => Number(args[0]) + Number(args[1]) + Number(args[2]);
    this.globalEnv.define('triangle_s', fnTriangleS);
    this.globalEnv.define('triangle_S', fnTriangleS);
    this.globalEnv.define('triangle_area', fnTriangleS);
    this.globalEnv.define('tri_s', fnTriangleS);
    this.globalEnv.define('tri_S', fnTriangleS);
    this.globalEnv.define('tri_area', fnTriangleS);

    this.globalEnv.define('triangle_c', fnTriangleC);
    this.globalEnv.define('triangle_C', fnTriangleC);
    this.globalEnv.define('triangle_perimeter', fnTriangleC);
    this.globalEnv.define('tri_c', fnTriangleC);
    this.globalEnv.define('tri_C', fnTriangleC);
    this.globalEnv.define('tri_perimeter', fnTriangleC);

    // Standard Library: String Operations
    this.globalEnv.define('upper', (args: any[]) => String(args[0]).toUpperCase());
    this.globalEnv.define('lower', (args: any[]) => String(args[0]).toLowerCase());
    this.globalEnv.define('trim', (args: any[]) => String(args[0]).trim());
    this.globalEnv.define('replace', (args: any[]) =>
      String(args[0]).split(String(args[1])).join(String(args[2]))
    );
    this.globalEnv.define('split', (args: any[]) => String(args[0]).split(String(args[1])));
    this.globalEnv.define('join', (args: any[]) =>
      Array.isArray(args[0]) ? args[0].join(String(args[1] ?? '')) : String(args[0])
    );
    this.globalEnv.define('contains', (args: any[]) => String(args[0]).includes(String(args[1])));

    // Standard Library: List & Aggregation
    this.globalEnv.define('sum', (args: any[]) =>
      Array.isArray(args[0]) ? args[0].reduce((acc, curr) => acc + Number(curr), 0) : 0
    );
    this.globalEnv.define('min_val', (args: any[]) =>
      Array.isArray(args[0]) && args[0].length > 0 ? Math.min(...args[0].map(Number)) : 0
    );
    this.globalEnv.define('max_val', (args: any[]) =>
      Array.isArray(args[0]) && args[0].length > 0 ? Math.max(...args[0].map(Number)) : 0
    );
    this.globalEnv.define('avg', (args: any[]) => {
      if (!Array.isArray(args[0]) || args[0].length === 0) return 0;
      const s = args[0].reduce((acc, curr) => acc + Number(curr), 0);
      return s / args[0].length;
    });
    this.globalEnv.define('reverse', (args: any[]) => {
      if (Array.isArray(args[0])) return [...args[0]].reverse();
      if (typeof args[0] === 'string') return args[0].split('').reverse().join('');
      return args[0];
    });

    // Standard Library: System & Time
    this.globalEnv.define('time_now', () => Date.now());

    // Random Number Generator: %random(a, b)% or random(a, b)
    this.globalEnv.define('random', (args: any[]) => {
      const min = Number(args[0] ?? 0);
      const max = Number(args[1] ?? 100);
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      if (Number.isInteger(min) && Number.isInteger(max)) {
        return Math.floor(Math.random() * (hi - lo + 1)) + lo;
      }
      return Math.random() * (hi - lo) + lo;
    });
  }

  public log(...items: any[]) {
    const text = items.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(' ');
    this.stdout.push(text);
  }

  public execute(ast: ProgramNode): any {
    this.stepCount = 0;
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
          if (++this.stepCount > Interpreter.MAX_STEPS) {
            throw {
              stage: 'runtime',
              message: `BLang Sandbox Protection: Vượt quá giới hạn thực thi an toàn (${Interpreter.MAX_STEPS.toLocaleString()} bước lặp). Tự động dừng để tránh đơ trình duyệt.`,
              line: w.line,
              col: w.col,
            };
          }
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
          if (++this.stepCount > Interpreter.MAX_STEPS) {
            throw {
              stage: 'runtime',
              message: `BLang Sandbox Protection: Vượt quá giới hạn thực thi an toàn (${Interpreter.MAX_STEPS.toLocaleString()} bước lặp). Tự động dừng để bảo vệ tài nguyên.`,
              line: f.line,
              col: f.col,
            };
          }
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
