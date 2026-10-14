// backend/src/config/ai-providers.js
// One place for AI model names. Providers retire models regularly, so every
// name can be overridden from the environment without a code change.
import dotenv from 'dotenv';

dotenv.config();

export const MODELS = {
  groqText: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqFast: process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant',
  groqWhisper: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3',
  geminiText: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiVision: process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  openrouterText: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
};

/**
 * Gemini generationConfig. 2.5 Flash models "think" by default and that
 * budget comes out of maxOutputTokens, which leaves short answers empty —
 * so thinking is switched off for them.
 */
export const geminiGenerationConfig = (model, { temperature = 0.5, maxTokens = 800, json = false } = {}) => {
  const cfg = { temperature, maxOutputTokens: maxTokens };
  if (json) cfg.responseMimeType = 'application/json';
  if (/2\.5-flash/.test(model)) cfg.thinkingConfig = { thinkingBudget: 0 };
  return cfg;
};

export const hasKey = {
  groq: () => !!process.env.GROQ_API_KEY,
  gemini: () => !!process.env.GEMINI_API_KEY,
  openrouter: () => !!process.env.OPENROUTER_API_KEY,
};
