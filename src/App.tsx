/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatInput } from './components/ChatInput';
import { MessageItem } from './components/MessageItem';
import { EmptyState } from './components/EmptyState';
import { SettingsModal, PERSONA_PRESETS } from './components/SettingsModal';
import { CodePreviewModal } from './components/CodePreviewModal';
import { DriveModal } from './components/DriveModal';
import { initAuth } from './services/googleAuth';
import {
  ChatSession,
  Message,
  ModelInfo,
  ThemeMode,
  ChatAttachment,
} from './types/chat';

const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tagline: 'Fast, intelligent, multimodal & grounded reasoning',
    badge: 'Recommended',
    description: 'Optimal for everyday queries, programming, writing, visual questions, and real-time search.',
    icon: 'sparkles',
    supportsSearch: true,
    supportsThinking: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash (Latest Stable)',
    tagline: 'High speed, ultra-consistent & balanced',
    badge: 'Stable',
    description: 'High-speed stable model ideal for quick queries, summaries, and uninterrupted conversations.',
    icon: 'zap',
    supportsSearch: true,
    supportsThinking: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tagline: 'Ultra-fast lightweight model',
    badge: 'Fast',
    description: 'Lightweight model designed for instant answers, quick translations, and high-frequency tasks.',
    icon: 'zap',
    supportsSearch: false,
    supportsThinking: false,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Deep Thinking)',
    tagline: 'High-order logic, STEM & multi-step coding',
    badge: 'Pro Tier',
    description: 'Advanced reasoning model for complex architectural problems, deep analysis, and extensive codebases.',
    icon: 'brain',
    supportsSearch: true,
    supportsThinking: true,
  },
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('omnichat_theme') as ThemeMode) || 'dark';
  });

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Models state
  const [models, setModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem('omnichat_selected_model');
    if (saved && saved !== 'gemma-4-26b-a4b-it') return saved;
    return 'gemini-3.8-flash';
  });

  // Persist selected model
  useEffect(() => {
    localStorage.setItem('omnichat_selected_model', selectedModel);
  }, [selectedModel]);

  // Capability toggles
  const [enableThinking, setEnableThinking] = useState(true);
  const [enableSearch, setEnableSearch] = useState(false);

  // System instructions & personas
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return localStorage.getItem('omnichat_system_prompt') || PERSONA_PRESETS[0].systemPrompt;
  });
  const [temperature, setTemperature] = useState<number>(0.7);
  const [voice, setVoice] = useState<string>('Kore');

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('omnichat_sessions_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse sessions:', e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return localStorage.getItem('omnichat_active_session_id') || null;
  });

  // Streaming & Abort controller
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveAttachmentToAdd, setDriveAttachmentToAdd] = useState<ChatAttachment | null>(null);
  const [codePreview, setCodePreview] = useState<{
    isOpen: boolean;
    code: string;
    language: string;
  }>({
    isOpen: false,
    code: '',
    language: '',
  });

  // Track Google Auth status for Google Drive integration
  useEffect(() => {
    const unsubscribe = initAuth(
      () => setIsDriveConnected(true),
      () => setIsDriveConnected(false)
    );
    return () => unsubscribe();
  }, []);

  // Input prefill state for edits
  const [inputPrefill, setInputPrefill] = useState<string | undefined>(undefined);

  // Message scroll anchor ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync theme with document element
  useEffect(() => {
    localStorage.setItem('omnichat_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0f1117';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [theme]);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omnichat_sessions_v1', JSON.stringify(sessions));
    } catch (e) {
      console.warn('LocalStorage quota limit reached:', e);
    }
  }, [sessions]);

  // Sync activeSessionId to localStorage
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('omnichat_active_session_id', activeSessionId);
    } else {
      localStorage.removeItem('omnichat_active_session_id');
    }
  }, [activeSessionId]);

  // Sync systemPrompt to localStorage
  useEffect(() => {
    localStorage.setItem('omnichat_system_prompt', systemPrompt);
  }, [systemPrompt]);

  // Fetch available models from backend
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setModels(data.models);
          }
        }
      } catch (err) {
        console.warn('Could not fetch models from server, using defaults:', err);
      }
    };
    fetchModels();
  }, []);

  // Keyboard shortcut for New Chat (Cmd/Ctrl + N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  // Active chat formatted markdown content for saving to Google Drive
  const activeChatContent = useMemo(() => {
    if (!activeSession || activeSession.messages.length === 0) return '';
    let content = `# ${activeSession.title}\n*Created: ${new Date(activeSession.createdAt).toLocaleString()}*\n*Model: ${activeSession.model || selectedModel}*\n\n---\n\n`;
    for (const m of activeSession.messages) {
      const sender = m.role === 'user' ? '### User' : `### OmniChat (${m.model || selectedModel})`;
      content += `${sender}\n\n${m.content}\n\n---\n\n`;
    }
    return content;
  }, [activeSession, selectedModel]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom(isGenerating ? 'auto' : 'smooth');
  }, [messages, isGenerating, scrollToBottom]);

  // Create new session helper
  const handleCreateNewChat = () => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }

    const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      enableThinking,
      enableSearch,
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInputPrefill('');
  };

  // Delete session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Toggle pin session
  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    // Turn off isStreaming flag on active assistant message
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const updatedMsgs = s.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          );
          return { ...s, messages: updatedMsgs };
        })
      );
    }
  };

  // Send message and stream response
  const handleSendMessage = async (
    content: string,
    attachments: ChatAttachment[] = [],
    overrideSearch?: boolean,
    overrideThinking?: boolean
  ) => {
    if (!content.trim() && attachments.length === 0) return;

    let currentSessionId = activeSessionId;
    let targetSession = sessions.find((s) => s.id === currentSessionId);

    // If no active session, automatically create one
    if (!currentSessionId || !targetSession) {
      currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      targetSession = {
        id: currentSessionId,
        title: 'New Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: selectedModel,
        enableThinking,
        enableSearch,
      };
      setSessions((prev) => [targetSession!, ...prev]);
      setActiveSessionId(currentSessionId);
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMsgId = `asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: selectedModel,
      isStreaming: true,
    };

    // Update session state with new user and placeholder assistant message
    const updatedMessages = [...(targetSession.messages || []), userMessage, assistantMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    // Generate smart conversation title if first message
    if (targetSession.messages.length === 0) {
      fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.title) {
            handleRenameSession(currentSessionId!, data.title);
          }
        })
        .catch((err) => console.warn('Title auto-generation error:', err));
    }

    // Prepare payload
    const searchVal = overrideSearch !== undefined ? overrideSearch : enableSearch;
    const thinkingVal = overrideThinking !== undefined ? overrideThinking : enableThinking;

    const payloadMessages = updatedMessages
      .filter((m) => m.id !== assistantMsgId)
      .map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

    setIsGenerating(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const startTime = Date.now();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: selectedModel,
          enableThinking: thinkingVal,
          enableSearch: searchVal,
          systemPrompt,
          temperature,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable response stream received.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let finalGrounding: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          let eventType = 'chunk';
          let eventData = '';

          const eventMatch = line.match(/^event:\s*(\w+)/);
          if (eventMatch) {
            eventType = eventMatch[1];
          }

          const dataMatch = line.match(/data:\s*([\s\S]*)$/);
          if (dataMatch) {
            eventData = dataMatch[1];
          }

          if (eventType === 'error') {
            try {
              const errObj = JSON.parse(eventData);
              accumulatedText += `\n\n> ⚠️ **Service Notice:** ${errObj.message || 'Stream temporarily unavailable. Click Regenerate below to retry.'}`;
            } catch {
              accumulatedText += `\n\n> ⚠️ **Service Notice:** Temporary connection issue. Click Regenerate below to retry.`;
            }
          } else if (eventType === 'chunk') {
            try {
              const parsed = JSON.parse(eventData);
              if (parsed.text) {
                accumulatedText += parsed.text;
              }
              if (parsed.grounding) {
                finalGrounding = parsed.grounding;
              }
            } catch (err) {
              console.error('Failed to parse chunk:', err);
            }
          } else if (eventType === 'done') {
            try {
              const parsed = JSON.parse(eventData);
              if (parsed.grounding) {
                finalGrounding = parsed.grounding;
              }
            } catch {
              // ignore
            }
          }

          // Update assistant message in state in real-time
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== currentSessionId) return s;
              const msgs = s.messages.map((m) => {
                if (m.id === assistantMsgId) {
                  return {
                    ...m,
                    content: accumulatedText,
                    grounding: finalGrounding,
                    isStreaming: true,
                  };
                }
                return m;
              });
              return { ...s, messages: msgs };
            })
          );
        }
      }

      // Finalize message when stream ends
      const thoughtDuration = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          const msgs = s.messages.map((m) => {
            if (m.id === assistantMsgId) {
              return {
                ...m,
                content: accumulatedText,
                grounding: finalGrounding,
                thoughtDuration,
                isStreaming: false,
              };
            }
            return m;
          } );
          return { ...s, messages: msgs };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('User stopped generation.');
      } else {
        console.error('Chat error:', err);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSessionId) return s;
            const msgs = s.messages.map((m) => {
              if (m.id === assistantMsgId) {
                return {
                  ...m,
                  content:
                    m.content ||
                    `> ⚠️ **Service Notice:** Temporary connection interruption. Click the **Regenerate (↻)** button below to try again.`,
                  isStreaming: false,
                };
              }
              return m;
            });
            return { ...s, messages: msgs };
          })
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (!activeSession || activeSession.messages.length === 0 || isGenerating) return;

    const msgs = [...activeSession.messages];
    let lastUserPrompt = '';
    let lastUserAttachments: ChatAttachment[] = [];

    // Find the last user message
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserPrompt = msgs[i].content;
        lastUserAttachments = msgs[i].attachments || [];
        // Trim messages up to that user message
        const trimmed = msgs.slice(0, i);
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSession.id ? { ...s, messages: trimmed } : s))
        );
        break;
      }
    }

    if (lastUserPrompt || lastUserAttachments.length > 0) {
      handleSendMessage(lastUserPrompt, lastUserAttachments);
    }
  };

  // Edit user prompt: load text into input and trim following messages
  const handleEditPrompt = (text: string) => {
    setInputPrefill(text);
  };

  // Export current chat
  const handleExportCurrentChat = (format: 'markdown' | 'json') => {
    if (!activeSession) return;

    let contentStr = '';
    let mime = 'text/plain';
    let filename = `${activeSession.title.replace(/\s+/g, '_')}`;

    if (format === 'markdown') {
      filename += '.md';
      mime = 'text/markdown';
      contentStr = `# ${activeSession.title}\n*Created: ${new Date(activeSession.createdAt).toLocaleString()}*\n\n`;
      for (const m of activeSession.messages) {
        const sender = m.role === 'user' ? '### User' : `### OmniChat (${m.model || 'Gemini'})`;
        contentStr += `${sender}\n\n${m.content}\n\n---\n\n`;
      }
    } else {
      filename += '.json';
      mime = 'application/json';
      contentStr = JSON.stringify(activeSession, null, 2);
    }

    const blob = new Blob([contentStr], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export all conversations
  const handleExportAllChats = () => {
    const jsonStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnichat_conversations_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear all chats
  const handleClearAllChats = () => {
    setSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem('omnichat_sessions_v1');
  };

  const currentModelObj = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        theme === 'dark' ? 'bg-[#0f111a] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleCreateNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePinSession={handleTogglePinSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDrive={() => setIsDriveModalOpen(true)}
        theme={theme}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          selectedModel={selectedModel}
          onSelectModel={(id) => setSelectedModel(id)}
          models={models}
          enableThinking={enableThinking}
          onToggleThinking={() => setEnableThinking(!enableThinking)}
          enableSearch={enableSearch}
          onToggleSearch={() => setEnableSearch(!enableSearch)}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenDrive={() => setIsDriveModalOpen(true)}
          isDriveConnected={isDriveConnected}
          onExportCurrentChat={handleExportCurrentChat}
          hasMessages={messages.length > 0}
        />

        {/* Message Feed / Empty State Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative"
        >
          {messages.length === 0 ? (
            <EmptyState
              onSelectPrompt={(prompt, autoSend, searchOpt, thinkOpt) => {
                if (searchOpt !== undefined) setEnableSearch(searchOpt);
                if (thinkOpt !== undefined) setEnableThinking(thinkOpt);
                if (autoSend) {
                  handleSendMessage(prompt, [], searchOpt, thinkOpt);
                } else {
                  setInputPrefill(prompt);
                }
              }}
              theme={theme}
              modelName={currentModelObj?.name || 'Gemini 3.8 Flash'}
            />
          ) : (
            <div className="py-4 space-y-1">
              {messages.map((msg, index) => {
                const isLatestAssistant =
                  msg.role === 'assistant' && index === messages.length - 1;
                return (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    theme={theme}
                    onRegenerate={isLatestAssistant ? handleRegenerate : undefined}
                    onEditPrompt={handleEditPrompt}
                    onOpenCodePreview={(code, language) =>
                      setCodePreview({ isOpen: true, code, language })
                    }
                    isLatestAssistant={isLatestAssistant}
                  />
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Floating Chat Input Omnibar */}
        <ChatInput
          onSendMessage={(content, attachments) => handleSendMessage(content, attachments)}
          onStopGeneration={handleStopGeneration}
          isGenerating={isGenerating}
          enableThinking={enableThinking}
          onToggleThinking={() => setEnableThinking(!enableThinking)}
          enableSearch={enableSearch}
          onToggleSearch={() => setEnableSearch(!enableSearch)}
          theme={theme}
          initialPrompt={inputPrefill}
          onOpenDrive={() => setIsDriveModalOpen(true)}
          driveAttachmentToAdd={driveAttachmentToAdd}
          onClearDriveAttachmentToAdd={() => setDriveAttachmentToAdd(null)}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        temperature={temperature}
        setTemperature={setTemperature}
        defaultModel={selectedModel}
        setDefaultModel={setSelectedModel}
        enableThinking={enableThinking}
        setEnableThinking={setEnableThinking}
        enableSearch={enableSearch}
        setEnableSearch={setEnableSearch}
        voice={voice}
        setVoice={setVoice}
        models={models}
        theme={theme}
        onClearAllChats={handleClearAllChats}
        onExportAllChats={handleExportAllChats}
      />

      {/* Code Preview Runner Modal */}
      <CodePreviewModal
        isOpen={codePreview.isOpen}
        onClose={() => setCodePreview((prev) => ({ ...prev, isOpen: false }))}
        code={codePreview.code}
        language={codePreview.language}
        theme={theme}
      />

      {/* Google Drive Integration Modal */}
      <DriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        theme={theme}
        onAttachFileToChat={(attachment) => {
          setDriveAttachmentToAdd(attachment);
        }}
        activeChatTitle={activeSession?.title}
        activeChatContent={activeChatContent}
      />
    </div>
  );
}
