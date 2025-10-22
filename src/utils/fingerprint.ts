/**
 * Simple hash function for generating fingerprints and content hashes
 * This is a basic implementation - in production, you might want to use crypto.subtle or a proper hash library
 */
export function simpleHash(input: string): string {
  let hash = 0;
  if (input.length === 0) return hash.toString();
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Generate a stable fingerprint for a translatable node
 * Format: sha1(relativeFilePath + ":" + nodeStartPosition)
 */
export function generateFingerprint(filePath: string, startPosition: number): string {
  const input = `${filePath}:${startPosition}`;
  return `fp_${simpleHash(input)}`;
}

/**
 * Generate content hash for detecting content changes
 * Format: sha1(normalizedText)
 */
export function generateContentHash(text: string): string {
  // Normalize text by trimming whitespace and converting to lowercase
  const normalizedText = text.trim().toLowerCase();
  return `ch_${simpleHash(normalizedText)}`;
}

/**
 * Extract tags from an element's hierarchy
 */
export function extractTags(element: Element): string[] {
  const tags: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body) {
    tags.unshift(current.tagName.toLowerCase());
    current = current.parentElement;
  }
  
  return tags.slice(0, 5); // Limit to 5 levels for performance
}

/**
 * Normalize text content for consistent processing
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();
}

/**
 * Check if text is translatable (not empty, not just numbers/symbols)
 */
export function isTranslatableText(text: string): boolean {
  const normalized = normalizeText(text);
  
  // Skip empty text
  if (!normalized) return false;
  
  // Skip text that's only numbers, punctuation, or symbols
  if (/^[\d\s\p{P}\p{S}]+$/u.test(normalized)) return false;
  
  // Skip very short text (less than 2 characters)
  if (normalized.length < 2) return false;
  
  // Skip text that looks like code or technical identifiers
  if (/^[A-Z_][A-Z0-9_]*$/.test(normalized)) return false;
  
  return true;
}

/**
 * Generate a unique ID for translation requests
 */
export function generateTranslationId(): string {
  return `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
