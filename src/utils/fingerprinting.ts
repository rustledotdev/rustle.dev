'use client';

/**
 * Shared fingerprinting utilities for both CLI and runtime
 * Ensures consistent fingerprint generation across all environments
 */

/**
 * Generate a content-based fingerprint for text
 * This function must produce identical results in both Node.js (CLI) and browser (runtime)
 */
export function generateContentFingerprint(text: string): string {
  // Normalize the text consistently
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Use a simple hash function that works in both Node.js and browser
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex and ensure consistent length
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return hexHash.substring(0, 12);
}

/**
 * Generate a content hash for change detection
 */
export function generateContentHash(text: string): string {
  // Use the same logic as fingerprint for simplicity
  return generateContentFingerprint(text);
}

/**
 * Normalize text for consistent processing
 */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check if text is translatable
 */
export function isTranslatableText(text: string): boolean {
  const trimmed = text.trim();
  
  // Skip empty, very short, or code-like content
  if (trimmed.length < 2) return false;
  if (/^[0-9\s\-_.,;:!?()[\]{}]+$/.test(trimmed)) return false; // Only punctuation/numbers
  if (/^[A-Z_][A-Z0-9_]*$/.test(trimmed)) return false; // Constants like API_KEY
  if (trimmed.startsWith('http')) return false; // URLs
  if (trimmed.includes('{{') || trimmed.includes('${')) return false; // Template strings
  
  return true;
}
