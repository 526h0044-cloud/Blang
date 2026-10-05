import { Lexer } from './lexer';
import { Parser } from './parser';
import { lintBLang } from './linter';
import { ProgramNode, ASTNode, FunctionDefNode, VarDeclNode } from './types';

export interface LSPCompletionItem {
  label: string;
  kind: 'keyword' | 'function' | 'variable' | 'macro' | 'module' | 'property';
  detail: string;
  documentation: string;
  insertText?: string;
}

export interface LSPHover {
  contents: string[];
  range?: { startLine: number; startCol: number; endLine: number; endCol: number };
}

export interface LSPLocation {
  line: number;
  col: number;
  uri?: string;
}

export interface LSPDocumentSymbol {
  name: string;
  kind: 'Function' | 'Variable' | 'Module' | 'Property';
  line: number;
  col: number;
  detail?: string;
  children?: LSPDocumentSymbol[];
}

export interface LSPDiagnostic {
  line: number;
  col: number;
  message: string;
  severity: 'Error' | 'Warning' | 'Information';
  source: 'BLang LSP';
  code?: string;
}

/**
 * Standard Library Catalog for LSP Autocomplete & Hover
 */
const STANDARD_BUILTINS: Record<string, { kind: 'function' | 'keyword' | 'macro'; detail: string; doc: string; insert?: string }> = {
  // Geometry
  circle_c: { kind: 'function', detail: 'circle_c(r: number): number', doc: 'Tính chu vi hình tròn bán kính r: C = 2 * PI * r' },
  circle_s: { kind: 'function', detail: 'circle_s(r: number): number', doc: 'Tính diện tích hình tròn bán kính r: S = PI * r^2' },
  sphere_v: { kind: 'function', detail: 'sphere_v(r: number): number', doc: 'Tính thể tích hình cầu bán kính r: V = (4/3) * PI * r^3' },
  sphere_s: { kind: 'function', detail: 'sphere_s(r: number): number', doc: 'Tính diện tích bề mặt hình cầu: S = 4 * PI * r^2' },
  cylinder_v: { kind: 'function', detail: 'cylinder_v(r: number, h: number): number', doc: 'Tính thể tích hình trụ bán kính r, chiều cao h: V = PI * r^2 * h' },
  cone_v: { kind: 'function', detail: 'cone_v(r: number, h: number): number', doc: 'Tính thể tích hình nón bán kính r, chiều cao h: V = (1/3) * PI * r^2 * h' },
  cube_v: { kind: 'function', detail: 'cube_v(a: number): number', doc: 'Tính thể tích khối lập phương cạnh a: V = a^3' },
  cuboid_v: { kind: 'function', detail: 'cuboid_v(a: number, b: number, c: number): number', doc: 'Tính thể tích hình hộp chữ nhật dài a, rộng b, cao c: V = a * b * c' },
  triangle_s: { kind: 'function', detail: 'triangle_s(base: number, height: number): number', doc: 'Tính diện tích tam giác cạnh đáy base, chiều cao height: S = 0.5 * b * h' },
  triangle_c: { kind: 'function', detail: 'triangle_c(a: number, b: number, c: number): number', doc: 'Tính chu vi tam giác 3 cạnh a, b, c: C = a + b + c' },

  // Trigonometry
  sin: { kind: 'function', detail: 'sin(deg: number): number', doc: 'Sin của góc tính bằng độ (Degrees)' },
  cos: { kind: 'function', detail: 'cos(deg: number): number', doc: 'Cos của góc tính bằng độ (Degrees)' },
  tan: { kind: 'function', detail: 'tan(deg: number): number', doc: 'Tan của góc tính bằng độ (Degrees)' },
  cotan: { kind: 'function', detail: 'cotan(deg: number): number', doc: 'Cotang của góc tính bằng độ' },
  sqrt: { kind: 'function', detail: 'sqrt(x: number): number', doc: 'Căn bậc hai của số thực x' },
  pow: { kind: 'function', detail: 'pow(base: number, exp: number): number', doc: 'Lũy thừa base mũ exp' },

  // Collections
  map: { kind: 'function', detail: 'map(list: any[], fn: function): any[]', doc: 'Áp dụng hàm biến đổi fn lên từng phần tử của mảng list' },
  filter: { kind: 'function', detail: 'filter(list: any[], fn: function): any[]', doc: 'Lọc các phần tử của mảng list thỏa mãn điều kiện trả về của hàm fn' },
  reduce: { kind: 'function', detail: 'reduce(list: any[], fn: function, initial: any): any', doc: 'Thu gọn mảng list thành giá trị đơn lẻ với giá trị khởi tạo initial' },
  find: { kind: 'function', detail: 'find(list: any[], fn: function): any | null', doc: 'Tìm phần tử đầu tiên trong mảng thỏa mãn hàm fn' },
  slice: { kind: 'function', detail: 'slice(target: any[] | string, start: number, end?: number)', doc: 'Cắt mảng hoặc chuỗi từ vị trí start đến end' },
  concat: { kind: 'function', detail: 'concat(listA: any[], listB: any[]): any[]', doc: 'Nối hai danh sách mảng lại với nhau' },
  push: { kind: 'function', detail: 'push(list: any[], item: any): number', doc: 'Thêm phần tử vào cuối danh sách' },
  pop: { kind: 'function', detail: 'pop(list: any[]): any', doc: 'Lấy và xóa phần tử cuối cùng trong mảng' },
  shift: { kind: 'function', detail: 'shift(list: any[]): any', doc: 'Lấy và xóa phần tử đầu tiên trong mảng' },
  unshift: { kind: 'function', detail: 'unshift(list: any[], item: any): number', doc: 'Chèn phần tử vào đầu danh sách' },
  sort: { kind: 'function', detail: 'sort(list: any[]): any[]', doc: 'Sắp xếp mảng theo thứ tự tăng dần' },
  reverse: { kind: 'function', detail: 'reverse(target: any[] | string): any', doc: 'Đảo ngược danh sách hoặc chuỗi ký tự' },
  keys: { kind: 'function', detail: 'keys(dict: object): string[]', doc: 'Lấy danh sách các khóa (keys) của từ điển' },
  values: { kind: 'function', detail: 'values(dict: object): any[]', doc: 'Lấy danh sách các giá trị (values) của từ điển' },
  entries: { kind: 'function', detail: 'entries(dict: object): any[][]', doc: 'Lấy danh sách cặp [khóa, giá trị] của từ điển' },

  // Unicode & Vietnamese
  utf8_len: { kind: 'function', detail: 'utf8_len(str: string): number', doc: 'Đếm độ dài chuỗi ký tự UTF-8 chính xác theo Code Point/Grapheme Cluster' },
  vietnamese_remove_accents: { kind: 'function', detail: 'vietnamese_remove_accents(str: string): string', doc: 'Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu chuẩn (e.g. Nguyễn Văn Ánh -> Nguyen Van Anh)' },
  vi_no_accents: { kind: 'function', detail: 'vi_no_accents(str: string): string', doc: 'Bí danh ngắn gọn của vietnamese_remove_accents' },
  vietnamese_sort_key: { kind: 'function', detail: 'vietnamese_sort_key(str: string): string', doc: 'Tạo khóa phân loại theo âm học bảng chữ cái tiếng Việt' },
  normalize_vn: { kind: 'function', detail: 'normalize_vn(str: string): string', doc: 'Chuẩn hóa Unicode chuỗi tiếng Việt về dạng chuẩn NFC' },
  is_alpha_vn: { kind: 'function', detail: 'is_alpha_vn(str: string): boolean', doc: 'Kiểm tra chuỗi chỉ chứa chữ cái và khoảng trắng tiếng Việt' },

  // JSON & File I/O
  json_parse: { kind: 'function', detail: 'json_parse(jsonStr: string): any', doc: 'Giải mã chuỗi văn bản JSON thành cấu trúc dữ liệu BLang' },
  json_stringify: { kind: 'function', detail: 'json_stringify(val: any, indent?: number): string', doc: 'Mã hóa cấu trúc dữ liệu thành chuỗi định dạng JSON' },
  file_read: { kind: 'function', detail: 'file_read(path: string): string', doc: 'Đọc nội dung tệp tin văn bản từ đường dẫn path' },
  file_write: { kind: 'function', detail: 'file_write(path: string, content: string): boolean', doc: 'Ghi nội dung văn bản content vào tệp tin path' },
  file_exists: { kind: 'function', detail: 'file_exists(path: string): boolean', doc: 'Kiểm tra tệp tin có tồn tại hay không' },
  path_join: { kind: 'function', detail: 'path_join(a: string, b: string): string', doc: 'Nối đường dẫn tệp tin an toàn' },

  // Modern Language Innovations
  match: { kind: 'keyword', detail: 'match expr { case val { ... } default { ... } }', doc: 'Cấu trúc so khớp mẫu (Pattern Matching) hiện đại của BLang, thay thế switch/if-elif dài dòng.' },
  case: { kind: 'keyword', detail: 'case pattern { ... }', doc: 'Nhánh khớp mẫu trong biểu thức match.' },
  default: { kind: 'keyword', detail: 'default { ... }', doc: 'Nhánh mặc định dự phòng khi không có case nào khớp.' },
  pipeline: { kind: 'keyword', detail: 'expr |> fn(...)', doc: 'Toán tử đường ống Pipeline |> chuyển giá trị bên trái làm tham số đầu tiên của hàm tiếp theo.' },
  range_inclusive: { kind: 'function', detail: 'start..end', doc: 'Toán tử Range .. tạo danh sách dãy số từ start đến end (ví dụ 1..5 -> [1, 2, 3, 4, 5]).' },

  // FFI & Interoperability
  ffi_call: { kind: 'function', detail: 'ffi_call(module: string, func: string, ...args): any', doc: 'Gọi hàm ngoại lai qua Foreign Function Interface (gọi trực tiếp hàm native Python/C)' },
  py_eval: { kind: 'function', detail: 'py_eval(expr: string): any', doc: 'Đánh giá biểu thức Python 3 trực tiếp trong môi trường chạy' },
  py_exec: { kind: 'function', detail: 'py_exec(code: string): any', doc: 'Thực thi khối mã lệnh Python nguyên bản' },
  py_import: { kind: 'function', detail: 'py_import(module: string): any', doc: 'Nạp module Python vào hệ thống' },
  js_eval: { kind: 'function', detail: 'js_eval(code: string): any', doc: 'Thực thi mã JavaScript trong runtime Web/Node.js' },

  // Standard Functions & Macros
  print: { kind: 'function', detail: 'print(...args: any[]): void', doc: 'In giá trị ra màn hình chuẩn (Console / Output)' },
  len: { kind: 'function', detail: 'len(target: string | any[]): number', doc: 'Trả về độ dài chuỗi hoặc số phần tử trong danh sách' },
  time_now: { kind: 'function', detail: 'time_now(): number', doc: 'Thời gian hiện tại tính theo mili-giây từ kỷ nguyên Unix' },
  random: { kind: 'function', detail: 'random(min: number, max: number): number', doc: 'Sinh số ngẫu nhiên trong khoảng [min, max]' },
  '%random%': { kind: 'macro', detail: '%random(min, max)% Macro', doc: 'Bộ sinh số ngẫu nhiên đặc biệt theo chuẩn BLang Macro', insert: '%random(${1:0}, ${2:100})%' },

  // Control Flow Keywords
  if: { kind: 'keyword', detail: 'if (condition) { ... }', doc: 'Cấu trúc rẽ nhánh điều kiện có ngoặc nhọn' },
  else: { kind: 'keyword', detail: 'else { ... }', doc: 'Nhánh phủ định' },
  elseif: { kind: 'keyword', detail: 'elseif (condition) { ... }', doc: 'Nhánh điều kiện bổ sung' },
  for: { kind: 'keyword', detail: 'for (item in collection) { ... }', doc: 'Vòng lặp duyệt phần tử' },
  while: { kind: 'keyword', detail: 'while (condition) { ... }', doc: 'Vòng lặp điều kiện' },
  function: { kind: 'keyword', detail: 'function name(params) { ... }', doc: 'Định nghĩa hàm người dùng' },
  return: { kind: 'keyword', detail: 'return value;', doc: 'Trả về kết quả từ hàm' },
  try: { kind: 'keyword', detail: 'try { ... } catch (err) { ... }', doc: 'Bắt và xử lý ngoại lệ Runtime' },
  catch: { kind: 'keyword', detail: 'catch (err) { ... }', doc: 'Khối xử lý lỗi ngoại lệ' },
  throw: { kind: 'keyword', detail: 'throw expression;', doc: 'Ném ngoại lệ chủ động' },
  import: { kind: 'keyword', detail: 'import "module.bl";', doc: 'Nạp module theo đường dẫn phân cấp' },
  let: { kind: 'keyword', detail: 'let variable = value;', doc: 'Khai báo biến (tùy chọn trong BLang)' },
};

export class BLangLSPService {
  /**
   * Provide syntax and semantic diagnostics for the current document
   */
  public static getDiagnostics(source: string): LSPDiagnostic[] {
    const diagnostics: LSPDiagnostic[] = [];

    // 1. Lexer & Parser checks
    try {
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      parser.parse();

      if (parser.errors.length > 0) {
        for (const err of parser.errors) {
          diagnostics.push({
            line: err.line || 1,
            col: err.col || 1,
            message: err.message || 'Lỗi cú pháp',
            severity: 'Error',
            source: 'BLang LSP',
          });
        }
      }
    } catch (e: any) {
      diagnostics.push({
        line: e.line || 1,
        col: e.col || 1,
        message: e.message || 'Lỗi phân tích cú pháp',
        severity: 'Error',
        source: 'BLang LSP',
      });
    }

    // 2. Linter checks (style, unused vars, unreachable code)
    const lint = lintBLang(source);
    for (const prob of lint.problems) {
      diagnostics.push({
        line: prob.line,
        col: prob.col,
        message: prob.message,
        severity: prob.severity === 'error' ? 'Error' : prob.severity === 'warning' ? 'Warning' : 'Information',
        source: 'BLang LSP',
        code: prob.rule,
      });
    }

    return diagnostics;
  }

  /**
   * Provide autocomplete suggestions at the given cursor line and column
   */
  public static getCompletions(source: string, line: number, col: number): LSPCompletionItem[] {
    const items: LSPCompletionItem[] = [];

    // 1. Add standard builtins and keywords
    for (const [name, info] of Object.entries(STANDARD_BUILTINS)) {
      items.push({
        label: name,
        kind: info.kind === 'function' ? 'function' : info.kind === 'macro' ? 'macro' : 'keyword',
        detail: info.detail,
        documentation: info.doc,
        insertText: info.insert || name,
      });
    }

    // 2. Add user-defined variables and functions from current source
    try {
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      function walkAST(node: ASTNode) {
        if (!node) return;
        if (node.type === 'VarDecl') {
          const decl = node as VarDeclNode;
          items.push({
            label: decl.name,
            kind: 'variable',
            detail: `Biến người dùng: ${decl.name}`,
            documentation: `Khai báo tại dòng ${decl.line}, cột ${decl.col}`,
          });
        } else if (node.type === 'FunctionDef') {
          const fn = node as FunctionDefNode;
          items.push({
            label: fn.name,
            kind: 'function',
            detail: `function ${fn.name}(${fn.parameters.join(', ')})`,
            documentation: `Hàm tự định nghĩa tại dòng ${fn.line}`,
          });
        }

        for (const key of Object.keys(node)) {
          if (key === 'line' || key === 'col' || key === 'type') continue;
          const val = (node as any)[key];
          if (Array.isArray(val)) {
            val.forEach(walkAST);
          } else if (val && typeof val === 'object' && val.type) {
            walkAST(val);
          }
        }
      }

      walkAST(ast);
    } catch {
      // Fallback gracefully on syntax errors
    }

    return items;
  }

  /**
   * Provide hover information (tooltips, documentation, signatures)
   */
  public static getHover(source: string, word: string): LSPHover | null {
    if (!word) return null;

    if (STANDARD_BUILTINS[word]) {
      const info = STANDARD_BUILTINS[word];
      return {
        contents: [
          `**${word}** &bull; *${info.kind}*`,
          `\`\`\`blang\n${info.detail}\n\`\`\``,
          info.doc,
        ],
      };
    }

    return null;
  }

  /**
   * Provide document symbols outline (Functions, Variables, Imports)
   */
  public static getDocumentSymbols(source: string): LSPDocumentSymbol[] {
    const symbols: LSPDocumentSymbol[] = [];

    try {
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      for (const stmt of ast.statements) {
        if (stmt.type === 'FunctionDef') {
          const fn = stmt as FunctionDefNode;
          symbols.push({
            name: fn.name,
            kind: 'Function',
            line: fn.line,
            col: fn.col,
            detail: `(${fn.parameters.join(', ')})`,
          });
        } else if (stmt.type === 'VarDecl') {
          const v = stmt as VarDeclNode;
          symbols.push({
            name: v.name,
            kind: 'Variable',
            line: v.line,
            col: v.col,
          });
        } else if (stmt.type === 'Import') {
          const imp = stmt as any;
          symbols.push({
            name: imp.modulePath,
            kind: 'Module',
            line: imp.line,
            col: imp.col,
            detail: `import "${imp.modulePath}"`,
          });
        }
      }
    } catch {
      // Return partial symbols
    }

    return symbols;
  }
}
