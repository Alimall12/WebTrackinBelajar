"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Play } from "lucide-react";

// ponytail: quick replies statis, tidak perlu AI-generated
const QUICK_REPLIES = [
  "Jelasin konsep utama di video ini",
  "Bikin contoh soal yang mirip",
  "Rumus apa aja yang wajib diingat?",
  "Tips & trik biar bisa jawab cepat",
];

const FOLLOW_UPS = [
  "Bisa jelasin lebih detail?",
  "Ada tips lain gak?",
  "Contoh soalnya dong",
];

export default function AIChat({ mode = "floating", context = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ponytail: extend sendMessage untuk support quick-reply tanpa event
  async function sendMessage(e, quickText) {
    if (e) e.preventDefault();
    const msg = quickText || input.trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context }),
      });

      if (!res.ok) throw new Error("Gagal menghubungi AI");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Maaf, terjadi kesalahan. Coba lagi nanti." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (mode === "embedded") {
    return (
      <div className="flex h-full flex-col">
        {/* Header dengan konteks video */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">AI Mentor</h3>
              {context.subtopicName && (
                <p className="truncate text-xs opacity-90 flex items-center gap-1">
                  <Play className="h-3 w-3 shrink-0" />
                  {context.subtopicName}
                </p>
              )}
            </div>
          </div>
        </div>
        <ChatMessages
          messages={messages}
          loading={loading}
          messagesEndRef={messagesEndRef}
          sendMessage={sendMessage}
          hasContext={!!(context.topicName || context.subtopicName)}
          hasVideo={!!context.videoUrl}
        />
        <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} loading={loading} />
      </div>
    );
  }

  // floating mode
  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-brand-700"
          title="Buka AI Mentor"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[80vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">AI Mentor</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ChatMessages messages={messages} loading={loading} messagesEndRef={messagesEndRef} sendMessage={sendMessage} />
          <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} loading={loading} />
        </div>
      )}
    </>
  );
}

// ponytail: render markdown bold dengan regex sederhana, no library
function renderBold(text) {
  return text.split(/(\*\*.*?\*\*)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function ChatMessages({ messages, loading, messagesEndRef, sendMessage, hasContext, hasVideo }) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center text-center text-sm">
          <Sparkles className="mb-2 h-8 w-8 text-brand-400" />
          <p className="mb-4 text-slate-600">
            {hasContext
              ? "Hai! Ada yang bisa aku bantu tentang video ini?"
              : "Tanya AI Mentor tentang strategi belajar, konsep materi, atau tips ujian!"}
          </p>
          {hasContext && (
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(null, q)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {messages.map((msg, i) => (
        <div key={i}>
          <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              {msg.role === "assistant" ? renderBold(msg.content) : msg.content}
            </div>
          </div>
          {/* ponytail: follow-up chips statis setelah AI reply */}
          {msg.role === "assistant" && i === messages.length - 1 && !loading && (
            <div className="mt-2 flex flex-wrap gap-2">
              {FOLLOW_UPS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(null, q)}
                  className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {hasVideo ? "AI sedang menganalisis video..." : "AI sedang memikirkan..."}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

function ChatInput({ input, setInput, sendMessage, loading }) {
  return (
    <form onSubmit={sendMessage} className="border-t border-slate-200 p-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya sesuatu..."
          className="input flex-1 !py-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary !px-3 !py-2"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
