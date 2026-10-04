import React, { useState } from 'react';
import {
  Layers,
  Zap,
  CheckCircle2,
  Cpu,
  Search,
  Check,
  X,
  Code2,
  Terminal,
  Compass,
  Sparkles,
  Shield,
  FileCode,
  FileJson,
  Binary,
  Globe2,
} from 'lucide-react';

interface MatrixRow {
  id: string;
  category: string;
  feature: string;
  blang: { text: string; status: 'superior' | 'full' | 'partial' | 'none'; detail: string };
  python: { text: string; status: 'superior' | 'full' | 'partial' | 'none'; detail: string };
  lua: { text: string; status: 'superior' | 'full' | 'partial' | 'none'; detail: string };
  nodejs: { text: string; status: 'superior' | 'full' | 'partial' | 'none'; detail: string };
  wasm: { text: string; status: 'superior' | 'full' | 'partial' | 'none'; detail: string };
}

export const TechnicalMatrixView: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const matrixData: MatrixRow[] = [
    {
      id: 'arch',
      category: 'Kiến Trúc & Tầng Biên Dịch',
      feature: '1. Kiến trúc Pipeline Đa Tầng (Multi-Pass)',
      blang: {
        text: '6 Tầng Độc Lập + Dual Transpiler',
        status: 'superior',
        detail: 'Lexer -> Parser -> Semantic -> Optimizer -> Dual Codegen (Py/JS) + BVM Bytecode -> In-Memory Interpreter. Zero-dependency.',
      },
      python: {
        text: 'AST -> Bytecode -> Stack VM',
        status: 'full',
        detail: 'CPython 3.12+ với Tier 1/2 JIT. Yêu cầu bộ runtime CPython đầy đủ (50-100MB).',
      },
      lua: {
        text: '1-Pass Bytecode -> Register VM',
        status: 'full',
        detail: 'PUC-Lua biên dịch 1 pass rất nhanh sang register-based bytecode, dung lượng ~300KB.',
      },
      nodejs: {
        text: 'Ignition + TurboFan JIT',
        status: 'full',
        detail: 'V8 Engine biên dịch động JS sang mã máy tối ưu hóa cao qua profile-guided optimization.',
      },
      wasm: {
        text: 'Stack Machine Bytecode',
        status: 'full',
        detail: 'Mã nhị phân Wasm Module được biên dịch AOT/JIT bởi trình duyệt hoặc runtime máy chủ.',
      },
    },
    {
      id: 'slots',
      category: 'Hiệu Năng & Bộ Nhớ',
      feature: '2. Định vị biến bằng Index (Fast Variable Slot Lookup)',
      blang: {
        text: 'O(1) Flat Slot Allocation',
        status: 'superior',
        detail: 'Tự động cấp phát vector chỉ mục cố định [slot_0, slot_1] qua LOAD_FAST/STORE_FAST, loại bỏ hoàn toàn chi phí băm Hash Map chuỗi lúc chạy.',
      },
      python: {
        text: 'LOAD_FAST (Local Array)',
        status: 'full',
        detail: 'CPython dùng fast locals array cho biến cục bộ hàm, nhưng biến toàn cục vẫn phải tra cứu qua PyDict global namespace.',
      },
      lua: {
        text: 'Register Allocator (255)',
        status: 'superior',
        detail: 'Mỗi frame có tối đa 255 registers ảo ánh xạ vào thanh ghi phần cứng khi dùng LuaJIT.',
      },
      nodejs: {
        text: 'V8 Scope Context & Slot',
        status: 'full',
        detail: 'V8 tối ưu hóa truy cập thuộc tính qua Hidden Classes (Shapes) và context slot indexing.',
      },
      wasm: {
        text: 'local.get / local.set $idx',
        status: 'superior',
        detail: 'Truy cập trực tiếp theo slot index kiểu tĩnh tại opcode level (i32, i64, f32, f64).',
      },
    },
    {
      id: 'vm',
      category: 'Hiệu Năng & Bộ Nhớ',
      feature: '3. Mô hình Máy Ảo (Stack-Based Bytecode VM - BVM)',
      blang: {
        text: 'BVM v2.0 Native Virtual Machine',
        status: 'superior',
        detail: 'Hỗ trợ cả 2 chế độ: Tree-Walk AST Explorer (cho học tập) và Stack-Based BVM với Disassembly, Constant Pool và Call Frames chuẩn.',
      },
      python: {
        text: 'CPython CEval Loop',
        status: 'full',
        detail: 'Stack VM với hàng trăm opcode tối ưu; từ bản 3.11+ có Specializing Adaptive Interpreter.',
      },
      lua: {
        text: 'Register-Based VM',
        status: 'full',
        detail: 'Kiến trúc Register-Based 3 địa chỉ (A, B, C) giúp giảm đáng kể số lượng chỉ mục lệnh điều hướng.',
      },
      nodejs: {
        text: 'Ignition Accumulator VM',
        status: 'full',
        detail: 'Máy ảo thanh ghi tích lũy (Accumulator Register) sinh bytecode từ AST.',
      },
      wasm: {
        text: 'Typed Operand Stack Machine',
        status: 'superior',
        detail: 'Mô hình ngăn xếp kiểu tĩnh chuẩn W3C, xác thực cấu trúc khối lệnh trước khi chạy.',
      },
    },
    {
      id: 'ffi',
      category: 'Khả Năng Tương Thích & Mở Rộng',
      feature: '4. FFI & Tương Thích Ngôn Ngữ Ngoại Vi',
      blang: {
        text: 'Native Python FFI & JS Interop',
        status: 'superior',
        detail: 'Tích hợp sẵn ffi_call(mod, fn), py_eval, py_exec nạp trực tiếp Python/C và js_eval(code) trong môi trường Web/Node.',
      },
      python: {
        text: 'ctypes / C-API / CFFI',
        status: 'full',
        detail: 'Hệ sinh thái FFI mạnh nhất cho C/C++, Rust, Fortran phục vụ AI và Deep Learning.',
      },
      lua: {
        text: 'Lua C-API & LuaJIT FFI',
        status: 'superior',
        detail: 'LuaJIT FFI gọi hàm C trực tiếp bằng cú pháp C header với overhead gần như bằng 0.',
      },
      nodejs: {
        text: 'N-API & WebAssembly Web APIs',
        status: 'full',
        detail: 'Node-API (N-API) gọi native C++ addon; WebAssembly Web API nạp module Wasm.',
      },
      wasm: {
        text: 'Wasm Import/Export & WASI',
        status: 'partial',
        detail: 'Giao tiếp qua Linear Memory pointers và con trỏ hàm WASI (cần glue code phong phú).',
      },
    },
    {
      id: 'modules',
      category: 'Hệ Thống Gói & Module',
      feature: '5. Cú Pháp Import Phân Cấp & Package Resolution',
      blang: {
        text: 'Hierarchical & std: Namespace',
        status: 'superior',
        detail: 'Hỗ trợ import "pkg.submodule";, import "./path.bl"; và import "std:*"; với cơ chế cyclic cache (imported_modules Set) tự động.',
      },
      python: {
        text: 'import pkg.sub & sys.modules',
        status: 'full',
        detail: 'Cơ chế nạp module phân cấp mạnh mẽ qua __init__.py, package discovery và sys.modules.',
      },
      lua: {
        text: 'require("pkg.sub")',
        status: 'partial',
        detail: 'Dựa vào package.path và hàm loader tùy biến trong package.searchers.',
      },
      nodejs: {
        text: 'CommonJS & ES Modules (ESM)',
        status: 'full',
        detail: 'Hỗ trợ cả require và import; cơ chế node_modules resolution đa tầng phong phú.',
      },
      wasm: {
        text: 'Wasm Dynamic Linking',
        status: 'partial',
        detail: 'Nạp qua ES Module wrapper hoặc instantiation thủ công từ Web/Node runtime.',
      },
    },
    {
      id: 'web-export',
      category: 'Khả Năng Tương Thích & Mở Rộng',
      feature: '6. Tương Thích JavaScript / ES Modules & Wasm',
      blang: {
        text: 'Direct ES6+ Clean Codegen',
        status: 'superior',
        detail: 'Chuyển dịch 1-click thành JavaScript ES6+ chuẩn mực (export function, không cần runtime đồ sộ) và thiết kế tương thích Wasm.',
      },
      python: {
        text: 'Pyodide / MicroPython',
        status: 'partial',
        detail: 'Cần nạp toàn bộ CPython WebAssembly bundle (5-15MB) vào trang web, khởi động chậm.',
      },
      lua: {
        text: 'Fengari / Wasmoon',
        status: 'partial',
        detail: 'Cần nhúng Lua VM JavaScript hoặc Wasm binary.',
      },
      nodejs: {
        text: 'Native JavaScript Runtime',
        status: 'full',
        detail: 'JavaScript là ngôn ngữ gốc của nền tảng V8.',
      },
      wasm: {
        text: 'Native Binary Format',
        status: 'superior',
        detail: 'Chạy trực tiếp trong sandbox trình duyệt ở tốc độ gần như mã máy (Near-Native Speed).',
      },
    },
    {
      id: 'collections',
      category: 'Thư Viện Chuẩn & Cú Pháp',
      feature: '7. Hàm Thao Tác Mảng & Functional Collections Cấp Cao',
      blang: {
        text: 'Builtin map, filter, reduce, find...',
        status: 'superior',
        detail: 'Tích hợp sẵn map, filter, reduce, find, slice, concat, push, pop, shift, unshift, sort, keys, values, entries trong cả C++ engine, Python compiler và Web Studio.',
      },
      python: {
        text: 'Comprehensions & functools',
        status: 'full',
        detail: 'Cú pháp List Comprehension mạnh mẽ; map/filter trả về generator; functools.reduce.',
      },
      lua: {
        text: 'table.* hạn chế',
        status: 'partial',
        detail: 'Chỉ có table.insert, table.remove, table.sort. Phải tự viết map/filter/reduce.',
      },
      nodejs: {
        text: 'Array.prototype.* phong phú',
        status: 'superior',
        detail: 'Đầy đủ map, filter, reduce, find, flatMap, slice, sort theo chuẩn ECMAScript.',
      },
      wasm: {
        text: 'Chưa hỗ trợ sẵn (Raw Bytes)',
        status: 'none',
        detail: 'Không có kiểu dữ liệu collection trừ khi dùng ngôn ngữ cấp cao (Rust/C++) biên dịch qua.',
      },
    },
    {
      id: 'unicode',
      category: 'Thư Viện Chuẩn & Cú Pháp',
      feature: '8. Xử Lý Chuỗi Unicode & Tiếng Việt Bản Địa',
      blang: {
        text: 'Chuẩn Hóa NFC & Bỏ Dấu Bản Địa',
        status: 'superior',
        detail: 'Hỗ trợ utf8_len (Code Point), vietnamese_remove_accents (bỏ dấu chuẩn tiếng Việt), vietnamese_sort_key và normalize_vn tích hợp sẵn.',
      },
      python: {
        text: 'Unicode Native (len Code Point)',
        status: 'full',
        detail: 'Xử lý chuỗi UTF-8/UTF-16/UTF-32 linh hoạt (PEP 393); cần unicodedata để bỏ dấu.',
      },
      lua: {
        text: 'Raw Bytes (Chỉ có utf8 cơ bản)',
        status: 'partial',
        detail: 'Chuỗi trong Lua là mảng byte thô; utf8.len từ bản 5.3 nhưng không có collation tiếng Việt.',
      },
      nodejs: {
        text: 'UTF-16 & Intl API',
        status: 'full',
        detail: 'Hỗ trợ normalize(\'NFC\') và Intl.Collator(\'vi\') chuẩn xác.',
      },
      wasm: {
        text: 'Không có kiểu String gốc',
        status: 'none',
        detail: 'Chuỗi được quản lý dưới dạng con trỏ byte và độ dài trên Linear Memory.',
      },
    },
    {
      id: 'json-io',
      category: 'Thư Viện Chuẩn & Cú Pháp',
      feature: '9. Xử Lý JSON & Quản Lý Tệp Tin (File I/O)',
      blang: {
        text: 'json_parse/stringify & Dual I/O',
        status: 'superior',
        detail: 'json_stringify, json_parse, read_file, write_file, file_exists, path_join đồng nhất giữa CLI vật lý và Virtual Filesystem trên Web Studio.',
      },
      python: {
        text: 'json module & open()',
        status: 'full',
        detail: 'Thư viện json và cú pháp with open() chuẩn hóa, an toàn.',
      },
      lua: {
        text: 'io.* (Không có JSON sẵn)',
        status: 'partial',
        detail: 'Hỗ trợ đọc ghi file qua io.*, nhưng phải cài thêm module ngoài như cjson/dkjson.',
      },
      nodejs: {
        text: 'JSON.* & node:fs/promises',
        status: 'full',
        detail: 'JSON là công dân hạng nhất; node:fs hỗ trợ cả sync lẫn async I/O.',
      },
      wasm: {
        text: 'WASI File Descriptors',
        status: 'partial',
        detail: 'Cần môi trường WASI (WebAssembly System Interface) để thao tác tệp tin qua fd.',
      },
    },
    {
      id: 'errors',
      category: 'Cơ Chế Bắt Lỗi & Độ Ổn Định',
      feature: '10. Bắt Lỗi Tại Runtime (Try - Catch - Throw)',
      blang: {
        text: 'try { ... } catch (err) { ... }',
        status: 'superior',
        detail: 'Cú pháp ngoặc nhọn đồng bộ, tự động bắt lỗi chia cho 0, type error, lỗi ngoại lệ người dùng throw kèm khôi phục phạm vi biến scoped.',
      },
      python: {
        text: 'try: ... except Exception:',
        status: 'full',
        detail: 'Hệ thống Exception hierarchy phong phú bậc nhất với finally, else block.',
      },
      lua: {
        text: 'pcall / xpcall / error()',
        status: 'partial',
        detail: 'Sử dụng protected call pcall() thay vì cú pháp try/catch tự nhiên.',
      },
      nodejs: {
        text: 'try { ... } catch (err) { ... }',
        status: 'full',
        detail: 'Chuẩn ECMAScript try/catch/finally với Promise.catch và Error stack trace.',
      },
      wasm: {
        text: 'Wasm Exception Handling',
        status: 'partial',
        detail: 'Đang chuẩn hóa proposal try_table / throw trong WebAssembly runtime hiện đại.',
      },
    },
    {
      id: 'recovery',
      category: 'Cơ Chế Bắt Lỗi & Độ Ổn Định',
      feature: '11. Phục Hồi Lỗi Parser (Multi-error Diagnostics)',
      blang: {
        text: 'Synchronization Boundary Recovery',
        status: 'superior',
        detail: 'Không dừng lại ở lỗi đầu tiên; đồng bộ hóa tại dấu ; và } để quét toàn bộ mã, báo cáo danh sách đa lỗi chẩn đoán chính xác kèm vị trí dòng/cột.',
      },
      python: {
        text: 'Dừng ở SyntaxError đầu tiên',
        status: 'partial',
        detail: 'CPython parser dừng ngay lập tức khi phát hiện lỗi cú pháp đầu tiên trong file.',
      },
      lua: {
        text: 'Dừng ở lỗi đầu tiên',
        status: 'partial',
        detail: 'Trình phân tích cú pháp dừng biên dịch ngay lập tức khi gặp lỗi từ vựng/cú pháp.',
      },
      nodejs: {
        text: 'V8 SyntaxError',
        status: 'partial',
        detail: 'Parser của V8 dừng lại ở lỗi cú pháp đầu tiên trước khi chạy bytecode.',
      },
      wasm: {
        text: 'Dừng tại byte vi phạm',
        status: 'none',
        detail: 'Validator ngắt kết nối ngay khi cấu trúc bytecode module không hợp lệ.',
      },
    },
    {
      id: 'lsp-linter',
      category: 'Công Cụ Phát Triển (DevTooling)',
      feature: '12. Language Server Protocol (LSP) & Linter/Formatter',
      blang: {
        text: 'BLangLSPService & Linter Tích Hợp',
        status: 'superior',
        detail: 'Tích hợp sẵn LSP: Diagnostics, Autocomplete (gợi ý từ khóa, hình học, collections, macros), Hover documentation, Document Symbols, Linter phát hiện biến không dùng và Auto-formatter 4 spaces.',
      },
      python: {
        text: 'Công cụ bên ngoài (Ruff, Pyright)',
        status: 'full',
        detail: 'Không có sẵn trong core CPython; cần cài thêm các công cụ cồng kềnh như Pyright, Black, Ruff.',
      },
      lua: {
        text: 'LuaLS (Cần cài đặt riêng)',
        status: 'partial',
        detail: 'Cần máy chủ ngôn ngữ bên ngoài sumneko_lua / StyLua.',
      },
      nodejs: {
        text: 'TypeScript tsserver & ESLint',
        status: 'full',
        detail: 'Hệ sinh thái tooling phong phú nhất nhưng cần cấu hình phức tạp qua npm/package.json.',
      },
      wasm: {
        text: 'WABT / Wasm LSP',
        status: 'partial',
        detail: 'Các công cụ dòng lệnh phân rã nhị phân wat2wasm, wasm-decompile.',
      },
    },
    {
      id: 'dist',
      category: 'Kiến Trúc & Tầng Biên Dịch',
      feature: '13. Độc Lập Triển Khai (Zero-Dependency Footprint)',
      blang: {
        text: '1 File Duy Nhất (~130KB) & Browser IDE',
        status: 'superior',
        detail: 'Toàn bộ compiler, transpiler, REPL, optimizer, BVM đóng gói trọn vẹn trong 1 file compiler.py hoặc nhúng 100% không server vào trình duyệt web.',
      },
      python: {
        text: 'Cài Đặt CPython (50MB - 100MB)',
        status: 'partial',
        detail: 'Yêu cầu cài đặt môi trường CPython runtime, quản lý pip venv.',
      },
      lua: {
        text: 'Binary Gọn Nhẹ (~300KB)',
        status: 'full',
        detail: 'Lua binary rất nhỏ gọn, dễ nhúng vào C/C++ game engine.',
      },
      nodejs: {
        text: 'Node Runtime (~80MB+)',
        status: 'partial',
        detail: 'Dung lượng cài đặt Node.js và thư mục node_modules thường chiếm hàng trăm MB.',
      },
      wasm: {
        text: 'Module Nhẹ Nhưng Cần Host',
        status: 'full',
        detail: 'Module Wasm rất nhẹ, nhưng bắt buộc phải có host runtime (V8, Wasmtime, Wasmer).',
      },
    },
  ];

  const categories = ['all', 'Kiến Trúc & Tầng Biên Dịch', 'Hiệu Năng & Bộ Nhớ', 'Thư Viện Chuẩn & Cú Pháp', 'Cơ Chế Bắt Lỗi & Độ Ổn Định', 'Khả Năng Tương Thích & Mở Rộng', 'Công Cụ Phát Triển (DevTooling)'];

  const filteredData = matrixData.filter((row) => {
    const matchCat = filterCategory === 'all' || row.category === filterCategory;
    const matchSearch =
      searchTerm === '' ||
      row.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.blang.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.blang.detail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-[#0b0f19] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ma Trận So Sánh Kỹ Thuật Chuyên Sâu</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Bảng Đối Chiếu Tính Năng Kỹ Thuật: BLang vs CPython, Lua, Node.js &amp; Wasm
            </h2>
            <p className="mt-2 text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              So sánh toàn diện 13 khía cạnh kiến trúc cốt lõi từ <strong className="text-indigo-300">Fast Variable Slot Lookup</strong>,{' '}
              <strong className="text-indigo-300">Stack-Based Bytecode VM (BVM)</strong>, <strong className="text-indigo-300">FFI &amp; Package Resolution</strong>,{' '}
              <strong className="text-indigo-300">Functional Collections</strong>, <strong className="text-indigo-300">Tiếng Việt Unicode</strong> cho đến{' '}
              <strong className="text-indigo-300">LSP &amp; Multi-error Diagnostics</strong>.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono font-medium">
              BLang v2.0 Production-Ready
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat === 'all' ? 'Tất Cả (13 Tiêu Chí)' : cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc tiêu chí, slot, FFI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1322] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                <th className="py-3.5 px-4 min-w-[240px]">Hạng Mục Kỹ Thuật</th>
                <th className="py-3.5 px-4 min-w-[230px] bg-indigo-950/40 text-indigo-300 border-x border-indigo-900/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    <span>BLang (Native BVM + Transpiler)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 min-w-[170px]">Python 3.x (CPython)</th>
                <th className="py-3.5 px-4 min-w-[160px]">Lua (PUC / LuaJIT)</th>
                <th className="py-3.5 px-4 min-w-[170px]">Node.js (V8)</th>
                <th className="py-3.5 px-4 min-w-[160px]">WebAssembly (Wasm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-850/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-950/20' : ''}`}
                >
                  {/* Feature & Category */}
                  <td className="py-3.5 px-4 align-top">
                    <span className="text-[10px] font-mono text-indigo-400 block mb-0.5">{row.category}</span>
                    <strong className="text-white font-semibold text-xs block">{row.feature}</strong>
                  </td>

                  {/* BLang Column (Highlighted) */}
                  <td className="py-3.5 px-4 align-top bg-indigo-950/20 border-x border-indigo-900/40">
                    <div className="flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                      <div>
                        <span className="font-bold text-emerald-300 block text-xs">{row.blang.text}</span>
                        <p className="mt-1 text-[11px] text-slate-300 leading-relaxed font-sans">{row.blang.detail}</p>
                      </div>
                    </div>
                  </td>

                  {/* Python Column */}
                  <td className="py-3.5 px-4 align-top">
                    <span className="font-semibold text-amber-300 block">{row.python.text}</span>
                    <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{row.python.detail}</p>
                  </td>

                  {/* Lua Column */}
                  <td className="py-3.5 px-4 align-top">
                    <span className="font-semibold text-sky-300 block">{row.lua.text}</span>
                    <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{row.lua.detail}</p>
                  </td>

                  {/* Node.js Column */}
                  <td className="py-3.5 px-4 align-top">
                    <span className="font-semibold text-lime-300 block">{row.nodejs.text}</span>
                    <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{row.nodejs.detail}</p>
                  </td>

                  {/* WebAssembly Column */}
                  <td className="py-3.5 px-4 align-top">
                    <span className="font-semibold text-purple-300 block">{row.wasm.text}</span>
                    <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{row.wasm.detail}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
