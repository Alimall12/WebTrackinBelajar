// lib/gemini/client.js
// Gemini API client dengan error handling, retry logic, dan token tracking

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash";
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);
console.log("GEMINI_MODEL:", MODEL_NAME);

/**
 * Panggil Gemini API dengan system instruction dan user message.
 * @param {string} userMessage - Pesan dari user
 * @param {string} systemPrompt - System instruction dari buildSystemPrompt()
 * @param {string|null} videoUrl - YouTube URL (https://www.youtube.com/watch?v=...) opsional
 * @returns {Promise<{text: string, inputTokens: number, outputTokens: number}>}
 * @throws Error dengan property `isRateLimit` jika kena 429 dari Google
 */
export async function callGeminiAPI(userMessage, systemPrompt, videoUrl = null) {
  const maxRetries = 2;
  const timeout = videoUrl ? 30000 : 15000; // 30 detik untuk video, 15 detik untuk teks

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Build contents: video part (jika ada) + text part
      const parts = [];
      
      if (videoUrl) {
        parts.push({
          file_data: {
            file_uri: videoUrl,
            mime_type: "video/*",
          },
        });
      }
      
      parts.push({ text: userMessage });

      // ponytail: log request untuk debugging (comment out di production)
      console.log("Gemini API Request:", {
        model: MODEL_NAME,
        partsCount: parts.length,
        hasVideo: !!videoUrl,
        videoUrl: videoUrl || "none",
        messageLength: userMessage.length,
      });

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: parts,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 350, // ponytail: batasi output ~80-120 kata
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = response.text || "";
      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

      console.log("Gemini API Response:", {
        success: true,
        inputTokens,
        outputTokens,
        responseLength: text.length,
      });

      return { text, inputTokens, outputTokens };
    } catch (error) {
      console.error("Gemini API error (attempt " + (attempt + 1) + "):", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        code: error.code,
      });

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

      // Video terlalu panjang atau tidak didukung
      if (
        error.message?.includes("video") ||
        error.message?.includes("duration") ||
        error.message?.includes("file_data") ||
        error.status === 400
      ) {
        // ponytail: log error asli lengkap sebelum throw custom message
        console.error("Original Gemini API error details:", {
          status: error.status,
          statusText: error.statusText,
          code: error.code,
          originalMessage: error.message,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });

        const customError = new Error(
          "Video terlalu panjang atau tidak bisa diproses. Coba tanyakan tentang materi secara umum."
        );
        // Simpan informasi asli sebagai properti Error object
        customError.originalStatus = error.status;
        customError.originalStatusText = error.statusText;
        customError.originalMessage = error.message;
        customError.originalCode = error.code;
        throw customError;
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
