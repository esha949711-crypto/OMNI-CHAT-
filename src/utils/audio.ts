// Audio playback helper for Gemini PCM 24000 and browser SpeechSynthesis

let globalAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;

function getAudioContext(): AudioContext {
  if (!globalAudioContext || globalAudioContext.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioContext = new AudioCtx({ sampleRate: 24000 });
  }
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume();
  }
  return globalAudioContext;
}

export function stopSpeaking() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch {
      // ignore
    }
    currentSourceNode = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Convert base64 PCM 16-bit little-endian (sample rate 24000) to AudioBuffer
function pcm16ToAudioBuffer(ctx: AudioContext, base64PCM: string): AudioBuffer {
  const binaryString = atob(base64PCM);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 16-bit signed PCM
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }

  const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
  audioBuffer.copyToChannel(float32, 0);
  return audioBuffer;
}

export async function speakText(
  text: string,
  onEnd?: () => void,
  voiceName: string = 'Kore'
): Promise<void> {
  stopSpeaking();

  try {
    // Attempt Gemini high-fidelity server TTS first
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: voiceName }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audio) {
        const ctx = getAudioContext();
        const buffer = pcm16ToAudioBuffer(ctx, data.audio);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        currentSourceNode = source;

        source.onended = () => {
          currentSourceNode = null;
          onEnd?.();
        };

        source.start(0);
        return;
      }
    }
  } catch (err) {
    console.warn('Server TTS unavailable, falling back to Web Speech API:', err);
  }

  // Fallback: Web Speech API
  if ('speechSynthesis' in window) {
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#*_`]/g, '')
      .slice(0, 1000);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  } else {
    onEnd?.();
  }
}
