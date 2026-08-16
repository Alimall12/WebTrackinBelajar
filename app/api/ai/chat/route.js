import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { callGeminiAPI } from "@/lib/gemini/client";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, context } = await request.json();
  const videoUrl = context?.videoUrl || null;

  // Rate limit check: 20 requests per 3 jam
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const { data: recentRequests, error: countError } = await supabase
    .from("ai_requests")
    .select("id")
    .eq("user_id", user.id)
    .gte("request_at", threeHoursAgo);

  if (countError) {
    console.error("Error checking rate limit:", countError);
    return NextResponse.json(
      { error: "Gagal memeriksa rate limit" },
      { status: 500 }
    );
  }

  const requestCount = recentRequests?.length || 0;

  if (requestCount >= 20) {
    const resetAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    return NextResponse.json(
      {
        error:
          "Anda sudah menggunakan 20 request AI Mentor dalam 3 jam terakhir. Silakan coba lagi nanti untuk menjaga kualitas layanan tetap optimal.",
        remaining: 0,
        resetAt,
      },
      {
        status: 429,
        headers: { "Retry-After": "10800" }, // 3 jam dalam detik
      }
    );
  }

  // Build system prompt dengan context dari frontend
  const systemPrompt = buildSystemPrompt({
    ...context,
    hasVideo: !!videoUrl,
  });

  try {
    // Panggil Gemini API
    const { text, inputTokens, outputTokens } = await callGeminiAPI(
      message,
      systemPrompt,
      videoUrl
    );

    // Log request ke database
    const { error: insertError } = await supabase.from("ai_requests").insert({
      user_id: user.id,
      message_tokens: inputTokens,
      response_tokens: outputTokens,
    });

    if (insertError) {
      console.error("Error logging AI request:", insertError);
      // Jangan gagalkan response, cukup log saja
    }

    const remaining = 20 - requestCount - 1;
    const resetAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      reply: text,
      remaining,
      resetAt,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    // Handle rate limit dari Google
    if (error.isRateLimit) {
      return NextResponse.json(
        {
          error:
            "AI Mentor sedang ramai dipakai, coba lagi sebentar lagi. Terima kasih atas pengertiannya! 🙏",
        },
        { status: 503 }
      );
    }

    // Error umum
    return NextResponse.json(
      {
        error:
          "Maaf, terjadi kesalahan saat menghubungi AI Mentor. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
