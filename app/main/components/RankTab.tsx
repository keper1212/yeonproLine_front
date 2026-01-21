"use client";

import React from "react";
import { Trophy, Medal, Crown, TrendingUp, MoreHorizontal } from "lucide-react";

const RANKING_DATA = [
  { rank: 1, name: "예측마스터", points: 2850, accuracy: "94%", badges: ["🔮", "🎬"], isMe: false },
  { rank: 2, name: "연애박사", points: 2640, accuracy: "89%", badges: ["🎲", "⚡"], isMe: false },
  { rank: 3, name: "리얼리티킹", points: 2580, accuracy: "87%", badges: ["🔮"], isMe: false },
  { rank: 4, name: "방구석평론가", points: 2420, accuracy: "85%", badges: ["🎬"], isMe: false },
  { rank: 12, name: "SS", points: 1850, accuracy: "88%", badges: ["🔮", "🎬", "🌱", "🔥"], isMe: true },
];

export default function RankTab() {
  const myData = RANKING_DATA.find((user) => user.isMe);
  const topTier = RANKING_DATA.slice(0, 4);

  return (
    <div className="w-full space-y-12 pb-32 animate-in fade-in duration-700 text-slate-800">
      
      {/* 1. 헤더 섹션 */}
      <div className="pt-6 text-left px-2">
        <h1 className="text-3xl font-black mb-1">순위</h1>
        <p className="text-slate-400 font-medium text-sm">전체 유저 랭킹을 확인하세요</p>
      </div>

      {/* 2. 내 현재 순위 카드 (이미지 스타일 반영) */}
      {myData && (
        <div className="bg-[#FFF5F8] rounded-[2.5rem] p-8 border-2 border-[#FFD1E0] shadow-sm text-left relative">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 font-bold text-sm">내 현재 순위</span>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-4">
              <span className="text-[48px] font-black text-[#FF4D77]">#{myData.rank}</span>
              <div>
                <p className="text-xl font-bold text-slate-800">{myData.name}</p>
                <p className="text-[#D9A520] font-bold flex items-center gap-1">
                   <TrendingUp size={16} /> {myData.points.toLocaleString()} pt
                </p>
              </div>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-md">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="me" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}

      {/* 3. TOP 랭킹 리스트 */}
      <div className="space-y-4">
        {topTier.map((user) => (
          <div 
            key={user.rank} 
            className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${
              user.rank % 2 !== 0 ? 'bg-[#FFFEF0] border-[#FDE047]' : 'bg-[#F1F5F9] border-slate-200'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 flex items-center justify-center">
                {user.rank === 1 && <Crown className="text-amber-500 w-8 h-8" />}
                {user.rank === 2 && <Medal className="text-slate-400 w-8 h-8" />}
                {user.rank === 3 && <Medal className="text-amber-700 w-8 h-8" />}
                {user.rank > 3 && <span className="text-xl font-black text-slate-400">#{user.rank}</span>}
              </div>
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="user" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-slate-800">{user.name}</span>
                  <div className="flex gap-1 text-sm">
                    {user.badges.map((b, i) => <span key={i}>{b}</span>)}
                  </div>
                </div>
                <p className="text-[#D9A520] font-bold text-sm">⚡ {user.points.toLocaleString()} pt</p>
              </div>
            </div>
          </div>
        ))}

        {/* 생략 표시 */}
        <div className="flex justify-center py-4">
          <MoreHorizontal size={36} className="text-slate-300" />
        </div>

        {/* 하단 내 순위 다시 강조 */}
        <div className="flex items-center justify-between p-6 rounded-[2rem] bg-[#FFF5F8] border-2 border-[#FFD1E0]">
            <div className="flex items-center gap-5">
                <span className="text-2xl font-black text-[#FF4D77] w-10 text-center">{myData?.rank}</span>
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="me" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-800">{myData?.name} (나)</span>
                    </div>
                    <p className="text-pink-400 font-bold text-sm">상위 12% 이내 · {myData?.accuracy} 적중</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-black text-slate-800 text-lg">{myData?.points.toLocaleString()} pt</p>
            </div>
        </div>
      </div>
    </div>
  );
}
