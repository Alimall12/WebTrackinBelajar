# Implementasi Video Understanding - AI Mentor

## Overview
AI Mentor sekarang bisa menganalisis isi video YouTube yang sedang ditonton user, bukan hanya mengetahui judul topik/subtopik.

## Perubahan yang Dilakukan

### 1. **VideoOverlay.js** - Menambahkan videoUrl ke chatContext
```javascript
const chatContext = {
  topicName: subtopic.topic_name,
  subtopicName: subtopic.subtopic_name,
  videoUrl: subtopic.video_id ? `https://www.youtube.com/watch?v=${subtopic.video_id}` : null,
};
```

### 2. **AIChat.js** - Teruskan videoUrl dan update loading message
- Context dengan `videoUrl` diteruskan ke API
- Loading message dinamis: "AI sedang menganalisis video..." jika ada video

### 3. **app/api/ai/chat/route.js** - Extract videoUrl dan teruskan ke Gemini
```javascript
const { message, context } = await request.json();
const videoUrl = context?.videoUrl || null;

const systemPrompt = buildSystemPrompt({
  ...context,
  hasVideo: !!videoUrl,
});

const { text, inputTokens, outputTokens } = await callGeminiAPI(
  message,
  systemPrompt,
  videoUrl
);
```

### 4. **lib/gemini/client.js** - Implementasi Video Input
```javascript
export async function callGeminiAPI(userMessage, systemPrompt, videoUrl = null) {
  const timeout = videoUrl ? 30000 : 15000; // 30 detik untuk video

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

  const response = await ai.models.generateContent({
    model: videoUrl ? "gemini-2.0-flash-exp" : "gemini-1.5-flash",
    contents: parts,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 350,
    },
    signal: controller.signal,
  });
}
```

**Error Handling untuk Video:**
- Video terlalu panjang atau tidak didukung (400 error)
- Fallback message yang jelas ke user

### 5. **lib/ai/systemPrompt.js** - Instruksi untuk Video
```javascript
if (hasVideo) {
  prompt += `
VIDEO PEMBELAJARAN:
User sedang menonton video pembelajaran. Video ini SUDAH tersedia sebagai input, jadi Anda BISA:
- Merangkum isi video
- Menjelaskan konsep yang dibahas di video
- Menjawab pertanyaan spesifik tentang bagian tertentu video
- Memberikan tips tambahan terkait materi di video

PENTING untuk video berisi soal latihan:
- Jelaskan CARA BERPIKIR dan KONSEP yang dipakai, bukan langsung kasih jawaban.
- Jika video adalah tryout resmi, jangan bocorkan kunci jawaban — arahkan ke pemahaman konsep.
`;
}
```

## Contoh Request Body ke Gemini API

### Request TANPA Video (Chat Umum)
```json
{
  "model": "gemini-1.5-flash",
  "contents": [
    { "text": "Jelasin konsep limit fungsi" }
  ],
  "config": {
    "systemInstruction": "Anda adalah AI Mentor untuk platform belajar SNBT/UTBK...",
    "maxOutputTokens": 350
  }
}
```

### Request DENGAN Video
```json
{
  "model": "gemini-2.0-flash-exp",
  "contents": [
    {
      "file_data": {
        "file_uri": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "mime_type": "video/*"
      }
    },
    { "text": "Jelasin konsep utama di video ini" }
  ],
  "config": {
    "systemInstruction": "Anda adalah AI Mentor untuk platform belajar SNBT/UTBK...\n\nVIDEO PEMBELAJARAN:\nUser sedang menonton video pembelajaran. Video ini SUDAH tersedia sebagai input...",
    "maxOutputTokens": 350
  }
}
```

## Model yang Digunakan

- **Tanpa video**: `gemini-1.5-flash` (stable, cepat)
- **Dengan video**: `gemini-2.0-flash-exp` (experimental, mendukung YouTube URL langsung)

## Timeout

- **Tanpa video**: 15 detik
- **Dengan video**: 30 detik (video processing lebih lambat)

## Error Handling

1. **Rate limit (429)**: Pesan user-friendly tanpa retry
2. **Video error (400)**: Deteksi video terlalu panjang/tidak didukung
3. **Timeout**: Exponential backoff retry (max 2 retry)
4. **Server error (5xx)**: Auto retry

## Limitasi & Catatan

### Gemini API YouTube URL (Preview Feature)
- **Status**: Experimental/preview
- **Batasan durasi**: Video sangat panjang (>1 jam) mungkin gagal
- **Quota harian**: Tergantung API key tier
- **Caption**: AI menganalisis audio/visual langsung, tidak butuh caption manual

### Best Practices
1. Test dengan video pendek dulu (<10 menit)
2. Monitor response time di production
3. Jika video gagal, AI tetap bisa jawab berdasarkan context (topicName/subtopicName)
4. Loading state sudah di-handle di UI

## Testing Checklist

- [x] Lint passed (no errors)
- [ ] Build berhasil (`npm run build`)
- [ ] Test dengan video pendek di dev mode
- [ ] Cek console log untuk request body yang dikirim
- [ ] Verify AI bisa merangkum isi video
- [ ] Test error handling (video invalid, terlalu panjang)
- [ ] Test fallback (tanpa video, chat umum tetap berfungsi)

## Debugging

Untuk melihat request body yang dikirim ke Gemini, tambahkan log di `lib/gemini/client.js`:

```javascript
console.log("Gemini API Request:", {
  model: videoUrl ? "gemini-2.0-flash-exp" : "gemini-1.5-flash",
  hasParts: parts.length,
  hasVideo: !!videoUrl,
  videoUrl,
  userMessage,
});
```

## Next Steps (Opsional)

1. **Cache video analysis**: Simpan rangkuman video pertama kali ke DB untuk re-use
2. **Timestamp references**: AI bisa reference timestamp spesifik di video
3. **Video quality check**: Validasi video_id valid sebelum kirim ke API
4. **Analytics**: Track video understanding success rate
