import { useState } from 'react';
import { BotFile } from '../data/botCode';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, FileCode } from 'lucide-react';

interface CodeViewerProps {
  file: BotFile;
}

export function CodeViewer({ file }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = file.code.split('\n').length;

  return (
    <div className="h-full flex flex-col">
      {/* File header */}
      <div className="bg-[#161b22] border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCode className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="font-mono text-sm font-semibold text-gray-200">{file.path}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{file.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{lineCount} строк</span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copied
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700 hover:border-purple-500/50'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Скопировано!' : 'Копировать'}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={file.language === 'python' ? 'python' : file.language === 'markdown' ? 'markdown' : 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: '#0d1117',
            fontSize: '0.8rem',
            lineHeight: '1.6',
            minHeight: '100%',
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: '#484f58',
            borderRight: '1px solid #21262d',
          }}
          wrapLines={true}
        >
          {file.code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
