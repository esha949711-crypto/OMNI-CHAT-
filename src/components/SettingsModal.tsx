import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Bot,
  Volume2,
  Trash2,
  Download,
  Check,
  Search,
  Brain,
  ShieldAlert,
} from 'lucide-react';
import { ModelInfo, PersonaPreset } from '../types/chat';

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: 'omni',
    name: 'OmniChat Default',
    description: 'Balanced, insightful, fast, with structured markdown and code.',
    icon: '✨',
    systemPrompt: `You are OmniChat, a premier AI assistant blending the reasoning depth and multimodal precision of Gemini with the conversational dexterity and developer polish of ChatGPT.
Deliver well-structured, direct, accurate responses with clean markdown, bullet points, and code formatting where applicable.`,
  },
  {
    id: 'developer',
    name: 'Senior Software Architect',
    description: 'Production-ready, battle-tested code, security, and architecture.',
    icon: '💻',
    systemPrompt: `You are a Principal Software Architect and Staff Engineer. When assisting with code:
- Write robust, typed, production-ready code with best practices and comments.
- Explain trade-offs, potential edge-cases, and performance implications.
- Adhere strictly to modern conventions (TypeScript, React hooks, clean architecture).`,
  },
  {
    id: 'researcher',
    name: 'Scientific Researcher & Analyst',
    description: 'Fact-first, rigorous analytical reasoning, objective synthesis.',
    icon: '🔬',
    systemPrompt: `You are a Senior Research Scientist and Quantitative Analyst.
- Provide objective, rigorous, step-by-step reasoning.
- Cite principles, methodologies, and factual frameworks.
- Clarify assumptions and distinguish proven empirical data from conjecture.`,
  },
  {
    id: 'creative',
    name: 'Creative Storyteller & Copywriter',
    description: 'Vivid prose, persuasive storytelling, and engaging style.',
    icon: '🎨',
    systemPrompt: `You are an acclaimed creative writer and brand copywriter.
- Craft captivating, expressive, and original writing.
- Adapt tone seamlessly to poetry, marketing hooks, screenplays, or immersive narratives.`,
  },
  {
    id: 'concise',
    name: 'Executive Brevity',
    description: 'Zero fluff, bulleted key takeaways, maximum speed.',
    icon: '⚡',
    systemPrompt: `You are an executive chief-of-staff.
- Be extremely concise, direct, and action-oriented.
- Use succinct bullet points, high-level summaries, and immediately actionable steps. Avoid fluff.`,
  },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  defaultModel: string;
  setDefaultModel: (model: string) => void;
  enableThinking: boolean;
  setEnableThinking: (val: boolean) => void;
  enableSearch: boolean;
  setEnableSearch: (val: boolean) => void;
  voice: string;
  setVoice: (voice: string) => void;
  models: ModelInfo[];
  theme: 'dark' | 'light';
  onClearAllChats: () => void;
  onExportAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  setSystemPrompt,
  temperature,
  setTemperature,
  defaultModel,
  setDefaultModel,
  enableThinking,
  setEnableThinking,
  enableSearch,
  setEnableSearch,
  voice,
  setVoice,
  models,
  theme,
  onClearAllChats,
  onExportAllChats,
}) => {
  const [activeTab, setActiveTab] = useState<'persona' | 'model' | 'voice' | 'data'>('persona');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#121624] border-slate-700/70 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Settings & Intelligence</h2>
              <p className="text-xs text-slate-400">Customize model behaviors, personas, and system preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div
          className={`flex border-b px-6 space-x-6 text-sm font-medium ${
            theme === 'dark' ? 'border-slate-800 bg-[#0d101d]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            onClick={() => setActiveTab('persona')}
            className={`py-3 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'persona'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Personas & Prompt</span>
          </button>

          <button
            onClick={() => setActiveTab('model')}
            className={`py-3 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'model'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Model & Reasoning</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`py-3 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'voice'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Speech & Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'data'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Data & Backup</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'persona' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Preset Persona
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERSONA_PRESETS.map((p) => {
                    const isSelected = systemPrompt === p.systemPrompt;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSystemPrompt(p.systemPrompt)}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-500/40'
                            : theme === 'dark'
                            ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-300'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="text-xl">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-white">{p.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{p.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Custom System Instructions
                  </label>
                  <button
                    onClick={() => setSystemPrompt(PERSONA_PRESETS[0].systemPrompt)}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Reset to default
                  </button>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  placeholder="Provide custom instructions that guide how OmniChat responds..."
                  className={`w-full p-3 rounded-xl text-xs font-mono border resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    theme === 'dark'
                      ? 'bg-[#0d101d] border-slate-800 text-slate-200 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-5">
              {/* Default Model */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Active Model
                </label>
                <div className="space-y-2">
                  {models.map((m) => {
                    const isSelected = defaultModel === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setDefaultModel(m.id)}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40'
                            : theme === 'dark'
                            ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm">{m.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{m.description}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-indigo-500 bg-indigo-600' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    theme === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold">Deep Thinking Mode</span>
                    </div>
                    <p className="text-[11px] text-slate-400">High-order reasoning for complex math and logic</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableThinking}
                    onChange={(e) => setEnableThinking(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    theme === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold">Google Web Search</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Ground responses with live Google Search citations</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableSearch}
                    onChange={(e) => setEnableSearch(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Temperature slider */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Creativity (Temperature: {temperature.toFixed(2)})
                  </label>
                  <span className="text-xs text-slate-400">
                    {temperature < 0.3 ? 'Deterministic & Precise' : temperature > 0.8 ? 'Creative & Uninhibited' : 'Balanced'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Text-to-Speech Voice Persona
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Kore', desc: 'Clear, warm, natural female voice' },
                  { name: 'Puck', desc: 'Energetic, expressive, modern tone' },
                  { name: 'Zephyr', desc: 'Calm, thoughtful, soothing tone' },
                  { name: 'Fenrir', desc: 'Authoritative, resonant, deep male voice' },
                  { name: 'Charon', desc: 'Crisp, measured, academic voice' },
                ].map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setVoice(v.name)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      voice === v.name
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-500/40'
                        : theme === 'dark'
                        ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-300'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">{v.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{v.desc}</div>
                    </div>
                    {voice === v.name && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  theme === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div>
                  <h4 className="text-sm font-semibold">Export Conversations</h4>
                  <p className="text-xs text-slate-400">Download all your chat sessions and messages as a JSON backup.</p>
                </div>
                <button
                  onClick={onExportAllChats}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div
                className={`p-4 rounded-xl border border-rose-500/30 ${
                  theme === 'dark' ? 'bg-rose-950/20' : 'bg-rose-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-rose-300">Clear All Chat History</h4>
                    <p className="text-xs text-rose-300/80 mt-1">
                      Permanently delete all stored conversations, pinned chats, and local cache. This action cannot be undone.
                    </p>

                    {!showClearConfirm ? (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 flex items-center space-x-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete All Chats</span>
                      </button>
                    ) : (
                      <div className="mt-3 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onClearAllChats();
                            setShowClearConfirm(false);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow"
                        >
                          Confirm & Delete Everything
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-inherit">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
