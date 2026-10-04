import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  FolderOpen,
  Check,
  X,
  FileCode,
} from 'lucide-react';

export interface BLangFile {
  name: string;
  content: string;
  isReadonly?: boolean;
}

interface FileExplorerProps {
  files: BLangFile[];
  activeFileName: string;
  onSelectFile: (fileName: string) => void;
  onCreateFile: (fileName: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onDeleteFile: (fileName: string) => void;
  onUploadFile: (fileName: string, content: string) => void;
  onDownloadFile: (fileName: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileName,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onUploadFile,
  onDownloadFile,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewFileName('');
  };

  const handleConfirmCreate = () => {
    let name = newFileName.trim();
    if (!name) {
      setIsCreating(false);
      return;
    }
    if (!name.endsWith('.bl')) {
      name += '.bl';
    }
    onCreateFile(name);
    setIsCreating(false);
    setNewFileName('');
  };

  const handleStartRename = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingName(name);
    setTempName(name);
  };

  const handleConfirmRename = () => {
    if (!editingName) return;
    let name = tempName.trim();
    if (!name) {
      setEditingName(null);
      return;
    }
    if (!name.endsWith('.bl')) {
      name += '.bl';
    }
    onRenameFile(editingName, name);
    setEditingName(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      let name = file.name;
      if (!name.endsWith('.bl')) {
        name += '.bl';
      }
      onUploadFile(name, content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e19] border-r border-slate-800 text-slate-200 select-none w-56 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>BLang Files</span>
          <span className="text-[10px] text-slate-500 font-mono">({files.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Upload Button */}
          <label
            title="Upload .bl file from computer"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              accept=".bl,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* New File Button */}
          <button
            onClick={handleStartCreate}
            title="New .bl File"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline File Creation Input */}
      {isCreating && (
        <div className="p-2 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              placeholder="filename.bl"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              className="w-full px-2 py-1 bg-slate-800 border border-indigo-500 rounded text-xs text-white font-mono focus:outline-none"
            />
            <button
              onClick={handleConfirmCreate}
              className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 text-slate-400 hover:bg-slate-800 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-auto p-1.5 space-y-0.5">
        {files.map((file) => {
          const isActive = file.name === activeFileName;
          const isRenaming = editingName === file.name;
          const lineCount = file.content.split('\n').length;

          if (isRenaming) {
            return (
              <div key={file.name} className="flex items-center gap-1 p-1 bg-slate-800/80 rounded">
                <input
                  type="text"
                  autoFocus
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmRename();
                    if (e.key === 'Escape') setEditingName(null);
                  }}
                  className="flex-1 px-1.5 py-0.5 bg-slate-900 border border-indigo-400 rounded text-xs text-white font-mono"
                />
                <button onClick={handleConfirmRename} className="p-0.5 text-emerald-400">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setEditingName(null)} className="p-0.5 text-slate-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={file.name}
              onClick={() => onSelectFile(file.name)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="truncate">{file.name}</span>
              </div>

              {/* Action buttons on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadFile(file.name);
                  }}
                  title="Download .bl file"
                  className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-700/50"
                >
                  <Download className="w-3 h-3" />
                </button>
                {!file.isReadonly && (
                  <>
                    <button
                      onClick={(e) => handleStartRename(file.name, e)}
                      title="Rename"
                      className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-700/50"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(file.name);
                        }}
                        title="Delete file"
                        className="p-1 hover:text-rose-400 text-slate-400 rounded hover:bg-slate-700/50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explorer Bottom info */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-900/40 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>Extension:</span>
          <span className="font-mono text-indigo-400 font-semibold">{'{file.bl}'}</span>
        </div>
      </div>
    </div>
  );
};
