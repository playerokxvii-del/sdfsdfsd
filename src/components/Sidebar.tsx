import { BotFile } from '../data/botCode';
import { FileCode, Folder, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  files: BotFile[];
  selectedFile: BotFile | null;
  onFileSelect: (file: BotFile) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ files, selectedFile, onFileSelect, isOpen, onToggle }: SidebarProps) {
  const folders: Record<string, BotFile[]> = {};
  const rootFiles: BotFile[] = [];

  files.forEach(file => {
    if (file.path.includes('/')) {
      const folder = file.path.split('/')[0];
      if (!folders[folder]) folders[folder] = [];
      folders[folder].push(file);
    } else {
      rootFiles.push(file);
    }
  });

  const getFileIcon = (name: string) => {
    if (name.endsWith('.py')) return '🐍';
    if (name.endsWith('.txt')) return '📄';
    if (name.endsWith('.md')) return '📝';
    return '📁';
  };

  return (
    <aside
      className={`bg-[#161b22] border-r border-gray-700/50 flex flex-col transition-all duration-300 relative ${
        isOpen ? 'w-72' : 'w-12'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-4 w-6 h-6 bg-[#161b22] border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500 transition-all z-10"
      >
        {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {isOpen && (
        <div className="p-4 overflow-y-auto flex-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            📁 Файлы проекта
          </h3>

          {/* Root files */}
          <div className="space-y-1 mb-4">
            {rootFiles.map(file => (
              <button
                key={file.path}
                onClick={() => onFileSelect(file)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  selectedFile?.path === file.path
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <span className="text-base">{getFileIcon(file.name)}</span>
                <span className="font-mono text-xs truncate">{file.name}</span>
              </button>
            ))}
          </div>

          {/* Folders */}
          {Object.entries(folders).map(([folderName, folderFiles]) => (
            <div key={folderName} className="mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Folder className="w-3.5 h-3.5" />
                {folderName}/
              </div>
              <div className="space-y-1 ml-2">
                {folderFiles.map(file => (
                  <button
                    key={file.path}
                    onClick={() => onFileSelect(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                      selectedFile?.path === file.path
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="text-base">{getFileIcon(file.name)}</span>
                    <span className="font-mono text-xs truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
