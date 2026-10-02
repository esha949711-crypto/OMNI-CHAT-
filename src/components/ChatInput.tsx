import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Search,
  Brain,
  X,
  FileText,
  Image as ImageIcon,
  HardDrive,
} from 'lucide-react';
import { ChatAttachment, ThemeMode } from '../types/chat';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: ChatAttachment[]) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  enableThinking: boolean;
  onToggleThinking: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  theme: ThemeMode;
  initialPrompt?: string;
  onOpenDrive?: () => void;
  driveAttachmentToAdd?: ChatAttachment | null;
  onClearDriveAttachmentToAdd?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  enableThinking,
  onToggleThinking,
  enableSearch,
  onToggleSearch,
  theme,
  initialPrompt,
  onOpenDrive,
  driveAttachmentToAdd,
  onClearDriveAttachmentToAdd,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Append drive attachment if passed from DriveModal
  useEffect(() => {
    if (driveAttachmentToAdd) {
      setAttachments((prev) => {
        if (prev.some((a) => a.id === driveAttachmentToAdd.id)) return prev;
        return [...prev, driveAttachmentToAdd];
      });
      onClearDriveAttachmentToAdd?.();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [driveAttachmentToAdd, onClearDriveAttachmentToAdd]);

  // Sync initialPrompt if provided (e.g. from clicking an empty state suggestion or editing prompt)
  useEffect(() => {
    if (initialPrompt !== undefined) {
      setContent(initialPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialPrompt]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // Handle files
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setAttachments((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              data: result,
              size: file.size,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Clipboard paste (screenshots, copied images)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      processFiles(files);
    }
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Web Speech API for voice dictation
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Speech recognition init error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isGenerating) return;
    if (!content.trim() && attachments.length === 0) return;

    onSendMessage(content.trim(), attachments);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const canSend = (content.trim().length > 0 || attachments.length > 0) && !isGenerating;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      {/* Container with glow */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-3xl border transition-all duration-200 shadow-xl ${
          isDragging
            ? 'border-indigo-500 ring-4 ring-indigo-500/20 bg-indigo-500/5'
            : theme === 'dark'
            ? 'bg-[#141829] border-slate-700/80 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20'
            : 'bg-white border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20 shadow-slate-200/60'
        }`}
      >
        {/* Attachments preview strip */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((att) => {
              const isImage = att.mimeType.startsWith('image/');
              return (
                <div
                  key={att.id}
                  className={`group relative flex items-center space-x-2 pl-2 pr-1.5 py-1 rounded-xl text-xs border ${
                    theme === 'dark'
                      ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {isImage ? (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="w-5 h-5 rounded object-cover"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="truncate max-w-[120px] font-mono text-[11px]">
                    {att.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Text Area */}
        <div className="flex items-end px-3.5 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isGenerating
                ? 'OmniChat is generating a response...'
                : 'Ask anything, explore ideas, or paste images/code...'
            }
            disabled={isGenerating}
            className={`w-full max-h-[220px] resize-none bg-transparent text-xs sm:text-sm outline-none leading-relaxed transition-colors ${
              theme === 'dark'
                ? 'text-slate-100 placeholder-slate-400'
                : 'text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Bottom bar inside omnibar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-inherit">
          {/* Left tools: Attach, Web Search pill, Deep Think pill */}
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,text/*,.ts,.tsx,.js,.jsx,.json,.py,.md,.csv,.html,.css"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach photos or files"
              className={`p-2 rounded-xl border transition-colors ${
                theme === 'dark'
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Google Drive file picker */}
            {onOpenDrive && (
              <button
                type="button"
                onClick={onOpenDrive}
                title="Attach from Google Drive"
                className={`p-2 rounded-xl border transition-all flex items-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'border-slate-800 hover:bg-slate-800/90 text-blue-400 hover:text-blue-300'
                    : 'border-slate-200 hover:bg-slate-100 text-blue-600 hover:text-blue-700'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span className="text-[11px] font-medium hidden sm:inline">Drive</span>
              </button>
            )}

            {/* In-bar search pill */}
            <button
              onClick={onToggleSearch}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                enableSearch
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 ring-1 ring-blue-500/30'
                  : theme === 'dark'
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500'
              }`}
            >
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* In-bar deep think pill */}
            <button
              onClick={onToggleThinking}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                enableThinking
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 ring-1 ring-purple-500/30'
                  : theme === 'dark'
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500'
              }`}
            >
              <Brain className="w-3 h-3" />
              <span className="hidden sm:inline">Think</span>
            </button>
          </div>

          {/* Right tools: Voice Dictation + Send/Stop */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={toggleRecording}
              title={isRecording ? 'Stop voice recording' : 'Voice input'}
              className={`p-2 rounded-xl border transition-all ${
                isRecording
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse ring-2 ring-rose-500/30'
                  : theme === 'dark'
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {isGenerating ? (
              <button
                onClick={onStopGeneration}
                title="Stop response"
                className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-600/25 transition-transform active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                title="Send prompt"
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  canSend
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/30 cursor-pointer transform active:scale-95'
                    : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-700/30'
                }`}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Under-bar footnote */}
      <div className="text-center mt-2">
        <p className="text-[11px] text-slate-400 font-medium select-none">
          OmniChat blends Gemini intelligence with ChatGPT workflows. Verify important facts.
        </p>
      </div>
    </div>
  );
};
