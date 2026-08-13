// scripts/test-gemini.mjs
// Simple test untuk verifikasi Gemini API bisa dipanggil
import { GoogleGenAI } from '@google/genai';

const apiKey = "AIzaSyCZO6mV9TP1M9EDVXgqVE9i-28KUwmJIJ0";

async function testGemini() {
  console.log('Testing Gemini API connection...\n');
  
  // Try different model names (based on 2026 docs)
  const modelsToTry = [
    "gemini-3.6-flash",      // Latest stable flash model
    "gemini-3.5-flash",      // Stable model for agentic tasks
    "gemini-3.5-flash-lite", // Fastest model
    "gemini-3-flash",        // Frontier-class performance
    "gemini-3.1-flash-lite"  // Cost-efficient
  ];
  
  for (const modelName of modelsToTry) {
    console.log(`Trying model: ${modelName}...`);
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "Jelaskan dalam 1 kalimat apa itu UTBK",
        config: {
          systemInstruction: "Anda adalah AI Mentor untuk belajar SNBT/UTBK. Jawab dengan singkat dan jelas dalam Bahasa Indonesia."
        }
      });
      
      console.log(`\n✓ Model ${modelName} berhasil!`);
      console.log('Response:', response.text);
      console.log('\nToken usage:');
      console.log('  - Input tokens:', response.usageMetadata?.promptTokenCount || 0);
      console.log('  - Output tokens:', response.usageMetadata?.candidatesTokenCount || 0);
      console.log(`\n✓ Gunakan model: ${modelName}`);
      break;
      
    } catch (error) {
      console.log(`✗ Model ${modelName} tidak tersedia: ${error.message}\n`);
    }
  }
}

testGemini();

