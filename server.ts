import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Shared Gemini GenAI client with required 'aistudio-build' telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatAttachment {
  name?: string;
  mimeType: string;
  data: string; // Base64 or data URL
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: ChatAttachment[];
}

// Model registry with human readable metadata
const AVAILABLE_MODELS = [
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

// Helper to extract clean, friendly error message from nested GenAI errors
function cleanErrorMessage(err: any): string {
  if (!err) return 'An unexpected service error occurred.';
  const raw = err.message || '';

  try {
    const parsed = JSON.parse(raw);
    if (parsed.error?.message) {
      try {
        const nested = JSON.parse(parsed.error.message);
        if (nested.error?.message) {
          return nested.error.message;
        }
      } catch {
        return parsed.error.message;
      }
    }
  } catch {
    // not JSON
  }

  if (err.status === 503 || raw.includes('503') || raw.includes('high demand')) {
    return 'The AI model is temporarily experiencing peak server demand. Please try again in a few moments.';
  }

  return raw || 'An unexpected error occurred while communicating with the AI service.';
}

// Endpoint: list models
app.get('/api/models', (_req: Request, res: Response) => {
  res.json({ models: AVAILABLE_MODELS });
});

// Endpoint: generate chat title
app.post('/api/title', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.json({ title: 'New Conversation' });
      return;
    }

    const titlePrompt = `Create a brief, clean, 3 to 5-word title summarizing this conversation starter. Do not use quotes, punctuation, or preamble. Just the title.\n\nUser prompt: "${prompt.slice(0, 300)}"`;

    let title = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: titlePrompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      title = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
    } catch {
      try {
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: titlePrompt,
        });
        title = fallbackRes.text ? fallbackRes.text.trim().replace(/^["']|["']$/g, '') : '';
      } catch {
        const words = prompt.trim().split(/\s+/).slice(0, 4).join(' ');
        title = words.length > 0 ? words.charAt(0).toUpperCase() + words.slice(1) : 'New Conversation';
      }
    }

    res.json({ title: title || 'New Conversation' });
  } catch (err: any) {
    console.error('Title generation error:', err);
    res.json({ title: 'New Conversation' });
  }
});

// Endpoint: text to speech
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[#*_~>]/g, '')
      .slice(0, 800);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Natural, friendly conversational tone',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio, format: 'audio/pcm' });
    } else {
      res.status(500).json({ error: 'No audio generated by TTS model' });
    }
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: err.message || 'Failed to synthesize speech' });
  }
});

// Endpoint: stream chat completion
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      messages = [],
      model = 'gemini-3.8-flash',
      enableThinking = true,
      enableSearch = false,
      systemPrompt,
      temperature = 0.7,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      sendEvent('error', { message: 'Messages array is required' });
      res.end();
      return;
    }

    // Format messages for @google/genai
    const formattedContents = messages.map((msg: ChatMessage) => {
      const parts: any[] = [];

      // Append multimodal attachments if present
      if (Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att?.data && att?.mimeType) {
            // Remove data URI prefix if present
            const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }

      // Append text content
      if (typeof msg.content === 'string' && msg.content.length > 0) {
        parts.push({ text: msg.content });
      } else if (parts.length === 0) {
        parts.push({ text: ' ' });
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    // Build configuration
    const config: any = {};

    // System instruction (default versatile assistant persona)
    const baseSystemPrompt =
      systemPrompt ||
      `You are OmniChat, a world-class AI assistant that seamlessly unites the depth, analytical rigor, and reasoning of Gemini with the conversational eloquence, polish, and developer-first utility of ChatGPT.

Guidelines:
- Deliver well-structured, clear, accurate, and insightful answers.
- Format responses cleanly with GitHub-flavored markdown: headers, bold accents, bulleted lists, and tables when comparing data.
- When generating code, always specify the language tag (e.g. \`\`\`tsx, \`\`\`python, \`\`\`html) and provide complete, functional, idiomatic code with helpful inline commentary.
- If web search or current information is queried, weave factual discoveries naturally and cite relevant details.
- Be friendly, concise, and intellectually honest. Avoid corporate fluff or repetitive caveats.`;

    config.systemInstruction = baseSystemPrompt;
    config.temperature = Math.max(0, Math.min(2, Number(temperature) || 0.7));

    // Thinking configuration for Gemini 3 models
    if (model.startsWith('gemini-3') && enableThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }

    // Grounding with Google Search if enabled
    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // Call generateContentStream with automatic fallback to gemini-flash-latest if primary model fails
    let streamSuccessful = false;
    let accumulatedGrounding: any = null;
    const fallbackModel = model === 'gemini-flash-latest' ? 'gemini-3.8-flash' : 'gemini-flash-latest';

    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: formattedContents,
        config,
      });

      for await (const chunk of responseStream) {
        const candidate = chunk.candidates?.[0];
        const text = chunk.text;
        
        // Extract grounding metadata if provided by Google Search
        if (candidate?.groundingMetadata) {
          const gm = candidate.groundingMetadata;
          accumulatedGrounding = {
            webSearchQueries: gm.webSearchQueries || [],
            groundingChunks: gm.groundingChunks || [],
            groundingSupports: gm.groundingSupports || [],
          };
        }

        if (text) {
          sendEvent('chunk', {
            text,
            grounding: accumulatedGrounding,
          });
        }
      }
      streamSuccessful = true;
    } catch (primaryErr: any) {
      console.warn(`Primary model ${model} encountered an issue:`, primaryErr?.status || primaryErr?.message?.slice(0, 100));

      try {
        const isQuotaOrToolError =
          primaryErr?.status === 429 ||
          primaryErr?.message?.includes('quota') ||
          primaryErr?.message?.includes('rate-limit') ||
          primaryErr?.message?.includes('Search');

        const fallbackConfig = { ...config };
        if (isQuotaOrToolError && fallbackConfig.tools) {
          delete fallbackConfig.tools;
          sendEvent('chunk', {
            text: `> *Search quota reached. Generating response from AI knowledge base...*\n\n`,
          });
        }

        if (!fallbackModel.startsWith('gemini-3')) {
          delete fallbackConfig.thinkingConfig;
        }

        const targetFallbackModel = isQuotaOrToolError ? model : fallbackModel;
        const fallbackStream = await ai.models.generateContentStream({
          model: targetFallbackModel,
          contents: formattedContents,
          config: fallbackConfig,
        });

        for await (const chunk of fallbackStream) {
          const candidate = chunk.candidates?.[0];
          const text = chunk.text;
          
          if (candidate?.groundingMetadata) {
            const gm = candidate.groundingMetadata;
            accumulatedGrounding = {
              webSearchQueries: gm.webSearchQueries || [],
              groundingChunks: gm.groundingChunks || [],
              groundingSupports: gm.groundingSupports || [],
            };
          }

          if (text) {
            sendEvent('chunk', {
              text,
              grounding: accumulatedGrounding,
            });
          }
        }
        streamSuccessful = true;
      } catch (fallbackErr: any) {
        console.error('Fallback attempt also failed:', fallbackErr);
        throw primaryErr;
      }
    }

    // Final completion event
    if (streamSuccessful) {
      sendEvent('done', {
        grounding: accumulatedGrounding,
      });
      res.end();
      return;
    }

    sendEvent('done', {});
    res.end();
  } catch (error: any) {
    console.error('Chat stream error:', error);
    sendEvent('error', {
      message: cleanErrorMessage(error),
    });
    res.end();
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniChat Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
