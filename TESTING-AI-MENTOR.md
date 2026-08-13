# AI Mentor Implementation - Testing Guide

## ✅ Completed Steps

### 1. SDK Installation
- ✅ Installed `@google/genai` v2.17.0
- ✅ Model tested: `gemini-3.6-flash` (stable, free tier)

### 2. Database Migration
- ✅ Created `supabase/apply-ai-requests.sql`
- ✅ Updated `supabase/schema.sql` with ai_requests table
- ✅ **STATUS: APPLIED** (sudah run manual di Supabase Dashboard)

### 3. Gemini Client
- ✅ Created `lib/gemini/client.js`
- Features: timeout 15s, retry 2x, token tracking

### 4. API Route
- ✅ Updated `app/api/ai/chat/route.js`
- Features: auth, rate limit 20/3h, error handling

### 5. Schema Update
- ✅ Added ai_requests table to schema.sql

---

## 🧪 Manual Testing Instructions

### Test 1: Basic AI Chat
1. Buka http://localhost:3000
2. Login
3. Klik AI Mentor button (kanan bawah)
4. Kirim: "Jelaskan strategi mengerjakan soal penalaran umum"
5. **Expected:** dapat response dari Gemini dalam Bahasa Indonesia

### Test 2: Rate Limit (21 Requests)
Buka console browser (F12), jalankan:
```javascript
async function testRateLimit() {
  for (let i = 1; i <= 21; i++) {
    console.log(`Request ${i}/21...`);
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Test ${i}`, context: {} })
    });
    const data = await res.json();
    console.log(`Response ${i}:`, data);
    if (res.status === 429) {
      console.log('✅ Rate limit triggered!');
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}
testRateLimit();
```
**Expected:** Request 1-20 sukses, request 21 dapat error 429

### Test 3: Database Verification
```sql
-- Check ai_requests table
SELECT * FROM ai_requests ORDER BY request_at DESC LIMIT 10;

-- Check user's request count
SELECT user_id, COUNT(*) as requests
FROM ai_requests 
WHERE request_at >= NOW() - INTERVAL '3 hours'
GROUP BY user_id;
```

---

## 📁 Files Modified

- ✅ `lib/gemini/client.js` (NEW)
- ✅ `app/api/ai/chat/route.js` (UPDATED)
- ✅ `supabase/apply-ai-requests.sql` (NEW)
- ✅ `supabase/schema.sql` (UPDATED)
- ✅ `package.json` (added @google/genai)

---

## 🐛 Troubleshooting

**Error: "Table ai_requests does not exist"**
→ Run `supabase/apply-ai-requests.sql` di Supabase Dashboard

**Error: "GEMINI_API_KEY is not defined"**
→ Check `.env.local` dan restart dev server

**No response from AI**
→ Check console/terminal for errors, verify API key

---

Generated: 2026-08-13
