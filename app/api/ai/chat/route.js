import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, context } = await request.json();

  // STUB: Gemini API belum di-hook up. Untuk sekarang, kembalikan placeholder.
  // Nanti: panggil Gemini API dengan systemPrompt dari lib/ai/systemPrompt.js

  const placeholderReply =
    "🚧 Fitur AI Mentor sedang dalam pengembangan. Integrasi Gemini API akan segera aktif. Untuk sementara, Anda bisa bertanya ke mentor atau teman belajar!";

  return NextResponse.json({ reply: placeholderReply });
}
