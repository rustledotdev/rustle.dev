"use client";
function cleanTranslation(translation) {
  if (!translation || typeof translation !== "string") {
    return translation;
  }
  let cleaned = translation.trim();
  while (cleaned.startsWith('"') && cleaned.endsWith('"') || cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  cleaned = cleaned.replace(/^["'`„""''«»‹›]+|["'`„""''«»‹›]+$/g, "");
  cleaned = cleaned.replace(/^\s*["']+\s*|\s*["']+\s*$/g, "");
  cleaned = cleaned.replace(/^(Translation|Traducción|Traduction|Übersetzung|Traduzione|Tradução|翻译|翻譯|번역|翻訳|Перевод|ترجمة):\s*/i, "");
  cleaned = cleaned.replace(/^(Here is the translation|The translation is|Translated text):\s*/i, "");
  cleaned = cleaned.replace(/^(Voici la traduction|La traduction est|Texte traduit):\s*/i, "");
  cleaned = cleaned.replace(/^(Hier ist die Übersetzung|Die Übersetzung ist|Übersetzter Text):\s*/i, "");
  cleaned = cleaned.replace(/^(Ecco la traduzione|La traduzione è|Testo tradotto):\s*/i, "");
  cleaned = cleaned.replace(/^(Aquí está la traducción|La traducción es|Texto traducido):\s*/i, "");
  cleaned = cleaned.replace(/^\*\*(.*)\*\*$/, "$1");
  cleaned = cleaned.replace(/^\*(.*)\*$/, "$1");
  cleaned = cleaned.replace(/^`(.*)`$/, "$1");
  cleaned = cleaned.replace(/^_(.*?)_$/, "$1");
  cleaned = cleaned.replace(/^\{["']?text["']?\s*:\s*["'](.*)["']\}$/i, "$1");
  cleaned = cleaned.replace(/^\{["']?translation["']?\s*:\s*["'](.*)["']\}$/i, "$1");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (cleaned.length > 2) {
    const quotePatterns = [
      /^"([^"]*)"$/,
      // Double quotes
      /^'([^']*)'$/,
      // Single quotes
      /^`([^`]*)`$/,
      // Backticks
      /^„([^"]*)"$/,
      // German quotes
      /^«([^»]*)»$/,
      // French quotes
      /^‹([^›]*)›$/,
      // Single French quotes
      /^"([^"]*)"$/,
      // Smart quotes
      /^'([^']*)'$/
      // Smart single quotes
    ];
    for (const pattern of quotePatterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        const inner = match[1];
        const quoteChar = cleaned[0];
        if (quoteChar && !inner.includes(quoteChar)) {
          cleaned = inner.trim();
          break;
        }
      }
    }
  }
  cleaned = cleaned.replace(/^["'`„""''«»‹›]+|["'`„""''«»‹›]+$/g, "").trim();
  return cleaned;
}
function cleanHTMLTranslation(htmlString) {
  if (!htmlString || typeof htmlString !== "string") {
    return htmlString;
  }
  return htmlString.replace(/>([^<]+)</g, (match, textContent) => {
    const cleaned = cleanTranslation(textContent);
    return `>${cleaned}<`;
  });
}
function cleanBatchTranslations(translations) {
  const cleaned = {};
  for (const [key, value] of Object.entries(translations)) {
    cleaned[key] = cleanTranslation(value);
  }
  return cleaned;
}
function sanitizeHTML(html) {
  return html.replace(/<script[^>]*>.*?<\/script>/gis, "").replace(/<iframe[^>]*>.*?<\/iframe>/gis, "").replace(/<object[^>]*>.*?<\/object>/gis, "").replace(/<embed[^>]*>/gis, "").replace(/on\w+\s*=\s*["'][^"']*["']/gis, "").replace(/javascript:/gis, "").replace(/data:(?!image\/)/gis, "").replace(/<link[^>]*>/gis, "").replace(/<meta[^>]*>/gis, "");
}
function cleanTranslationWithContext(translation, context = {}) {
  if (!translation) return translation;
  let cleaned = context.isHTML ? cleanHTMLTranslation(translation) : cleanTranslation(translation);
  if (context.originalText && context.targetLanguage) {
    if (cleaned === context.originalText && context.targetLanguage !== context.sourceLanguage) {
      return cleaned;
    }
  }
  return cleaned;
}
function generateContentFingerprint(text) {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
  return hexHash.substring(0, 12);
}
function generateContentHash(text) {
  return generateContentFingerprint(text);
}
function isTranslatableText(text) {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (/^[0-9\s\-_.,;:!?()[\]{}]+$/.test(trimmed)) return false;
  if (/^[A-Z_][A-Z0-9_]*$/.test(trimmed)) return false;
  if (trimmed.startsWith("http")) return false;
  if (trimmed.includes("{{") || trimmed.includes("${")) return false;
  return true;
}
export {
  generateContentHash as a,
  cleanBatchTranslations as b,
  cleanTranslation as c,
  cleanTranslationWithContext as d,
  generateContentFingerprint as g,
  isTranslatableText as i,
  sanitizeHTML as s
};
