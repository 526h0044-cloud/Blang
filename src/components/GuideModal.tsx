import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Code2,
  Terminal,
  Layers,
  ShieldAlert,
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
} from 'lucide-react';
import { highlightBLang } from '../compiler/blangPrism';
import { DownloadSdkModal } from './DownloadSdkModal';

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
}

export const GuideModal: React.FC<GuideModalProps> = ({ onLoadSnippet }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);

  const chapters = [
    { id: 'all', name: 'Toàn bộ tài liệu' },
    { id: 'download', name: '1. Tải Về & Cài Đặt (Như Python)' },
    { id: 'overview', name: '2. Triết Lý & Độc Lập' },
    { id: 'variables', name: '3. Khai Báo Biến & Kiểu Dữ Liệu' },
    { id: 'random', name: '4. Sinh Số Ngẫu Nhiên %random%' },
    { id: 'control', name: '5. Cấu Trúc Điều Khiển & Vòng Lặp' },
    { id: 'functions', name: '6. Hàm & Phạm Vi (Functions)' },
    { id: 'geometry', name: '7. Thư Viện Hình Học & Toán Học' },
    { id: 'stdlib', name: '8. Thao Tác Chuỗi & Mảng' },
    { id: 'safety', name: '9. Strict Type Safety' },
    { id: 'bvm', name: '10. Máy Ảo BVM & Bytecode .blc' },
  ];

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-8 bg-[#0a0e19] text-slate-200 font-sans select-text scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Hero Header Banner */}
        <div className="relative rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-[#0a0e19] p-6 md:p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tài Liệu Toàn Diện &amp; Đặc Tả Ngôn Ngữ BLang (v1.0.0)</span>
              </div>

              <button
                onClick={() => setIsDownloadOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải BLang Runtime (.zip / CLI)</span>
              </button>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Ngôn Ngữ Lập Trình BLang &mdash; Bản Đặc Tả Kỹ Thuật Chính Thức
            </h1>

            <p className="text-slate-300 text-xs md:text-sm max-w-3xl leading-relaxed">
              <strong>BLang</strong> (<em>Balanced &amp; Beautiful Language</em>) là một ngôn ngữ lập trình độc lập, tường minh và mạnh mẽ. BLang kết hợp <strong>cú pháp biến trực quan không cần từ khóa (Sigil Syntax)</strong>, <strong>cơ chế an toàn kiểu nghiêm ngặt (Strict Type Safety)</strong>, <strong>bộ tối ưu hằng số compile-time</strong> và <strong>Máy ảo Bytecode độc lập (BLang Virtual Machine - BVM)</strong>.
            </p>

            {/* Quick Specs Badges */}
            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/80 text-slate-300 font-mono">
                Định dạng tệp: <strong className="text-emerald-400">*.bl</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/80 text-slate-300 font-mono">
                Bytecode nhị phân: <strong className="text-indigo-400">*.blc</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/80 text-slate-300 font-mono">
                Lệnh CLI: <strong className="text-amber-400">blang run app.bl</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/80 text-slate-300 font-mono">
                Bộ sinh ngẫu nhiên: <strong className="text-cyan-400">%random(a, b)%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Filter and Search Navigation Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0d1322] p-3 rounded-xl border border-slate-800 sticky top-0 z-20 shadow-xl backdrop-blur-md">
          {/* Chapter Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {chapters.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Real-time search filter */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cú pháp, hàm, câu lệnh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0e19] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* ============================================================================== */}
        {/* CHƯƠNG 1: TẢI VỀ & CÀI ĐẶT TRÊN MÁY TÍNH (NHƯ PYTHON) */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'download') && matchesSearch('tải về cài đặt download cli terminal sdk runtime python blang') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Package className="w-5 h-5 text-emerald-400" />
                <span>1. Tải Về &amp; Cài Đặt BLang Runtime (Chạy file .bl Như Python)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Official SDK
              </span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <p>
                Nếu như với <strong>Python</strong> bạn phải tải gói cài đặt từ <em>python.org</em> để có lệnh <code className="text-blue-300 font-mono">python file.py</code>, thì với <strong>BLang</strong> bạn cũng có gói cài đặt <strong>BLang Native Runtime &amp; Toolchain</strong> độc lập để chạy trực tiếp các tệp tin <code className="text-emerald-400 font-mono">*.bl</code> trên máy tính cá nhân (hỗ trợ Windows, macOS, Linux, WSL).
              </p>

              {/* Download CTA Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-indigo-400" />
                    Tải Gói Cài Đặt BLang SDK v1.0.0 (Đầy đủ)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Bao gồm trình thực thi dòng lệnh <code className="text-slate-300">blang</code>, lõi biên dịch máy ảo BVM, file cài đặt tự động <code className="text-slate-300">install.sh</code> và thư viện mẫu.
                  </p>
                </div>

                <button
                  onClick={() => setIsDownloadOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Mở Cửa Sổ Tải Về</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <h4 className="font-semibold text-white text-xs">So sánh cách chạy giữa Python và BLang trên Terminal:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800">
                    <div className="text-slate-400 mb-1.5 flex items-center gap-1.5 font-sans font-semibold">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Môi trường Python (.py)
                    </div>
                    <div className="text-slate-300">$ python3 app.py</div>
                    <div className="text-slate-500 text-[11px] mt-1 font-sans">Biên dịch ra bytecode .pyc và chạy trên PVM.</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070b14] border border-emerald-500/30">
                    <div className="text-emerald-400 mb-1.5 flex items-center gap-1.5 font-sans font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Môi trường BLang (.bl)
                    </div>
                    <div className="text-emerald-300">$ blang run app.bl</div>
                    <div className="text-slate-400 text-[11px] mt-1 font-sans">Biên dịch ra bytecode .blc và chạy trên BVM.</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <h4 className="font-semibold text-white text-xs">Các lệnh cốt lõi của công cụ dòng lệnh `blang`:</h4>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800/80 flex items-center justify-between">
                    <span className="text-indigo-300">blang run main.bl</span>
                    <span className="text-slate-400 font-sans text-[11px]">Thực thi trực tiếp mã nguồn trong bộ nhớ</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800/80 flex items-center justify-between">
                    <span className="text-emerald-300">blang build main.bl</span>
                    <span className="text-slate-400 font-sans text-[11px]">Biên dịch ra file nhị phân độc lập main.blc</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800/80 flex items-center justify-between">
                    <span className="text-amber-300">blang dis main.bl</span>
                    <span className="text-slate-400 font-sans text-[11px]">Xem tập lệnh máy ảo BVM Opcode Disassembly</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800/80 flex items-center justify-between">
                    <span className="text-blue-300">blang export main.bl</span>
                    <span className="text-slate-400 font-sans text-[11px]">Xuất bundle phụ trợ Python 3.x &amp; JS khi cần</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* CHƯƠNG 2: TRIẾT LÝ THIẾT KẾ & TÍNH ĐỘC LẬP */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'overview') && matchesSearch('triết lý độc lập kiến trúc nguồn gốc') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <Compass className="w-5 h-5 text-indigo-400" />
              <span>2. Triết Lý Thiết Kế &amp; Tính Độc Lập Của BLang</span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <p>
                Nhiều người lầm tưởng BLang chỉ là một bộ chuyển đổi mã (transpiler) phụ thuộc vào Python hay JavaScript. <strong>Đó là nhận định chưa chính xác.</strong> Bản chất BLang là một ngôn ngữ lập trình độc lập, sở hữu toàn bộ các tầng biên dịch hoàn chỉnh:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="font-semibold text-indigo-300 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    Cú Pháp Sigils Trực Quan
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Loại bỏ từ khóa khai báo rườm rà như <code className="text-slate-300">let</code>, <code className="text-slate-300">var</code>. Dễ dàng nhận diện loại biến và ngữ cảnh toán học thông qua ký tự tiền tố (<code className="text-amber-300">@</code>, <code className="text-amber-300">$</code>, <code className="text-amber-300">_</code>).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="font-semibold text-rose-300 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    Strict Type Safety
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tuyệt đối ngăn chặn hành vi ép kiểu ngầm định nguy hiểm (như JavaScript cho phép <code className="text-rose-300">&quot;10&quot; + 5 = &quot;105&quot;</code>). Trong BLang, hành vi này bị chặn ngay ở thời điểm phân tích tĩnh (Static Analysis).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="font-semibold text-emerald-300 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Máy Ảo BVM &amp; Exporters
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    BLang chạy trực tiếp trên máy ảo <strong>BVM (BLang Virtual Machine)</strong> với tập lệnh Bytecode riêng. Mã Python và JavaScript sinh ra chỉ đóng vai trò là <em>Target Exporters</em> phục vụ nhúng web hoặc AI khi cần.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* CHƯƠNG 3: KHAI BÁO BIẾN & KIỂU DỮ LIỆU */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'variables') && matchesSearch('biến sigil kiểu dữ liệu khai báo let var') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span>3. Quy Tắc Khai Báo Biến &amp; Các Kiểu Dữ Liệu</span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs">
                <strong className="text-indigo-300 block mb-1">Quy tắc vàng của BLang:</strong>
                Bạn <strong>KHÔNG CẦN</strong> viết từ khóa <code className="text-slate-400 line-through">let</code>, <code className="text-slate-400 line-through">var</code> hay <code className="text-slate-400 line-through">val</code>. Bạn chỉ cần gõ trực tiếp tên biến cùng ký tự tiền tố Sigil và gán giá trị!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 space-y-1.5">
                  <div className="font-mono font-bold text-indigo-400 text-sm flex items-center gap-1.5">
                    <span>@tên</span>
                    <span className="text-[10px] font-sans font-normal text-slate-400">(Số / Toán học)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Dùng cho số nguyên, số thực, đại lượng toán học và kết quả tính toán.
                  </p>
                  <code className="text-[11px] font-mono text-indigo-200 block pt-1">@score = 100;</code>
                  <code className="text-[11px] font-mono text-indigo-200 block">@pi = 3.14159;</code>
                </div>

                <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 space-y-1.5">
                  <div className="font-mono font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                    <span>$tên</span>
                    <span className="text-[10px] font-sans font-normal text-slate-400">(Chuỗi / Văn bản)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Dùng cho văn bản, tên người dùng, tin nhắn, token chuỗi ký tự.
                  </p>
                  <code className="text-[11px] font-mono text-emerald-200 block pt-1">$name = &quot;Kaelen&quot;;</code>
                  <code className="text-[11px] font-mono text-emerald-200 block">$status = &quot;Ready&quot;;</code>
                </div>

                <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 space-y-1.5">
                  <div className="font-mono font-bold text-amber-400 text-sm flex items-center gap-1.5">
                    <span>_tên</span>
                    <span className="text-[10px] font-sans font-normal text-slate-400">(Biến tạm / Cờ logic)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Dùng cho biến đếm vòng lặp, cờ boolean hoặc giá trị trung gian ngắn hạn.
                  </p>
                  <code className="text-[11px] font-mono text-amber-200 block pt-1">_counter = 0;</code>
                  <code className="text-[11px] font-mono text-amber-200 block">_is_active = true;</code>
                </div>
              </div>

              <CodeSnippet
                title="Ví dụ Khai báo Biến và Mảng & Từ điển (Dict) trong BLang"
                code={`// Khai báo biến cơ bản
@radius = 12.5;
$project_title = "BLang Core Engine";
_initialized = true;

// Khai báo Danh sách (List)
@scores = [85, 92, 78, 96, 88];
$fruits = ["Apple", "Orange", "Banana"];

// Khai báo Từ điển (Dictionary / Map)
$config = {
    "engine": "BVM",
    "version": 1.0,
    "strict_mode": true
};

print("Project:", $project_title);
print("First score:", @scores[0]);
print("Config engine:", $config["engine"]);`}
                output="Project: BLang Core Engine | First score: 85 | Config engine: BVM"
                onLoadSnippet={onLoadSnippet}
              />
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* CHƯƠNG 4: TÍNH NĂNG SINH SỐ NGẪU NHIÊN %random(a, b)% */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'random') && matchesSearch('random %random% ngẫu nhiên số may mắn xúc xắc') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>4. Cú Pháp Sinh Số Ngẫu Nhiên: %random(a, b)%</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                New Feature
              </span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <p>
                BLang trang bị cú pháp macro sinh số ngẫu nhiên <code className="text-amber-300 font-mono font-semibold">%random(a, b)%</code> (đồng thời hỗ trợ gọi hàm chuẩn <code className="text-indigo-300 font-mono">random(a, b)</code>). Trình biên dịch sẽ tự động xác định phạm vi để sinh số ngẫu nhiên:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 space-y-1">
                  <span className="font-semibold text-indigo-300 block">1. Khi truyền 2 số nguyên (Int):</span>
                  <p className="text-slate-400">
                    Sinh số nguyên ngẫu nhiên trong đoạn kín <code className="text-slate-200">[a, b]</code> (bao gồm cả a và b). Rất hữu ích cho trò chơi, lắc xúc xắc, rút thăm trúng thưởng.
                  </p>
                  <code className="text-[11px] font-mono text-emerald-300 block pt-1">@dice = %random(1, 6)%;</code>
                </div>

                <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 space-y-1">
                  <span className="font-semibold text-cyan-300 block">2. Khi truyền số thực (Float):</span>
                  <p className="text-slate-400">
                    Sinh số thực ngẫu nhiên liên tục trong khoảng <code className="text-slate-200">[a, b]</code>. Dùng trong tính toán xác suất, mô phỏng vật lý, thuật toán Monte Carlo.
                  </p>
                  <code className="text-[11px] font-mono text-emerald-300 block pt-1">@probability = %random(0.0, 1.0)%;</code>
                </div>
              </div>

              <CodeSnippet
                title="Ứng dụng cú pháp %random(a, b)% trong thực tế"
                code={`// 1. Lắc xúc xắc 6 mặt
@dice1 = %random(1, 6)%;
@dice2 = %random(1, 6)%;
@total = @dice1 + @dice2;
print("Xuc xac 1:", @dice1, "| Xuc xac 2:", @dice2, "| Tong:", @total);

// 2. Tạo mã bảo mật OTP 4 chữ số (1000 - 9999)
@otp_code = %random(1000, 9999)%;
print("Ma xac thuc OTP cua ban la:", @otp_code);

// 3. Tỷ lệ xác suất (Float)
@chance = %random(0.0, 100.0)%;
if (@chance >= 50.0) {
    print("Ket qua: Ty le thanh cong vuot moc 50% (", @chance, "%)");
} else {
    print("Ket qua: Ty le duoi 50% (", @chance, "%)");
}`}
                output="Xuc xac 1: 5 | Xuc xac 2: 4 | Tong: 9 | Ma xac thuc OTP cua ban la: 8492"
                onLoadSnippet={onLoadSnippet}
              />
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* CHƯƠNG 5: CẤU TRÚC ĐIỀU KHIỂN & VÒNG LẶP */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'control') && matchesSearch('điều khiển rẽ nhánh if else while for loop break continue') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>5. Cấu Trúc Rẽ Nhánh &amp; Vòng Lặp</span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <p>
                BLang sử dụng khối lệnh ngoặc nhọn <code className="text-indigo-300 font-mono">{'{ }'}</code> rõ ràng và tiêu chuẩn. Các cấu trúc bao gồm <code className="text-slate-200 font-mono">if / elseif / else</code>, <code className="text-slate-200 font-mono">while</code>, và <code className="text-slate-200 font-mono">for (biến in mảng)</code>.
              </p>

              <CodeSnippet
                title="Cấu trúc Rẽ nhánh If / Elseif / Else"
                code={`@score = 88;

if (@score >= 90) {
    $grade = "Xuat sac (A+)";
} elseif (@score >= 80) {
    $grade = "Gioi (A)";
} elseif (@score >= 65) {
    $grade = "Kha (B)";
} else {
    $grade = "Trung binh (C)";
}

print("Diem so:", @score, "-> Xep loai:", $grade);`}
                output="Diem so: 88 -> Xep loai: Gioi (A)"
                onLoadSnippet={onLoadSnippet}
              />

              <CodeSnippet
                title="Vòng lặp For duyệt mảng và While có break / continue"
                code={`// 1. Duyệt mảng bằng vòng lặp For
@numbers = [1, 2, 3, 4, 5];
@sum = 0;
for (n in @numbers) {
    @sum = @sum + n;
}
print("Tong cac phan tu:", @sum);

// 2. Vòng lặp While voi break
_i = 1;
print("Dem tu 1 den 3:");
while (_i <= 10) {
    if (_i > 3) {
        break; // Dung lai khi vuot qua 3
    }
    print("  Buoc:", _i);
    _i = _i + 1;
}`}
                output="Tong cac phan tu: 15 | Dem tu 1 den 3: Buoc: 1, Buoc: 2, Buoc: 3"
                onLoadSnippet={onLoadSnippet}
              />
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* CHƯƠNG 6: HÀM & PHẠM VI (FUNCTIONS) */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'functions') && matchesSearch('hàm function return tham số recursion đệ quy') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <FileCode className="w-5 h-5 text-indigo-400" />
              <span>6. Định Nghĩa Hàm &amp; Phạm Vi Biến (Functions &amp; Scopes)</span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <p>
                Hàm trong BLang được khai báo bằng từ khóa <code className="text-indigo-400 font-mono">function</code>, nhận danh sách tham số và trả về giá trị thông qua lệnh <code className="text-indigo-400 font-mono">return</code>. BLang hỗ trợ đầy đủ các kỹ thuật nâng cao như hàm đệ quy (Recursion) và phân tầng phạm vi cục bộ (Lexical Scoping).
              </p>

              <CodeSnippet
                title="Hàm tính Giai Thừa bằng thuật toán Đệ Quy (Recursion)"
                code={`function factorial(@n) {
    if (@n <= 1) {
        return 1;
    }
    return @n * factorial(@n - 1);
}

@ans5 = factorial(5);
@ans7 = factorial(7);
print("5! = (5 * 4 * 3 * 2 * 1) =", @ans5);
print("7! =", @ans7);`}
                output="5! = (5 * 4 * 3 * 2 * 1) = 120 | 7! = 5040"
                onLoadSnippet={onLoadSnippet}
              />

              <CodeSnippet
                title="Hàm tính Lũy Thừa tùy chỉnh"
                code={`function custom_power(@base, @exp) {
    if (@exp == 0) {
        return 1;
    }
    @res = 1;
    _k = 0;
    while (_k < @exp) {
        @res = @res * @base;
        _k = _k + 1;
    }
    return @res;
}

@val = custom_power(2, 8);
print("2^8 =", @val);`}
                output="2^8 = 256"
                onLoadSnippet={onLoadSnippet}
              />
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* CHƯƠNG 7: THƯ VIỆN TOÁN HỌC & HÌNH HỌC CHUẨN */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'geometry') && matchesSearch('toán học hình học geometry chu vi diện tích thể tích circle rect triangle') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <Calculator className="w-5 h-5 text-indigo-400" />
              <span>7. Thư Viện Chuẩn Hình Học &amp; Toán Học Trực Quan</span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <p>
                BLang đi đầu trong việc chuẩn hóa các hàm tính toán hình học theo quy ước ngắn gọn, dễ nhớ nhất thế giới:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/25 space-y-1">
                  <span className="font-bold text-indigo-300 font-mono text-sm block">c hoặc C</span>
                  <span className="text-slate-400">Chu vi (Circumference / Perimeter)</span>
                  <div className="text-[11px] text-slate-400 pt-1">Ví dụ: <code className="text-indigo-200">circle_c(r)</code>, <code className="text-indigo-200">rect_c(w, h)</code></div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/25 space-y-1">
                  <span className="font-bold text-emerald-300 font-mono text-sm block">s hoặc S</span>
                  <span className="text-slate-400">Diện tích (Surface / Area)</span>
                  <div className="text-[11px] text-slate-400 pt-1">Ví dụ: <code className="text-emerald-200">circle_s(r)</code>, <code className="text-emerald-200">square_s(a)</code></div>
                </div>

                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/25 space-y-1">
                  <span className="font-bold text-amber-300 font-mono text-sm block">v hoặc V</span>
                  <span className="text-slate-400">Thể tích (Volume)</span>
                  <div className="text-[11px] text-slate-400 pt-1">Ví dụ: <code className="text-amber-200">cube_v(a)</code>, <code className="text-amber-200">sphere_v(r)</code></div>
                </div>
              </div>

              <CodeSnippet
                title="Tính toán Chu vi, Diện tích & Thể tích các hình trong BLang"
                code={`// Hình Tròn (bán kính r = 10)
@cir_p = circle_c(10);
@cir_a = circle_s(10);
print("Hinh tron r=10 -> Chu vi (c):", @cir_p, "| Dien tich (s):", @cir_a);

// Hình Chữ Nhật (rộng = 8, dài = 15)
@rec_p = rect_c(8, 15);
@rec_a = rect_s(8, 15);
print("Hinh chu nhat 8x15 -> Chu vi (c):", @rec_p, "| Dien tich (s):", @rec_a);

// Hình Khối: Khối Lập Phương & Hình Cầu
@cube_vol = cube_v(4);
@sphere_vol = sphere_v(5);
print("The tich Lap phuong (canh 4):", @cube_vol);
print("The tich Hinh cau (ban kinh 5):", @sphere_vol);`}
                output="Hinh tron r=10 -> Chu vi: 62.8318 | Dien tich: 314.159 | The tich Lap phuong: 64"
                onLoadSnippet={onLoadSnippet}
              />

              <CodeSnippet
                title="Hàm Lượng giác & Căn bậc / Lũy thừa"
                code={`// Tính giá trị lượng giác theo độ (d) hoặc Radian
@sin_30 = sind(30);
@cos_60 = cosd(60);
print("sin(30 deg):", @sin_30, "| cos(60 deg):", @cos_60);

// Căn bậc 2, căn bậc 3, làm tròn
@sq = sqrt(144);
@cb = cbrt(125);
@rnd = round(3.78);
print("sqrt(144) =", @sq, "| cbrt(125) =", @cb, "| round(3.78) =", @rnd);`}
                output="sin(30 deg): 0.5 | cos(60 deg): 0.5 | sqrt(144) = 12 | cbrt(125) = 5"
                onLoadSnippet={onLoadSnippet}
              />
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* CHƯƠNG 8: THAO TÁC CHUỖI, MẢNG & THỜI GIAN */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'stdlib') && matchesSearch('chuỗi mảng thời gian string list array time upper lower replace') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <Zap className="w-5 h-5 text-indigo-400" />
              <span>8. Thư Viện Chuẩn: Chuỗi Ký Tự, Danh Sách &amp; Thời Gian</span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <p>
                BLang tích hợp sẵn các hàm xử lý mảng và chuỗi tiện dụng giúp việc lập trình trở nên nhanh chóng và ngắn gọn:
              </p>

              <CodeSnippet
                title="Thao tác Xử lý Chuỗi Ký tự"
                code={`$raw = "   hello BLang world   ";
$trimmed = trim($raw);
$upper_str = upper($trimmed);
$replaced = replace($upper_str, "WORLD", "VIETNAM");

print("Chuoi goc:", $raw);
print("Sau khi trim & viet hoa:", $upper_str);
print("Sau khi thay the:", $replaced);
print("Kiem tra chua tu 'VIETNAM':", contains($replaced, "VIETNAM"));`}
                output="Sau khi trim & viet hoa: HELLO BLANG WORLD | Sau khi thay the: HELLO BLANG VIETNAM"
                onLoadSnippet={onLoadSnippet}
              />

              <CodeSnippet
                title="Thao tác Xử lý Danh sách (Aggregation) & Thời gian"
                code={`@data = [12, 45, 78, 23, 56, 89, 34];

@tong = sum(@data);
@nho_nhat = min_val(@data);
@lon_nhat = max_val(@data);
@trung_binh = avg(@data);
@dao_nguoc = reverse(@data);

print("Tong:", @tong, "| Min:", @nho_nhat, "| Max:", @lon_nhat, "| Trung binh:", @trung_binh);
print("Mang dao nguoc:", @dao_nguoc);
print("Thoi gian hien tai (Epoch ms):", time_now());`}
                output="Tong: 337 | Min: 12 | Max: 89 | Trung binh: 48.14 | Mang dao nguoc: [89, 56, ...]"
                onLoadSnippet={onLoadSnippet}
              />
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* CHƯƠNG 9: CHẾ ĐỘ AN TOÀN KIỂU DỮ LIỆU (STRICT TYPE SAFETY) */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'safety') && matchesSearch('an toàn kiểu strict type safety typeerror ép kiểu str num') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>9. Chế Độ An Toàn Kiểu Tuyệt Đối (Strict Type Safety)</span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <p>
                Một trong những nguồn gốc lớn nhất gây ra lỗi tiềm ẩn (silent bug) trong JavaScript và PHP là việc cho phép toán tử <code className="text-amber-300 font-mono">+</code> thực hiện cả phép cộng số học và phép nối chuỗi khi dữ liệu không đồng nhất:
              </p>

              <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Quy tắc cấm kỵ trong BLang:</span>
                </div>
                <p>
                  Tuyệt đối <strong>CẤM</strong> cộng trực tiếp Chuỗi với Số: <code className="text-white bg-rose-900/60 px-1 py-0.5 rounded font-mono">&quot;Score: &quot; + 100</code> &rarr; BLang sẽ báo lỗi <strong className="text-rose-300">BLangTypeError</strong> ngay lập tức!
                </p>
              </div>

              <CodeSnippet
                title="Cách chuyển đổi kiểu dữ liệu an toàn bằng str() và num()"
                code={`$label = "Diem so cua ban la: ";
@points = 95;

// DUNG DUNG: Chuyen so thanh chuoi truoc khi xu ly
$full_message = $label + str(@points);
print($full_message);

// Chuyen chuoi so thanh so thuc de tinh toan
$input_str = "150";
@total_bonus = num($input_str) + 50;
print("Tong diem thuong (150 + 50):", @total_bonus);`}
                output="Diem so cua ban la: 95 | Tong diem thuong (150 + 50): 200"
                onLoadSnippet={onLoadSnippet}
              />
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* CHƯƠNG 10: MÁY ẢO BVM & BYTECODE .BLC */}
        {/* ============================================================================== */}
        {(activeCategory === 'all' || activeCategory === 'bvm') && matchesSearch('máy ảo bvm bytecode .blc binary isa architecture') && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>10. Máy Ảo BLang Virtual Machine (BVM) &amp; Định Dạng Bytecode .blc</span>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <p>
                Để đảm bảo BLang là một ngôn ngữ lập trình độc lập 100%, BLang được trang bị hệ thống máy ảo <strong>BVM (BLang Virtual Machine)</strong> với tập lệnh Bytecode (ISA) hoàn chỉnh:
              </p>

              <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 font-mono text-xs space-y-1.5 text-indigo-200">
                <div className="text-slate-500 font-sans pb-1 font-semibold">Tập lệnh máy ảo chuẩn (BVM Instructions):</div>
                <div>0000  LOAD_CONST          0               ; 10</div>
                <div>0002  LOAD_CONST          1               ; 99</div>
                <div>0004  CALL_RANDOM         2               ; %random(10, 99)% evaluation</div>
                <div>0006  STORE_VAR           @lucky_seed     ; Bind variable @lucky_seed</div>
                <div>0008  PRINT_VAL           1               ; Print 1 item to stdout</div>
                <div>0010  HALT                                ; Program execution terminated cleanly</div>
              </div>

              <p className="text-xs text-slate-400">
                Khi biên dịch bằng lệnh <code className="text-emerald-400 font-mono">blang build app.bl</code> hoặc nhấn nút <strong>Download .blc</strong> trên Studio, bạn sẽ nhận được tệp nhị phân trung gian <code className="text-indigo-300 font-mono">app.blc</code> có thể phân phối và chạy trên bất kỳ máy ảo BVM nào.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Download SDK Modal */}
      <DownloadSdkModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
};
