import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Code2,
  Terminal,
  Layers,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Sparkles,
  Cpu,
  ArrowRight,
  FolderOpen,
  Calculator,
  Compass,
  FileCode,
  Zap,
  Play,
  Download,
  Package,
  Shield,
  HelpCircle,
  Hash,
  ChevronRight,
  Bookmark,
  ExternalLink,
  Activity,
  Table,
  FileJson,
  Globe2,
  Binary,
  Sliders,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { highlightBLang } from '../compiler/blangPrism';
import { DownloadSdkModal } from './DownloadSdkModal';
import { TechnicalMatrixView } from './TechnicalMatrixView';

interface CodeSnippetProps {
  code: string;
  output?: string;
  title?: string;
  onLoadSnippet?: (code: string) => void;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, output, title, onLoadSnippet }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = useMemo(() => highlightBLang(code), [code]);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#070b14] overflow-hidden my-3 shadow-md">
      {title && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 text-[11px] text-slate-300">
          <span className="font-mono text-indigo-400 font-semibold flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" />
            {title}
          </span>
          <div className="flex items-center gap-2">
            {onLoadSnippet && (
              <button
                onClick={() => onLoadSnippet(code)}
                title="Mở và chạy thử đoạn mã này trong Editor"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Thử ngay</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Đã copy</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
      <div className="p-3.5 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
      {output && (
        <div className="border-t border-slate-800/70 bg-[#050811] px-3.5 py-2 text-[11px] font-mono text-emerald-300/90 flex items-start gap-2">
          <span className="text-slate-500 select-none shrink-0">&gt;&gt;&gt; Kết quả:</span>
          <span>{output}</span>
        </div>
      )}
    </div>
  );
};

interface GuideModalProps {
  onLoadSnippet?: (code: string) => void;
  onClose?: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onLoadSnippet, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);

  const navigationSections = [
    { id: 'tech-matrix', name: '⭐ Bảng Đối Chiếu Kỹ Thuật', icon: Table },
    { id: 'overview', name: '1. Triết Lý & Tổng Quan', icon: BookOpen },
    { id: 'setup', name: '2. Cài Đặt & setup_blang.py', icon: Download },
    { id: 'cli', name: '3. Tra Cứu Lệnh BLang CLI', icon: Terminal },
    { id: 'syntax', name: '4. Cú Pháp & Khai Báo Biến', icon: Code2 },
    { id: 'dynamic-typing', name: '5. Hệ Thống Kiểu Động (Dynamic)', icon: Sparkles },
    { id: 'random', name: '6. Macro Ngẫu Nhiên %random%', icon: Hash },
    { id: 'control', name: '7. Cấu Trúc Điều Khiển & Vòng Lặp', icon: Layers },
    { id: 'functions', name: '8. Hàm & Phạm Vi (Functions)', icon: Cpu },
    { id: 'geometry', name: '9. Thư Viện Hình Học & Lượng Giác', icon: Compass },
    { id: 'collections', name: '10. Danh Sách & Từ Điển (Maps)', icon: FolderOpen },
    { id: 'bvm-slots', name: '11. Fast Slot & Bytecode VM (BVM)', icon: Binary },
    { id: 'ffi-interop', name: '12. FFI & Tương Thích Python / JS', icon: Globe2 },
    { id: 'pkg-system', name: '13. Import Phân Cấp & Package', icon: Package },
    { id: 'collections-adv', name: '14. Thao Tác Mảng & Functional API', icon: Sliders },
    { id: 'unicode-vn', name: '15. Chuỗi Unicode & Tiếng Việt Chuẩn', icon: FileCode },
    { id: 'json-fileio', name: '16. Xử Lý JSON & File I/O', icon: FileJson },
    { id: 'try-catch', name: '17. Bắt Lỗi Runtime (Try - Catch)', icon: ShieldAlert },
    { id: 'lsp-linter', name: '18. LSP, Multi-error & Linter', icon: Wrench },
    { id: 'best-practices', name: '19. Thực Tiễn Tốt Nhất (Best Practices)', icon: CheckCircle2 },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return navigationSections;
    const q = searchQuery.toLowerCase();
    return navigationSections.filter((s) => s.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`doc-section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex-1 h-full w-full flex flex-col md:flex-row bg-[#0b0f19] text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar: Structured Navigation & Search */}
      <aside className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-800 bg-[#0d1322] flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Tài Liệu BLang</h2>
              <span className="text-[10px] text-slate-400 font-mono">Phiên bản 1.0.0 Chuẩn</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm cú pháp, hàm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                <span className="truncate">{sec.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-200" />}
              </button>
            );
          })}
        </div>

        {/* Sidebar Quick Action: Download SDK */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => setIsDownloadOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Bộ Cài Đặt (SDK)</span>
          </button>
        </div>
      </aside>

      {/* Right Main Content Pane (Properly scrollable with standard typography) */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-10 space-y-12 scroll-smooth custom-scrollbar bg-[#0b0f19]">
        {/* Document Header Hero */}
        <div className="pb-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tài Liệu Kỹ Thuật Chính Thức &bull; Tiêu Chuẩn Ngôn Ngữ BLang</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Cẩm Nang Ngôn Ngữ Lập Trình BLang
          </h1>
          <p className="mt-3 text-base text-slate-300 max-w-3xl leading-relaxed">
            BLang là ngôn ngữ lập trình độc lập, sử dụng dấu ngoặc nhọn <code className="font-mono text-indigo-300 text-sm bg-slate-800 px-1 py-0.5 rounded">{'{}'}</code>,
            khai báo biến trực tiếp không cần từ khóa <code className="font-mono text-amber-300 text-sm bg-slate-800 px-1 py-0.5 rounded">let</code>,
            hệ thống kiểu động tự nhiên, tích hợp sẵn công cụ tối ưu Constant Folding và chuyển dịch hai đích sang Python 3.x và JavaScript ES6+.
          </p>
        </div>

        {/* Section 0: Technical Comparison Matrix */}
        <section id="doc-section-tech-matrix" className="space-y-4">
          <TechnicalMatrixView />
        </section>

        {/* Section 1: Overview & Philosophy */}
        <section id="doc-section-overview" className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Chương 1</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Triết Lý &amp; Tính Độc Lập</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang được thiết kế như một ngôn ngữ lập trình độc lập hoàn toàn, không phụ thuộc vào hệ sinh thái bên ngoài.
            Mã nguồn BLang có định dạng chuẩn <code className="font-mono text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">*.bl</code>,
            có thể biên dịch thành bytecode máy ảo BVM (<code className="font-mono text-pink-400 bg-slate-800 px-1.5 py-0.5 rounded">*.blc</code>),
            hoặc dịch chuyển trực tiếp (Transpile) sang Python 3.x và JavaScript ES6+ để chạy trên Web, Node.js hoặc hệ thống backend.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-white text-xs block mb-1">Cú pháp Dễ Đọc</span>
              <p className="text-xs text-slate-400">
                Sử dụng ký tự tiền tố định danh (@ số, $ chuỗi, _ tạm thời) giúp nhận diện mục đích biến ngay lập tức.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-white text-xs block mb-1">Tối ưu Compile-Time</span>
              <p className="text-xs text-slate-400">
                Tầng 4 AST Optimizer tự động thu gọn các biểu thức hằng số tĩnh (Constant Folding) trước khi thực thi.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-white text-xs block mb-1">Kiểu Động Tự Nhiên</span>
              <p className="text-xs text-slate-400">
                Phép cộng chuỗi và số tự động kết hợp liền mạch (coercion) mà không làm gián đoạn luồng làm việc.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Setup & Installation */}
        <section id="doc-section-setup" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Download className="w-4 h-4" />
            <span>Chương 2</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Hướng Dẫn Cài Đặt Với setup_blang.py</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang cung cấp kịch bản cài đặt tự động <code className="font-mono text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">setup_blang.py</code>,
            giúp thiết lập môi trường thực thi runtime và trình điều khiển dòng lệnh <code className="font-mono text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded">blang</code> cục bộ
            trên máy tính của bạn tương tự như cách cài đặt Python hoặc Rust.
          </p>

          <CodeSnippet
            title="Terminal: Cài đặt BLang tự động"
            code={`# 1. Kiểm tra môi trường hệ thống
python3 setup_blang.py --check

# 2. Cài đặt BLang vào máy tính (mặc định tại ~/.blang)
python3 setup_blang.py

# 3. Chạy file mã nguồn BLang bất kỳ
blang run main.bl

# Hoặc chạy trực tiếp ngắn gọn:
blang main.bl`}
            output="[SUCCESS] All environment and Python dependency checks passed successfully!
[SUCCESS] Created 'blang' CLI binary in ~/.blang/bin
[SUCCESS] Self-test executed successfully with zero runtime diagnostics!"
          />
        </section>

        {/* Section 3: CLI Command References */}
        <section id="doc-section-cli" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Chương 3</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Tra Cứu Lệnh BLang CLI (Command References)</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Sau khi cài đặt, bạn có thể gọi tiện ích <code className="font-mono text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">blang</code> trong terminal
            với các lệnh chính thức sau:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Lệnh CLI</th>
                  <th className="py-2.5 px-3">Mô tả tác vụ</th>
                  <th className="py-2.5 px-3">Ví dụ thực tế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-emerald-400">blang run &lt;file.bl&gt;</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Thực thi trực tiếp mã nguồn trong bộ nhớ</td>
                  <td className="py-2.5 px-3 text-slate-400">blang run main.bl</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-sky-400">blang &lt;file.bl&gt;</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Cú pháp rút gọn để chạy file tương tự python script.py</td>
                  <td className="py-2.5 px-3 text-slate-400">blang geometry_math.bl</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-indigo-400">blang repl</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Mở shell thông dịch tương tác dòng lệnh</td>
                  <td className="py-2.5 px-3 text-slate-400">blang repl</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-pink-400">blang build &lt;file.bl&gt;</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Biên dịch mã nguồn thành bytecode BVM (*.blc)</td>
                  <td className="py-2.5 px-3 text-slate-400">blang build game_engine.bl</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-amber-400">blang dis &lt;file.bl&gt;</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Duyệt và phân rã các opcode bytecode BVM</td>
                  <td className="py-2.5 px-3 text-slate-400">blang dis main.bl</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-purple-400">blang export &lt;file.bl&gt;</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Xuất file mã nguồn tương ứng sang output.py &amp; output.js</td>
                  <td className="py-2.5 px-3 text-slate-400">blang export main.bl</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-300">blang --version</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Kiểm tra phiên bản runtime đã cài</td>
                  <td className="py-2.5 px-3 text-slate-400">blang -v</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Syntax & Variables */}
        <section id="doc-section-syntax" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Code2 className="w-4 h-4" />
            <span>Chương 4</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Cú Pháp Chuẩn Python &amp; Khai Báo Biến Trực Tiếp</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Trong BLang, cú pháp khai báo biến <strong>hoàn toàn giống Python</strong>: khai báo trực tiếp bằng phép gán (<code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">tên = giá trị;</code>).
            Ngôn ngữ <strong>không cần từ khóa <code className="font-mono text-rose-400 bg-slate-800 px-1 rounded">let</code> hay <code className="font-mono text-rose-400 bg-slate-800 px-1 rounded">var</code></strong>.
            Bạn có thể đặt tên biến thuần túy như trong Python, hoặc tùy chọn sử dụng các tiền tố đặc biệt nếu muốn:
          </p>

          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono text-slate-300">
            <li className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-sky-400 font-bold block mb-1">score = 100;</span>
              <span className="text-slate-400 font-sans">Khai báo trực tiếp chuẩn Python (tùy chọn @score)</span>
            </li>
            <li className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">name = "BLang";</span>
              <span className="text-slate-400 font-sans">Chuỗi ký tự thuần phong cách Python (tùy chọn $name)</span>
            </li>
            <li className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-purple-400 font-bold block mb-1">is_active = True;</span>
              <span className="text-slate-400 font-sans">Giá trị logic True, False, None tương thích 100%</span>
            </li>
          </ul>

          <CodeSnippet
            title="Ví dụ khai báo biến chuẩn phong cách Python"
            code={`# 1. Khai báo biến trực tiếp (chuẩn Python, không cần let)
score = 1500;
player_name = "Kaelen Voss";
level = 12;
is_active = True;

print("Player:", player_name, "| Level:", level, "| Score:", score);`}
            output="Player: Kaelen Voss | Level: 12 | Score: 1500"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 5: Dynamic Typing System */}
        <section id="doc-section-dynamic-typing" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Chương 5</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Hệ Thống Kiểu Động Tự Nhiên (Dynamic Typing)</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang sử dụng <strong>hệ thống kiểu dữ liệu động, linh hoạt</strong> (tương tự Python và JavaScript hiện đại).
            Khác với hệ thống tĩnh gò bó, BLang cho phép biến thay đổi kiểu theo ngữ cảnh và hỗ trợ phép cộng chuỗi tự nhiên (String concatenation &amp; coercion)
            khi kết hợp chuỗi văn bản với số hoặc giá trị logic.
          </p>

          <CodeSnippet
            title="Ghép chuỗi và số tự nhiên trong BLang"
            code={`$greeting = "Tiến độ dự án hiện tại: ";
@progress_percent = 85.5;

// Tự động kết hợp chuỗi và số mà không báo lỗi
$full_report = $greeting + @progress_percent + "%";
print($full_report);

// Hỗ trợ compound assignment linh hoạt
$log_message = "Thực hiện lượt lặp #";
$log_message += 12;
print($log_message);`}
            output="Tiến độ dự án hiện tại: 85.5%
Thực hiện lượt lặp #12"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 6: Random Macro */}
        <section id="doc-section-random" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Hash className="w-4 h-4" />
            <span>Chương 6</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Macro Sinh Số Ngẫu Nhiên: %random(min, max)%</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang cung cấp cú pháp đặc biệt <code className="font-mono text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded">%random(a, b)%</code> (hoặc gọi hàm <code className="font-mono text-sky-400 bg-slate-800 px-1.5 py-0.5 rounded">random(a, b)</code>)
            để sinh số nguyên ngẫu nhiên trong khoảng từ <code className="font-mono text-slate-200">a</code> đến <code className="font-mono text-slate-200">b</code> (đóng hai đầu):
          </p>

          <CodeSnippet
            title="Sinh số ngẫu nhiên với cú pháp %random(a, b)%"
            code={`// Sinh số xúc xắc từ 1 đến 6
@dice = %random(1, 6)%;
print(">>> Gieo xúc xắc được:", @dice);

// Sinh mã định danh ngẫu nhiên
@lucky_token = %random(1000, 9999)%;
$token_id = "TOKEN-" + @lucky_token;
print(">>> Security Token:", $token_id);`}
            output=">>> Gieo xúc xắc được: 4
>>> Security Token: TOKEN-7429"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 7: Control Flow & Loops */}
        <section id="doc-section-control" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Chương 7</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Cấu Trúc Điều Khiển &amp; Vòng Lặp</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Hỗ trợ khối lệnh phân nhánh <code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">if / elseif / else</code>,
            toán tử logic <code className="font-mono text-pink-400 bg-slate-800 px-1 rounded">not</code>, <code className="font-mono text-pink-400 bg-slate-800 px-1 rounded">and</code>, <code className="font-mono text-pink-400 bg-slate-800 px-1 rounded">or</code>,
            vòng lặp <code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">while</code>, <code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">for-in</code>, cùng các câu lệnh điều khiển dòng chảy <code className="font-mono text-amber-400 bg-slate-800 px-1 rounded">break</code> và <code className="font-mono text-amber-400 bg-slate-800 px-1 rounded">continue</code>.
          </p>

          <CodeSnippet
            title="Vòng lặp và điều kiện trong BLang"
            code={`@items = ["Alpha", "Beta", "Gamma", "Delta"];

print("--- Duyệt danh sách với for-in ---");
for (item in @items) {
    print("Xử lý gói tin:", item);
}

print("--- Vòng lặp while với break/continue ---");
_k = 0;
while (_k < 10) {
    _k += 1;
    if (_k == 3) {
        continue; // Bỏ qua lần lặp 3
    }
    if (_k == 6) {
        print("Đã gặp ngưỡng giới hạn tại:", _k);
        break;
    }
    print("Bước lặp:", _k);
}`}
            output="--- Duyệt danh sách với for-in ---
Xử lý gói tin: Alpha
Xử lý gói tin: Beta
Xử lý gói tin: Gamma
Xử lý gói tin: Delta
--- Vòng lặp while với break/continue ---
Bước lặp: 1
Bước lặp: 2
Bước lặp: 4
Bước lặp: 5
Đã gặp ngưỡng giới hạn tại: 6"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 8: Functions & Scoping */}
        <section id="doc-section-functions" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Chương 8</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Hàm &amp; Phạm Vi (Functions &amp; Lexical Scope)</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Hàm được khai báo bằng từ khóa <code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">function</code>,
            thân hàm bao bọc trong dấu ngoặc nhọn <code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">{'{}'}</code>,
            hỗ trợ danh sách tham số, phạm vi cục bộ độc lập và trả về giá trị qua <code className="font-mono text-emerald-400 bg-slate-800 px-1 rounded">return</code>.
          </p>

          <CodeSnippet
            title="Định nghĩa hàm tính toán trong BLang"
            code={`function compute_kinetic_energy(@mass, @velocity) {
    // Phạm vi cục bộ trong hàm
    _v_squared = @velocity * @velocity;
    _ke = 0.5 * @mass * _v_squared;
    return _ke;
}

@m = 1200; // Khối lượng 1200 kg
@v = 25;   // Vận tốc 25 m/s
@energy = compute_kinetic_energy(@m, @v);

print("Động năng tính được (Joule):", @energy);`}
            output="Động năng tính được (Joule): 375000"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 9: Scientific Math & Geometry */}
        <section id="doc-section-geometry" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Chương 9</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Thư Viện Hình Học &amp; Lượng Giác Trực Tiếp Theo Độ</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang tích hợp sẵn thư viện hình học và lượng giác khoa học cấp cao:
            Hàm lượng giác tính <strong>theo góc độ trực tiếp</strong> (<code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">sin(90) = 1</code>, <code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">cos(60) = 0.5</code>),
            chu vi kí hiệu <code className="font-mono text-amber-300 bg-slate-800 px-1 rounded">c / C</code>,
            diện tích <code className="font-mono text-amber-300 bg-slate-800 px-1 rounded">s / S</code>,
            thể tích <code className="font-mono text-amber-300 bg-slate-800 px-1 rounded">v / V</code>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-slate-300">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-sky-400 font-bold block">Hình Tròn (cir / circle)</span>
              <span>cir_c(r), cir_s(r)</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold block">Hình Cầu (sphere)</span>
              <span>sphere_v(r), sphere_s(r)</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-pink-400 font-bold block">Hình Vuông (sq / square)</span>
              <span>sq_c(a), sq_s(a)</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-amber-400 font-bold block">Hình Hộp / Trụ / Nón</span>
              <span>cube_v, cylinder_v, cone_v</span>
            </div>
          </div>

          <CodeSnippet
            title="Toán học & Hình học trong BLang"
            code={`// Lượng giác theo góc độ trực tiếp
print("sin(90 độ)  =", sin(90));
print("cos(60 độ)  =", cos(60));
print("tan(45 độ)  =", tan(45));

// Hình tròn & Hình cầu
@r = 5;
print("Chu vi hình tròn r=5:      ", cir_c(@r));
print("Diện tích hình tròn r=5:   ", cir_s(@r));
print("Thể tích hình cầu r=3:     ", sphere_v(3));

// Thể tích khối lập phương & chữ nhật
print("Thể tích lập phương cạnh 4: ", cube_v(4));
print("Thể tích hộp chữ nhật 4x5x6:", cuboid_v(4, 5, 6));`}
            output="sin(90 độ)  = 1
cos(60 độ)  = 0.5
tan(45 độ)  = 1
Chu vi hình tròn r=5:       31.41592653589793
Diện tích hình tròn r=5:    78.53981633974483
Thể tích hình cầu r=3:      113.09733552923255
Thể tích lập phương cạnh 4: 64
Thể tích hộp chữ nhật 4x5x6: 120"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 10: Collections */}
        <section id="doc-section-collections" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <FolderOpen className="w-4 h-4" />
            <span>Chương 10</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Danh Sách &amp; Từ Điển (Arrays &amp; Dictionaries)</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang hỗ trợ danh sách mảng (<code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">[1, 2, 3]</code>)
            và từ điển cặp khóa-giá trị (<code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">{`{"key": "value"}`}</code>)
            với chỉ mục truy cập qua dấu ngoặc vuông <code className="font-mono text-indigo-300 bg-slate-800 px-1 rounded">target[index]</code>.
          </p>

          <CodeSnippet
            title="Thao tác từ điển và danh sách"
            code={`$server_config = {
    "host": "127.0.0.1",
    "port": 8080,
    "secure": true
};

print("Server target:", $server_config["host"] + ":" + $server_config["port"]);

@ports = [80, 443, 8080, 9000];
print("Cổng bảo mật mặc định:", @ports[1]);`}
            output="Server target: 127.0.0.1:8080
Cổng bảo mật mặc định: 443"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 11: Fast Slot Lookup & BVM */}
        <section id="doc-section-bvm-slots" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Binary className="w-4 h-4 text-pink-400" />
            <span>Chương 11</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Định Vị Biến Bằng Index (Fast Variable Slot Lookup) &amp; Máy Ảo Bytecode BVM
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Nhằm khắc phục triệt để điểm nghẽn hiệu năng của mô hình <em>Tree-Walk Interpreter</em> (phải tra cứu chuỗi bảng băm Hash Map ở từng dòng lệnh),
            BLang v2.0 trang bị <strong>Fast Variable Slot Lookup</strong> cùng <strong>Stack-Based Bytecode Virtual Machine (BVM)</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-pink-300 text-xs block mb-1">O(1) Indexed Flat Vector</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tất cả biến cục bộ (@a, @sum, $msg) được trình biên dịch gán trước vào mảng chỉ mục cố định (ví dụ: Slot [00], Slot [01]).
                Thời gian truy xuất và ghi nhớ là O(1) trực tiếp vào thanh nhớ RAM.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-pink-300 text-xs block mb-1">BVM Instruction Set Architecture</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Các chỉ lệnh mã máy ảo như <code className="font-mono text-pink-300">LOAD_FAST [slot]</code>, <code className="font-mono text-pink-300">STORE_FAST [slot]</code>,
                <code className="font-mono text-pink-300">BINARY_ADD</code>, <code className="font-mono text-pink-300">PRINT_VAL</code> vận hành trên ngăn xếp toán hạng (Operand Stack) siêu tốc.
              </p>
            </div>
          </div>

          <CodeSnippet
            title="Thực thi trên BVM với Fast Slot Lookup"
            code={`@x = 10;
@y = 25;
@total = @x * @y + 50;

print("Tổng tính toán qua BVM Slots:", @total);`}
            output="Tổng tính toán qua BVM Slots: 300"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 12: FFI & Interoperability */}
        <section id="doc-section-ffi-interop" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Globe2 className="w-4 h-4 text-sky-400" />
            <span>Chương 12</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            FFI (Foreign Function Interface) &amp; Tương Thích Ngoại Vi Python / JavaScript / Wasm
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang hỗ trợ giao diện hàm ngoại vi <strong>FFI</strong> mạnh mẽ, cho phép mã nguồn BLang gọi trực tiếp các module tính toán C/C++, thư viện AI/Machine Learning trong Python,
            hoặc API DOM/Canvas trong JavaScript trên trình duyệt.
          </p>

          <CodeSnippet
            title="Sử dụng FFI và nhúng mã ngoại vi"
            code={`// Gọi trực tiếp hàm native math.hypot của Python qua FFI
@c = ffi_call("math", "hypot", 3, 4);
print("Độ dài cạnh huyền (Python FFI math.hypot):", @c);

// Đánh giá biểu thức Python trực tiếp
$py_res = py_eval("'BLang Engine'.upper()");
print("Python Eval Result:", $py_res);

// Thực thi mã JavaScript an toàn trên môi trường Web Studio
@timestamp = js_eval("Date.now()");
print("Timestamp từ JS Runtime:", @timestamp);`}
            output="Độ dài cạnh huyền (Python FFI math.hypot): 5.0
Python Eval Result: BLANG ENGINE
Timestamp từ JS Runtime: 1728045600000"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 13: Hierarchical Package Resolution */}
        <section id="doc-section-pkg-system" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Package className="w-4 h-4 text-amber-400" />
            <span>Chương 13</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Cú Pháp Import Phân Cấp &amp; Package Resolution
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Hệ thống giải quyết module của BLang hỗ trợ cả 3 dạng nạp:
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li><code className="font-mono text-amber-300">import "math_lib.bl";</code>: Nạp module tại cùng thư mục hiện tại.</li>
            <li><code className="font-mono text-amber-300">import "geometry.shapes";</code>: Nạp module phân cấp, tự động dịch thành <code className="font-mono text-amber-300">geometry/shapes.bl</code>.</li>
            <li><code className="font-mono text-amber-300">import "std:math";</code>: Nạp chuẩn không gian tên tiêu chuẩn của hệ sinh thái BLang.</li>
          </ul>
          <p className="text-xs text-slate-400 leading-relaxed">
            BLang tích hợp bộ đệm kiểm tra chu kỳ (<code className="font-mono text-indigo-300">imported_modules</code> Set),
            tự động bỏ qua việc nạp lại nếu một file đã được import trước đó, ngăn chặn hoàn toàn lỗi lặp vô hạn (Circular Import).
          </p>
        </section>

        {/* Section 14: Advanced Collections */}
        <section id="doc-section-collections-adv" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Chương 14</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Thao Tác Mảng &amp; Functional Collections Cấp Cao (map, filter, reduce, find...)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Thư viện chuẩn BLang cung cấp trọn vẹn bộ công cụ lập trình hàm (Functional Programming) xử lý mảng và tập hợp dữ liệu:
          </p>

          <CodeSnippet
            title="Xử lý danh sách bằng Functional API"
            code={`@scores = [85, 92, 45, 78, 60, 95, 30];

// 1. Lọc các điểm đạt yêu cầu (>= 50)
function is_passed(@item, @idx) {
    return @item >= 50;
}
@passed_scores = filter(@scores, is_passed);
print("Các điểm số đạt:", @passed_scores);

// 2. Thêm và thao tác mảng
push(@passed_scores, 100);
@top_score = pop(@passed_scores);
print("Điểm vừa lấy ra khỏi mảng:", @top_score);

// 3. Sắp xếp mảng tăng dần
@sorted_scores = sort(@passed_scores);
print("Danh sách điểm đã sắp xếp:", @sorted_scores);

// 4. Cắt mảng (slice)
@top_3 = slice(@sorted_scores, 0, 3);
print("Top 3 điểm đầu tiên:", @top_3);`}
            output="Các điểm số đạt: [85, 92, 78, 60, 95]
Điểm vừa lấy ra khỏi mảng: 100
Danh sách điểm đã sắp xếp: [60, 78, 85, 92, 95]
Top 3 điểm đầu tiên: [60, 78, 85]"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 15: Vietnamese & Unicode */}
        <section id="doc-section-unicode-vn" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Chương 15</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Xử Lý Chuỗi Unicode &amp; Tiếng Việt Bản Địa
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang là một trong những ngôn ngữ hiếm hoi tích hợp sẵn xử lý tiếng Việt bản địa ngay trong tầng Core của runtime:
          </p>

          <CodeSnippet
            title="Xử lý tiếng Việt và chuẩn hóa Unicode"
            code={`$ho_ten = "Nguyễn Văn Ánh";

// 1. Đếm độ dài chính xác theo Code Point (không bị nhân đôi byte)
print("Số ký tự UTF-8 chính xác:", utf8_len($ho_ten));

// 2. Chuyển đổi bỏ dấu tiếng Việt chuẩn học
$slug = vietnamese_remove_accents($ho_ten);
print("Tên không dấu chuẩn:", $slug);

// 3. Khóa phân loại âm học tiếng Việt (Collation Key)
$sort_key = vietnamese_sort_key($ho_ten);
print("Khóa sắp xếp tiếng Việt:", $sort_key);

// 4. Lấy ký tự tại vị trí
print("Ký tự đầu tiên:", str_char_at($ho_ten, 0));`}
            output="Số ký tự UTF-8 chính xác: 14
Tên không dấu chuẩn: Nguyen Van Anh
Khóa sắp xếp tiếng Việt: nguyen van anh
Ký tự đầu tiên: N"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 16: JSON & File I/O */}
        <section id="doc-section-json-fileio" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Chương 16</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Xử Lý JSON &amp; Quản Lý Tệp Tin (File I/O)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang cung cấp các hàm tương tác định dạng JSON và tệp tin thống nhất:
          </p>

          <CodeSnippet
            title="Đọc ghi tệp tin và xử lý JSON"
            code={`$user_profile = {
    "username": "blang_developer",
    "level": "Senior",
    "verified": true,
    "skills": ["Compiler", "Bytecode", "Transpiler"]
};

// 1. Mã hóa cấu trúc thành chuỗi JSON
$json_text = json_stringify($user_profile, 2);
print("JSON Output:\n", $json_text);

// 2. Lưu vào tệp tin (hoạt động đồng nhất trên cả CLI & Web Studio)
write_file("profile.json", $json_text);

// 3. Kiểm tra và đọc lại từ tệp tin
if (file_exists("profile.json")) {
    $content = read_file("profile.json");
    $loaded_obj = json_parse($content);
    print("Đọc thành công user:", $loaded_obj["username"]);
}`}
            output="JSON Output:
{
  &quot;username&quot;: &quot;blang_developer&quot;,
  &quot;level&quot;: &quot;Senior&quot;,
  &quot;verified&quot;: true,
  &quot;skills&quot;: [
    &quot;Compiler&quot;,
    &quot;Bytecode&quot;,
    &quot;Transpiler&quot;
  ]
}
Đọc thành công user: blang_developer"
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 17: Try-Catch-Throw */}
        <section id="doc-section-try-catch" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Chương 17</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Cơ Chế Bắt Lỗi Tại Runtime (Try - Catch - Throw)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ngăn chặn crash ứng dụng đột ngột bằng cấu trúc ngoặc nhọn an toàn <code className="font-mono text-rose-300">try {'{ ... }'} catch (err) {'{ ... }'}</code> và từ khóa ném lỗi <code className="font-mono text-rose-300">throw</code>.
          </p>

          <CodeSnippet
            title="Bắt lỗi runtime và ném ngoại lệ chủ động"
            code={`function safe_divide(@a, @b) {
    if (@b == 0) {
        throw "Không thể chia cho số 0!";
    }
    return @a / @b;
}

try {
    @result = safe_divide(100, 0);
    print("Kết quả:", @result);
} catch ($err) {
    print("Đã bắt ngoại lệ an toàn:", $err);
}

print("Chương trình tiếp tục thực thi bình thường mà không bị crash.");`}
            output="Đã bắt ngoại lệ an toàn: Không thể chia cho số 0!
Chương trình tiếp tục thực thi bình thường mà không bị crash."
            onLoadSnippet={onLoadSnippet}
          />
        </section>

        {/* Section 18: LSP & DevTooling */}
        <section id="doc-section-lsp-linter" className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Wrench className="w-4 h-4 text-purple-400" />
            <span>Chương 18</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Language Server Protocol (LSP), Multi-error Diagnostics &amp; Linter/Formatter
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BLang trang bị hệ thống công cụ hỗ trợ nhà phát triển (Developer Experience) đạt tiêu chuẩn công nghiệp:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-purple-300 text-xs block mb-1">Parser Multi-error Recovery</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Đồng bộ hóa tại ranh giới câu lệnh (;, {'}'}) để tiếp tục phân tích toàn bộ file mã nguồn, cung cấp danh sách đa lỗi chẩn đoán chính xác thay vì ngắt đột ngột.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-purple-300 text-xs block mb-1">Language Server (LSP)</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cung cấp Autocomplete ngữ cảnh, Hover docstring, Document Symbol tree, và Real-time Diagnostics tích hợp sẵn trong <code className="font-mono text-purple-300">BLangLSPService</code>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-purple-300 text-xs block mb-1">AST Linter &amp; Formatter</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tự động kiểm tra quy tắc mã sạch: biến không sử dụng (no-unused-vars), gợi ý tiền tố (@ số, $ chuỗi), mã không thể chạm tới, kèm công cụ tự động căn lề 4-spaces.
              </p>
            </div>
          </div>
        </section>

        {/* Section 19: Best Practices */}
        <section id="doc-section-best-practices" className="space-y-4 pt-6 border-t border-slate-800/80 pb-12">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Chương 19</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Thực Tiễn Tốt Nhất (Best Practices &amp; Idiomatic BLang)</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Các nguyên tắc vàng khi lập trình bằng BLang để tạo ra mã nguồn sạch sẽ, hiệu năng tối ưu và dễ bảo trì:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">Đặt tên biến có tiền tố rõ ràng (@, $, _)</h4>
                <p className="text-xs text-slate-400">
                  Sử dụng @ cho các số tính toán (@width, @height), $ cho dữ liệu văn bản ($user, $path) và _ cho biến trung gian hoặc biến lặp.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">Tận dụng Constant Folding cho các biểu thức tĩnh</h4>
                <p className="text-xs text-slate-400">
                  Viết các phép tính hằng số như <code className="font-mono text-indigo-300">(24 * 60 * 60)</code> trực tiếp trong mã; trình biên dịch BLang sẽ tính trước ngay ở Tầng 4 mà không tốn chi phí lúc chạy.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex gap-3">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">3</span>
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">Module hóa với import "module.bl"</h4>
                <p className="text-xs text-slate-400">
                  Tách các hàm tiện ích vào file riêng (như <code className="font-mono text-sky-300">math_lib.bl</code>) và nạp bằng <code className="font-mono text-sky-300">import "math_lib.bl";</code> để tái sử dụng mã hiệu quả.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Standalone SDK Download Modal */}
      <DownloadSdkModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
};
