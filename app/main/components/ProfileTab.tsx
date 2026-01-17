"use client";

import React, { useState } from "react";
import { Medal, TrendingUp, Sparkles, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";

// --- 데이터 설정 ---
const stats = [
  { label: "적중률", value: "88%", color: "#FF4D77" },
  { label: "총 포인트", value: "700", color: "#7C3AED" },
  { label: "참여 회차", value: "3", color: "#3B82F6" },
];

const ALL_BADGES = [
  { name: "연프 촉", icon: "🔮" },
  { name: "편집 읽는 사람", icon: "🎬" },
  { name: "역배 전문가", icon: "🎲" },
  { name: "분석왕", icon: "📊" },
  { name: "초심자", icon: "🌱" },
  { name: "열정팬", icon: "🔥" },
];

const chartData = [
  { name: "EP.6", rate: 60 },
  { name: "EP.7", rate: 72 },
  { name: "EP.8", rate: 80 },
  { name: "EP.9", rate: 68 },
  { name: "EP.10", rate: 85 },
  { name: "EP.11", rate: 92 },
  { name: "EP.12", rate: 75 },
];

const historyData = [
  {
    episode: "EP.12",
    date: "2026-01-15",
    totalPoints: "+150 pt",
    correctRatio: "2/3 정답",
    details: [
      { label: "최종 커플 예측", points: "+100", correct: true },
      { label: "문자 발송 대상", points: "", correct: false },
      { label: "직업 예측", points: "+50", correct: true },
    ]
  },
  {
    episode: "EP.11",
    date: "2026-01-08",
    totalPoints: "+350 pt",
    correctRatio: "3/3 정답",
    details: [
      { label: "최종 커플 예측", points: "+100", correct: true },
      { label: "문자 발송 대상", points: "+100", correct: true },
      { label: "인기 1위 예측", points: "+150", correct: true },
    ]
  }
];

export default function ProfileTab() {
  const [userEarnedBadgeNames] = useState(["연프 촉", "편집 읽는 사람", "초심자", "열정팬"]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // 폰트 스타일 가이드: tracking-tight(자간 좁게), antialiased(글자 매끄럽게)
  const fontMain = "font-sans antialiased tracking-tight text-slate-800";

  return (
    <div className={`w-full space-y-6 pb-20 px-1 ${fontMain}`}>
      
      {/* 1. 제목 섹션 */}
      <div className="pt-4 text-left">
        <h1 className="text-3xl font-bold mb-1">내 정보</h1>
        <p className="text-slate-400 font-medium text-sm">내 예측 기록과 통계를 확인하세요</p>
      </div>

      {/* 2. 상단 프로필 카드 */}
      <div className="bg-[#FFF5F8] rounded-[2.5rem] p-6 border-2 border-[#FFD1E0] shadow-sm text-left">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 flex-shrink-0 rounded-full border-4 border-white overflow-hidden shadow-md bg-white">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">SS</h2>
            <div className="flex gap-1.5 text-lg">
              {ALL_BADGES
                .filter(badge => userEarnedBadgeNames.includes(badge.name))
                .map((badge, i) => (
                  <span key={i}>{badge.icon}</span>
                ))}
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-between gap-3 w-full">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex-1 bg-white rounded-2xl py-4 px-2 text-center shadow-sm border border-pink-50 min-w-0">
              <p className="text-xl font-bold mb-0.5" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 배지 섹션 */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 text-left">
        <div className="flex items-center gap-2 mb-6">
          <Medal className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h3 className="text-lg font-bold">획득한 배지</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3 w-full">
          {ALL_BADGES.map((badge, idx) => {
            const isEarned = userEarnedBadgeNames.includes(badge.name);
            return (
              <div 
                key={idx} 
                className={`flex flex-col items-center justify-center py-4 px-1 rounded-2xl border-2 transition-all duration-300 ${
                  isEarned ? 'bg-[#FFFDEB] border-[#FDE047] shadow-sm' : 'bg-gray-50 border-transparent opacity-30 grayscale'
                }`}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <p className="text-[10px] font-bold text-center leading-tight px-1">{badge.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 적중률 추이 그래프 */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 text-left">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-bold">예측 적중률 추이</h3>
        </div>
        <div className="h-48 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 10, left: -40, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 600 }} dy={10} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Area type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. 예측 성향 분석 */}
      <div className="bg-[#F5F3FF] rounded-[2.5rem] p-8 shadow-sm border border-[#DDD6FE] text-left">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold">내 예측 성향 분석</h3>
        </div>

        <div className="space-y-8">
          {[
            { label: "감정형", val: "45%", color: "bg-pink-500", txt: "출연자의 감정과 분위기를 중시하며 예측합니다" },
            { label: "논리형", val: "35%", color: "bg-indigo-500", txt: "데이터와 패턴을 분석하여 예측합니다" },
            { label: "인기 추종형", val: "20%", color: "bg-slate-500", txt: "대중의 의견을 참고하여 예측합니다" }
          ].map((item, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="font-bold text-slate-700">{item.label}</span>
                <span className={`font-bold text-lg ${i===0?'text-pink-500':i===1?'text-indigo-500':'text-slate-500'}`}>{item.val}</span>
              </div>
              <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: item.val }}></div>
              </div>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">{item.txt}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-white rounded-3xl p-5 text-center shadow-sm border border-purple-100">
          <p className="text-sm font-bold text-slate-700">
            당신은 <span className="text-pink-500 font-extrabold underline decoration-pink-100 underline-offset-4 decoration-4">감정형 예측자</span>입니다! 💕
          </p>
        </div>
      </div>

      {/* 6. 예측 히스토리 */}
      <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-100 text-left">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold">예측 히스토리</h3>
          </div>
          <button 
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-pink-500 text-sm font-bold hover:opacity-70 transition-all"
          >
            {showAllHistory ? "접기" : "전체보기"}
          </button>
        </div>

        <div className="space-y-6">
          {(showAllHistory ? historyData : historyData.slice(0, 1)).map((item, idx) => (
            <div key={idx} className="bg-slate-50 rounded-[1.8rem] p-6 border border-slate-100 animate-in fade-in duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{item.episode}</h4>
                  <p className="text-[10px] font-medium text-slate-400">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-500">{item.totalPoints}</p>
                  <p className="text-[10px] font-bold text-slate-400">{item.correctRatio}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-200/50 mt-2 pt-4">
                {item.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {detail.correct ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-xs font-medium text-slate-600">{detail.label}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-500">{detail.points}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}