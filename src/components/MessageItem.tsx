import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Brain,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Search,
  Code2,
  Play,
  Edit3,
} from 'lucide-react';
import { Message, ThemeMode } from '../types/chat';
import { extractThinking, renderMarkdown, isPreviewableCode } from '../utils/markdown';
import { speakText, stopSpeaking } from '../utils/audio';

interface MessageItemProps {
  message: Message;
  theme: ThemeMode;
  onRegenerate?: () => void;
  onEditPrompt?: (text: string) => void;
  onOpenCodePreview: (code: string, language: string) => void;
  isLatestAssistant: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  theme,
  onRegenerate,
  onEditPrompt,
  onOpenCodePreview,
  isLatestAssistant,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const isUser = message.role === 'user';

  // Process thinking tag separation
  const { thinking: extractedThinking, cleanText } = useMemo(() => {
    return extractThinking(message.content);
  }, [message.content]);

  const displayThinking = message.thinking || extractedThinking;
  const displayContent = cleanText;

  // Render markdown to HTML
  const htmlContent = useMemo(() => {
    return renderMarkdown(displayContent);
  }, [displayContent]);

  // Extract previewable code blocks if any
  const previewableBlocks = useMemo(() => {
    if (isUser) return [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches: Array<{ language: string; code: string }> = [];
    let match;
    while ((match = codeBlockRegex.exec(displayContent)) !== null) {
      const language = match[1] || 'text';
      const code = match[2];
      if (isPreviewableCode(language, code)) {
        matches.push({ language, code });
      }
    }
    return matches;
  }, [displayContent, isUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(displayContent, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <div
      className={`py-4 sm:py-6 px-3 sm:px-6 transition-colors ${
        isUser
          ? theme === 'dark'
            ? 'bg-transparent'
            : 'bg-transparent'
          : theme === 'dark'
          ? 'bg-[#121524]/40 border-y border-slate-800/40'
          : 'bg-slate-50/70 border-y border-slate-100'
      }`}
    >
      <div className="max-w-3xl mx-auto flex items-start space-x-3 sm:space-x-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center text-white shadow-sm">
              <User className="w-4 h-4 text-slate-300" />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row: Author + Model tag + Timestamp */}
          <div className="flex items-center justify-between text-xs text-slate-400 select-none">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-200">
                {isUser ? 'You' : 'OmniChat'}
              </span>
              {!isUser && message.model && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  {message.model.replace('gemini-', 'Gemini ')}
                </span>
              )}
            </div>

            {/* User prompt edit trigger */}
            {isUser && onEditPrompt && (
              <button
                onClick={() => onEditPrompt(message.content)}
                title="Edit message"
                className="opacity-0 group-hover:opacity-100 hover:text-slate-200 transition-opacity p-1"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* User Attachments (Images & Files) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att) => {
                const isImage = att.mimeType.startsWith('image/');
                return (
                  <div
                    key={att.id}
                    onClick={() => isImage && setImageModalUrl(att.data)}
                    className={`relative rounded-xl border overflow-hidden transition-all ${
                      isImage
                        ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 shadow-sm max-w-[200px]'
                        : 'p-2.5 flex items-center space-x-2 bg-slate-800/80 border-slate-700 text-xs'
                    }`}
                  >
                    {isImage ? (
                      <img
                        src={att.data}
                        alt={att.name || 'Attachment'}
                        className="max-h-36 w-auto object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-slate-300 font-mono text-xs truncate max-w-[150px]">
                        {att.name || 'File'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Assistant: Thinking / Reasoning Accordion (Gemini style) */}
          {displayThinking && (
            <div
              className={`rounded-xl border overflow-hidden my-2 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-purple-500/30 text-purple-200'
                  : 'bg-purple-50/70 border-purple-200 text-purple-900'
              }`}
            >
              <button
                onClick={() => setThinkingExpanded(!thinkingExpanded)}
                className="w-full text-left px-3.5 py-2 flex items-center justify-between text-xs font-semibold hover:bg-purple-500/10 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>
                    Thinking Process
                    {message.thoughtDuration ? ` (${message.thoughtDuration}s)` : ''}
                  </span>
                </div>
                {thinkingExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                )}
              </button>

              {thinkingExpanded && (
                <div className="px-3.5 py-2.5 text-xs font-mono leading-relaxed border-t border-purple-500/20 whitespace-pre-wrap text-slate-300 bg-black/20">
                  {displayThinking}
                </div>
              )}
            </div>
          )}

          {/* Assistant: Google Search Grounding Sources (Gemini Grounding) */}
          {message.grounding && message.grounding.groundingChunks && message.grounding.groundingChunks.length > 0 && (
            <div
              className={`p-3 rounded-xl border my-2 text-xs space-y-2 ${
                theme === 'dark'
                  ? 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center space-x-1.5 font-semibold text-blue-400 text-[11px] uppercase tracking-wider">
                <Search className="w-3.5 h-3.5" />
                <span>Web Sources & Grounding</span>
              </div>

              {/* Search queries searched */}
              {message.grounding.webSearchQueries && message.grounding.webSearchQueries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="text-slate-400">Searched for:</span>
                  {message.grounding.webSearchQueries.map((query, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300"
                    >
                      &quot;{query}&quot;
                    </span>
                  ))}
                </div>
              )}

              {/* Sources carousel / grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {message.grounding.groundingChunks.map((chunk, idx) => {
                  if (!chunk.web?.uri) return null;
                  let hostname = '';
                  try {
                    hostname = new URL(chunk.web.uri).hostname.replace('www.', '');
                  } catch {
                    hostname = 'web';
                  }

                  return (
                    <a
                      key={idx}
                      href={chunk.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg border transition-all flex items-center justify-between group hover:border-blue-400/60 ${
                        theme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-[10px] text-blue-400 font-mono truncate">{hostname}</div>
                        <div className="text-xs font-medium text-slate-200 truncate group-hover:text-blue-300">
                          {chunk.web.title || chunk.web.uri}
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Code Preview Banner if previewable code exists */}
          {previewableBlocks.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">
              {previewableBlocks.map((block, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenCodePreview(block.code, block.language)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all transform active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run / Preview {block.language.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}

          {/* Rendered Message Markdown Body */}
          <div
            className={`prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto ${
              theme === 'dark'
                ? 'prose-invert prose-p:leading-relaxed prose-pre:bg-[#0c0f17] prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl'
                : 'prose-slate prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl'
            }`}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Streaming Cursor indicator */}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse rounded-sm align-middle" />
          )}

          {/* Message Bottom Action Toolbar (for Assistant) */}
          {!isUser && !message.isStreaming && (
            <div className="flex items-center space-x-1.5 pt-2 text-slate-400 select-none">
              <button
                onClick={handleCopy}
                title="Copy response"
                className={`p-1.5 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleToggleSpeech}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSpeaking
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400 animate-pulse'
                    : theme === 'dark'
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {isLatestAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  title="Regenerate answer"
                  className={`p-1.5 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="h-3 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                title="Good response"
                className={`p-1.5 rounded-lg border transition-colors ${
                  feedback === 'up'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : theme === 'dark'
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                title="Poor response"
                className={`p-1.5 rounded-lg border transition-colors ${
                  feedback === 'down'
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                    : theme === 'dark'
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {imageModalUrl && (
        <div
          onClick={() => setImageModalUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-zoom-out animate-in fade-in"
        >
          <img
            src={imageModalUrl}
            alt="Enlarged preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
