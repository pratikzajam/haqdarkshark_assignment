import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let geminiClientInstance = null;

export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Returns a configured instance of GoogleGenAI SDK.
 * Lazily initialized and caches client instance.
 * @returns {GoogleGenAI|null}
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    return null;
  }

  if (!geminiClientInstance) {
    geminiClientInstance = new GoogleGenAI({ apiKey });
  }

  return geminiClientInstance;
}

/**
 * Reset client (for testing or key updates)
 */
export function resetGeminiClient() {
  geminiClientInstance = null;
}
