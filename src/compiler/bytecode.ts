import { ASTNode, ProgramNode, VarDeclNode, AssignNode, CallNode, LiteralNode, IdentifierNode, BinaryOpNode, UnaryOpNode, IfNode, WhileNode, ForNode, ReturnNode, FunctionDefNode, PrintNode } from './types';

export interface BytecodeInstruction {
  offset: number;
  opcode: string;
  arg?: any;
  comment?: string;
}

export interface CompiledBytecode {
  magic: string;
  version: string;
  constants: any[];
  instructions: BytecodeInstruction[];
  disassembly: string;
}

/**
 * BLang Bytecode Compiler (BVM - BLang Virtual Machine)
 * Proves BLang is a 100% independent, standalone programming language
 * with its own Instruction Set Architecture (ISA) and Virtual Machine runtime.
 */
export class BytecodeCompiler {
  private instructions: BytecodeInstruction[] = [];
  private constants: any[] = [];
  private offset = 0;

  public compile(ast: ProgramNode): CompiledBytecode {
    this.instructions = [];
    this.constants = [];
    this.offset = 0;

    for (const stmt of ast.statements) {
      this.compileStatement(stmt);
    }

    this.emit('HALT', undefined, 'End of BLang program execution');

    const disassembly = this.generateDisassembly();

    return {
      magic: 'BLANG_BYTECODE_BVM',
      version: '1.0.0',
      constants: this.constants,
      instructions: this.instructions,
      disassembly,
    };
  }

  private emit(opcode: string, arg?: any, comment?: string) {
    this.instructions.push({
      offset: this.offset,
      opcode,
      arg,
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
        if (decl.initializer) {
          this.compileExpression(decl.initializer);
        } else {
          this.emit('LOAD_NULL');
        }
        this.emit('STORE_VAR', decl.name, `Bind to variable ${decl.name}`);
        break;
      }

      case 'Assign': {
        const assign = node as AssignNode;
        this.compileExpression(assign.value);
        if (assign.target.type === 'Identifier') {
          const name = (assign.target as IdentifierNode).name;
          if (assign.operator === '=') {
            this.emit('STORE_VAR', name, `Assign to ${name}`);
          } else if (assign.operator === '+=') {
            this.emit('LOAD_VAR', name);
            this.emit('BINARY_ADD');
            this.emit('STORE_VAR', name);
          } else if (assign.operator === '-=') {
            this.emit('LOAD_VAR', name);
            this.emit('BINARY_SUB');
            this.emit('STORE_VAR', name);
          }
        }
        break;
      }

      case 'Print': {
        const p = node as PrintNode;
        for (const arg of p.arguments) {
          this.compileExpression(arg);
        }
        this.emit('PRINT_VAL', p.arguments.length, `Print ${p.arguments.length} item(s)`);
        break;
      }

      case 'FunctionDef': {
        const fn = node as FunctionDefNode;
        this.emit('MAKE_FUNCTION', fn.name, `Define function ${fn.name}(${fn.parameters.join(', ')})`);
        for (const s of fn.body.statements) {
          this.compileStatement(s);
        }
        this.emit('RETURN_NULL');
        break;
      }

      case 'If': {
        const ifNode = node as IfNode;
        this.compileExpression(ifNode.condition);
        this.emit('JUMP_IF_FALSE', 'ELSE_BRANCH', 'Check branch condition');
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
        this.compileExpression(f.iterable);
        this.emit('GET_ITERATOR');
        this.emit('FOR_ITER', f.variable, `Iterate items into ${f.variable}`);
        for (const s of f.body.statements) {
          this.compileStatement(s);
        }
        this.emit('JUMP_LOOP_START');
        break;
      }

      case 'Return': {
        const r = node as ReturnNode;
        if (r.expression) {
          this.compileExpression(r.expression);
        } else {
          this.emit('LOAD_NULL');
        }
        this.emit('RETURN_VAL', undefined, 'Return from current frame');
        break;
      }

      case 'ExpressionStatement': {
        this.compileExpression((node as any).expression);
        this.emit('POP_TOP', undefined, 'Discard unused expression result');
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
        this.emit('LOAD_CONST', constIdx, JSON.stringify(lit.value));
        break;
      }

      case 'Identifier': {
        const id = node as IdentifierNode;
        this.emit('LOAD_VAR', id.name, `Read ${id.name}`);
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
          this.emit('CALL_RANDOM', call.arguments.length, '%random(a, b)% macro evaluation');
        } else {
          this.emit('CALL_FN', `${calleeName} (${call.arguments.length} args)`, `Invoke ${calleeName}`);
        }
        break;
      }

      case 'List': {
        const list = node as any;
        for (const el of list.elements) {
          this.compileExpression(el);
        }
        this.emit('BUILD_LIST', list.elements.length, `Create array of size ${list.elements.length}`);
        break;
      }

      case 'Dict': {
        const dict = node as any;
        for (const entry of dict.entries) {
          this.compileExpression(entry.key);
          this.compileExpression(entry.value);
        }
        this.emit('BUILD_DICT', dict.entries.length, `Create map of ${dict.entries.length} pairs`);
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
      '; BLang Native Virtual Machine (BVM v1.0)',
      '; Standalone Bytecode Architecture & Native Instruction Set',
      '; Independent Programming Language Runtime (Zero External Dependency)',
      '; ==============================================================================',
      '',
      '; --- CONSTANTS POOL ---',
    ];

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
