import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Sparkles,
  Search,
  Brain,
  Sliders,
  Sun,
  Moon,
  Share2,
  FileDown,
  Copy,
  Check,
  HardDrive,
} from 'lucide-react';
import { ModelInfo, ThemeMode } from '../types/chat';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  models: ModelInfo[];
  enableThinking: boolean;
  onToggleThinking: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenDrive: () => void;
  isDriveConnected?: boolean;
  onExportCurrentChat: (format: 'markdown' | 'json') => void;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  selectedModel,
  onSelectModel,
  models,
  enableThinking,
  onToggleThinking,
  enableSearch,
  onToggleSearch,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenDrive,
  isDriveConnected,
  onExportCurrentChat,
  hasMessages,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`h-14 border-b flex items-center justify-between px-3.5 sm:px-5 shrink-0 select-none z-20 backdrop-blur-md transition-colors ${
        theme === 'dark'
          ? 'bg-[#0f111a]/90 border-slate-800/80 text-slate-100'
          : 'bg-white/90 border-slate-200 text-slate-800'
      }`}
    >
      {/* Left: Sidebar toggle + Model Selector */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className={`p-2 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
              theme === 'dark'
                ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-200 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold">{currentModel ? currentModel.name : 'Gemini 3.8 Flash'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                modelDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {modelDropdownOpen && (
            <div
              className={`absolute top-full left-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                theme === 'dark' ? 'bg-[#131726] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Choose Intelligence Model
              </div>

              <div className="space-y-1">
                {models.map((m) => {
                  const isSelected = m.id === selectedModel;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel(m.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col space-y-1 ${
                        isSelected
                          ? 'bg-indigo-600/15 border border-indigo-500/40 text-indigo-200'
                          : theme === 'dark'
                          ? 'hover:bg-slate-800/80 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-xs text-white">{m.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{m.tagline}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Toggles + Actions */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Web Search toggle button */}
        <button
          onClick={onToggleSearch}
          title={enableSearch ? 'Google Web Search: ON' : 'Google Web Search: OFF'}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            enableSearch
              ? 'bg-blue-500/15 border-blue-500/50 text-blue-400 shadow-sm ring-1 ring-blue-500/30'
              : theme === 'dark'
              ? 'border-transparent text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
              : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <Search className={`w-3.5 h-3.5 ${enableSearch ? 'text-blue-400' : ''}`} />
          <span className="hidden sm:inline">Search</span>
        </button>

        {/* Deep Think toggle button */}
        <button
          onClick={onToggleThinking}
          title={enableThinking ? 'Deep Think Reasoning: ON' : 'Deep Think Reasoning: OFF'}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            enableThinking
              ? 'bg-purple-500/15 border-purple-500/50 text-purple-300 shadow-sm ring-1 ring-purple-500/30'
              : theme === 'dark'
              ? 'border-transparent text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
              : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <Brain className={`w-3.5 h-3.5 ${enableThinking ? 'text-purple-400' : ''}`} />
          <span className="hidden sm:inline">Deep Think</span>
        </button>

        {/* Google Drive integration button */}
        <button
          onClick={onOpenDrive}
          title="Google Drive: Browse files, attach docs & save chats"
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isDriveConnected
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
              : theme === 'dark'
              ? 'border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
              : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Google Drive</span>
          {isDriveConnected && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        {/* Share / Export chat dropdown */}
        {hasMessages && (
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              title="Share or Export Chat"
              className={`p-2 rounded-xl transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {exportDropdownOpen && (
              <div
                className={`absolute top-full right-0 mt-2 w-48 rounded-xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  theme === 'dark'
                    ? 'bg-[#131726] border-slate-700 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <button
                  onClick={() => {
                    onOpenDrive();
                    setExportDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>Save to Google Drive</span>
                </button>
                <button
                  onClick={() => {
                    onExportCurrentChat('markdown');
                    setExportDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download Markdown</span>
                </button>
                <button
                  onClick={() => {
                    onExportCurrentChat('json');
                    setExportDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <FileDown className="w-3.5 h-3.5 text-purple-400" />
                  <span>Download JSON</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Theme mode toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-2 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="Open Settings"
          className={`p-2 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
