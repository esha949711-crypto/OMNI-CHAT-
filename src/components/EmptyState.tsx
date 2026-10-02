import React from 'react';
import {
  Sparkles,
  Code2,
  Search,
  Brain,
  Lightbulb,
  ArrowUpRight,
  Compass,
  FileCode,
} from 'lucide-react';
import { ThemeMode } from '../types/chat';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string, autoSend?: boolean, enableSearch?: boolean, enableThinking?: boolean) => void;
  theme: ThemeMode;
  modelName: string;
}

interface PromptCard {
  title: string;
  desc: string;
  category: string;
  icon: React.ReactNode;
  prompt: string;
  enableSearch?: boolean;
  enableThinking?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt,
  theme,
  modelName,
}) => {
  const promptSuggestions: PromptCard[] = [
    {
      title: 'Quantum Entanglement',
      desc: 'Explain to a 10-year-old, then to a physicist',
      category: 'Science & Physics',
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      prompt: 'Explain quantum entanglement simply for a 10-year-old, followed by an intuitive mathematical breakdown for an undergraduate student.',
    },
    {
      title: 'Production React Hook',
      desc: 'Type-safe debounce hook with cancel & flush',
      category: 'Engineering',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      prompt: 'Write a battle-tested, fully typed React TypeScript custom hook for debouncing functions with immediate execution, cancel, and pending states.',
    },
    {
      title: 'Current AI Developments',
      desc: 'Discover breakthroughs using live Google Search',
      category: 'Web Grounding',
      icon: <Search className="w-4 h-4 text-blue-400" />,
      prompt: 'What are the most significant AI breakthroughs and benchmark announcements from top research labs this month? Summarize key findings with citations.',
      enableSearch: true,
    },
    {
      title: 'Step-by-Step Logic Riddle',
      desc: 'Complex reasoning through the Monty Hall paradox',
      category: 'Deep Reasoning',
      icon: <Brain className="w-4 h-4 text-purple-400" />,
      prompt: 'Analyze the Monty Hall problem using rigorous Bayesian probability and step-by-step reasoning. Explain why switching doors doubles your chances.',
      enableThinking: true,
    },
    {
      title: 'Interactive HTML Web Component',
      desc: 'Generate an interactive dashboard preview',
      category: 'Code Sandbox',
      icon: <FileCode className="w-4 h-4 text-indigo-400" />,
      prompt: 'Create a single-file interactive modern HTML/Tailwind/JS weather card with animated weather icons, Celsius/Fahrenheit toggle, and hourly forecast.',
    },
    {
      title: 'Executive Pitch Deck',
      desc: 'Hook, problem, solution & business model',
      category: 'Strategy & Writing',
      icon: <Compass className="w-4 h-4 text-rose-400" />,
      prompt: 'Draft an executive pitch summary for an AI-native developer tool. Include the pain point, product defensibility, TAM, and monetization model.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Hero Badge */}
      <div className="mb-4 inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
        <span className="text-xs font-semibold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
          Powered by {modelName}
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-center tracking-tight mb-3">
        <span>Where would you like to </span>
        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          begin?
        </span>
      </h1>

      <p className="text-xs sm:text-sm text-center text-slate-400 max-w-lg mb-8">
        Ask complex questions, brainstorm ideas, analyze images and data, or write production code with deep reasoning.
      </p>

      {/* Capability Highlights */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <span
          className={`text-[11px] font-medium px-3 py-1 rounded-full border flex items-center space-x-1.5 ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-800 text-slate-300'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <Search className="w-3 h-3 text-blue-400" />
          <span>Real-time Google Grounding</span>
        </span>

        <span
          className={`text-[11px] font-medium px-3 py-1 rounded-full border flex items-center space-x-1.5 ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-800 text-slate-300'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <Brain className="w-3 h-3 text-purple-400" />
          <span>High-Order Reasoning</span>
        </span>

        <span
          className={`text-[11px] font-medium px-3 py-1 rounded-full border flex items-center space-x-1.5 ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-800 text-slate-300'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <Code2 className="w-3 h-3 text-emerald-400" />
          <span>Interactive Code Sandbox</span>
        </span>

        <span
          className={`text-[11px] font-medium px-3 py-1 rounded-full border flex items-center space-x-1.5 ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-800 text-slate-300'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Multimodal Vision & Audio</span>
        </span>
      </div>

      {/* Suggestion Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
        {promptSuggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt, true, item.enableSearch, item.enableThinking)}
            className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 ${
              theme === 'dark'
                ? 'bg-[#121524]/60 hover:bg-[#181d32] border-slate-800/80 hover:border-indigo-500/50 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  {item.icon}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {item.category}
                </span>
              </div>
              <h3 className="font-semibold text-xs sm:text-sm group-hover:text-indigo-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="flex items-center justify-end mt-3 text-slate-400 group-hover:text-indigo-400 text-xs">
              <span className="text-[11px] mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Try prompt</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
