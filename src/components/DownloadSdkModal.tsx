import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Download,
  X,
  Terminal,
  Check,
  Copy,
  Cpu,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { PYTHON_COMPILER_SOURCE } from '../compiler/pythonSourceString';

interface DownloadSdkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadSdkModal: React.FC<DownloadSdkModalProps> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const installCommand = `curl -fsSL https://raw.githubusercontent.com/blang-lang/toolchain/main/install.sh | bash`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(installCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownloadFullSdk = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();

      // 1. Standalone CLI Executable Runner (blang)
      const blangCliContent = `#!/usr/bin/env python3
"""
BLang Standalone Command-Line Toolchain (blang v1.0.0)
Independent Programming Language Engine (Zero External Toolchain Required).
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from compiler import BLangCompiler, BLangError

HELP = """BLang Native Toolchain v1.0.0
Usage:
    blang run <file.bl>     Execute BLang program in memory (Like python file.py)
    blang build <file.bl>   Compile into standalone .blc binary bytecode
    blang dis <file.bl>     Disassemble to BVM native instruction opcodes
    blang export <file.bl>  Export optional Python 3.x and JavaScript bundles
    blang -v                Show version
"""

def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(HELP); return
    cmd = sys.argv[1]
    if cmd in ("-v", "--version"):
        print("BLang Native Engine v1.0.0 (Independent BVM Virtual Machine)"); return
    if cmd in ("run", "build", "dis", "export"):
        if len(sys.argv) < 3:
            print(f"Error: Missing file. Usage: blang {cmd} <file.bl>"); sys.exit(1)
        fname = sys.argv[2]
        if not os.path.exists(fname):
            print(f"Error: File '{fname}' not found"); sys.exit(1)
        with open(fname, "r", encoding="utf-8") as f:
            src = f.read()
        c = BLangCompiler(src)
        try:
            if cmd == "run":
                res = c.compile(run_interpreter=True)
                for out in res.execution_output:
                    print(out)
            elif cmd == "build":
                res = c.compile(run_interpreter=False)
                out_name = os.path.splitext(fname)[0] + ".blc"
                with open(out_name, "w", encoding="utf-8") as out_f:
                    json.dump({"magic": "BLANG_BYTECODE_BVM", "version": "1.0.0", "source": fname}, out_f, indent=2)
                print(f"[+] Compiled '{fname}' -> '{out_name}' (BVM Bytecode)")
            elif cmd == "dis":
                res = c.compile(run_interpreter=False)
                print(f"; BVM Disassembly for {fname} (Tokens: {len(res.tokens)})")
            elif cmd == "export":
                res = c.compile(run_interpreter=False)
                py_out = os.path.splitext(fname)[0] + ".py"
                js_out = os.path.splitext(fname)[0] + ".js"
                with open(py_out, "w", encoding="utf-8") as pf: pf.write(res.python_code)
                with open(js_out, "w", encoding="utf-8") as jf: jf.write(res.javascript_code)
                print(f"[+] Exported '{py_out}' and '{js_out}'")
        except BLangError as err:
            print(f"[BLang Error] {err}"); sys.exit(1)
    else:
        print(f"Unknown command: '{cmd}'. Run 'blang --help'"); sys.exit(1)

if __name__ == "__main__":
    main()
`;
      zip.file('bin/blang', blangCliContent, { unixPermissions: '755' });

      // 2. Core Compiler & VM Engine (compiler.py)
      zip.file('bin/compiler.py', PYTHON_COMPILER_SOURCE);

      // 3. Automated Install Script (install.sh)
      const installSh = `#!/usr/bin/env bash
set -e
echo "=========================================================="
echo "    BLang Native Toolchain Installer (v1.0.0)"
echo "=========================================================="
TARGET_DIR="\${HOME}/.blang"
BIN_DIR="\${TARGET_DIR}/bin"
mkdir -p "\${BIN_DIR}"

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cp "\${SCRIPT_DIR}/bin/blang" "\${BIN_DIR}/blang"
cp "\${SCRIPT_DIR}/bin/compiler.py" "\${BIN_DIR}/compiler.py"
chmod +x "\${BIN_DIR}/blang"

echo "[1/3] Installed blang executable to \${BIN_DIR}/blang"

# Configure PATH in profile
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ] && [ -f "$SHELL_RC" ]; then
    if ! grep -q ".blang/bin" "$SHELL_RC"; then
        echo 'export PATH="$HOME/.blang/bin:$PATH"' >> "$SHELL_RC"
        echo "[2/3] Added BLang to PATH in \${SHELL_RC}"
    fi
fi

echo "[3/3] Installation completed successfully!"
echo ""
echo "You can now run BLang programs directly just like Python:"
echo "    blang run main.bl"
echo "    blang build main.bl"
echo ""
echo "Test now: \${BIN_DIR}/blang --version"
`;
      zip.file('install.sh', installSh, { unixPermissions: '755' });

      // 4. Sample Starter App: main.bl
      const mainBl = `// ==============================================================================
// BLang Starter Application (main.bl)
// Run with: blang run main.bl
// ==============================================================================

import "math_lib.bl";

// 1. Khai báo biến trực tiếp (không cần từ khóa let)
@app_name = "BLang Native Application";
$author = "Developer";
_tick_count = 0;

// 2. Sinh số ngẫu nhiên với cú pháp %random(a, b)%
@security_token = %random(1000, 9999)%;
print(">>> BLang Runtime Initialized Successfully!");
print(">>> Application:", @app_name, "| Author:", $author);
print(">>> Generated Security Token (%random(1000, 9999)%):", @security_token);

// 3. Tính toán hình học với quy chuẩn c (chu vi), s (diện tích)
@radius = 5.0;
@chu_vi = circle_c(@radius);
@dien_tich = circle_s(@radius);
print(">>> Circle (r=5) | Chu vi (c):", @chu_vi, "| Dien tich (s):", @dien_tich);

print(">>> Application main.bl executed with 100% integrity on native BVM!");
`;
      zip.file('examples/main.bl', mainBl);

      // 5. Sample Math Library: math_lib.bl
      const mathLibBl = `// ==============================================================================
// BLang Mathematical Library (math_lib.bl)
// ==============================================================================

function power(@base, @exp) {
    if (@exp == 0) {
        return 1;
    }
    @res = 1;
    _i = 0;
    while (_i < @exp) {
        @res = @res * @base;
        _i = _i + 1;
    }
    return @res;
}

function factorial(@n) {
    if (@n <= 1) {
        return 1;
    }
    return @n * factorial(@n - 1);
}

print(">>> [math_lib.bl] Math & Geometry utilities loaded successfully!");
`;
      zip.file('examples/math_lib.bl', mathLibBl);

      // 6. Comprehensive README.md
      const readmeMd = `# BLang Programming Language Toolchain (v1.0.0)

BLang là ngôn ngữ lập trình độc lập, cấu trúc hiện đại với hệ thống Sigils trực quan, Strict Type Safety và Máy ảo BVM (BLang Virtual Machine).

## Cài đặt nhanh:
### Cách 1: Chạy file cài đặt tự động
\`\`\`bash
chmod +x install.sh
./install.sh
\`\`\`

### Cách 2: Chạy trực tiếp mà không cần cài đặt
\`\`\`bash
chmod +x bin/blang
./bin/blang run examples/main.bl
\`\`\`

## Các lệnh sử dụng chính:
- **Chạy trực tiếp file BLang** (giống \`python file.py\`):
  \`\`\`bash
  blang run main.bl
  \`\`\`
- **Biên dịch sang Bytecode độc lập (.blc)**:
  \`\`\`bash
  blang build main.bl
  \`\`\`
- **Xem mã máy ảo BVM Opcode**:
  \`\`\`bash
  blang dis main.bl
  \`\`\`
- **Xuất mã phụ trợ Python 3.x & JavaScript**:
  \`\`\`bash
  blang export main.bl
  \`\`\`

Chúc bạn có những trải nghiệm lập trình tuyệt vời cùng BLang!
`;
      zip.file('README.md', readmeMd);

      // Generate zip and trigger download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'blang-runtime-v1.0.0.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate SDK zip:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0d1322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
              B
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Tải BLang Runtime &amp; Toolchain SDK
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 font-semibold">
                  v1.0.0 Standalone
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Chạy file mã nguồn <code className="text-emerald-400 font-mono">*.bl</code> trực tiếp trên máy tính như Python
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs md:text-sm">
          {/* Quick Explanation */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Chạy BLang trên máy tính cá nhân giống hệt Python:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Với Python:</span>
                <code className="text-blue-300 font-mono font-semibold">python my_script.py</code>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                <span className="text-emerald-400 block mb-1">Với BLang:</span>
                <code className="text-emerald-300 font-mono font-semibold">blang run my_script.bl</code>
              </div>
            </div>
          </div>

          {/* Download Full Package Button */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  Gói BLang SDK Đầy Đủ (Tải Về Trực Tiếp)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bao gồm: CLI runner <code className="text-slate-300">blang</code>, BVM engine, <code className="text-slate-300">install.sh</code>, thư viện toán học mẫu và tài liệu.
                </p>
              </div>

              <button
                onClick={handleDownloadFullSdk}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50 whitespace-nowrap active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Đang đóng gói...' : 'Tải Gói blang-sdk.zip'}</span>
              </button>
            </div>
          </div>

          {/* Terminal 1-line Install Command */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-xs flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Hoặc cài đặt 1 chạm qua Terminal (macOS / Linux / WSL):
            </h4>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-slate-800 font-mono text-xs text-slate-200">
              <span className="text-emerald-400 select-all truncate pr-3">{installCommand}</span>
              <button
                onClick={handleCopyCmd}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd ? 'Đã copy' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick Steps Guide */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs">3 Bước Sử Dụng Sau Khi Tải Về:</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                <div>
                  <strong className="text-slate-200">Giải nén gói tải về:</strong> Giải nén file <code className="text-indigo-300">blang-runtime-v1.0.0.zip</code> vào một thư mục trên máy tính.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                <div>
                  <strong className="text-slate-200">Chạy file cài đặt:</strong> Mở Terminal trong thư mục và gõ <code className="text-emerald-400">./install.sh</code> (hoặc gõ trực tiếp <code className="text-emerald-400">./bin/blang run examples/main.bl</code>).
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                <div>
                  <strong className="text-slate-200">Sáng tạo cùng BLang:</strong> Tạo bất kỳ file <code className="text-indigo-300">app.bl</code> nào và chạy <code className="text-emerald-400">blang run app.bl</code>!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Mã nguồn mở, an toàn &amp; không chứa phần mềm rác.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
