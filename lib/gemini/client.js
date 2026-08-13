// lib/gemini/client.js
// Gemini API client dengan error handling, retry logic, dan token tracking

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Panggil Gemini API dengan system instruction dan user message.
 * @param {string} userMessage - Pesan dari user
 * @param {string} systemPrompt - System instruction dari buildSystemPrompt()
 * @returns {Promise<{text: string, inputTokens: number, outputTokens: number}>}
 * @throws Error dengan property `isRateLimit` jika kena 429 dari Google
 */
export async function callGeminiAPI(userMessage, systemPrompt) {
  const maxRetries = 2;
  const timeout = 15000; // 15 detik

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = response.text || "";
      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

      return { text, inputTokens, outputTokens };
    } catch (error) {
      // Timeout
      if (error.name === "AbortError") {
        if (attempt < maxRetries) {
          await sleep(Math.pow(2, attempt) * 1000); // exponential backoff
          continue;
        }
        throw new Error("Gemini API timeout setelah 15 detik");
      }

      // Rate limit dari Google (429) — jangan retry, propagate langsung
      if (error.status === 429 || error.message?.includes("429")) {
        const rateLimitError = new Error(
          "Gemini API sedang ramai, coba lagi sebentar"
        );
        rateLimitError.isRateLimit = true;
        throw rateLimitError;
      }

      // Server error 5xx — retry
      if (error.status >= 500 && attempt < maxRetries) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      // Error lain — propagate
      throw new Error(`Gemini API error: ${error.message || error}`);
    }
  }

  throw new Error("Gemini API gagal setelah retry");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
