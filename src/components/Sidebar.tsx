import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Edit2,
  MoreVertical,
  Check,
  X,
  Sparkles,
  Sliders,
  ChevronLeft,
  HardDrive,
} from 'lucide-react';
import { ChatSession, ThemeMode } from '../types/chat';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onOpenSettings: () => void;
  onOpenDrive?: () => void;
  theme: ThemeMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onOpenSettings,
  onOpenDrive,
  theme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Filter sessions by query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const pinned: ChatSession[] = [];
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const last7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    for (const s of filteredSessions) {
      if (s.isPinned) {
        pinned.push(s);
        continue;
      }
      const age = now - s.updatedAt;
      if (age < oneDay) {
        today.push(s);
      } else if (age < oneDay * 2) {
        yesterday.push(s);
      } else if (age < oneDay * 7) {
        last7Days.push(s);
      } else {
        older.push(s);
      }
    }

    return { pinned, today, yesterday, last7Days, older };
  }, [filteredSessions]);

  const handleStartRename = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = session.id === editingId;
    const isMenuOpen = session.id === menuOpenId;

    if (isEditing) {
      return (
        <form
          key={session.id}
          onSubmit={(e) => handleSaveRename(session.id, e)}
          className="flex items-center px-2 py-1.5 rounded-xl border border-indigo-500 bg-indigo-500/10 my-0.5"
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-xs text-white outline-none"
          />
          <button type="submit" className="p-1 hover:text-emerald-400">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="p-1 hover:text-rose-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={session.id}
        onClick={() => {
          onSelectSession(session.id);
          // On mobile screens, auto-close sidebar on session selection
          if (window.innerWidth < 768) {
            onClose();
          }
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all my-0.5 ${
          isActive
            ? theme === 'dark'
              ? 'bg-slate-800/90 text-white border border-slate-700/80 shadow-sm'
              : 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-sm font-semibold'
            : theme === 'dark'
            ? 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <MessageSquare
            className={`w-3.5 h-3.5 shrink-0 ${
              isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
            }`}
          />
          <span className="truncate">{session.title}</span>
        </div>

        {/* Action icons / Menu trigger */}
        <div className="flex items-center space-x-1 shrink-0 ml-1">
          {session.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(isMenuOpen ? null : session.id);
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700/50 transition-opacity"
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute right-0 top-full mt-1 w-32 rounded-xl border shadow-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100 ${
                  theme === 'dark'
                    ? 'bg-[#181d2e] border-slate-700 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePinSession(session.id);
                    setMenuOpenId(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center space-x-2 hover:bg-slate-700/40 transition-colors"
                >
                  <Pin className="w-3 h-3 text-amber-400" />
                  <span>{session.isPinned ? 'Unpin' : 'Pin'}</span>
                </button>
                <button
                  onClick={(e) => handleStartRename(session, e)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center space-x-2 hover:bg-slate-700/40 transition-colors"
                >
                  <Edit2 className="w-3 h-3 text-indigo-400" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                    setMenuOpenId(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center space-x-2 hover:bg-rose-500/20 text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 shrink-0 flex flex-col border-r transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
        } ${
          theme === 'dark'
            ? 'bg-[#0d0f18] border-slate-800/80 text-slate-200'
            : 'bg-[#fafafa] border-slate-200 text-slate-800'
        }`}
      >
        {/* App Branding & Collapse */}
        <div className="p-3.5 flex items-center justify-between border-b border-inherit">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center space-x-1.5">
                <span>OmniChat</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Gemini & GPT Workspace</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors md:hidden ${
              theme === 'dark'
                ? 'border-slate-800 hover:bg-slate-800 text-slate-400'
                : 'border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full py-2.5 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-between bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.99]"
          >
            <span className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </span>
            <span className="text-[10px] opacity-75 font-mono bg-black/20 px-1.5 py-0.5 rounded">
              ⌘N
            </span>
          </button>
        </div>

        {/* Search bar */}
        {sessions.length > 2 && (
          <div className="px-3 pb-2">
            <div
              className={`flex items-center px-2.5 py-1.5 rounded-xl border text-xs ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none placeholder-slate-500 text-xs"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-200">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4 select-none">
          {sessions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <MessageSquare className="w-7 h-7 mx-auto text-slate-500/50 mb-2" />
              <p className="text-xs text-slate-400">No conversations yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Start a new chat to explore reasoning and search.</p>
            </div>
          ) : (
            <>
              {groupedSessions.pinned.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center space-x-1">
                    <Pin className="w-3 h-3" />
                    <span>Pinned</span>
                  </div>
                  {groupedSessions.pinned.map(renderSessionItem)}
                </div>
              )}

              {groupedSessions.today.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Today
                  </div>
                  {groupedSessions.today.map(renderSessionItem)}
                </div>
              )}

              {groupedSessions.yesterday.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Yesterday
                  </div>
                  {groupedSessions.yesterday.map(renderSessionItem)}
                </div>
              )}

              {groupedSessions.last7Days.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Previous 7 Days
                  </div>
                  {groupedSessions.last7Days.map(renderSessionItem)}
                </div>
              )}

              {groupedSessions.older.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Older
                  </div>
                  {groupedSessions.older.map(renderSessionItem)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom utility bar */}
        <div className="p-3 border-t border-inherit space-y-2">
          {onOpenDrive && (
            <button
              onClick={() => {
                onOpenDrive();
                if (window.innerWidth < 768) onClose();
              }}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="flex items-center space-x-2">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <span>Google Drive</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Files
              </span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
              theme === 'dark'
                ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <span className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Settings & Personas</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v3.8</span>
          </button>
        </div>
      </aside>
    </>
  );
};
