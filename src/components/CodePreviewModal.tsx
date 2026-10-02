import React, { useState } from 'react';
import { X, Play, Code2, RotateCcw, Copy, Check } from 'lucide-react';

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  theme: 'dark' | 'light';
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reloadPreview = () => {
    setKey((prev) => prev + 1);
  };

  // Generate complete HTML document for sandboxed iframe
  const generatePreviewHtml = () => {
    if (language.toLowerCase() === 'html' || code.includes('<html') || code.includes('<div') || code.includes('<body')) {
      // If code doesn't have DOCTYPE or full page structure, wrap it nicely with Tailwind CDN
      if (!code.includes('<html')) {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 1.5rem; background: ${theme === 'dark' ? '#0f172a' : '#ffffff'}; color: ${theme === 'dark' ? '#f8fafc' : '#0f172a'}; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
      }
      return code;
    }

    // If JavaScript
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: monospace; padding: 1rem; background: #0f172a; color: #38bdf8; }
    #console { white-space: pre-wrap; font-size: 14px; }
  </style>
</head>
<body>
  <div id="output" style="margin-bottom: 12px; font-weight: bold; color: #94a3b8;">Output Console:</div>
  <div id="console"></div>
  <script>
    const con = document.getElementById('console');
    const origLog = console.log;
    console.log = function(...args) {
      con.innerText += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\\n';
      origLog.apply(console, args);
    };
    try {
      ${code}
    } catch(err) {
      con.innerText += 'Error: ' + err.message;
      con.style.color = '#ef4444';
    }
  </script>
</body>
</html>`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl h-[80vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden transition-colors ${
          theme === 'dark'
            ? 'bg-[#121624] border-slate-700/60 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-inherit">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Interactive Code Runner</span>
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono uppercase ${
                theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {language}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tab switch */}
            <div
              className={`flex items-center p-0.5 rounded-lg border text-xs font-medium ${
                theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                  activeTab === 'code'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Source</span>
              </button>
            </div>

            {activeTab === 'preview' && (
              <button
                onClick={reloadPreview}
                title="Reload Preview"
                className={`p-1.5 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleCopy}
              title="Copy code"
              className={`p-1.5 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'border-slate-700 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'
                  : 'border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'preview' ? (
            <iframe
              key={key}
              srcDoc={generatePreviewHtml()}
              title="Code Preview"
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-none bg-white"
            />
          ) : (
            <div className="w-full h-full overflow-auto p-4 font-mono text-xs leading-relaxed bg-[#0b0e17] text-slate-200">
              <pre className="whitespace-pre">{code}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
