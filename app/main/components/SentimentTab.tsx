"use client";

import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Sparkles, Activity, Heart } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Gender = "female" | "male";

interface Participant {
  id: number;
  name: string;
  gender: Gender;
  image: string;
}

interface SentimentPoint {
  time: string;
  value: number;
}

interface Highlight {
  direction: "up" | "down";
  change: number;
  time: string;
  label: string;
}

interface SentimentViewData {
  supportRate: number;
  delta5m: number;
  chart: SentimentPoint[];
  highlight: Highlight | null;
  summary: string;
  accent: string;
  accentSoft: string;
}

const participants: Participant[] = [
  { id: 1, name: "정원규", gender: "male", image: "/participants/정원규.png" },
  { id: 2, name: "조유식", gender: "male", image: "/participants/조유식.png" },
  { id: 3, name: "신승용", gender: "male", image: "/participants/신승용.png" },
  { id: 4, name: "성백현", gender: "male", image: "/participants/성백현.png" },
  { id: 5, name: "홍지연", gender: "female", image: "/participants/홍지연.png" },
  { id: 6, name: "박지현", gender: "female", image: "/participants/박지현.png" },
  { id: 7, name: "박현지", gender: "female", image: "/participants/박현지.png" },
  { id: 8, name: "곽민경", gender: "female", image: "/participants/곽민경.png" },
];

const coupleSentiment: Record<string, SentimentViewData> = {
  "6-2": {
    supportRate: 80,
    delta5m: 0,
    chart: [
      { time: "0분", value: 56 },
      { time: "10분", value: 62 },
      { time: "20분", value: 63 },
      { time: "30분", value: 70 },
      { time: "40분", value: 79 },
      { time: "50분", value: 80 },
    ],
    highlight: { direction: "up", change: 7, time: "40분 구간", label: "급상승" },
    summary:
      "박지현 ♥ 조유식 커플이 안정적인 지지를 확보하고 있습니다. 두 사람의 자연스러운 리액션이 긍정 평가를 이끌어냈어요.",
    accent: "#ff3b73",
    accentSoft: "bg-rose-50",
  },
  "7-1": {
    supportRate: 66,
    delta5m: 3,
    chart: [
      { time: "0분", value: 52 },
      { time: "10분", value: 55 },
      { time: "20분", value: 59 },
      { time: "30분", value: 61 },
      { time: "40분", value: 63 },
      { time: "50분", value: 66 },
    ],
    highlight: { direction: "up", change: 5, time: "20분 구간", label: "완만한 상승" },
    summary:
      "박현지 ♥ 정원규 커플은 초반 상승세를 유지하며 고른 반응을 얻고 있습니다. 대화의 균형이 시청자 기대를 충족시키는 흐름입니다.",
    accent: "#ff6b3b",
    accentSoft: "bg-orange-50",
  },
};

const singleSentiment: Record<number, SentimentViewData> = {
  6: {
    supportRate: 79,
    delta5m: 3,
    chart: [
      { time: "0분", value: 68 },
      { time: "10분", value: 72 },
      { time: "20분", value: 70 },
      { time: "30분", value: 68 },
      { time: "40분", value: 74 },
      { time: "50분", value: 79 },
    ],
    highlight: { direction: "up", change: 6, time: "40분 구간", label: "급상승" },
    summary:
      "박지현이 시청자에게 높은 호감도를 얻고 있습니다. 침착한 태도와 설득력 있는 대화가 긍정적인 평가로 이어져요.",
    accent: "#1d9bf0",
    accentSoft: "bg-sky-50",
  },
  5: {
    supportRate: 71,
    delta5m: -2,
    chart: [
      { time: "0분", value: 76 },
      { time: "10분", value: 74 },
      { time: "20분", value: 73 },
      { time: "30분", value: 72 },
      { time: "40분", value: 70 },
      { time: "50분", value: 71 },
    ],
    highlight: { direction: "down", change: 4, time: "10분 구간", label: "소폭 하락" },
    summary:
      "홍지연은 여전히 높은 관심을 받고 있지만 최근 반응은 다소 보수적으로 변했습니다. 다음 선택이 흐름을 바꿀 수 있어요.",
    accent: "#0f766e",
    accentSoft: "bg-emerald-50",
  },
};

const fallbackChart: SentimentPoint[] = [
  { time: "0분", value: 52 },
  { time: "10분", value: 56 },
  { time: "20분", value: 59 },
  { time: "30분", value: 62 },
  { time: "40분", value: 64 },
  { time: "50분", value: 66 },
];

export default function SentimentTab() {
  const femaleList = participants.filter((p) => p.gender === "female");
  const maleList = participants.filter((p) => p.gender === "male");

  const [femaleId, setFemaleId] = useState<string>(String(femaleList[0]?.id ?? ""));
  const [maleId, setMaleId] = useState<string>(String(maleList[0]?.id ?? ""));
  const [analysisType, setAnalysisType] = useState<"couple" | "single">("couple");

  const selectedFemale = femaleList.find((p) => String(p.id) === femaleId) ?? null;
  const selectedMale = maleList.find((p) => String(p.id) === maleId) ?? null;
  const hasCouple = Boolean(selectedFemale && selectedMale);

  const {
    viewData,
    title,
    subtitle,
    chartTitle,
    highlightTitle,
    targetLabel,
  } = useMemo(() => {
    if (hasCouple && analysisType === "couple") {
      const key = `${selectedFemale!.id}-${selectedMale!.id}`;
      const data =
        coupleSentiment[key] ??
        ({
          supportRate: 62,
          delta5m: 1,
          chart: fallbackChart,
          highlight: null,
          summary: "선택한 커플의 여론이 안정적으로 유지되고 있습니다.",
          accent: "#ff3b73",
          accentSoft: "bg-rose-50",
        } as SentimentViewData);
      return {
        viewData: data,
        title: "커플 민심 분석",
        subtitle: `${selectedFemale!.name} ♥ ${selectedMale!.name}`,
        chartTitle: "커플 인기도 변화 추이",
        highlightTitle: "주요 변화 구간",
        targetLabel: `${selectedFemale!.name} ♥ ${selectedMale!.name}`,
      };
    }

    const target = selectedFemale ?? selectedMale ?? participants[0];
    const data =
      singleSentiment[target.id] ??
      ({
        supportRate: 64,
        delta5m: 2,
        chart: fallbackChart,
        highlight: { direction: "up", change: 4, time: "30분 구간", label: "완만한 상승" },
        summary: `${target.name}의 호감도가 안정적으로 유지되고 있습니다.`,
        accent: "#1d9bf0",
        accentSoft: "bg-sky-50",
      } as SentimentViewData);

    return {
      viewData: data,
      title: "개인 민심 분석",
      subtitle: `${target.name}`,
      chartTitle: "개인 호감도 변화 추이",
      highlightTitle: "주요 변화 구간",
      targetLabel: target.name,
    };
  }, [analysisType, hasCouple, selectedFemale, selectedMale]);

  const deltaLabel = `${viewData.delta5m >= 0 ? "+" : ""}${viewData.delta5m}%`;
  const trendUp = viewData.delta5m >= 0;

  return (
    <div className="w-full space-y-10 pb-40 text-slate-900 animate-in fade-in duration-700">
      <div className="relative overflow-hidden rounded-[2.75rem] border border-slate-100 bg-white px-8 py-10 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_15%_0%,#ffe6ee,transparent_45%),radial-gradient(500px_circle_at_85%_0%,#e6f6ff,transparent_40%)] opacity-70" />
        <div className="relative space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.4em] text-slate-400">
            Sentiment Radar
          </p>
          <h1 className="text-[32px] font-black leading-tight text-slate-900">
            민심 분석
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            실시간 여론 흐름과 변화를 한눈에 확인하세요.
          </p>
        </div>
      </div>

      <div className="rounded-[2.75rem] border border-slate-100 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">분석 대상 선택</h2>
          <span className="text-xs font-bold text-slate-400">LIVE</span>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-slate-600">여자 출연자</label>
          <div className="relative">
            <select
              value={femaleId}
              onChange={(event) => setFemaleId(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm focus:border-rose-400 focus:outline-none"
            >
              <option value="">선택 안함</option>
              {femaleList.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
              ▾
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-slate-600">남자 출연자</label>
          <div className="relative">
            <select
              value={maleId}
              onChange={(event) => setMaleId(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm focus:border-rose-400 focus:outline-none"
            >
              <option value="">선택 안함</option>
              {maleList.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
              ▾
            </span>
          </div>
        </div>

        <button
          onClick={() => setAnalysisType(hasCouple ? "couple" : "single")}
          className={`w-full rounded-2xl px-5 py-4 text-base font-black transition ${
            hasCouple
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
        >
          {hasCouple ? "커플 민심 분석" : "개인 민심 분석"}
        </button>
      </div>

      <div className="rounded-[2.75rem] border border-slate-100 bg-white p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-center gap-5">
          {analysisType === "couple" && selectedFemale && selectedMale ? (
            <>
              <div className="flex flex-col items-center gap-3">
                <img
                  src={selectedFemale.image}
                  alt={selectedFemale.name}
                  className="h-20 w-20 rounded-full border-2 border-rose-300 object-cover shadow-sm"
                />
                <span className="text-sm font-bold text-slate-700">{selectedFemale.name}</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-rose-500">
                <Heart className="h-6 w-6 fill-rose-500" />
                <span className="text-xs font-bold">HOT</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <img
                  src={selectedMale.image}
                  alt={selectedMale.name}
                  className="h-20 w-20 rounded-full border-2 border-slate-300 object-cover shadow-sm"
                />
                <span className="text-sm font-bold text-slate-700">{selectedMale.name}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <img
                src={(selectedFemale ?? selectedMale)?.image ?? participants[0].image}
                alt={targetLabel}
                className="h-24 w-24 rounded-full border-2 border-slate-200 object-cover shadow-sm"
              />
              <span className="text-base font-bold text-slate-700">{targetLabel}</span>
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-slate-400">
            {title}
          </p>
          <p className="text-base font-bold text-slate-700">{subtitle}</p>
        </div>
      </div>

      <div className="rounded-[2.75rem] border border-slate-100 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">
              현재 {analysisType === "couple" ? "커플 지지율" : "호감도"}
            </p>
            <p className="text-[52px] font-black text-slate-900">
              {viewData.supportRate}%
            </p>
            <p className="text-xs font-semibold text-slate-400">최근 5분 대비</p>
          </div>
          <div className={`flex items-center gap-2 text-sm font-bold ${trendUp ? "text-emerald-500" : "text-rose-500"}`}>
            {trendUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            <span>{deltaLabel}</span>
          </div>
        </div>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={viewData.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={viewData.accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={viewData.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tick={{ fill: "#94a3b8", fontWeight: 600 }}
                dy={16}
              />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{
                  borderRadius: "18px",
                  border: "none",
                  boxShadow: "0 18px 35px -12px rgb(15 23 42 / 0.25)",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={viewData.accent}
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#sentimentFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm font-bold text-slate-800">{chartTitle}</p>
      </div>

      <div className="rounded-[2.75rem] border border-slate-100 bg-white p-8 shadow-sm space-y-5">
        <h3 className="text-lg font-black text-slate-900">{highlightTitle}</h3>
        {viewData.highlight ? (
          <div
            className={`flex items-center gap-4 rounded-[2rem] border px-6 py-5 ${viewData.accentSoft} ${
              viewData.highlight.direction === "up"
                ? "border-emerald-200"
                : "border-rose-200"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                viewData.highlight.direction === "up" ? "bg-emerald-500" : "bg-rose-500"
              } text-white`}
            >
              {viewData.highlight.direction === "up" ? <TrendingUp /> : <TrendingDown />}
            </div>
            <div>
              <p className="text-base font-black text-slate-900">
                {viewData.highlight.label} {viewData.highlight.change > 0 ? "+" : ""}
                {viewData.highlight.change}%
              </p>
              <p className="text-sm font-semibold text-slate-500">{viewData.highlight.time}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-slate-100 bg-slate-50 px-6 py-8">
            <Activity className="h-5 w-5 text-slate-300" />
            <span className="text-sm font-bold text-slate-400">안정적인 여론 흐름</span>
          </div>
        )}
      </div>

      <div className="rounded-[2.75rem] border border-slate-100 bg-white p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">AI 여론 요약</h3>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {title}
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold leading-7 text-slate-600">{viewData.summary}</p>
      </div>
    </div>
  );
}
