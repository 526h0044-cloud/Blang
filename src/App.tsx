import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { EditorPane } from './components/EditorPane';
import { FileExplorer, BLangFile } from './components/FileExplorer';
import { TokensView } from './components/TokensView';
import { ASTView } from './components/ASTView';
import { SymbolTableView } from './components/SymbolTableView';
import { CodegenView } from './components/CodegenView';
import { ConsoleView } from './components/ConsoleView';
import { ReplShell } from './components/ReplShell';
import { GuideModal } from './components/GuideModal';
import { PythonSourceView } from './components/PythonSourceView';
import { PerformanceMetricsView } from './components/PerformanceMetricsView';
import { RuntimeStateView } from './components/RuntimeStateView';
import { DownloadSdkModal } from './components/DownloadSdkModal';
import { compileBLang, PipelineResult } from './compiler';
import { PRESETS } from './compiler/presets';
import { PYTHON_COMPILER_SOURCE } from './compiler/pythonSourceString';
import {
  ListFilter,
  Network,
  ShieldCheck,
  Terminal as TerminalIcon,
  FolderOpen,
  Cpu,
  Activity,
  Variable,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_FILES: BLangFile[] = [
  {
    name: 'main.bl',
    content: `// ==============================================================================
// BLang Main Application File (main.bl)
// Cú pháp khai báo biến chuẩn phong cách Python: trực tiếp, không cần let/var
// ==============================================================================

import "math_lib.bl";

# 1. Khai báo biến trực tiếp giống hệt Python (gán giá trị tự động định nghĩa)
app_name = "BLang Native Application";
version_id = 1.0;
launch_ticks = 0;
is_production = True;

# 2. Định nghĩa hàm và giá trị trả về
function initialize_system(agent_name, rank) {
    greeting = "Welcome, Commander ";
    print(">>> Initializing system for:", agent_name, "| Clearance Level:", rank);
    boost = power(2, 4); // Sử dụng hàm power() từ math_lib.bl
    print(">>> Calculated Core Boost (2^4 = 16):", boost);
    return boost + 100;
}

# 3. Thực thi Pipeline
agent = "Kaelen Voss";
clearance = 5;
final_power = initialize_system(agent, clearance);

print(">>> System status fully calibrated! Output power level:", final_power);

# 4. Nối chuỗi linh hoạt (Dynamic Typing & Coercion)
status_log = "Agent " + agent + " authorized with power ";
status_log += final_power;
print(">>> Status Log:", status_log);

# 5. Danh sách mảng và vòng lặp for-in
sensors = ["Thermal Sensor", "Graviton Detector", "Quantum Radar"];
for (sensor in sensors) {
    print(">>> Online sensor unit:", sensor);
}

# 6. Tính năng sinh số ngẫu nhiên: %random(a, b)%
lucky_seed = %random(10, 99)%;
print(">>> Generated Security Token Seed (%random(10, 99)%):", lucky_seed);

print(">>> Application main.bl executed with 100% integrity.");
`,
  },
  {
    name: 'geometry_math.bl',
    content: `// ==============================================================================
// BLang Scientific Math & Geometry Engine (geometry_math.bl)
// Logarit, Căn bậc, Lượng giác độ trực tiếp & Chu vi (c/C), Diện tích (s/S), Thể tích (v/V)
// Hình tròn (circle hoặc cir), Hình vuông (square hoặc sq)
// ==============================================================================

print("=== 1. LOGARITHM & EXPONENTIAL ===");
print("ln(e)              =", ln(E));
print("log10(1000)        =", log(1000));
print("log2(64)           =", log(64, 2));

print("=== 2. ROOTS & POWERS ===");
print("sqrt(144)          =", sqrt(144));
print("cbrt(125)          =", cbrt(125));
print("root(81, 4)        =", root(81, 4));
print("pow(2, 10)         =", pow(2, 10));

print("=== 3. GÓC & LƯỢNG GIÁC (SIN, COS, TAN, COTAN THEO ĐỘ) ===");
print("sin(90 độ)         =", sin(90));
print("cos(60 độ)         =", cos(60));
print("tan(45 độ)         =", tan(45));
print("cotan(45 độ)       =", cotan(45));

print("=== 4. HÌNH TRÒN, HÌNH CẦU, HÌNH TRỤ, HÌNH NÓN ===");
@r = 5;
print("Chu vi hình tròn (cir_c, r=5)       =", cir_c(@r));
print("Diện tích hình tròn (cir_s, r=5)    =", cir_s(@r));
print("Thể tích hình cầu (sphere_v, r=3)   =", sphere_v(3));
print("Thể tích hình trụ (cylinder_v, r=3) =", cylinder_v(3, 10));
print("Thể tích hình nón (cone_v, r=3)     =", cone_v(3, 10));

print("=== 5. HÌNH VUÔNG, CHỮ NHẬT & THỂ TÍCH KHỐI ===");
print("Chu vi hình vuông (sq_c, a=6)      =", sq_c(6));
print("Diện tích hình vuông (sq_s, a=6)   =", sq_s(6));
print("Thể tích lập phương (cube_v, a=4)  =", cube_v(4));
print("Chu vi chữ nhật (rect_c, 8x5)      =", rect_c(8, 5));
print("Diện tích chữ nhật (rect_s, 8x5)   =", rect_s(8, 5));
print("Thể tích hộp chữ nhật (cuboid_v)   =", cuboid_v(4, 5, 6));

print("=== 6. HÌNH THANG & ĐA GIÁC ĐỀU ===");
print("Diện tích hình thang (trapezoid_s)  =", trapezoid_s(6, 10, 4));
print("Chu vi hình thang (trapezoid_c)     =", trapezoid_c(6, 10, 5, 5));
print("Chu vi lục giác đều (polygon_c)     =", polygon_c(6, 4));
print("Diện tích lục giác đều (polygon_s)  =", polygon_s(6, 4));

print("=== 7. HÌNH TAM GIÁC (TRI / TRIANGLE) ===");
print("Chu vi tam giác (tri_c, 3, 4, 5)    =", tri_c(3, 4, 5));
print("Diện tích tam giác (tri_s, b=6, h=4)=", tri_s(6, 4));
`,
  },
  {
    name: 'math_lib.bl',
    content: `// ==============================================================================
// BLang Module: math_lib.bl
// Standard Mathematical & Scientific Utilities Library
// ==============================================================================

function power(@base, $exponent) {
    _result = 1;
    _count = 0;
    while (_count < $exponent) {
        _result = _result * @base;
        _count += 1;
    }
    return _result;
}

function factorial($n) {
    if ($n <= 1) {
        return 1;
    }
    _accum = 1;
    _k = 2;
    while (_k <= $n) {
        _accum = _accum * _k;
        _k += 1;
    }
    return _accum;
}

function clamp($val, $min_val, $max_val) {
    if ($val < $min_val) {
        return $min_val;
    }
    if ($val > $max_val) {
        return $max_val;
    }
    return $val;
}

print(">>> [math_lib.bl] Mathematical utilities loaded successfully!");
`,
  },
  {
    name: 'game_engine.bl',
    content: `// ==============================================================================
// BLang Game Simulation Module (game_engine.bl)
// Programming Language File format: {file.bl}
// ==============================================================================

@hero = {
    "name": "Aura Knight",
    "hp": 250,
    "stamina": 100,
    "level": 12
};

@dungeon_mobs = [
    {"name": "Shadow Wisp", "damage": 20, "exp": 50},
    {"name": "Iron Golem", "damage": 45, "exp": 120},
    {"name": "Rift Dragon", "damage": 80, "exp": 300}
];

function combat_round(@current_hp, $incoming_damage) {
    _mitigation = 10;
    _net_damage = $incoming_damage - _mitigation;
    if (_net_damage < 0) {
        _net_damage = 0;
    }
    _new_hp = @current_hp - _net_damage;
    return _new_hp;
}

print(">>> Commencing simulation for hero:", @hero["name"]);
_cur_hp = @hero["hp"];

for (mob in @dungeon_mobs) {
    $m_name = mob["name"];
    @m_dmg = mob["damage"];
    print("--- Encountering:", $m_name, "| Threat DMG:", @m_dmg);

    _cur_hp = combat_round(_cur_hp, @m_dmg);
    print(">>> Post-encounter Hero HP:", _cur_hp);

    if (_cur_hp <= 0) {
        print(">>> Critical damage! Hero fallen in battle.");
        break;
    }
}

print(">>> Simulation finished. Final HP remaining:", _cur_hp);
`,
  },
  {
    name: 'test_script.bl',
    content: PRESETS[0].code,
  },
  {
    name: 'test_error.bl',
    content: PRESETS[1].code,
  },
];

export default function App() {
  const [activeNav, setActiveNav] = useState<'workbench' | 'repl' | 'guide' | 'python-source' | 'metrics'>('workbench');
  const [files, setFiles] = useState<BLangFile[]>(INITIAL_FILES);
  const [activeFileName, setActiveFileName] = useState<string>('main.bl');
  const [openTabs, setOpenTabs] = useState<string[]>(['main.bl', 'geometry_math.bl', 'math_lib.bl', 'game_engine.bl']);
  const [showExplorer, setShowExplorer] = useState(true);
  const [activeStageTab, setActiveStageTab] = useState<'console' | 'runtime' | 'metrics' | 'codegen' | 'ast' | 'symbols' | 'tokens'>('console');
  const [presetId, setPresetId] = useState<string>('comprehensive');
  const [isDownloadSdkOpen, setIsDownloadSdkOpen] = useState(false);
  const [protectedToast, setProtectedToast] = useState<string | null>(null);

  // Web protection against F12 and Right-Click (DevTools Protection)
  useEffect(() => {
    let timer: any = null;
    const triggerProtection = (msg: string) => {
      setProtectedToast(msg);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setProtectedToast(null);
      }, 3000);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerProtection('Chế độ bảo vệ: Thao tác chuột phải đã bị vô hiệu hóa.');
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtection('Chế độ bảo vệ: Phím F12 (DevTools) đã bị vô hiệu hóa.');
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspect/Console/DevTools)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ['i', 'I', 'j', 'J', 'c', 'C', 'k', 'K'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtection('Chế độ bảo vệ: Phím tắt DevTools/Inspect đã bị vô hiệu hóa.');
        return false;
      }

      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtection('Chế độ bảo vệ: Xem mã nguồn (Ctrl+U) đã bị vô hiệu hóa.');
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Active file content
  const activeFile = useMemo(() => {
    return files.find((f) => f.name === activeFileName) || files[0];
  }, [files, activeFileName]);

  // Virtual Files Map for in-browser multi-file imports
  const virtualFilesMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of files) {
      map[f.name] = f.content;
    }
    return map;
  }, [files]);

  // Compile active file with virtual file system
  const result: PipelineResult = useMemo(() => {
    return compileBLang(activeFile.content, true, virtualFilesMap);
  }, [activeFile.content, virtualFilesMap]);

  // Handle Code changes
  const handleCodeChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === activeFileName ? { ...f, content: newContent } : f))
    );
  };

  // Handle Preset Selection
  const handleSelectPreset = (id: string) => {
    setPresetId(id);
    const found = PRESETS.find((p) => p.id === id);
    if (found) {
      handleCodeChange(found.code);
      if (found.isErrorDemo) {
        setActiveStageTab('console');
      }
    }
  };

  // Switch Active File
  const handleSelectFile = (name: string) => {
    setActiveFileName(name);
    if (!openTabs.includes(name)) {
      setOpenTabs((prev) => [...prev, name]);
    }
  };

  // Close Tab
  const handleCloseTab = (name: string) => {
    const remaining = openTabs.filter((t) => t !== name);
    setOpenTabs(remaining);
    if (activeFileName === name && remaining.length > 0) {
      setActiveFileName(remaining[remaining.length - 1]);
    }
  };

  // Create New File
  const handleCreateFile = (name: string, content?: string) => {
    const existing = files.find((f) => f.name === name);
    if (existing) {
      if (content !== undefined) {
        handleCodeChange(content);
      }
      setActiveFileName(name);
      return;
    }
    const newFile: BLangFile = {
      name,
      content:
        content !== undefined
          ? content
          : `// ==============================================================================\n// BLang File: ${name}\n// ==============================================================================\n\n@version = 1.0;\nprint("Hello from ${name}!");\n`,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileName(name);
    if (!openTabs.includes(name)) {
      setOpenTabs((prev) => [...prev, name]);
    }
  };

  // Rename File
  const handleRenameFile = (oldName: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === oldName ? { ...f, name: newName } : f))
    );
    setOpenTabs((prev) => prev.map((t) => (t === oldName ? newName : t)));
    if (activeFileName === oldName) {
      setActiveFileName(newName);
    }
  };

  // Delete File
  const handleDeleteFile = (name: string) => {
    if (files.length <= 1) return;
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setOpenTabs((prev) => prev.filter((t) => t !== name));
    if (activeFileName === name) {
      const nextFile = files.find((f) => f.name !== name);
      if (nextFile) setActiveFileName(nextFile.name);
    }
  };

  // Upload File
  const handleUploadFile = (name: string, content: string) => {
    setFiles((prev) => {
      const existing = prev.find((f) => f.name === name);
      if (existing) {
        return prev.map((f) => (f.name === name ? { ...f, content } : f));
      }
      return [...prev, { name, content }];
    });
    setActiveFileName(name);
    if (!openTabs.includes(name)) {
      setOpenTabs((prev) => [...prev, name]);
    }
  };

  // Download Individual File
  const handleDownloadFile = (name: string) => {
    const file = files.find((f) => f.name === name);
    if (!file) return;
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Re-run execution
  const handleRun = () => {
    setActiveNav('workbench');
    setActiveStageTab('console');
  };

  // Export Bundle: All .bl files + compiler.py + output.py + output.js + setup_blang.py
  const handleDownloadAll = () => {
    const downloadBlob = (filename: string, content: string) => {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // Download each .bl file
    files.forEach((f, idx) => {
      setTimeout(() => downloadBlob(f.name, f.content), idx * 100);
    });

    const baseDelay = files.length * 100;
    setTimeout(() => downloadBlob('compiler.py', PYTHON_COMPILER_SOURCE), baseDelay + 100);
    if (result.pythonCode) {
      setTimeout(() => downloadBlob('output.py', result.pythonCode), baseDelay + 200);
    }
    if (result.javascriptCode) {
      setTimeout(() => downloadBlob('output.js', result.javascriptCode), baseDelay + 300);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <Header
        activeTab={activeNav}
        setActiveTab={setActiveNav}
        onRun={handleRun}
        onDownloadOutputs={handleDownloadAll}
        onDownloadSdk={() => setIsDownloadSdkOpen(true)}
        hasError={!result.success}
        foldedCount={result.foldedConstants}
      />

      {/* Main Content Area with Animated Transitions */}
      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeNav === 'workbench' && (
            <motion.div
              key="workbench"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex overflow-hidden w-full h-full"
            >
              {/* File Explorer Toggle Bar / Sidebar */}
              <AnimatePresence>
                {showExplorer && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="overflow-hidden shrink-0"
                  >
                    <FileExplorer
                      files={files}
                      activeFileName={activeFileName}
                      onSelectFile={handleSelectFile}
                      onCreateFile={handleCreateFile}
                      onRenameFile={handleRenameFile}
                      onDeleteFile={handleDeleteFile}
                      onUploadFile={handleUploadFile}
                      onDownloadFile={handleDownloadFile}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Middle: Code Editor Pane */}
              <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                <div className="w-full md:w-1/2 min-h-[360px] md:min-h-0 h-[50vh] md:h-full overflow-hidden flex flex-col shrink-0 md:shrink border-b md:border-b-0 md:border-r border-slate-800">
                  <div className="bg-[#0a0e19] px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                    <button
                      onClick={() => setShowExplorer(!showExplorer)}
                      title={showExplorer ? 'Hide File Explorer' : 'Show File Explorer'}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-800 hover:text-slate-300 text-slate-400 transition-colors cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{showExplorer ? 'Ẩn Explorer' : 'Hiện Explorer'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-mono text-indigo-400 font-semibold">{activeFileName}</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <EditorPane
                      code={activeFile.content}
                      onChange={handleCodeChange}
                      onSelectPreset={handleSelectPreset}
                      currentPresetId={presetId}
                      errorLine={result.error?.line}
                      activeFileName={activeFileName}
                      openFiles={openTabs}
                      onSelectTab={handleSelectFile}
                      onCloseTab={handleCloseTab}
                      onDownloadActive={() => handleDownloadFile(activeFileName)}
                    />
                  </div>
                </div>

                {/* Right: Multi-Stage Pipeline Inspectors */}
                <div className="w-full md:w-1/2 min-h-[360px] md:min-h-0 h-[50vh] md:h-full flex flex-col overflow-hidden bg-[#0d1322] shrink-0 md:shrink">
                  {/* Pipeline Stage Tabs */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 text-xs overflow-x-auto">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveStageTab('console')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                          activeStageTab === 'console'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Console</span>
                        {result.error && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                        )}
                      </button>

                      {/* Runtime State tab in the right-hand panel */}
                      <button
                        onClick={() => setActiveStageTab('runtime')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                          activeStageTab === 'runtime'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Variable className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Runtime State</span>
                        {result.runtimeState && result.runtimeState.allVariables.length > 0 && (
                          <span className="text-[10px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {result.runtimeState.allVariables.length}
                          </span>
                        )}
                      </button>

                      {/* Performance Metrics tab in the right-hand panel */}
                      <button
                        onClick={() => setActiveStageTab('metrics')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                          activeStageTab === 'metrics'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Performance Metrics</span>
                        {result.metrics && (
                          <span className="text-[10px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {result.metrics.totalTranspileTimeMs}ms
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveStageTab('codegen')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                          activeStageTab === 'codegen'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        <span>BVM Bytecode &amp; Exporters</span>
                      </button>

                      <button
                        onClick={() => setActiveStageTab('ast')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                          activeStageTab === 'ast'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Network className="w-3.5 h-3.5 text-amber-400" />
                        <span>AST &amp; Optimizer</span>
                        {result.foldedConstants > 0 && (
                          <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                            {result.foldedConstants}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveStageTab('symbols')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                          activeStageTab === 'symbols'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Symbol Table</span>
                      </button>

                      <button
                        onClick={() => setActiveStageTab('tokens')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                          activeStageTab === 'tokens'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5 text-purple-400" />
                        <span>Tokens ({result.tokens.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Stage Viewport with Animated Transitions */}
                  <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      {activeStageTab === 'console' && (
                        <motion.div
                          key="stage-console"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="h-full w-full"
                        >
                          <ConsoleView
                            logs={result.executionOutput}
                            error={result.error}
                            foldedCount={result.foldedConstants}
                            sourceCode={activeFile.content}
                            onRun={handleRun}
                          />
                        </motion.div>
                      )}

                      {activeStageTab === 'runtime' && (
                        <motion.div
                          key="stage-runtime"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="h-full w-full"
                        >
                          <RuntimeStateView
                            runtimeState={result.runtimeState}
                            sourceCode={activeFile.content}
                          />
                        </motion.div>
                      )}

                      {activeStageTab === 'metrics' && (
                        <motion.div
                          key="stage-metrics"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="h-full w-full"
                        >
                          <PerformanceMetricsView
                            metrics={result.metrics}
                            sourceCode={activeFile.content}
                            isCompact={true}
                          />
                        </motion.div>
                      )}

                      {activeStageTab === 'codegen' && (
                        <motion.div
                          key="stage-codegen"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="h-full w-full"
                        >
                          <CodegenView
                            pythonCode={result.pythonCode}
                            javascriptCode={result.javascriptCode}
                            bytecodeDisassembly={result.bytecodeDisassembly}
                            bytecodeData={result.bytecodeData}
                          />
                        </motion.div>
                      )}

                      {activeStageTab === 'ast' && (
                        <motion.div
                          key="stage-ast"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="h-full w-full"
                        >
                          <ASTView
                            rawAST={result.rawAST}
                            optimizedAST={result.optimizedAST}
                            foldedCount={result.foldedConstants}
                          />
                        </motion.div>
                      )}

                      {activeStageTab === 'symbols' && (
                        <motion.div
                          key="stage-symbols"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="h-full w-full"
                        >
                          <SymbolTableView scopes={result.scopes} />
                        </motion.div>
                      )}

                      {activeStageTab === 'tokens' && (
                        <motion.div
                          key="stage-tokens"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="h-full w-full"
                        >
                          <TokensView tokens={result.tokens} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeNav === 'repl' && (
            <motion.div
              key="repl"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full overflow-hidden w-full"
            >
              <ReplShell />
            </motion.div>
          )}

          {activeNav === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full w-full overflow-hidden flex flex-col"
            >
              <GuideModal
                onLoadSnippet={(snip) => {
                  handleCreateFile('snippet.bl', snip);
                  setActiveNav('workbench');
                }}
              />
            </motion.div>
          )}

          {/* Full Page Performance & Comparison view replacing old Ecosystem page */}
          {activeNav === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full w-full overflow-hidden flex flex-col"
            >
              <PerformanceMetricsView
                metrics={result.metrics}
                sourceCode={activeFile.content}
                isCompact={false}
              />
            </motion.div>
          )}

          {activeNav === 'python-source' && (
            <motion.div
              key="python-source"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full w-full overflow-hidden flex flex-col"
            >
              <PythonSourceView pythonSource={PYTHON_COMPILER_SOURCE} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Standalone BLang SDK & Toolchain Download Modal */}
      <DownloadSdkModal
        isOpen={isDownloadSdkOpen}
        onClose={() => setIsDownloadSdkOpen(false)}
      />

      {/* DevTools & Right-Click Security Toast Notification */}
      <AnimatePresence>
        {protectedToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-rose-500/40 text-slate-100 shadow-2xl shadow-rose-950/40 backdrop-blur-md pointer-events-none"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-rose-300 block">{protectedToast}</span>
              <span className="text-[10px] text-slate-400">Hệ thống bảo vệ bản quyền BLang Studio</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
