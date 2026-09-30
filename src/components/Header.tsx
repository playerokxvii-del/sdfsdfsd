import { Gamepad2, Code2, Home } from 'lucide-react';

interface HeaderProps {
  onShowCode: () => void;
  onShowLanding: () => void;
  currentView: 'landing' | 'code';
}

export function Header({ onShowCode, onShowLanding, currentView }: HeaderProps) {
  return (
    <header className="bg-[#161b22] border-b border-gray-700/50 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            PLAYEROK Market Bot
          </h1>
          <p className="text-xs text-gray-500">Telegram Bot • aiogram 3.x • Python</p>
        </div>
      </div>

      <nav className="flex items-center gap-2">
        <button
          onClick={onShowLanding}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentView === 'landing'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Home className="w-4 h-4" />
          Обзор
        </button>
        <button
          onClick={onShowCode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentView === 'code'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Исходный код
        </button>
      </nav>
    </header>
  );
}
