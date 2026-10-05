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
  RuntimeVariable,
  RuntimeScope,
  ExecutionStep,
  RuntimeExecutionState,
} from './types';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { ASTOptimizer } from './optimizer';

class ReturnSignal {
  constructor(public value: any) {}
}

class BreakSignal {}
class ContinueSignal {}

export function formatRuntimeValue(val: any): { formatted: string; type: string } {
  if (val === null) return { formatted: 'null', type: 'null' };
  if (val === undefined) return { formatted: 'undefined', type: 'undefined' };
  if (typeof val === 'number') return { formatted: String(val), type: 'number' };
  if (typeof val === 'string') return { formatted: JSON.stringify(val), type: 'string' };
  if (typeof val === 'boolean') return { formatted: String(val), type: 'boolean' };
  if (Array.isArray(val)) {
    const preview = JSON.stringify(val);
    return { formatted: preview.length > 50 ? preview.slice(0, 47) + '...' : preview, type: `list[${val.length}]` };
  }
  if (val instanceof CallableFunction) {
    return { formatted: `function ${val.name}(${val.params.join(', ')})`, type: 'function' };
  }
  if (typeof val === 'function') {
    return { formatted: '<native built-in>', type: 'builtin' };
  }
  if (typeof val === 'object') {
    try {
      const preview = JSON.stringify(val);
      return { formatted: preview.length > 50 ? preview.slice(0, 47) + '...' : preview, type: 'dict' };
    } catch {
      return { formatted: '[Object]', type: 'object' };
    }
  }
  return { formatted: String(val), type: typeof val };
}

export class Environment {
  public bindings: Map<string, any> = new Map();
  public name: string;
  public depth: number;

  constructor(public parent?: Environment, name = 'Global Scope') {
    this.name = name;
    this.depth = parent ? parent.depth + 1 : 0;
  }

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
    const callEnv = new Environment(this.closure, `function ${this.name}()`);
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
  public steps: ExecutionStep[] = [];
  public maxTraceSteps = 300;
  private stepCount = 0;
  public static readonly MAX_STEPS = 100000;

  constructor(customStdout?: (msg: string) => void, virtualFiles?: Record<string, string>) {
    this.globalEnv = new Environment(undefined, 'Global Scope');
    this.currentEnv = this.globalEnv;
    this.virtualFiles = virtualFiles || {};
    this.initBuiltins(customStdout);
  }

  public recordStep(node: ASTNode, action: string, changedVariable?: string, outputLog?: string) {
    if (this.steps.length >= this.maxTraceSteps) return;
    const scopes = this.getScopesSnapshot();
    const allVars: RuntimeVariable[] = [];
    const seen = new Set<string>();
    // Collect variables from innermost to outer, so local shadows outer
    for (let i = scopes.length - 1; i >= 0; i--) {
      for (const v of scopes[i].variables) {
        if (!seen.has(v.name)) {
          seen.add(v.name);
          allVars.push({
            ...v,
            changed: v.name === changedVariable,
          });
        }
      }
    }
    this.steps.push({
      stepNumber: this.steps.length + 1,
      line: node.line || 1,
      col: node.col || 1,
      statementType: node.type,
      action,
      scopes,
      allVariables: allVars,
      changedVariable,
      outputLog,
    });
  }

  public getScopesSnapshot(): RuntimeScope[] {
    const scopes: RuntimeScope[] = [];
    let current: Environment | undefined = this.currentEnv;
    while (current) {
      const vars: RuntimeVariable[] = [];
      for (const [k, v] of current.bindings.entries()) {
        if (typeof v === 'function' && !(v instanceof CallableFunction)) {
          continue;
        }
        const { formatted, type } = formatRuntimeValue(v);
        vars.push({
          name: k,
          value: v,
          type,
          formattedValue: formatted,
          scopeName: current.name,
          scopeDepth: current.depth,
        });
      }
      scopes.unshift({
        name: current.name,
        depth: current.depth,
        variables: vars,
      });
      current = current.parent;
    }
    return scopes;
  }

  public getRuntimeState(executionTimeMs = 0): RuntimeExecutionState {
    const finalScopes = this.getScopesSnapshot();
    const finalVars: RuntimeVariable[] = [];
    const seen = new Set<string>();
    for (let i = finalScopes.length - 1; i >= 0; i--) {
      for (const v of finalScopes[i].variables) {
        if (!seen.has(v.name)) {
          seen.add(v.name);
          finalVars.push(v);
        }
      }
    }
    return {
      totalSteps: this.steps.length,
      steps: this.steps,
      scopes: finalScopes,
      allVariables: finalVars,
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
    };
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
    const fnTriangleS = (args: any[]) => 0.5 * Number(args[0] ?? 0) * Number(args[1] ?? 0);
    const fnTriangleC = (args: any[]) => Number(args[0] ?? 0) + Number(args[1] ?? 0) + Number(args[2] ?? 0);
    for (const alias of ['triangle_s', 'triangle_S', 'triangle_area', 'tri_s', 'tri_S', 'tri_area']) {
      this.globalEnv.define(alias, fnTriangleS);
    }
    for (const alias of ['triangle_c', 'triangle_C', 'triangle_perimeter', 'tri_c', 'tri_C', 'tri_perimeter']) {
      this.globalEnv.define(alias, fnTriangleC);
    }

    // Standard Library: String Operations
    this.globalEnv.define('upper', (args: any[]) => (args.length > 0 ? String(args[0]).toUpperCase() : ''));
    this.globalEnv.define('lower', (args: any[]) => (args.length > 0 ? String(args[0]).toLowerCase() : ''));
    this.globalEnv.define('trim', (args: any[]) => (args.length > 0 ? String(args[0]).trim() : ''));
    this.globalEnv.define('replace', (args: any[]) =>
      args.length >= 3
        ? String(args[0]).split(String(args[1])).join(String(args[2]))
        : args.length > 0
          ? String(args[0])
          : ''
    );
    this.globalEnv.define('split', (args: any[]) => (args.length > 0 ? String(args[0]).split(String(args[1] ?? '')) : []));
    this.globalEnv.define('join', (args: any[]) =>
      Array.isArray(args[0]) ? args[0].join(String(args[1] ?? '')) : (args.length > 0 ? String(args[0]) : '')
    );
    this.globalEnv.define('contains', (args: any[]) => (args.length >= 2 ? String(args[0]).includes(String(args[1])) : false));

    // Standard Library: List & Aggregation
    this.globalEnv.define('sum', (args: any[]) =>
      Array.isArray(args[0]) ? args[0].reduce((acc, curr) => acc + (isNaN(Number(curr)) ? 0 : Number(curr)), 0) : 0
    );
    this.globalEnv.define('min_val', (args: any[]) => {
      if (!Array.isArray(args[0]) || args[0].length === 0) return 0;
      const nums = args[0].map(Number).filter((n) => !isNaN(n));
      return nums.length > 0 ? Math.min(...nums) : 0;
    });
    this.globalEnv.define('max_val', (args: any[]) => {
      if (!Array.isArray(args[0]) || args[0].length === 0) return 0;
      const nums = args[0].map(Number).filter((n) => !isNaN(n));
      return nums.length > 0 ? Math.max(...nums) : 0;
    });
    this.globalEnv.define('avg', (args: any[]) => {
      if (!Array.isArray(args[0]) || args[0].length === 0) return 0;
      const nums = args[0].map(Number).filter((n) => !isNaN(n));
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    });
    this.globalEnv.define('reverse', (args: any[]) => {
      if (Array.isArray(args[0])) return [...args[0]].reverse();
      if (typeof args[0] === 'string') return args[0].split('').reverse().join('');
      return args[0] ?? null;
    });

    // Standard Library: Higher-Order Collections
    this.globalEnv.define('map', (args: any[]) => {
      const arr = args[0];
      const fn = args[1];
      if (!Array.isArray(arr) || !fn) return [];
      return arr.map((item, idx) => {
        if (fn instanceof CallableFunction) return fn.call(this, [item, idx], 0, 0);
        if (typeof fn === 'function') return fn([item, idx]);
        return item;
      });
    });

    this.globalEnv.define('filter', (args: any[]) => {
      const arr = args[0];
      const fn = args[1];
      if (!Array.isArray(arr) || !fn) return [];
      return arr.filter((item, idx) => {
        if (fn instanceof CallableFunction) return Boolean(fn.call(this, [item, idx], 0, 0));
        if (typeof fn === 'function') return Boolean(fn([item, idx]));
        return Boolean(item);
      });
    });

    this.globalEnv.define('reduce', (args: any[]) => {
      const arr = args[0];
      const fn = args[1];
      let acc = args[2];
      if (!Array.isArray(arr) || !fn) return acc;
      for (let i = 0; i < arr.length; i++) {
        if (fn instanceof CallableFunction) {
          acc = fn.call(this, [acc, arr[i], i], 0, 0);
        } else if (typeof fn === 'function') {
          acc = fn([acc, arr[i], i]);
        }
      }
      return acc;
    });

    this.globalEnv.define('find', (args: any[]) => {
      const arr = args[0];
      const fn = args[1];
      if (!Array.isArray(arr) || !fn) return null;
      for (let i = 0; i < arr.length; i++) {
        const matches = fn instanceof CallableFunction ? fn.call(this, [arr[i], i], 0, 0) : fn([arr[i], i]);
        if (matches) return arr[i];
      }
      return null;
    });

    this.globalEnv.define('slice', (args: any[]) => {
      const target = args[0];
      const start = Number(args[1] ?? 0);
      const end = args[2] !== undefined ? Number(args[2]) : undefined;
      if (Array.isArray(target) || typeof target === 'string') {
        return target.slice(start, end);
      }
      return [];
    });

    this.globalEnv.define('push', (args: any[]) => {
      if (Array.isArray(args[0])) {
        args[0].push(args[1]);
        return args[0].length;
      }
      return 0;
    });

    this.globalEnv.define('shift', (args: any[]) => {
      if (Array.isArray(args[0])) return args[0].shift();
      return null;
    });

    this.globalEnv.define('unshift', (args: any[]) => {
      if (Array.isArray(args[0])) {
        args[0].unshift(args[1]);
        return args[0].length;
      }
      return 0;
    });

    this.globalEnv.define('sort', (args: any[]) => {
      if (Array.isArray(args[0])) {
        return [...args[0]].sort((a, b) => {
          if (typeof a === 'number' && typeof b === 'number') return a - b;
          return String(a).localeCompare(String(b), 'vi');
        });
      }
      return [];
    });

    this.globalEnv.define('concat', (args: any[]) => {
      if (Array.isArray(args[0]) && Array.isArray(args[1])) {
        return args[0].concat(args[1]);
      }
      if (typeof args[0] === 'string' || typeof args[1] === 'string') {
        return String(args[0] ?? '') + String(args[1] ?? '');
      }
      return [];
    });

    this.globalEnv.define('pop', (args: any[]) => {
      if (Array.isArray(args[0])) return args[0].pop();
      return null;
    });

    this.globalEnv.define('keys', (args: any[]) => {
      if (typeof args[0] === 'object' && args[0] !== null) return Object.keys(args[0]);
      return [];
    });

    this.globalEnv.define('values', (args: any[]) => {
      if (typeof args[0] === 'object' && args[0] !== null) return Object.values(args[0]);
      return [];
    });

    this.globalEnv.define('entries', (args: any[]) => {
      if (typeof args[0] === 'object' && args[0] !== null) return Object.entries(args[0]);
      return [];
    });

    // Standard Library: Vietnamese Unicode & UTF-8
    const fnViNoAccents = (args: any[]) => {
      let s = String(args[0] ?? '');
      s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      s = s.replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
      return s;
    };
    this.globalEnv.define('vietnamese_remove_accents', fnViNoAccents);
    this.globalEnv.define('vi_no_accents', fnViNoAccents);
    this.globalEnv.define('vietnamese_sort_key', (args: any[]) => fnViNoAccents(args).toLowerCase());
    this.globalEnv.define('vi_sort_key', (args: any[]) => fnViNoAccents(args).toLowerCase());
    this.globalEnv.define('str_char_at', (args: any[]) => {
      const chars = [...String(args[0] ?? '')];
      return chars[Number(args[1] ?? 0)] ?? '';
    });
    this.globalEnv.define('str_starts_with', (args: any[]) => String(args[0] ?? '').startsWith(String(args[1] ?? '')));
    this.globalEnv.define('str_ends_with', (args: any[]) => String(args[0] ?? '').endsWith(String(args[1] ?? '')));
    this.globalEnv.define('str_pad_start', (args: any[]) =>
      String(args[0] ?? '').padStart(Number(args[1] ?? 0), String(args[2] ?? ' '))
    );
    this.globalEnv.define('str_pad_end', (args: any[]) =>
      String(args[0] ?? '').padEnd(Number(args[1] ?? 0), String(args[2] ?? ' '))
    );

    this.globalEnv.define('utf8_len', (args: any[]) => [...String(args[0] ?? '')].length);
    this.globalEnv.define('unicode_slice', (args: any[]) => {
      const chars = [...String(args[0] ?? '')];
      const start = Number(args[1] ?? 0);
      const end = args[2] !== undefined ? Number(args[2]) : undefined;
      return chars.slice(start, end).join('');
    });
    this.globalEnv.define('char_at', (args: any[]) => {
      const chars = [...String(args[0] ?? '')];
      const idx = Number(args[1] ?? 0);
      return chars[idx] ?? '';
    });
    this.globalEnv.define('normalize_vn', (args: any[]) => String(args[0] ?? '').normalize('NFC'));
    this.globalEnv.define('is_alpha_vn', (args: any[]) =>
      /^[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ\s]+$/.test(String(args[0] ?? ''))
    );

    // Standard Library: JSON & Virtual File I/O
    this.globalEnv.define('json_parse', (args: any[]) => {
      try {
        return JSON.parse(String(args[0]));
      } catch (err: any) {
        throw { stage: 'runtime', message: `json_parse error: ${err?.message}` };
      }
    });

    this.globalEnv.define('json_stringify', (args: any[]) => {
      const indent = args[1] !== undefined ? Number(args[1]) : 2;
      return JSON.stringify(args[0], null, indent);
    });

    this.globalEnv.define('file_read', (args: any[]) => {
      const fname = String(args[0]);
      return this.virtualFiles[fname] ?? '';
    });
    this.globalEnv.define('read_file', (args: any[]) => {
      const fname = String(args[0]);
      return this.virtualFiles[fname] ?? '';
    });

    this.globalEnv.define('file_write', (args: any[]) => {
      const fname = String(args[0]);
      const content = String(args[1] ?? '');
      this.virtualFiles[fname] = content;
      return true;
    });
    this.globalEnv.define('write_file', (args: any[]) => {
      const fname = String(args[0]);
      const content = String(args[1] ?? '');
      this.virtualFiles[fname] = content;
      return true;
    });

    this.globalEnv.define('file_exists', (args: any[]) => {
      const fname = String(args[0]);
      return fname in this.virtualFiles;
    });

    this.globalEnv.define('path_join', (args: any[]) => {
      const parts = args.map((x) => String(x).replace(/\/+$/, '').replace(/^\/+/, ''));
      return parts.join('/');
    });

    // Standard Library: Python & Native Interop FFI
    this.globalEnv.define('py_import', (args: any[]) => {
      const mod = String(args[0]);
      return { module: mod, status: 'interop_ready', native: true };
    });

    this.globalEnv.define('py_eval', (args: any[]) => String(args[0]));
    this.globalEnv.define('py_exec', (args: any[]) => `Executed Python: ${args[0]}`);

    this.globalEnv.define('ffi_call', (args: any[]) => {
      const mod = String(args[0]);
      const fn = String(args[1]);
      const fnArgs = args.slice(2);
      return `[FFI ${mod}::${fn}(${fnArgs.join(', ')})]`;
    });

    this.globalEnv.define('js_eval', (args: any[]) => {
      try {
        return Function(`"use strict"; return (${args[0]});`)();
      } catch (err: any) {
        return `JS Eval Error: ${err?.message}`;
      }
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
        const { formatted } = formatRuntimeValue(val);
        this.recordStep(decl, `Khai báo biến ${decl.name} = ${formatted}`, decl.name);
        return val;
      }

      case 'Destructure': {
        const d = node as any;
        const rhsVal = this.evaluate(d.value);
        if (d.kind === 'array') {
          const arr = Array.isArray(rhsVal) ? rhsVal : [];
          for (let i = 0; i < d.names.length; i++) {
            const item = i < arr.length ? arr[i] : null;
            if (d.isDeclaration) {
              this.currentEnv.define(d.names[i], item);
            } else {
              this.currentEnv.set(d.names[i], item);
            }
          }
          this.recordStep(d, `Phân rã mảng [${d.names.join(', ')}] = ${formatRuntimeValue(rhsVal).formatted}`);
        } else {
          const obj = (rhsVal && typeof rhsVal === 'object') ? rhsVal : {};
          for (const name of d.names) {
            const item = name in obj ? obj[name] : null;
            if (d.isDeclaration) {
              this.currentEnv.define(name, item);
            } else {
              this.currentEnv.set(name, item);
            }
          }
          this.recordStep(d, `Phân rã Dict {${d.names.join(', ')}} = ${formatRuntimeValue(rhsVal).formatted}`);
        }
        return rhsVal;
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
          } else if (assign.operator === '*=') {
            const cur = this.currentEnv.get(id, assign.line, assign.col);
            this.currentEnv.set(id, cur * val);
          } else if (assign.operator === '/=') {
            const cur = this.currentEnv.get(id, assign.line, assign.col);
            if (val === 0) {
              throw { stage: 'runtime', message: 'Division by zero in "/="', line: assign.line, col: assign.col };
            }
            this.currentEnv.set(id, cur / val);
          } else if (assign.operator === '%=') {
            const cur = this.currentEnv.get(id, assign.line, assign.col);
            if (val === 0) {
              throw { stage: 'runtime', message: 'Modulo by zero in "%="', line: assign.line, col: assign.col };
            }
            this.currentEnv.set(id, cur % val);
          }
          const finalVal = this.currentEnv.get(id, assign.line, assign.col);
          const { formatted } = formatRuntimeValue(finalVal);
          this.recordStep(assign, `Gán giá trị ${id} ${assign.operator} ${formatted}`, id);
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
          } else if (assign.operator === '*=') {
            tgt[idx] = tgt[idx] * val;
          } else if (assign.operator === '/=') {
            if (val === 0) {
              throw { stage: 'runtime', message: 'Division by zero in "/="', line: assign.line, col: assign.col };
            }
            tgt[idx] = tgt[idx] / val;
          } else if (assign.operator === '%=') {
            if (val === 0) {
              throw { stage: 'runtime', message: 'Modulo by zero in "%="', line: assign.line, col: assign.col };
            }
            tgt[idx] = tgt[idx] % val;
          }
          const { formatted } = formatRuntimeValue(tgt[idx]);
          this.recordStep(assign, `Cập nhật phần tử [${idx}] = ${formatted}`);
        }
        return val;
      }

      case 'FunctionDef': {
        const fn = node as FunctionDefNode;
        const callable = new CallableFunction(fn.name, fn.parameters, fn.body, this.currentEnv);
        this.currentEnv.define(fn.name, callable);
        this.recordStep(fn, `Định nghĩa hàm ${fn.name}(${fn.parameters.join(', ')})`, fn.name);
        return callable;
      }

      case 'If': {
        const ifNode = node as IfNode;
        const cond = this.evaluate(ifNode.condition);
        this.recordStep(ifNode, `Kiểm tra điều kiện if (${Boolean(cond) ? 'true' : 'false'})`);
        if (Boolean(cond)) {
          const sub = new Environment(this.currentEnv, 'if-block');
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
          const elifCond = this.evaluate(branch.condition);
          this.recordStep(branch.condition, `Kiểm tra điều kiện elseif (${Boolean(elifCond) ? 'true' : 'false'})`);
          if (Boolean(elifCond)) {
            const sub = new Environment(this.currentEnv, 'elseif-block');
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
          this.recordStep(ifNode.elseBranch, 'Thực thi nhánh else');
          const sub = new Environment(this.currentEnv, 'else-block');
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
          const sub = new Environment(this.currentEnv, 'while-block');
          const prev = this.currentEnv;
          this.currentEnv = sub;
          this.recordStep(w, 'Lặp qua khối lệnh while');
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
          const sub = new Environment(this.currentEnv, `for (${f.variable})`);
          sub.define(f.variable, item);
          const prev = this.currentEnv;
          this.currentEnv = sub;
          const { formatted } = formatRuntimeValue(item);
          this.recordStep(f, `Vòng lặp for: ${f.variable} = ${formatted}`, f.variable);
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
        const { formatted } = formatRuntimeValue(val);
        this.recordStep(ret, `Return giá trị ${formatted}`);
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
        const logStr = vals.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' ');
        this.recordStep(p, `Gọi print(${logStr})`, undefined, logStr);
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

      case 'TryCatch': {
        const tc = node as any;
        const sub = new Environment(this.currentEnv, 'try-block');
        const prev = this.currentEnv;
        this.currentEnv = sub;
        try {
          return this.executeBlock(tc.tryBlock);
        } catch (err: any) {
          if (err instanceof ReturnSignal || err instanceof BreakSignal || err instanceof ContinueSignal) {
            throw err;
          }
          const catchEnv = new Environment(prev, 'catch-block');
          if (tc.errorVar) {
            const msg = typeof err === 'string' ? err : err?.message ?? JSON.stringify(err);
            catchEnv.define(tc.errorVar, msg);
          }
          this.currentEnv = catchEnv;
          this.recordStep(tc, `Bắt ngoại lệ tại catch (${tc.errorVar || 'err'})`);
          return this.executeBlock(tc.catchBlock);
        } finally {
          this.currentEnv = prev;
        }
      }

      case 'Throw': {
        const th = node as any;
        const msg = this.evaluate(th.expression);
        throw { stage: 'runtime', message: String(msg), line: th.line, col: th.col };
      }

      case 'Match': {
        const m = node as any;
        const discVal = this.evaluate(m.discriminant);
        this.recordStep(m, `Kiểm tra match (${discVal})`);
        let matched = false;

        for (const c of m.cases) {
          const patVal = this.evaluate(c.pattern);
          if (discVal === patVal || String(discVal) === String(patVal)) {
            matched = true;
            this.recordStep(c, `Khớp case (${patVal})`);
            const sub = new Environment(this.currentEnv, 'match-case');
            const prev = this.currentEnv;
            this.currentEnv = sub;
            try {
              return this.executeBlock(c.body);
            } finally {
              this.currentEnv = prev;
            }
          }
        }

        if (!matched && m.defaultCase) {
          this.recordStep(m.defaultCase, 'Thực thi default case');
          const sub = new Environment(this.currentEnv, 'match-default');
          const prev = this.currentEnv;
          this.currentEnv = sub;
          try {
            return this.executeBlock(m.defaultCase);
          } finally {
            this.currentEnv = prev;
          }
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

        // Flexible Dynamic Typing
        if (op === '+') return left + right;
        if (op === '-') return left - right;
        if (op === '*') return left * right;
        if (op === '/') {
          if (right === 0) throw { stage: 'runtime', message: 'Division by zero', line: bin.line, col: bin.col };
          return left / right;
        }
        if (op === '%') {
          if (right === 0) throw { stage: 'runtime', message: 'Modulo by zero', line: bin.line, col: bin.col };
          return left % right;
        }
        if (op === '==') return left === right;
        if (op === '!=') return left !== right;
        if (op === '<') return left < right;
        if (op === '<=') return left <= right;
        if (op === '>') return left > right;
        if (op === '>=') return left >= right;
        if (op === 'and') return left && right;
        if (op === 'or') return left || right;
        if (op === '??') return left !== null && left !== undefined ? left : right;
        return null;
      }

      case 'Range': {
        const r = node as any;
        const start = Number(this.evaluate(r.start));
        const end = Number(this.evaluate(r.end));
        const res: number[] = [];
        if (start <= end) {
          for (let i = start; i <= end; i++) res.push(i);
        } else {
          for (let i = start; i >= end; i--) res.push(i);
        }
        return res;
      }

      case 'Pipeline': {
        const p = node as any;
        const left = this.evaluate(p.left);
        if (p.target.type === 'Identifier') {
          const fn = this.currentEnv.get(p.target.name, p.line, p.col);
          if (fn instanceof CallableFunction) {
            return fn.call(this, [left], p.line, p.col);
          }
          if (typeof fn === 'function') {
            return fn([left]);
          }
          throw { stage: 'runtime', message: `'${p.target.name}' is not callable in pipeline`, line: p.line, col: p.col };
        }
        if (p.target.type === 'Call') {
          const callee = this.evaluate(p.target.callee);
          const args = [left, ...p.target.arguments.map((a: any) => this.evaluate(a))];
          if (callee instanceof CallableFunction) {
            return callee.call(this, args, p.line, p.col);
          }
          if (typeof callee === 'function') {
            return callee(args);
          }
          throw { stage: 'runtime', message: 'Target in pipeline is not callable', line: p.line, col: p.col };
        }
        return left;
      }

      case 'InterpolatedString': {
        const isNode = node as any;
        let out = '';
        for (const part of isNode.parts) {
          const val = this.evaluate(part);
          out += val === null ? 'null' : String(val);
        }
        return out;
      }

      default:
        return null;
    }
  }
}
