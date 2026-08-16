## Contoh Console Log yang Akan Terlihat

### Skenario 1: User Bertanya Tanpa Video (Chat Umum)

**Request dari Frontend:**
```javascript
POST /api/ai/chat
{
  "message": "Jelasin konsep limit fungsi",
  "context": {
    "topicName": "Matematika Dasar",
    "subtopicName": null,
    "videoUrl": null
  }
}
```

**Console Log di Server:**
```
Gemini API Request: {
  model: 'gemini-1.5-flash',
  partsCount: 1,
  hasVideo: false,
  videoUrl: 'none',
  messageLength: 25
}

Gemini API Response: {
  success: true,
  inputTokens: 142,
  outputTokens: 98,
  responseLength: 387
}
```

**Request Body Actual ke Gemini API:**
```json
{
  "model": "gemini-1.5-flash",
  "contents": [
    {
      "text": "Jelasin konsep limit fungsi"
    }
  ],
  "config": {
    "systemInstruction": "Anda adalah AI Mentor untuk platform belajar SNBT/UTBK \"StemsatoPTN\".\n\nATURAN KETAT:\n1. Anda HANYA boleh berperan sebagai pembimbing/pembina belajar SNBT/UTBK.\n...\n\nKONTEKS SAAT INI:\nUser sedang mempelajari materi:\n- Topik: Matematika Dasar\n- Subtopik: —\n\nPrioritaskan menjawab pertanyaan terkait materi ini...",
    "maxOutputTokens": 350
  }
}
```

---

### Skenario 2: User Bertanya Tentang Video yang Sedang Ditonton

**Request dari Frontend:**
```javascript
POST /api/ai/chat
{
  "message": "Jelasin konsep utama di video ini",
  "context": {
    "topicName": "Penalaran Matematika",
    "subtopicName": "Barisan dan Deret Aritmatika",
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
}
```

**Console Log di Server:**
```
Gemini API Request: {
  model: 'gemini-2.0-flash-exp',
  partsCount: 2,
  hasVideo: true,
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  messageLength: 30
}

Gemini API Response: {
  success: true,
  inputTokens: 1847,
  outputTokens: 112,
  responseLength: 456
}
```

**Request Body Actual ke Gemini API:**
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
    {
      "text": "Jelasin konsep utama di video ini"
    }
  ],
  "config": {
    "systemInstruction": "Anda adalah AI Mentor untuk platform belajar SNBT/UTBK \"StemsatoPTN\".\n\nATURAN KETAT:\n1. Anda HANYA boleh berperan sebagai pembimbing/pembina belajar SNBT/UTBK.\n...\n\nKONTEKS SAAT INI:\nUser sedang mempelajari materi:\n- Topik: Penalaran Matematika\n- Subtopik: Barisan dan Deret Aritmatika\n\nPrioritaskan menjawab pertanyaan terkait materi ini...\n\nVIDEO PEMBELAJARAN:\nUser sedang menonton video pembelajaran. Video ini SUDAH tersedia sebagai input, jadi Anda BISA:\n- Merangkum isi video\n- Menjelaskan konsep yang dibahas di video\n- Menjawab pertanyaan spesifik tentang bagian tertentu video\n- Memberikan tips tambahan terkait materi di video\n\nPENTING untuk video berisi soal latihan:\n- Jelaskan CARA BERPIKIR dan KONSEP yang dipakai, bukan langsung kasih jawaban.\n- Jika video adalah tryout resmi, jangan bocorkan kunci jawaban — arahkan ke pemahaman konsep.",
    "maxOutputTokens": 350
  }
}
```

**Catatan:**
- `inputTokens` jauh lebih besar (1847 vs 142) karena video content ikut diproses
- Model berubah dari `gemini-1.5-flash` ke `gemini-2.0-flash-exp`
- Response time ~5-15 detik untuk video pendek, ~20-30 detik untuk video panjang

---

### Skenario 3: Error - Video Terlalu Panjang

**Console Log:**
```
Gemini API Request: {
  model: 'gemini-2.0-flash-exp',
  partsCount: 2,
  hasVideo: true,
  videoUrl: 'https://www.youtube.com/watch?v=VERY_LONG_VIDEO',
  messageLength: 25
}

Gemini API error (attempt 1): Video duration exceeds maximum allowed

Gemini API error (attempt 2): Video duration exceeds maximum allowed

Gemini API error (attempt 3): Video duration exceeds maximum allowed
```

**Response ke User:**
```json
{
  "error": "Video terlalu panjang atau tidak bisa diproses. Coba tanyakan tentang materi secara umum.",
  "status": 500
}
```

---

### Skenario 4: Error - Rate Limit dari Google

**Console Log:**
```
Gemini API Request: {
  model: 'gemini-2.0-flash-exp',
  partsCount: 2,
  hasVideo: true,
  videoUrl: 'https://www.youtube.com/watch?v=abc123',
  messageLength: 30
}

Gemini API error (attempt 1): 429 Too Many Requests
```

**Response ke User:**
```json
{
  "error": "AI Mentor sedang ramai dipakai, coba lagi sebentar lagi. Terima kasih atas pengertiannya! 🙏",
  "status": 503
}
```

---

## Cara Test di Development

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Buka halaman Materi dan putar video**

3. **Klik AI Mentor dan tanya:**
   - "Jelasin konsep utama di video ini"
   - "Rumus apa yang dijelaskan?"
   - "Bikin contoh soal yang mirip"

4. **Check Browser Console (F12)** untuk request/response

5. **Check Terminal/Server Console** untuk log:
   ```
   Gemini API Request: { ... }
   Gemini API Response: { ... }
   ```

6. **Verify:**
   - ✅ AI merespons berdasarkan ISI video, bukan cuma judul
   - ✅ Loading message: "AI sedang menganalisis video..."
   - ✅ Response time ~5-30 detik tergantung durasi video
   - ✅ Error handling jika video invalid/terlalu panjang

---

## Production Checklist

Sebelum deploy ke production:

- [ ] **Remove/Comment console.log** di `lib/gemini/client.js` (baris 42-48 dan 66-71) untuk performa
- [ ] **Test dengan video pendek dulu** (<5 menit) untuk verify API key quota
- [ ] **Monitor error rate** di Supabase/logs untuk video errors
- [ ] **Set alert** jika rate limit sering terjadi
- [ ] **Dokumentasikan** ke admin: video >30 menit mungkin gagal
