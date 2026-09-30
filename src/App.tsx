import { useState } from 'react';
import { botFiles, BotFile } from './data/botCode';
import { CodeViewer } from './components/CodeViewer';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Landing } from './components/Landing';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<BotFile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<'landing' | 'code'>('landing');

  const handleFileSelect = (file: BotFile) => {
    setSelectedFile(file);
    setView('code');
  };

  const handleShowCode = () => {
    setView('code');
    if (!selectedFile) {
      setSelectedFile(botFiles[botFiles.length - 1]); // bot.py
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex flex-col">
      <Header
        onShowCode={handleShowCode}
        onShowLanding={() => setView('landing')}
        currentView={view}
      />

      {view === 'landing' ? (
        <Landing onShowCode={handleShowCode} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            files={botFiles}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex-1 overflow-auto">
            {selectedFile ? (
              <CodeViewer file={selectedFile} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Выберите файл из панели слева</p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
