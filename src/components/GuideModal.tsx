import React from 'react';
import { Terminal, BookOpen, Layers, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';

export const GuideModal: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto p-6 bg-[#0a0e19] text-slate-200 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            BLang: Architecture, CLI & Local Execution Manual
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Production-Grade Multi-Pass Transpiler, Execution Engine & REPL Shell targeting Python 3.x and JavaScript ES6+.
          </p>
        </div>

        {/* 6 Layer Visual Flow */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>The 6 Architectural Layers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-indigo-300">Tầng 1: Lexer & Tokenizer</div>
              <p className="text-slate-400 leading-normal">
                Bóc tách từ vựng với theo dõi số dòng (Line) và cột (Column) chuẩn xác. Hỗ trợ đầy đủ từ khóa và biến chứa ký tự đặc biệt (<code className="text-amber-300">_</code>, <code className="text-amber-300">@</code>, <code className="text-amber-300">$</code>).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-indigo-300">Tầng 2: Parser & AST</div>
              <p className="text-slate-400 leading-normal">
                Phân tích cú pháp đệ quy giảm dần với leo thang độ ưu tiên toán tử, khối lệnh chuẩn dấu ngoặc nhọn <code className="text-emerald-300">{'{ }'}</code>, mảng <code className="text-emerald-300">[ ]</code>, và từ điển <code className="text-emerald-300">{'{ key: value }'}</code>.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-indigo-300">Tầng 3: Semantic & Strict Type Safety</div>
              <p className="text-slate-400 leading-normal">
                Quản lý phạm vi từ vựng (Global & Local Scopes), cấm khai báo trùng lặp biến trong cùng scope, và <strong>Strict Type Safety</strong>: Tuyệt đối cấm cộng/trừ/nhân/chia chuỗi với số.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-indigo-300">Tầng 4: AST Optimizer</div>
              <p className="text-slate-400 leading-normal">
                Constant Folding pass: Tính toán trước các biểu thức toán học và logic hằng số tĩnh tĩnh tại compile-time (ví dụ: <code className="text-cyan-300">(10 * 5) + 2 → 52</code>).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-indigo-300">Tầng 5: Dual-Target Code Generator</div>
              <p className="text-slate-400 leading-normal">
                Xuất đồng thời ra mã nguồn Python 3.x (<code className="text-blue-300">output.py</code>) cho AI/Backend và JavaScript ES6+ (<code className="text-amber-300">output.js</code>) cho Web/Apps/Game.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-indigo-300">Tầng 6: Interpreter & REPL Shell</div>
              <p className="text-slate-400 leading-normal">
                Bộ thông dịch cây AST thời gian thực với closures, hàm built-in (<code className="text-purple-300">print</code>, <code className="text-purple-300">len</code>, <code className="text-purple-300">type</code>) và shell tương tác trực tiếp <code className="text-emerald-300">BLang&gt;</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Math & Geometry Reference Section */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 font-mono text-xs">∑ π</span>
              <span>Thư Viện Toán Học &amp; Hình Học Tích Hợp Sẵn (Built-in Math &amp; Geometry)</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Tích hợp sẵn</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-semibold text-indigo-300">1. Logarit &amp; Số Mũ</div>
              <ul className="text-slate-400 space-y-0.5 font-mono text-[11px]">
                <li><code className="text-indigo-200">log(x, [base])</code>: Logarit cơ số tùy chọn (mặc định 10)</li>
                <li><code className="text-indigo-200">ln(x)</code>: Logarit tự nhiên (cơ số e)</li>
                <li><code className="text-indigo-200">log10(x) / log2(x)</code>: Log cơ số 10 / 2</li>
                <li><code className="text-indigo-200">pow(b, e)</code>: Lũy thừa b mũ e</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-semibold text-indigo-300">2. Căn Bậc &amp; Hằng Số</div>
              <ul className="text-slate-400 space-y-0.5 font-mono text-[11px]">
                <li><code className="text-indigo-200">sqrt(x)</code>: Căn bậc hai</li>
                <li><code className="text-indigo-200">cbrt(x)</code>: Căn bậc ba</li>
                <li><code className="text-indigo-200">root(x, n)</code>: Căn bậc n của x</li>
                <li><code className="text-indigo-200">PI, E</code>: Hằng số π (~3.14159) và e (~2.71828)</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-semibold text-indigo-300">3. Góc &amp; Lượng Giác</div>
              <ul className="text-slate-400 space-y-0.5 font-mono text-[11px]">
                <li><code className="text-indigo-200">sind(d), cosd(d)</code>: Sin, Cos theo góc độ (Degrees)</li>
                <li><code className="text-indigo-200">tand(d), cotand(d)</code>: Tan, Cotan theo góc độ</li>
                <li><code className="text-indigo-200">sin, cos, tan, cotan</code>: Lượng giác chuẩn (Radian)</li>
                <li><code className="text-indigo-200">deg_to_rad, rad_to_deg</code>: Đổi độ &lt;-&gt; radian</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-semibold text-indigo-300">4. Hình Tròn, Cầu, Trụ, Nón</div>
              <ul className="text-slate-400 space-y-0.5 font-mono text-[11px]">
                <li><code className="text-indigo-200">circle_perimeter(r)</code>: Chu vi hình tròn (2πr)</li>
                <li><code className="text-indigo-200">circle_area(r)</code>: Diện tích hình tròn (πr²)</li>
                <li><code className="text-indigo-200">sphere_volume(r)</code>: Thể tích hình cầu (4/3 πr³)</li>
                <li><code className="text-indigo-200">cylinder_volume(r, h)</code>: Thể tích hình trụ (πr²h)</li>
                <li><code className="text-indigo-200">cone_volume(r, h)</code>: Thể tích hình nón (1/3 πr²h)</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-semibold text-indigo-300">5. Vuông, Chữ Nhật, Khối Hộp</div>
              <ul className="text-slate-400 space-y-0.5 font-mono text-[11px]">
                <li><code className="text-indigo-200">square_perimeter(a)</code>: Chu vi hình vuông (4a)</li>
                <li><code className="text-indigo-200">square_area(a)</code>: Diện tích hình vuông (a²)</li>
                <li><code className="text-indigo-200">cube_volume(a)</code>: Thể tích hình lập phương (a³)</li>
                <li><code className="text-indigo-200">rect_perimeter / rect_area</code>: Chu vi &amp; diện tích chữ nhật</li>
                <li><code className="text-indigo-200">cuboid_volume(w, h, d)</code>: Thể tích hình hộp chữ nhật</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-semibold text-indigo-300">6. Hình Thang &amp; Đa Giác Đều</div>
              <ul className="text-slate-400 space-y-0.5 font-mono text-[11px]">
                <li><code className="text-indigo-200">trapezoid_area(a, b, h)</code>: Diện tích hình thang ((a+b)h/2)</li>
                <li><code className="text-indigo-200">trapezoid_perimeter</code>: Chu vi hình thang (a+b+c+d)</li>
                <li><code className="text-indigo-200">polygon_perimeter(n, s)</code>: Chu vi đa giác đều n cạnh</li>
                <li><code className="text-indigo-200">polygon_area(n, s)</code>: Diện tích đa giác đều n cạnh</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step-by-Step Terminal Guide */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-5">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Hướng Dẫn Chi Tiết Chạy Bằng Terminal Trên Máy Tính Của Bạn</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Step 1 */}
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Tải hoặc tạo file <code className="text-indigo-400">compiler.py</code></span>
              </div>
              <p className="text-slate-400 pl-7">
                Mở terminal, tạo một thư mục làm việc mới và lưu mã nguồn Python từ tab <strong>"compiler.py Source"</strong> vào file tên là <code className="text-slate-200">compiler.py</code>:
              </p>
              <div className="pl-7">
                <pre className="p-3 rounded bg-[#0a0e19] border border-slate-800 font-mono text-emerald-300 text-[11px]">
mkdir blang-project && cd blang-project
# Lưu mã nguồn compiler.py vào thư mục này
python3 compiler.py --help
                </pre>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Chạy Chế Độ REPL Tương Tác Dòng Lệnh (Interactive Shell)</span>
              </div>
              <p className="text-slate-400 pl-7">
                Khởi động shell tương tác tức thời. Bạn có thể gõ trực tiếp từng lệnh, kiểm tra kết quả ngay lập tức:
              </p>
              <div className="pl-7">
                <pre className="p-3 rounded bg-[#0a0e19] border border-slate-800 font-mono text-emerald-300 text-[11px]">
python3 compiler.py repl

# Trong REPL Shell:
BLang&gt; let @score = 100;
BLang&gt; let $bonus = 25;
BLang&gt; print(@score + $bonus);
=&gt; 125
BLang&gt; :symbols
BLang&gt; :exit
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Tạo file mã nguồn BLang (<code className="text-indigo-400">script.bl</code>) — Không cần từ khóa <code className="text-rose-400">let</code></span>
              </div>
              <div className="pl-7">
                <pre className="p-3 rounded bg-[#0a0e19] border border-slate-800 font-mono text-slate-300 text-[11px]">
@base = 100;
$name = "Super Agent";

function boost(@val) {'{'}
    return @val * 2 + 50;
{'}'}

print("Result:", boost(@base));
                </pre>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">4</span>
                <span>Thực thi trực tiếp mã nguồn bằng Bộ thông dịch BLang</span>
              </div>
              <div className="pl-7">
                <pre className="p-3 rounded bg-[#0a0e19] border border-slate-800 font-mono text-emerald-300 text-[11px]">
python3 compiler.py run script.bl
                </pre>
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">5</span>
                <span>Biên dịch & Chuyển đổi mã đồng thời sang Python và JavaScript (Transpile)</span>
              </div>
              <div className="pl-7">
                <pre className="p-3 rounded bg-[#0a0e19] border border-slate-800 font-mono text-emerald-300 text-[11px]">
python3 compiler.py transpile script.bl -o output.py -j output.js

# Chạy file Python vừa sinh:
python3 output.py

# Chạy file JavaScript vừa sinh bằng Node.js:
node output.js
                </pre>
              </div>
            </div>

            {/* Step 6 */}
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">6</span>
                <span>Chạy bộ kiểm thử tự động toàn diện (Self-Diagnostic Suite)</span>
              </div>
              <div className="pl-7">
                <pre className="p-3 rounded bg-[#0a0e19] border border-slate-800 font-mono text-emerald-300 text-[11px]">
python3 compiler.py test
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Strict Type Invariant Callout */}
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Quy Chuẩn An Toàn Kiểu Dữ Liệu Nghiêm Ngặt (Strict Type Safety)</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Trong nhiều ngôn ngữ kịch bản khác (như JavaScript hoặc PHP), phép toán <code className="text-rose-300">"Total: " + 100</code> sẽ âm thầm ép kiểu thành chuỗi. Trong BLang, hành vi ép kiểu ngầm định này <strong>bị tuyệt đối cấm ở Tầng 3</strong>. Bất kỳ nỗ lực thực hiện phép toán số học giữa String và Number sẽ lập tức ném ra ngoại lệ <code className="text-rose-400 font-mono font-bold">BLangTypeError</code>, kèm theo số dòng, số cột, tên biến và hủy bỏ toàn bộ tiến trình biên dịch.
          </p>
        </div>
      </div>
    </div>
  );
};
