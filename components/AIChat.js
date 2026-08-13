"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

export default function AIChat({ mode = "floating", context = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), context }),
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
        <div className="flex items-center gap-2 border-b border-slate-200 bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-white">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">AI Mentor</h3>
        </div>
        <ChatMessages messages={messages} loading={loading} messagesEndRef={messagesEndRef} />
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
        <div className="fixed bottom-6 right-6 z-40 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
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
          <ChatMessages messages={messages} loading={loading} messagesEndRef={messagesEndRef} />
          <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} loading={loading} />
        </div>
      )}
    </>
  );
}

function ChatMessages({ messages, loading, messagesEndRef }) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
          <div>
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-brand-400" />
            <p>Tanya AI Mentor tentang strategi belajar, konsep materi, atau tips ujian!</p>
          </div>
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI sedang memikirkan...
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
