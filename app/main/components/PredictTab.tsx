"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Heart,
  User,
  Flame,
  X,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// --- Types ---
interface Contestant {
  id: number;
  name: string;
  type: "female" | "male";
  emoji: string;
}

interface SelectionState {
  from: number | null;
  to: number | null;
}

interface Couple {
  female: Contestant;
  male: Contestant;
}

// --- Mock Data ---
const contestants: Contestant[] = [
  { id: 1, name: "지우", type: "female", emoji: "👩" },
  { id: 2, name: "세연", type: "female", emoji: "👩‍🦰" },
  { id: 3, name: "민서", type: "female", emoji: "👧" },
  { id: 4, name: "현우", type: "male", emoji: "👨" },
  { id: 5, name: "준호", type: "male", emoji: "👦" },
  { id: 6, name: "태영", type: "male", emoji: "🧔" },
];

const sentimentData = [
  { time: "10분", jiwoo: 40, hyunwoo: 50 },
  { time: "20분", jiwoo: 45, hyunwoo: 70 },
  { time: "30분", jiwoo: 30, hyunwoo: 85 },
  { time: "40분", jiwoo: 60, hyunwoo: 65 },
  { time: "50분", jiwoo: 80, hyunwoo: 40 },
];

export default function RealityShowApp() {
  const [activeMainTab, setActiveMainTab] =
    useState<"예측" | "민심" | "채팅" | "순위" | "내정보">("예측");

  const [predictMode, setPredictMode] = useState("episode");
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [isLocked, setIsLocked] = useState(false);
  const [episodeSelection, setEpisodeSelection] =
    useState<SelectionState>({ from: null, to: null });
  const [predictedCouples, setPredictedCouples] = useState<Couple[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // ⏱ 타이머 로직
  useEffect(() => {
    const target = new Date("2026-01-21T21:00:00").getTime();
    const timer = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setIsLocked(true);
        clearInterval(timer);
      } else {
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        setTimeLeft(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 💌 커플 생성 로직
  useEffect(() => {
    if (episodeSelection.from && episodeSelection.to) {
      const a = contestants.find((c) => c.id === episodeSelection.from)!;
      const b = contestants.find((c) => c.id === episodeSelection.to)!;
      if (a.type === b.type) {
        alert("다른 성별을 선택해주세요!");
        setEpisodeSelection({ from: null, to: null });
        return;
      }
      const couple: Couple = {
        female: a.type === "female" ? a : b,
        male: a.type === "male" ? a : b,
      };
      setPredictedCouples((prev) => {
        if (prev.some((c) => c.female.id === couple.female.id || c.male.id === couple.male.id)) {
          alert("이미 매칭된 출연자입니다.");
          return prev;
        }
        return [...prev, couple];
      });
      setEpisodeSelection({ from: null, to: null });
    }
  }, [episodeSelection]);

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-slate-900 pb-10 overflow-x-hidden">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="px-6 pt-6 flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-pink-500 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Love Signal</h1>
          </div>
          <button className="bg-slate-100 p-2.5 rounded-full">
            <User className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        <div className="px-6 flex gap-6 overflow-x-auto border-b border-slate-200 scrollbar-hide">
          {["예측", "민심", "채팅", "순위", "내정보"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab as any)}
              className={`pb-3 text-sm font-black whitespace-nowrap transition-all ${
                activeMainTab === tab
                  ? "text-pink-500 border-b-2 border-pink-500"
                  : "text-slate-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="px-6 max-w-md mx-auto mt-6">
        {activeMainTab === "예측" && (
          <div className="space-y-6">
            {/* ⏰ 타이머 카드 */}
            <div className="bg-white rounded-[2.5rem] p-7 shadow-sm flex justify-between items-center border border-slate-200">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">
                  Prediction Deadline
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-pink-500 stroke-[3px]" />
                  <span className="text-4xl font-black tabular-nums tracking-tighter italic text-slate-900">
                    {timeLeft}
                  </span>
                </div>
              </div>
              <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black">
                LIVE
              </div>
            </div>

            {/* 💌 예측 카드 영역 */}
            <div className="bg-white text-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-black mb-6">누가 보낼까요?</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 text-center">
                  <p className="text-[10px] text-slate-500 font-black uppercase">Females</p>
                  {contestants
                    .filter((c) => c.type === "female")
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() =>
                          setEpisodeSelection((prev) => ({ ...prev, from: c.id }))
                        }
                        className={`w-full p-4 rounded-3xl flex flex-col items-center gap-1 transition-all border-2 ${
                          episodeSelection.from === c.id
                            ? "border-pink-500 bg-pink-50"
                            : "border-transparent bg-slate-100"
                        } ${
                          predictedCouples.some((cp) => cp.female.id === c.id)
                            ? "opacity-40 grayscale cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span className="text-2xl">{c.emoji}</span>
                        <span className="text-xs font-black text-slate-800">{c.name}</span>
                      </button>
                    ))}
                </div>
                <div className="space-y-3 text-center">
                  <p className="text-[10px] text-slate-500 font-black uppercase">Males</p>
                  {contestants
                    .filter((c) => c.type === "male")
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() =>
                          setEpisodeSelection((prev) => ({ ...prev, to: c.id }))
                        }
                        className={`w-full p-4 rounded-3xl flex flex-col items-center gap-1 transition-all border-2 ${
                          episodeSelection.to === c.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-transparent bg-slate-100"
                        } ${
                          predictedCouples.some((cp) => cp.male.id === c.id)
                            ? "opacity-40 grayscale cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span className="text-2xl">{c.emoji}</span>
                        <span className="text-xs font-black text-slate-800">{c.name}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 생성된 커플 리스트 */}
              <div className="mt-8 space-y-3">
                {predictedCouples.length > 0 && (
                  <p className="text-[10px] text-pink-500 font-bold uppercase pl-1 tracking-widest">
                    Confirmed Matches
                  </p>
                )}
                {predictedCouples.map((c, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200"
                  >
                    <span className="font-black text-sm text-slate-800 flex items-center gap-3 italic">
                      {c.female.name}
                      <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                      {c.male.name}
                    </span>
                    <button onClick={() => setPredictedCouples((p) => p.filter((_, idx) => idx !== i))}>
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 제출 버튼 */}
              <button
                disabled={submitted || isLocked || predictedCouples.length === 0}
                onClick={() => setSubmitted(true)}
                className="w-full mt-10 py-5 bg-pink-500 text-white rounded-3xl font-black shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:bg-slate-300"
              >
                {submitted ? "SUBMITTED ✨" : `SUBMIT PREDICTION (${predictedCouples.length})`}
              </button>
            </div>
          </div>
        )}

        {/* --- 민심 화면 --- */}
        {activeMainTab === "민심" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black mb-10 text-slate-900">민심 리포트</h2>
              <div className="h-56 w-full mb-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Line type="monotone" dataKey="jiwoo" stroke="#ec4899" strokeWidth={5} dot={false} />
                    <Line type="monotone" dataKey="hyunwoo" stroke="#6366f1" strokeWidth={5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] shadow-sm border border-slate-200">
                <p className="text-[10px] font-black text-pink-600 mb-2 uppercase tracking-wider">
                  AI Insight
                </p>
                <p className="text-sm leading-[1.6] font-black italic text-slate-800">
                  "지우의 솔직한 표현이 시청자들에게 큰 울림을 주며 민심이 급격히 상승하고 있습니다!"
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
