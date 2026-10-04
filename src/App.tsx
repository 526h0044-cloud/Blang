import React, { useState, useMemo } from 'react';
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
import { compileBLang, PipelineResult } from './compiler';
import { PRESETS } from './compiler/presets';
import { PYTHON_COMPILER_SOURCE } from './compiler/pythonSourceString';
import {
  ListFilter,
  Network,
  ShieldCheck,
  FileCode2,
  Terminal as TerminalIcon,
  Sidebar,
  FolderOpen,
} from 'lucide-react';

const INITIAL_FILES: BLangFile[] = [
  {
    name: 'main.bl',
    content: `// ==============================================================================
// BLang Main Application File (main.bl)
// Programming Language File format: {file.bl}
// ==============================================================================

import "math_lib.bl";

// 1. Khai báo biến trực tiếp (không dùng let)
@app_name = "BLang Native Application";
$version_id = 1.0;
_launch_ticks = 0;

// 2. Custom Functions and Return Values
function initialize_system($agent_name, @rank) {
    _greeting = "Welcome, Commander ";
    print(">>> Initializing system for:", $agent_name, "| Clearance Level:", @rank);
    @boost = power(2, 4); // Uses power() from math_lib.bl
    print(">>> Calculated Core Boost (2^4 = 16):", @boost);
    return @boost + 100;
}

// 3. Execution Pipeline
$agent = "Kaelen Voss";
@clearance = 5;
$final_power = initialize_system($agent, @clearance);

print(">>> System status fully calibrated! Output power level:", $final_power);

// 4. Data Collection Loops
@sensors = ["Thermal Sensor", "Graviton Detector", "Quantum Radar"];
for (sensor in @sensors) {
    print(">>> Online sensor unit:", sensor);
}

print(">>> Application main.bl executed with 100% integrity.");
`,
  },
  {
    name: 'geometry_math.bl',
    content: `// ==============================================================================
// BLang Scientific Math & Geometry Engine (geometry_math.bl)
// Logarit, Căn bậc, Lượng giác & Chu vi, Diện tích, Thể tích hình học
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

print("=== 3. GÓC & LƯỢNG GIÁC (SIN, COS, TAN, COTAN) ===");
print("sin(90 độ)         =", sind(90));
print("cos(60 độ)         =", cosd(60));
print("tan(45 độ)         =", tand(45));
print("cotan(45 độ)       =", cotand(45));

print("=== 4. HÌNH TRÒN, HÌNH CẦU, HÌNH TRỤ, HÌNH NÓN ===");
@r = 5;
print("Chu vi hình tròn (r=5)       =", circle_perimeter(@r));
print("Diện tích hình tròn (r=5)    =", circle_area(@r));
print("Thể tích hình cầu (r=3)      =", sphere_volume(3));
print("Thể tích hình trụ (r=3, h=10)=", cylinder_volume(3, 10));
print("Thể tích hình nón (r=3, h=10)=", cone_volume(3, 10));

print("=== 5. HÌNH VUÔNG, CHỮ NHẬT & THỂ TÍCH KHỐI ===");
print("Chu vi hình vuông (a=6)      =", square_perimeter(6));
print("Diện tích hình vuông (a=6)   =", square_area(6));
print("Thể tích lập phương (a=4)    =", cube_volume(4));
print("Chu vi chữ nhật (8x5)        =", rect_perimeter(8, 5));
print("Diện tích chữ nhật (8x5)     =", rect_area(8, 5));
print("Thể tích hộp chữ nhật (4x5x6)=", cuboid_volume(4, 5, 6));

print("=== 6. HÌNH THANG & ĐA GIÁC ĐỀU ===");
print("Diện tích hình thang (a=6, b=10, h=4) =", trapezoid_area(6, 10, 4));
print("Chu vi hình thang (6, 10, 5, 5)       =", trapezoid_perimeter(6, 10, 5, 5));
print("Chu vi lục giác đều (n=6, s=4)        =", polygon_perimeter(6, 4));
print("Diện tích lục giác đều (n=6, s=4)     =", polygon_area(6, 4));
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
  const [activeNav, setActiveNav] = useState<'workbench' | 'repl' | 'guide' | 'python-source'>('workbench');
  const [files, setFiles] = useState<BLangFile[]>(INITIAL_FILES);
  const [activeFileName, setActiveFileName] = useState<string>('main.bl');
  const [openTabs, setOpenTabs] = useState<string[]>(['main.bl', 'geometry_math.bl', 'math_lib.bl', 'game_engine.bl']);
  const [showExplorer, setShowExplorer] = useState(true);
  const [activeStageTab, setActiveStageTab] = useState<'console' | 'tokens' | 'ast' | 'symbols' | 'codegen'>('console');
  const [presetId, setPresetId] = useState<string>('comprehensive');

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
  const handleCreateFile = (name: string) => {
    if (files.some((f) => f.name === name)) {
      setActiveFileName(name);
      return;
    }
    const newFile: BLangFile = {
      name,
      content: `// ==============================================================================\n// BLang File: ${name}\n// ==============================================================================\n\nlet @version = 1.0;\nprint("Hello from ${name}!");\n`,
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

  // Export Bundle: All .bl files + compiler.py + output.py + output.js + blang runner
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
        hasError={!result.success}
        foldedCount={result.foldedConstants}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeNav === 'workbench' && (
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer Toggle Bar / Sidebar */}
            {showExplorer && (
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
            )}

            {/* Middle: Code Editor Pane */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-hidden flex flex-col">
                <div className="bg-[#0a0e19] px-2 py-1 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <button
                    onClick={() => setShowExplorer(!showExplorer)}
                    title={showExplorer ? 'Hide File Explorer' : 'Show File Explorer'}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-800 hover:text-slate-300 text-slate-400 transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{showExplorer ? 'Hide Explorer' : 'Show Explorer'}</span>
                  </button>

                  <span className="font-mono text-indigo-400 font-semibold">{activeFileName}</span>
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
              <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col overflow-hidden bg-[#0d1322]">
                {/* Pipeline Stage Tabs */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 text-xs overflow-x-auto">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveStageTab('console')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                        activeStageTab === 'console'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Interpreter Console</span>
                      {result.error && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveStageTab('codegen')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                        activeStageTab === 'codegen'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Dual Codegen (Py & JS)</span>
                    </button>

                    <button
                      onClick={() => setActiveStageTab('ast')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                        activeStageTab === 'ast'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Network className="w-3.5 h-3.5 text-amber-400" />
                      <span>AST & Optimizer</span>
                      {result.foldedConstants > 0 && (
                        <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                          {result.foldedConstants}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveStageTab('symbols')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
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

                {/* Stage Viewport */}
                <div className="flex-1 overflow-hidden">
                  {activeStageTab === 'console' && (
                    <ConsoleView
                      logs={result.executionOutput}
                      error={result.error}
                      foldedCount={result.foldedConstants}
                      sourceCode={activeFile.content}
                      onRun={handleRun}
                    />
                  )}

                  {activeStageTab === 'codegen' && (
                    <CodegenView
                      pythonCode={result.pythonCode}
                      javascriptCode={result.javascriptCode}
                    />
                  )}

                  {activeStageTab === 'ast' && (
                    <ASTView
                      rawAST={result.rawAST}
                      optimizedAST={result.optimizedAST}
                      foldedCount={result.foldedConstants}
                    />
                  )}

                  {activeStageTab === 'symbols' && (
                    <SymbolTableView scopes={result.scopes} />
                  )}

                  {activeStageTab === 'tokens' && (
                    <TokensView tokens={result.tokens} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'repl' && (
          <div className="flex-1 h-full overflow-hidden">
            <ReplShell />
          </div>
        )}

        {activeNav === 'guide' && (
          <div className="flex-1 h-full overflow-hidden">
            <GuideModal />
          </div>
        )}

        {activeNav === 'python-source' && (
          <div className="flex-1 h-full overflow-hidden">
            <PythonSourceView pythonSource={PYTHON_COMPILER_SOURCE} />
          </div>
        )}
      </main>
    </div>
  );
}
