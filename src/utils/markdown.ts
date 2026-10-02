import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Separate thinking / reasoning tags if present in the text
 * Some reasoning models output <thought>...</thought> or <think>...</think>
 */
export function extractThinking(text: string): { thinking: string | null; cleanText: string } {
  const thinkMatch = text.match(/<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/i);
  if (thinkMatch) {
    const thinking = thinkMatch[1].trim();
    const cleanText = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/i, '').trim();
    return { thinking, cleanText };
  }

  // Check if thinking is still currently in-flight during streaming (unclosed tag)
  const openMatch = text.match(/<think(?:ing)?>([\s\S]*)$/i);
  if (openMatch) {
    return {
      thinking: openMatch[1].trim(),
      cleanText: '',
    };
  }

  return { thinking: null, cleanText: text };
}

/**
 * Render Markdown to HTML string
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  try {
    return marked.parse(markdown) as string;
  } catch (err) {
    console.error('Markdown parse error:', err);
    return markdown;
  }
}

/**
 * Check if code block language is previewable (HTML/JS/SVG/CSS)
 */
export function isPreviewableCode(lang: string, code: string): boolean {
  const normalized = (lang || '').toLowerCase().trim();
  if (['html', 'htm', 'svg'].includes(normalized)) return true;
  if (['javascript', 'js'].includes(normalized) && (code.includes('document.') || code.includes('<'))) return true;
  return false;
}
