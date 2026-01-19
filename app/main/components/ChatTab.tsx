"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Send } from "lucide-react";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type ChatMessage = {
  id: number;
  user_id: number;
  nickname: string;
  content: string;
  created_at: string;
  primary_badge_icon_url?: string | null;
  primary_badge_name?: string | null;
};

type ChatHistory = {
  messages: ChatMessage[];
};

const badgeFallbackMap: Record<string, string> = {
  "연프 촉": "🔮",
  "편집 읽는 사람": "🎬",
  "역배 전문가": "🎲",
  "분석왕": "📊",
  "초심자": "🌱",
  "열정팬": "🔥",
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ChatTab() {
  const { data: session, status } = useSession();
  const token = session?.appAccessToken;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = useMemo(() => {
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
      const data = JSON.parse(decoded) as { sub?: string };
      return data.sub ? Number(data.sub) : null;
    } catch {
      return null;
    }
  }, [token]);

  const wsUrl = useMemo(() => {
    if (!token) return null;
    const base = backendUrl.startsWith("https")
      ? backendUrl.replace("https", "wss")
      : backendUrl.replace("http", "ws");
    return `${base}/ws/chat?token=${token}`;
  }, [token]);

  useEffect(() => {
    if (!token) {
      if (status !== "loading") {
        setLoading(false);
        setError("로그인이 필요합니다.");
      }
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/chats?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("채팅 기록을 불러오지 못했습니다.");
        const data = (await res.json()) as ChatHistory;
        setMessages(data.messages ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류입니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, status]);

  useEffect(() => {
    if (!wsUrl) return;
    setError(null);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ChatMessage;
        setMessages((prev) => [...prev, message]);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      setError("채팅 연결에 실패했습니다.");
    };

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    wsRef.current.send(JSON.stringify({ content: trimmed }));
    setInput("");
  };

  const renderBadge = (message: ChatMessage) => {
    if (message.primary_badge_icon_url) {
      return (
        <img
          src={message.primary_badge_icon_url}
          alt={message.primary_badge_name ?? "대표 배지"}
          className="w-5 h-5 rounded-full object-cover"
        />
      );
    }
    if (message.primary_badge_name) {
      return (
        <span className="text-sm">
          {badgeFallbackMap[message.primary_badge_name] ?? "🏅"}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6 pb-24 px-1 text-slate-800">
      <div className="pt-4 text-left">
        <h1 className="text-3xl font-bold mb-1">실시간 채팅</h1>
        <p className="text-slate-400 font-medium text-sm">
          방송 중 시청자들과 대화하세요
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          불러오는 중...
        </div>
      )}

      {!loading && error && (
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-red-200 text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col gap-4 h-[560px]">
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto pr-2"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${currentUserId === message.user_id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`space-y-1 max-w-[75%] ${
                    currentUserId === message.user_id ? "items-end text-right" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span>{message.nickname}</span>
                    {renderBadge(message)}
                  </div>
                  <div
                    className={`inline-flex rounded-xl border px-3 py-2 text-xs text-slate-700 ${
                      currentUserId === message.user_id
                        ? "border-pink-300 bg-pink-100"
                        : "border-pink-200 bg-pink-50"
                    }`}
                  >
                    {message.content}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="메시지를 입력하세요..."
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500 text-white shadow-sm hover:bg-pink-600"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
