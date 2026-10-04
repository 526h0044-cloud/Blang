import {
  ASTNode,
  ProgramNode,
  VarDeclNode,
  AssignNode,
  CallNode,
  LiteralNode,
  IdentifierNode,
  BinaryOpNode,
  UnaryOpNode,
  IfNode,
  WhileNode,
  ForNode,
  ReturnNode,
  FunctionDefNode,
  PrintNode,
  TryCatchNode,
  ThrowNode,
} from './types';

export interface BytecodeInstruction {
  offset: number;
  opcode: string;
  arg?: any;
  slot?: number;
  comment?: string;
}

export interface CompiledBytecode {
  magic: string;
  version: string;
  constants: any[];
  instructions: BytecodeInstruction[];
  slotTable: Record<string, number>;
  disassembly: string;
}

export interface VMExecutionResult {
  instructionsExecuted: number;
  executionTimeMs: number;
  peakStackDepth: number;
  finalStackTop: any;
  slots: Record<string, any>;
  outputs: string[];
}

/**
 * BLang Bytecode Compiler (BVM - BLang Virtual Machine)
 * Features Fast Variable Slot Lookup (indexing local variables into flat memory slots)
 * and compilation of AST into a stack-based instruction set.
 */
export class BytecodeCompiler {
  private instructions: BytecodeInstruction[] = [];
  private constants: any[] = [];
  private slotTable: Record<string, number> = {};
  private nextSlot = 0;
  private offset = 0;

  public compile(ast: ProgramNode): CompiledBytecode {
    this.instructions = [];
    this.constants = [];
    this.slotTable = {};
    this.nextSlot = 0;
    this.offset = 0;

    for (const stmt of ast.statements) {
      this.compileStatement(stmt);
    }

    this.emit('HALT', undefined, undefined, 'End of BLang BVM program execution');

    const disassembly = this.generateDisassembly();

    return {
      magic: 'BLANG_BYTECODE_BVM',
      version: '2.0.0',
      constants: this.constants,
      instructions: this.instructions,
      slotTable: this.slotTable,
      disassembly,
    };
  }

  private getOrAllocSlot(name: string): number {
    if (this.slotTable[name] !== undefined) {
      return this.slotTable[name];
    }
    const slot = this.nextSlot++;
    this.slotTable[name] = slot;
    return slot;
  }

  private emit(opcode: string, arg?: any, slot?: number, comment?: string) {
    this.instructions.push({
      offset: this.offset,
      opcode,
      arg,
      slot,
      comment,
    });
    this.offset += 2;
  }

  private addConstant(val: any): number {
    const idx = this.constants.findIndex((c) => c === val);
    if (idx !== -1) return idx;
    this.constants.push(val);
    return this.constants.length - 1;
  }

  private compileStatement(node: ASTNode) {
    switch (node.type) {
      case 'VarDecl': {
        const decl = node as VarDeclNode;
        const slot = this.getOrAllocSlot(decl.name);
        if (decl.initializer) {
          this.compileExpression(decl.initializer);
        } else {
          this.emit('LOAD_NULL');
        }
        this.emit('STORE_FAST', slot, slot, `Bind to local slot [${slot}] (${decl.name})`);
        break;
      }

      case 'Assign': {
        const assign = node as AssignNode;
        this.compileExpression(assign.value);
        if (assign.target.type === 'Identifier') {
          const name = (assign.target as IdentifierNode).name;
          const slot = this.getOrAllocSlot(name);
          if (assign.operator === '=') {
            this.emit('STORE_FAST', slot, slot, `Assign to slot [${slot}] (${name})`);
          } else if (assign.operator === '+=') {
            this.emit('LOAD_FAST', slot, slot, `Read slot [${slot}]`);
            this.emit('BINARY_ADD');
            this.emit('STORE_FAST', slot, slot, `Update slot [${slot}]`);
          } else if (assign.operator === '-=') {
            this.emit('LOAD_FAST', slot, slot, `Read slot [${slot}]`);
            this.emit('BINARY_SUB');
            this.emit('STORE_FAST', slot, slot, `Update slot [${slot}]`);
          } else if (assign.operator === '*=') {
            this.emit('LOAD_FAST', slot, slot, `Read slot [${slot}]`);
            this.emit('BINARY_MUL');
            this.emit('STORE_FAST', slot, slot, `Update slot [${slot}]`);
          } else if (assign.operator === '/=') {
            this.emit('LOAD_FAST', slot, slot, `Read slot [${slot}]`);
            this.emit('BINARY_DIV');
            this.emit('STORE_FAST', slot, slot, `Update slot [${slot}]`);
          } else if (assign.operator === '%=') {
            this.emit('LOAD_FAST', slot, slot, `Read slot [${slot}]`);
            this.emit('BINARY_MOD');
            this.emit('STORE_FAST', slot, slot, `Update slot [${slot}]`);
          }
        }
        break;
      }

      case 'Print': {
        const p = node as PrintNode;
        for (const arg of p.arguments) {
          this.compileExpression(arg);
        }
        this.emit('PRINT_VAL', p.arguments.length, undefined, `Print ${p.arguments.length} item(s)`);
        break;
      }

      case 'FunctionDef': {
        const fn = node as FunctionDefNode;
        this.emit('MAKE_FUNCTION', fn.name, undefined, `Define function ${fn.name}(${fn.parameters.join(', ')})`);
        for (const s of fn.body.statements) {
          this.compileStatement(s);
        }
        this.emit('RETURN_NULL');
        break;
      }

      case 'If': {
        const ifNode = node as IfNode;
        this.compileExpression(ifNode.condition);
        this.emit('JUMP_IF_FALSE', 'ELSE_BRANCH', undefined, 'Check branch condition');
        for (const s of ifNode.thenBranch.statements) {
          this.compileStatement(s);
        }
        if (ifNode.elseBranch) {
          this.emit('JUMP_ABSOLUTE', 'END_IF');
          for (const s of ifNode.elseBranch.statements) {
            this.compileStatement(s);
          }
        }
        break;
      }

      case 'While': {
        const w = node as WhileNode;
        this.emit('LOOP_START');
        this.compileExpression(w.condition);
        this.emit('JUMP_IF_FALSE', 'LOOP_END');
        for (const s of w.body.statements) {
          this.compileStatement(s);
        }
        this.emit('JUMP_LOOP_START');
        this.emit('LOOP_END');
        break;
      }

      case 'For': {
        const f = node as ForNode;
        const slot = this.getOrAllocSlot(f.variable);
        this.compileExpression(f.iterable);
        this.emit('GET_ITERATOR');
        this.emit('FOR_ITER', slot, slot, `Iterate items into slot [${slot}] (${f.variable})`);
        for (const s of f.body.statements) {
          this.compileStatement(s);
        }
        this.emit('JUMP_LOOP_START');
        break;
      }

      case 'TryCatch': {
        const tc = node as TryCatchNode;
        this.emit('SETUP_TRY', undefined, undefined, 'Establish exception frame');
        for (const s of tc.tryBlock.statements) {
          this.compileStatement(s);
        }
        this.emit('POP_TRY', undefined, undefined, 'Clear exception frame');
        this.emit('JUMP_ABSOLUTE', 'END_TRY');
        if (tc.errorVar) {
          const errSlot = this.getOrAllocSlot(tc.errorVar);
          this.emit('STORE_FAST', errSlot, errSlot, `Store exception into [${errSlot}] (${tc.errorVar})`);
        }
        for (const s of tc.catchBlock.statements) {
          this.compileStatement(s);
        }
        break;
      }

      case 'Throw': {
        const th = node as ThrowNode;
        this.compileExpression(th.expression);
        this.emit('RAISE_EXCEPTION', undefined, undefined, 'Raise user runtime exception');
        break;
      }

      case 'Return': {
        const r = node as ReturnNode;
        if (r.expression) {
          this.compileExpression(r.expression);
        } else {
          this.emit('LOAD_NULL');
        }
        this.emit('RETURN_VAL', undefined, undefined, 'Return from current frame');
        break;
      }

      case 'ExpressionStatement': {
        this.compileExpression((node as any).expression);
        this.emit('POP_TOP', undefined, undefined, 'Discard unused expression result');
        break;
      }

      default:
        break;
    }
  }

  private compileExpression(node: ASTNode) {
    switch (node.type) {
      case 'Literal': {
        const lit = node as LiteralNode;
        const constIdx = this.addConstant(lit.value);
        this.emit('LOAD_CONST', constIdx, undefined, JSON.stringify(lit.value));
        break;
      }

      case 'Identifier': {
        const id = node as IdentifierNode;
        const slot = this.getOrAllocSlot(id.name);
        this.emit('LOAD_FAST', slot, slot, `Read slot [${slot}] (${id.name})`);
        break;
      }

      case 'BinaryOp': {
        const bin = node as BinaryOpNode;
        this.compileExpression(bin.left);
        this.compileExpression(bin.right);
        const opMap: Record<string, string> = {
          '+': 'BINARY_ADD',
          '-': 'BINARY_SUB',
          '*': 'BINARY_MUL',
          '/': 'BINARY_DIV',
          '%': 'BINARY_MOD',
          '??': 'NULL_COALESCE',
          '==': 'COMPARE_EQ',
          '!=': 'COMPARE_NEQ',
          '<': 'COMPARE_LT',
          '<=': 'COMPARE_LTE',
          '>': 'COMPARE_GT',
          '>=': 'COMPARE_GTE',
          '&&': 'LOGICAL_AND',
          '||': 'LOGICAL_OR',
        };
        const opcode = opMap[bin.operator] || 'BINARY_OP';
        this.emit(opcode, bin.operator);
        break;
      }

      case 'UnaryOp': {
        const un = node as UnaryOpNode;
        this.compileExpression(un.operand);
        if (un.operator === '-') this.emit('UNARY_NEGATE');
        if (un.operator === '!' || un.operator === 'not') this.emit('UNARY_NOT');
        break;
      }

      case 'Call': {
        const call = node as CallNode;
        let calleeName = 'unknown';
        if (call.callee.type === 'Identifier') {
          calleeName = (call.callee as IdentifierNode).name;
        }
        for (const arg of call.arguments) {
          this.compileExpression(arg);
        }
        if (calleeName === 'random') {
          this.emit('CALL_RANDOM', call.arguments.length, undefined, '%random(a, b)% macro evaluation');
        } else {
          this.emit('CALL_FN', `${calleeName} (${call.arguments.length} args)`, undefined, `Invoke ${calleeName}`);
        }
        break;
      }

      case 'List': {
        const list = node as any;
        for (const el of list.elements) {
          this.compileExpression(el);
        }
        this.emit('BUILD_LIST', list.elements.length, undefined, `Create array of size ${list.elements.length}`);
        break;
      }

      case 'Dict': {
        const dict = node as any;
        for (const entry of dict.entries) {
          this.compileExpression(entry.key);
          this.compileExpression(entry.value);
        }
        this.emit('BUILD_DICT', dict.entries.length, undefined, `Create map of ${dict.entries.length} pairs`);
        break;
      }

      default:
        this.emit('NOP');
        break;
    }
  }

  private generateDisassembly(): string {
    const lines: string[] = [
      '; ==============================================================================',
      '; BLang Native Virtual Machine (BVM v2.0 - Fast Slot Execution Engine)',
      '; Standalone Bytecode Architecture & Fast Variable Slot Lookup',
      '; Independent Programming Language Runtime (Zero External Dependency)',
      '; ==============================================================================',
      '',
      '; --- VARIABLE SLOTS ALLOCATION (O(1) FAST LOOKUP) ---',
    ];

    Object.entries(this.slotTable).forEach(([name, slot]) => {
      lines.push(`;   Slot [${slot.toString().padStart(2, '0')}] => ${name}`);
    });

    lines.push('');
    lines.push('; --- CONSTANTS POOL ---');
    this.constants.forEach((c, i) => {
      lines.push(`;   [${i.toString().padStart(2, '0')}] ${JSON.stringify(c)}`);
    });

    lines.push('');
    lines.push('; --- BVM OPCODES DISASSEMBLY ---');
    lines.push('; Offset  Opcode                 Operand / Target            Annotation');
    lines.push('; ----------------------------------------------------------------------');

    for (const inst of this.instructions) {
      const offStr = inst.offset.toString().padStart(4, '0');
      const opStr = inst.opcode.padEnd(22, ' ');
      const argStr = (inst.arg !== undefined ? String(inst.arg) : '').padEnd(28, ' ');
      const commentStr = inst.comment ? `; ${inst.comment}` : '';
      lines.push(`  ${offStr}    ${opStr} ${argStr} ${commentStr}`);
    }

    return lines.join('\n');
  }
}

/**
 * Stack-Based Bytecode Virtual Machine (BVM)
 * Executes compiled bytecode instructions directly on a virtual operand stack
 * using local variable slots for maximum memory and execution speed.
 */
export class VirtualMachine {
  private stack: any[] = [];
  private slots: any[] = [];
  private outputs: string[] = [];
  private peakStackDepth = 0;
  private instructionsExecuted = 0;

  constructor(private customPrint?: (...args: any[]) => void) {}

  public run(compiled: CompiledBytecode): VMExecutionResult {
    const startTime = performance.now();
    this.stack = [];
    this.slots = new Array(Object.keys(compiled.slotTable).length).fill(null);
    this.outputs = [];
    this.peakStackDepth = 0;
    this.instructionsExecuted = 0;

    const instructions = compiled.instructions;
    const constants = compiled.constants;
    let ip = 0;

    while (ip < instructions.length) {
      const inst = instructions[ip++];
      this.instructionsExecuted++;

      switch (inst.opcode) {
        case 'LOAD_CONST': {
          const val = constants[inst.arg];
          this.push(val);
          break;
        }

        case 'LOAD_NULL': {
          this.push(null);
          break;
        }

        case 'LOAD_FAST': {
          const slot = inst.arg;
          this.push(this.slots[slot]);
          break;
        }

        case 'STORE_FAST': {
          const slot = inst.arg;
          this.slots[slot] = this.pop();
          break;
        }

        case 'BINARY_ADD': {
          const b = this.pop();
          const a = this.pop();
          this.push(a + b);
          break;
        }

        case 'BINARY_SUB': {
          const b = this.pop();
          const a = this.pop();
          this.push(a - b);
          break;
        }

        case 'BINARY_MUL': {
          const b = this.pop();
          const a = this.pop();
          this.push(a * b);
          break;
        }

        case 'BINARY_DIV': {
          const b = this.pop();
          const a = this.pop();
          this.push(b === 0 ? 0 : a / b);
          break;
        }

        case 'BINARY_MOD': {
          const b = this.pop();
          const a = this.pop();
          this.push(b === 0 ? 0 : a % b);
          break;
        }

        case 'NULL_COALESCE': {
          const b = this.pop();
          const a = this.pop();
          this.push(a !== null && a !== undefined ? a : b);
          break;
        }

        case 'COMPARE_EQ': {
          const b = this.pop();
          const a = this.pop();
          this.push(a === b);
          break;
        }

        case 'COMPARE_NEQ': {
          const b = this.pop();
          const a = this.pop();
          this.push(a !== b);
          break;
        }

        case 'COMPARE_LT': {
          const b = this.pop();
          const a = this.pop();
          this.push(a < b);
          break;
        }

        case 'COMPARE_LTE': {
          const b = this.pop();
          const a = this.pop();
          this.push(a <= b);
          break;
        }

        case 'COMPARE_GT': {
          const b = this.pop();
          const a = this.pop();
          this.push(a > b);
          break;
        }

        case 'COMPARE_GTE': {
          const b = this.pop();
          const a = this.pop();
          this.push(a >= b);
          break;
        }

        case 'UNARY_NEGATE': {
          this.push(-this.pop());
          break;
        }

        case 'UNARY_NOT': {
          this.push(!this.pop());
          break;
        }

        case 'PRINT_VAL': {
          const count = Number(inst.arg);
          const args = [];
          for (let i = 0; i < count; i++) {
            args.unshift(this.pop());
          }
          const text = args.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ');
          this.outputs.push(text);
          if (this.customPrint) this.customPrint(text);
          break;
        }

        case 'BUILD_LIST': {
          const count = Number(inst.arg);
          const list = [];
          for (let i = 0; i < count; i++) {
            list.unshift(this.pop());
          }
          this.push(list);
          break;
        }

        case 'BUILD_DICT': {
          const count = Number(inst.arg);
          const dict: Record<string, any> = {};
          for (let i = 0; i < count; i++) {
            const val = this.pop();
            const key = this.pop();
            dict[key] = val;
          }
          this.push(dict);
          break;
        }

        case 'BINARY_SUBSCR': {
          const idx = this.pop();
          const target = this.pop();
          if (Array.isArray(target) || typeof target === 'string') {
            this.push(target[Number(idx)]);
          } else if (target && typeof target === 'object') {
            this.push(target[idx]);
          } else {
            this.push(null);
          }
          break;
        }

        case 'STORE_SUBSCR': {
          const val = this.pop();
          const idx = this.pop();
          const target = this.pop();
          if (Array.isArray(target)) {
            target[Number(idx)] = val;
          } else if (target && typeof target === 'object') {
            target[idx] = val;
          }
          break;
        }

        case 'CALL_RANDOM': {
          const count = Number(inst.arg || 0);
          const args = [];
          for (let i = 0; i < count; i++) {
            args.unshift(this.pop());
          }
          const min = Number(args[0] ?? 0);
          const max = Number(args[1] ?? 100);
          const lo = Math.min(min, max);
          const hi = Math.max(min, max);
          const randVal = Math.floor(Math.random() * (hi - lo + 1)) + lo;
          this.push(randVal);
          break;
        }

        case 'CALL_FN': {
          const fnSignature = String(inst.arg || '');
          const fnName = fnSignature.split(' ')[0] || '';
          const matchArgs = fnSignature.match(/\((\d+)\s+args\)/);
          const argCount = matchArgs ? parseInt(matchArgs[1], 10) : 0;
          const args: any[] = [];
          for (let i = 0; i < argCount; i++) {
            args.unshift(this.pop());
          }

          // Built-in function evaluation in BVM
          let result: any = null;
          switch (fnName) {
            case 'circle_c':
            case 'circle_C':
            case 'cir_c':
            case 'cir_C':
              result = 2 * Math.PI * Number(args[0] ?? 0);
              break;
            case 'circle_s':
            case 'circle_S':
            case 'cir_s':
            case 'cir_S':
            case 'circle_area':
              result = Math.PI * Math.pow(Number(args[0] ?? 0), 2);
              break;
            case 'sphere_v':
            case 'sphere_V':
            case 'sphere_volume':
              result = (4 / 3) * Math.PI * Math.pow(Number(args[0] ?? 0), 3);
              break;
            case 'cube_v':
              result = Math.pow(Number(args[0] ?? 0), 3);
              break;
            case 'cuboid_v':
              result = Number(args[0] ?? 0) * Number(args[1] ?? 0) * Number(args[2] ?? 0);
              break;
            case 'triangle_s':
            case 'tri_s':
              result = 0.5 * Number(args[0] ?? 0) * Number(args[1] ?? 0);
              break;
            case 'triangle_c':
            case 'tri_c':
              result = Number(args[0] ?? 0) + Number(args[1] ?? 0) + Number(args[2] ?? 0);
              break;
            case 'sin':
              result = Math.sin((Number(args[0] ?? 0) * Math.PI) / 180);
              break;
            case 'cos':
              result = Math.cos((Number(args[0] ?? 0) * Math.PI) / 180);
              break;
            case 'tan':
              result = Math.tan((Number(args[0] ?? 0) * Math.PI) / 180);
              break;
            case 'sqrt':
              result = Math.sqrt(Number(args[0] ?? 0));
              break;
            case 'pow':
              result = Math.pow(Number(args[0] ?? 0), Number(args[1] ?? 0));
              break;
            case 'len':
              result = args[0] ? (args[0].length ?? Object.keys(args[0]).length) : 0;
              break;
            case 'upper':
              result = String(args[0] ?? '').toUpperCase();
              break;
            case 'lower':
              result = String(args[0] ?? '').toLowerCase();
              break;
            case 'trim':
              result = String(args[0] ?? '').trim();
              break;
            case 'utf8_len':
              result = [...String(args[0] ?? '')].length;
              break;
            case 'vietnamese_remove_accents':
            case 'vi_no_accents': {
              let s = String(args[0] ?? '');
              s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              s = s.replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
              result = s;
              break;
            }
            case 'json_stringify':
              result = JSON.stringify(args[0], null, args[1] !== undefined ? Number(args[1]) : 2);
              break;
            case 'json_parse':
              try {
                result = JSON.parse(String(args[0]));
              } catch {
                result = null;
              }
              break;
            case 'keys':
              result = typeof args[0] === 'object' && args[0] !== null ? Object.keys(args[0]) : [];
              break;
            case 'values':
              result = typeof args[0] === 'object' && args[0] !== null ? Object.values(args[0]) : [];
              break;
            case 'entries':
              result = typeof args[0] === 'object' && args[0] !== null ? Object.entries(args[0]) : [];
              break;
            case 'concat':
              result = Array.isArray(args[0]) && Array.isArray(args[1]) ? [...args[0], ...args[1]] : [];
              break;
            case 'slice':
              if (Array.isArray(args[0]) || typeof args[0] === 'string') {
                result = args[0].slice(Number(args[1] ?? 0), args[2] !== undefined ? Number(args[2]) : undefined);
              } else {
                result = [];
              }
              break;
            case 'reverse':
              if (Array.isArray(args[0])) result = [...args[0]].reverse();
              else if (typeof args[0] === 'string') result = args[0].split('').reverse().join('');
              else result = args[0];
              break;
            case 'sum':
              result = Array.isArray(args[0]) ? args[0].reduce((a, b) => a + Number(b), 0) : 0;
              break;
            case 'time_now':
              result = Date.now();
              break;
            case 'random': {
              const lo = Math.min(Number(args[0] ?? 0), Number(args[1] ?? 100));
              const hi = Math.max(Number(args[0] ?? 0), Number(args[1] ?? 100));
              result = Math.floor(Math.random() * (hi - lo + 1)) + lo;
              break;
            }
            default:
              result = null;
              break;
          }
          this.push(result);
          break;
        }

        case 'HALT': {
          ip = instructions.length;
          break;
        }

        default:
          break;
      }
    }

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    const slotRecord: Record<string, any> = {};
    for (const [name, idx] of Object.entries(compiled.slotTable)) {
      slotRecord[name] = this.slots[idx];
    }

    return {
      instructionsExecuted: this.instructionsExecuted,
      executionTimeMs,
      peakStackDepth: this.peakStackDepth,
      finalStackTop: this.stack.length > 0 ? this.stack[this.stack.length - 1] : null,
      slots: slotRecord,
      outputs: this.outputs,
    };
  }

  private push(val: any) {
    this.stack.push(val);
    if (this.stack.length > this.peakStackDepth) {
      this.peakStackDepth = this.stack.length;
    }
  }

  private pop(): any {
    return this.stack.pop();
  }
}
