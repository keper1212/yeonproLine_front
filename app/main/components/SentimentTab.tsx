"use client";

import React, { useState } from "react";
import { TrendingUp, TrendingDown, Sparkles, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- 데이터 설정 (변경 없음) ---
const coupleData = {
  "지우 ♥ 민수": {
    support: "58%",
    trend: "+1%",
    color: "#FF4D77",
    aiSummary: "지우 ♥ 민수 커플에 대한 지지가 매우 견고합니다. 특히 최근 50분 구간에서 다시 반등하며 긍정적인 여론이 형성되고 있습니다.",
    chart: [
      { time: "0분", value: 65 }, { time: "10분", value: 60 },
      { time: "20분", value: 55 }, { time: "30분", value: 53 },
      { time: "40분", value: 51 }, { time: "50분", value: 58 },
    ],
    fluctuations: [{ type: 'down', change: '-10%', time: '20분 구간' }]
  },
  "서연 ♥ 준호": {
    support: "42%",
    trend: "-3%",
    color: "#7C3AED",
    aiSummary: "서연 ♥ 준호 커플에 대한 의견이 엇갈리고 있습니다. 일부는 두 사람의 관계 발전을 응원하지만, 신중한 시선도 존재하네요.",
    chart: [
      { time: "0분", value: 50 }, { time: "10분", value: 52 },
      { time: "20분", value: 51 }, { time: "30분", value: 53 },
      { time: "40분", value: 52 }, { time: "50분", value: 50 },
    ],
    fluctuations: []
  },
  "하은 ♥ 태양": {
    support: "25%",
    trend: "+5%",
    color: "#3B82F6",
    aiSummary: "하은 ♥ 태양 커플은 초반 낮은 지지율을 극복하고 급상승 중입니다. 태양의 적극적인 태도가 민심을 움직인 것으로 보입니다.",
    chart: [
      { time: "0분", value: 15 }, { time: "10분", value: 25 },
      { time: "20분", value: 22 }, { time: "30분", value: 25 },
      { time: "40분", value: 22 }, { time: "50분", value: 25 },
    ],
    fluctuations: [{ type: 'up', change: '+10%', time: '10분 구간' }]
  },
};

export default function SentimentTab() {
  const couples = Object.keys(coupleData);
  const [selectedCouple, setSelectedCouple] = useState(couples[0]);
  const currentData = coupleData[selectedCouple as keyof typeof coupleData];

  return (
    // 섹션 사이 간격을 촘촘하지 않게 대폭 확대 (space-y-16)
    <div className="w-full space-y-16 pb-40 animate-in fade-in duration-700 font-sans antialiased tracking-tight text-slate-800">
      
      {/* 1. 헤더 섹션: 상단 여백 확보 */}
      <div className="pt-10 text-left px-2">
        <h1 className="text-[36px] font-bold mb-4 leading-tight">민심 분석</h1>
        <p className="text-slate-400 font-medium text-[17px]">실시간 여론 변화를 확인하세요</p>
      </div>

      {/* 2. 커플 선택 바: 아바타 삭제 후 미니멀한 칩 스타일로 축소 */}
      <div className="flex flex-row gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
        {couples.map((couple) => (
          <button
            key={couple}
            onClick={() => setSelectedCouple(couple)}
            className={`px-6 py-3 rounded-full border-[1.5px] whitespace-nowrap transition-all duration-300 font-bold text-[15px] ${
              selectedCouple === couple
                ? "bg-slate-900 border-slate-900 text-white shadow-lg -translate-y-1"
                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
            }`}
          >
            {couple}
          </button>
        ))}
      </div>

      {/* 3. 현재 지지율 카드: 내부 패딩과 폰트 크기 대폭 확대 */}
      <div className="bg-white rounded-[3rem] p-14 shadow-sm border border-slate-100 text-left">
        <div className="flex justify-between items-start mb-12">
          <span className="text-slate-400 font-bold text-[16px] tracking-widest uppercase">현재 지지율</span>
          <div className="flex items-center gap-2 text-green-500 font-bold text-[18px]">
            <TrendingUp className="w-6 h-6 stroke-[3.5px]" />
            <span>{currentData.trend}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <h2 className="text-[100px] font-black leading-none text-slate-900 tracking-tighter">
            {currentData.support}
          </h2>
          <p className="text-[14px] font-bold text-slate-300 uppercase tracking-[0.3em] ml-2">
            최근 5분 대비 실시간 여론
          </p>
        </div>
      </div>

      {/* 4. 인기도 변화 추이: 차트 높이를 키워 시원한 뷰 제공 */}
      <div className="bg-white rounded-[3rem] p-14 shadow-sm border border-slate-100 text-left">
        <h3 className="text-[22px] font-bold mb-14">인기도 변화 추이</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentData.chart} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentData.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={currentData.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                fontSize={13} 
                tick={{ fill: '#cbd5e1', fontWeight: 600 }} 
                dy={25}
              />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '15px' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={currentData.color} 
                strokeWidth={5} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. 주요 변화 구간: 개별 항목의 여백 확보 */}
      <div className="bg-white rounded-[3rem] p-14 shadow-sm border border-slate-100 text-left">
        <h3 className="text-[22px] font-bold mb-12">주요 변화 구간</h3>
        
        {currentData.fluctuations.length > 0 ? (
          <div className="space-y-8">
            {currentData.fluctuations.map((flux, i) => (
              <div 
                key={i} 
                className={`flex items-center justify-between p-12 rounded-[2.5rem] border-[1.5px] ${
                  flux.type === 'up' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}
              >
                <div className="flex items-center gap-8">
                  <div className={`p-5 rounded-3xl ${flux.type === 'up' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {flux.type === 'up' ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`text-[24px] font-bold ${flux.type === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {flux.type === 'up' ? '급상승' : '급하락'} {flux.change}
                    </span>
                    <span className="text-slate-400 text-[18px] font-medium">{flux.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 p-20 rounded-[3rem] flex items-center justify-center gap-6">
             <Activity size={30} className="text-slate-300" />
             <span className="text-slate-400 font-bold text-[22px]">안정적인 여론 흐름</span>
          </div>
        )}
      </div>

      {/* 6. AI 여론 요약: 행간과 여백을 조절해 가독성 강화 */}
      <div className="bg-[#F8F7FF] rounded-[3rem] p-14 shadow-sm border border-[#EBE9FE] text-left">
        <div className="flex items-center gap-6 mb-12">
          <div className="p-5 bg-purple-500 text-white rounded-[1.5rem] shadow-xl">
            <Sparkles size={30} />
          </div>
          <h3 className="text-[22px] font-bold">AI 여론 요약</h3>
        </div>
        <p className="text-slate-600 font-medium text-[20px] leading-[1.9] break-keep px-2">
          {currentData.aiSummary}
        </p>
      </div>
    </div>
  );
}