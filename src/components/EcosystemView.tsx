import React, { useState } from 'react';
import {
  Globe,
  ShieldCheck,
  Zap,
  Layers,
  Terminal,
  Download,
  Copy,
  Check,
  Package,
  Code2,
  Cpu,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Lock,
  Box,
  FileJson,
} from 'lucide-react';

export const EcosystemView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'strategy' | 'vscode' | 'bpm' | 'security'>('strategy');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const handleCopy = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // VS Code Extension files
  const vscodePackageJson = JSON.stringify(
    {
      name: "blang-language-support",
      displayName: "BLang Programming Language",
      description: "Rich language support, syntax highlighting, and snippets for BLang (*.bl)",
      version: "1.0.0",
      publisher: "blang-ecosystem",
      engines: {
        vscode: "^1.75.0"
      },
      categories: ["Programming Languages", "Snippets"],
      contributes: {
        languages: [
          {
            id: "blang",
            aliases: ["BLang", "blang"],
            extensions: [".bl"],
            configuration: "./language-configuration.json"
          }
        ],
        grammars: [
          {
            language: "blang",
            scopeName: "source.blang",
            path: "./syntaxes/blang.tmLanguage.json"
          }
        ]
      }
    },
    null,
    2
  );

  const vscodeLanguageConfig = JSON.stringify(
    {
      comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"]
      },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"]
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "\"", close: "\"", notIn: ["string"] },
        { open: "'", close: "'", notIn: ["string"] }
      ],
      surroundingPairs: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
        ["\"", "\""],
        ["'", "'"]
      ],
      indentationRules: {
        increaseIndentPattern: "^.*(\\{|\\[|\\()\\s*$",
        decreaseIndentPattern: "^\\s*(\\}|\\]|\\))"
      }
    },
    null,
    2
  );

  const vscodeTmLanguage = JSON.stringify(
    {
      $schema: "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
      name: "BLang",
      scopeName: "source.blang",
      patterns: [
        { include: "#comments" },
        { include: "#strings" },
        { include: "#sigil-variables" },
        { include: "#keywords" },
        { include: "#builtins" },
        { include: "#numbers" },
        { include: "#operators" }
      ],
      repository: {
        comments: {
          patterns: [
            {
              name: "comment.line.double-slash.blang",
              match: "//.*$"
            },
            {
              name: "comment.block.blang",
              begin: "/\\*",
              end: "\\*/"
            }
          ]
        },
        strings: {
          patterns: [
            {
              name: "string.quoted.double.blang",
              begin: "\"",
              end: "\"",
              patterns: [{ name: "constant.character.escape.blang", match: "\\\\." }]
            },
            {
              name: "string.quoted.single.blang",
              begin: "'",
              end: "'",
              patterns: [{ name: "constant.character.escape.blang", match: "\\\\." }]
            }
          ]
        },
        "sigil-variables": {
          patterns: [
            {
              name: "variable.other.sigil.number.blang",
              match: "@[a-zA-Z_]\\w*"
            },
            {
              name: "variable.other.sigil.string.blang",
              match: "\\$[a-zA-Z_]\\w*"
            },
            {
              name: "variable.other.sigil.temp.blang",
              match: "_[a-zA-Z_]\\w*"
            }
          ]
        },
        keywords: {
          patterns: [
            {
              name: "keyword.control.blang",
              match: "\\b(if|elseif|else|while|for|in|break|continue|return|import)\\b"
            },
            {
              name: "storage.type.function.blang",
              match: "\\bfunction\\b"
            },
            {
              name: "constant.language.blang",
              match: "\\b(true|false|null)\\b"
            }
          ]
        },
        builtins: {
          patterns: [
            {
              name: "support.function.builtin.blang",
              match: "\\b(print|len|type|input|str|num|range|push|sin|cos|tan|cotan|cir_c|cir_s|sq_c|sq_s|tri_c|tri_s|sphere_v|cube_v|cylinder_v|cone_v|rect_c|rect_s|cuboid_v|trapezoid_c|trapezoid_s|polygon_c|polygon_s|sqrt|cbrt|root|pow|power|abs|round|floor|ceil|log|ln|upper|lower|trim|replace|split|join|contains|sum|min_val|max_val|avg|reverse|time_now|PI|E)\\b"
            }
          ]
        },
        numbers: {
          patterns: [
            {
              name: "constant.numeric.blang",
              match: "\\b\\d+(\\.\\d+)?\\b"
            }
          ]
        },
        operators: {
          patterns: [
            {
              name: "keyword.operator.blang",
              match: "(\\+|\\-|\\*|\\/|%|=|==|!=|<|>|<=|>=|&&|\\|\\||!)"
            }
          ]
        }
      }
    },
    null,
    2
  );

  const bpmManifestSample = JSON.stringify(
    {
      name: "my-blang-app",
      version: "1.0.0",
      description: "A high-performance BLang scientific application",
      main: "main.bl",
      dependencies: {
        "math_lib": "^1.2.0",
        "geometry_engine": "^2.0.0"
      },
      compiler: {
        target: "python",
        strictMode: true,
        optimizeConstants: true
      }
    },
    null,
    2
  );

  const downloadFile = (filename: string, content: string, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-8 bg-[#0a0e19] text-slate-200 font-sans select-text scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-[#0a0e19] p-6 md:p-8 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chiến Lược &amp; Hệ Sinh Thái Toàn Diện (BLang Ecosystem)</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Biến BLang Thành Hệ Sinh Thái Ngôn Ngữ Chuyên Nghiệp
            </h1>

            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Giải pháp toàn diện đưa BLang từ một ngôn ngữ kịch bản thành nền tảng độc lập: chạy đa nền tảng (Universal), bảo mật hộp cát (Sandbox Security), trải nghiệm phát triển tối ưu (DX), và gói tiện ích mở rộng Visual Studio Code sẵn sàng cài đặt.
            </p>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono">
                1. Universal (Web + PC + Cloud)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono">
                2. Sandbox Protection (100k Steps Limit)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono">
                3. VS Code Extension (TextMate Grammar)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono">
                4. Package Manager (BPM)
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveSubTab('strategy')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'strategy'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4 Trụ Cột Chiến Lược &amp; Biện Pháp</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vscode')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'vscode'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Gói VS Code Extension</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bpm')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'bpm'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>BLang Package Manager (BPM)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'security'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cơ Chế Bảo Mật &amp; Sandbox</span>
          </button>
        </div>

        {/* TAB 1: 4 TRỤ CỘT CHIẾN LƯỢC & BIỆN PHÁP CỤ THỂ */}
        {activeSubTab === 'strategy' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pillar 1 */}
              <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <span>1. Chạy được mọi nơi (Universal &amp; Cross-Platform)</span>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-emerald-400">Đã hiện thực hóa:</strong> BLang hiện có kiến trúc biên dịch kép (Dual-Transpiler) sinh đồng thời ra <strong>Python 3.x</strong> (cho AI, Backend, CLI) và <strong>JavaScript ES6+</strong> (chạy trực tiếp trên mọi trình duyệt, Node.js, Web, Mobile).
                  </p>
                  <p>
                    <strong className="text-indigo-300">Biện pháp nâng cấp tiếp theo:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li>Đóng gói <code>compiler.py</code> thành file thực thi duy nhất <strong>standalone binary</strong> (dùng PyInstaller hoặc Nuitka) để chạy trên Windows (<code>blang.exe</code>), macOS và Linux mà không cần cài Python.</li>
                    <li>Biên dịch lõi C/Rust sang <strong>WebAssembly (.wasm)</strong> để đạt tốc độ xử lý native ngay trong trình duyệt.</li>
                  </ul>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-rose-400" />
                  <span>2. Bảo mật tối đa (Maximum Security &amp; Sandbox)</span>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-emerald-400">Đã hiện thực hóa:</strong> Strict Static Type Checking (ngăn chặn triệt để ép kiểu nguy hiểm chuỗi - số) và Hộp cát giới hạn vòng lặp (100.000 bước) chống tấn công từ chối dịch vụ (DoS/Hanging).
                  </p>
                  <p>
                    <strong className="text-indigo-300">Biện pháp nâng cấp tiếp theo:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li><strong>Safe Virtual Filesystem:</strong> Chỉ cho phép lệnh <code>import</code> đọc trong thư mục cho phép (chặn <code>../etc/passwd</code>).</li>
                    <li><strong>Bytecode Obfuscation (.blc):</strong> Xuất file nhị phân trung gian đã mã hóa để bảo vệ bản quyền sở hữu trí tuệ của tác giả code.</li>
                  </ul>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>3. Dễ dùng &amp; Nhiều tính năng (Developer Experience - DX)</span>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-emerald-400">Đã hiện thực hóa:</strong> Định dạng mã tự động (Format Code `Ctrl+Shift+F`), tô màu cú pháp thời gian thực Prism.js, phím tắt Tab thụt 4 spaces, thư viện toán &amp; hình học toàn diện.
                  </p>
                  <p>
                    <strong className="text-indigo-300">Biện pháp nâng cấp tiếp theo:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li><strong>Extended Standard Library:</strong> Thư viện xử lý chuỗi (<code>upper, lower, trim, split, join</code>) và mảng (<code>sum, avg, min_val, max_val, reverse</code>).</li>
                    <li>Thông báo lỗi bằng tiếng Việt tự nhiên và hướng dẫn khắc phục ngay tại vị trí dòng và cột.</li>
                  </ul>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
                  <Package className="w-5 h-5 text-cyan-400" />
                  <span>4. Tiện lợi &amp; Tích hợp toàn diện (All-in-One Integration)</span>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-emerald-400">Đã hiện thực hóa:</strong> Bộ cài đặt Extension cho Visual Studio Code (TextMate Grammar + Language Config), bộ quản lý gói BPM (BLang Package Manager) và Web Studio IDE tương tác.
                  </p>
                  <p>
                    <strong className="text-indigo-300">Biện pháp nâng cấp tiếp theo:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li>Đăng tải extension lên <strong>VS Code Marketplace</strong> để lập trình viên toàn cầu cài bằng 1 click.</li>
                    <li>Xây dựng cổng đăng ký gói <code>bpm.blang.dev</code> cho cộng đồng chia sẻ mã nguồn.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GÓI VS CODE EXTENSION READY-TO-INSTALL */}
        {activeSubTab === 'vscode' && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  <span>Gói Cài Đặt Tiện Ích Visual Studio Code Cho BLang</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chứa đầy đủ cấu hình ngôn ngữ, quy tắc thụt lề, comment và bộ ngữ pháp TextMate grammar chuẩn để tô màu cú pháp biến sigil (@, $, _), từ khóa, hàm hình học.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadFile('blang-extension.json', vscodeTmLanguage)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải tmLanguage.json</span>
                </button>
              </div>
            </div>

            {/* Instruction steps */}
            <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
              <span className="font-semibold text-indigo-300">Cách cài đặt vào VS Code trên máy tính:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                <li>Tạo thư mục: <code className="text-slate-200 font-mono">~/.vscode/extensions/blang-language-support</code></li>
                <li>Lưu 3 file bên dưới vào thư mục đó (<code className="text-slate-200 font-mono">package.json</code>, <code className="text-slate-200 font-mono">language-configuration.json</code>, và <code className="text-slate-200 font-mono">syntaxes/blang.tmLanguage.json</code>).</li>
                <li>Khởi động lại VS Code, mở bất kỳ file nào có đuôi <code className="text-emerald-400 font-mono">*.bl</code> để tận hưởng giao diện tô màu tự động!</li>
              </ol>
            </div>

            {/* File 1: package.json */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-indigo-300 font-semibold">1. package.json (Extension Manifest)</span>
                <button
                  onClick={() => handleCopy('package.json', vscodePackageJson)}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
                >
                  {copiedFile === 'package.json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFile === 'package.json' ? 'Đã copy' : 'Sao chép'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-[#070b14] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 scrollbar-thin">
                {vscodePackageJson}
              </pre>
            </div>

            {/* File 2: syntaxes/blang.tmLanguage.json */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-indigo-300 font-semibold">2. syntaxes/blang.tmLanguage.json (TextMate Grammar)</span>
                <button
                  onClick={() => handleCopy('blang.tmLanguage.json', vscodeTmLanguage)}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
                >
                  {copiedFile === 'blang.tmLanguage.json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFile === 'blang.tmLanguage.json' ? 'Đã copy' : 'Sao chép'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-[#070b14] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56 scrollbar-thin">
                {vscodeTmLanguage}
              </pre>
            </div>

            {/* File 3: language-configuration.json */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-indigo-300 font-semibold">3. language-configuration.json (Auto Closing &amp; Indents)</span>
                <button
                  onClick={() => handleCopy('language-configuration.json', vscodeLanguageConfig)}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
                >
                  {copiedFile === 'language-configuration.json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFile === 'language-configuration.json' ? 'Đã copy' : 'Sao chép'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-[#070b14] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 scrollbar-thin">
                {vscodeLanguageConfig}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: BLANG PACKAGE MANAGER (BPM) */}
        {activeSubTab === 'bpm' && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <Package className="w-5 h-5 text-indigo-400" />
              <span>BLang Package Manager (BPM) - Quản Lý Thư Viện Tương Lai</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Mô hình quản lý gói BPM được thiết kế tương tự như <code>cargo</code> (Rust) và <code>npm</code> (Node.js), sử dụng tệp kê khai cấu hình <code className="text-amber-300 font-mono">blang.json</code> để quản lý phụ thuộc module và thiết lập cấu hình biên dịch.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="font-mono text-xs text-indigo-300 font-semibold">Cấu trúc file blang.json mẫu:</span>
                <pre className="p-3 rounded-lg bg-[#070b14] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {bpmManifestSample}
                </pre>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <span className="font-semibold text-indigo-300">Các câu lệnh CLI của BPM:</span>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400">$ bpm init</span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">Khởi tạo dự án BLang mới với cấu trúc chuẩn và blang.json.</p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400">$ bpm install math_lib</span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">Tải và liên kết thư viện toán học vào thư mục blang_modules/.</p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400">$ bpm build --target=py</span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">Biên dịch toàn bộ dự án ra mã Python hoặc JavaScript đã tối ưu hóa.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BẢO MẬT & SANDBOX */}
        {activeSubTab === 'security' && (
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <Lock className="w-5 h-5 text-rose-400" />
              <span>Kiến Trúc Hộp Cát (Sandbox Protection) &amp; An Toàn Tuyệt Đối</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="font-semibold text-rose-300 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Loop Step Limiter (100k)
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Trình thông dịch tự động đếm số bước lặp trong vòng lặp <code>while</code> và <code>for</code>. Nếu vượt quá 100.000 bước (vòng lặp vô tận), sandbox sẽ tự ngắt và cảnh báo an toàn thay vì làm đơ máy người dùng.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="font-semibold text-amber-300 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Strict Type Safety
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ngăn chặn hành vi ép kiểu ngầm định nguy hiểm của JavaScript (như <code>"10" + 5 = "105"</code>). Phân tích ngữ nghĩa chặn ngay từ đầu các phép toán sai kiểu.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="font-semibold text-emerald-300 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Isolated Scope Environment
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mỗi khối lệnh, hàm, và module chạy trong một môi trường tầm vực biến (lexical scope) riêng biệt, không thể làm ô nhiễm hay ghi đè các hàm hệ thống cốt lõi.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
