"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatApiResponse = {
  reply?: string;
  error?: string;
};

type Chip = {
  label: string;
  text: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Tell me your craving (spicy/light/comfort/high-protein), budget, and what you have at home.",
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const chips: Chip[] = [
    { label: "High protein 💪", text: "I want a high-protein meal (target ~30g). " },
    { label: "Spicy 🌶️", text: "I want something spicy. " },
    { label: "Quick ⏱️", text: "I want something quick (under 15 minutes). " },
    { label: "Under ₹200 💸", text: "My budget is under ₹200. " },
    { label: "Veg only 🥦", text: "Vegetarian only. " },
  ];

  function applyChip(chipText: string) {
    if (isLoading) return;
    setInput((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return chipText.trim();
      return (trimmed + " " + chipText.trim()).trim() + " ";
    });
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    if (isLoading) return;

    setIsLoading(true);

    const updatedMessages: Message[] = [...messages, { role: "user", content: text }];
    const limitedMessages: Message[] = updatedMessages.slice(-6);

    setMessages(limitedMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: limitedMessages }),
      });

      const data = (await res.json()) as ChatApiResponse;

      const replyText =
        typeof data.reply === "string"
          ? data.reply
          : typeof data.error === "string"
            ? `Error: ${data.error}`
            : "No reply received.";

      const assistantMsg: Message = { role: "assistant", content: replyText };
      setMessages([...limitedMessages, assistantMsg].slice(-6));
    } catch {
      const assistantMsg: Message = {
        role: "assistant",
        content: "Something went wrong. Please try again.",
      };
      setMessages([...limitedMessages, assistantMsg].slice(-6));
    } finally {
      setIsLoading(false);
    }
  }

  const bottomPanel = (
    <>
      {/* Chips */}
      <div className="pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {chips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => applyChip(chip.text)}
              className={`whitespace-nowrap text-xs px-3 py-1 rounded-full border transition ${
                isLoading
                  ? "bg-gray-900 text-gray-500 border-gray-800 cursor-not-allowed"
                  : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
              }`}
              type="button"
              disabled={isLoading}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="pb-4">
        <div className="flex w-full gap-2">
          <input
            className="flex-1 min-w-0 bg-gray-800 text-white border border-gray-700 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tap chips or type..."
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          {/* ✅ Mobile-friendly: smaller + allowed to shrink */}
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-3 md:px-4 py-3 rounded-xl text-xs md:text-sm hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            type="button"
            disabled={isLoading}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <main className="bg-black">
      <div className="min-h-[100dvh] flex md:items-center md:justify-center">
        {/* Main container */}
        <div className="w-full min-h-[100dvh] md:min-h-0 md:h-[85vh] md:max-w-2xl bg-gray-900 md:shadow-lg md:rounded-xl flex flex-col md:border md:border-gray-700">
          {/* Header */}
          <div className="px-4 py-3 md:p-4 border-b border-gray-700 font-semibold text-lg text-white">
            🔥 Craving Checker
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6 pb-44 md:pb-6">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[85%] md:max-w-[75%] text-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-200"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-gray-800 text-gray-200 text-sm">
                  Planning your diet<span className="animate-pulse">...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Desktop bottom */}
          <div className="hidden md:block border-t border-gray-800 px-6">{bottomPanel}</div>
        </div>

        {/* ✅ Mobile fixed bottom: safe-area + box-sizing so it never overflows */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800"
          style={{
            boxSizing: "border-box",
            paddingLeft: "calc(env(safe-area-inset-left) + 16px)",
            paddingRight: "calc(env(safe-area-inset-right) + 16px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
          }}
        >
          {bottomPanel}
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
