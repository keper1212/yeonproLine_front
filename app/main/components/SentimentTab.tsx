"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Heart,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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

type Participant = {
  id: number;
  name: string;
  gender: Gender;
  image_url?: string | null;
};

type SentimentPoint = {
  captured_at: string;
  support_rate: number;
};

type SentimentEvent = {
  event_type: "up" | "down" | "stable";
  delta: number;
  start_at: string;
  end_at: string;
};

type SentimentOverview = {
  support_rate: number;
  delta_5m: number;
  history: SentimentPoint[];
  summary?: string | null;
  event?: SentimentEvent | null;
};

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const fallbackChart = [
  { time: "0분", value: 52 },
  { time: "10분", value: 56 },
  { time: "20분", value: 59 },
  { time: "30분", value: 62 },
  { time: "40분", value: 64 },
  { time: "50분", value: 66 },
];

const accentPalette = {
  couple: { line: "#ff3b73", soft: "bg-rose-50" },
  single: { line: "#1d9bf0", soft: "bg-sky-50" },
};

function formatMinutesLabel(base: Date, current: Date) {
  const diff = Math.max(
    0,
    Math.round((current.getTime() - base.getTime()) / 60000)
  );
  return `${diff}분`;
}

function resolveImageUrl(participant: Participant | null) {
  if (!participant) return "/participants/곽민경.png";
  if (participant.image_url) return participant.image_url;
  return `/participants/${participant.name}.png`;
}

export default function SentimentTab() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [femaleId, setFemaleId] = useState<string>("");
  const [maleId, setMaleId] = useState<string>("");
  const [analysisType, setAnalysisType] = useState<"couple" | "single">("couple");
  const [overview, setOverview] = useState<SentimentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const femaleList = useMemo(
    () => participants.filter((p) => p.gender === "female"),
    [participants]
  );
  const maleList = useMemo(
    () => participants.filter((p) => p.gender === "male"),
    [participants]
  );

  const selectedFemale =
    femaleList.find((p) => String(p.id) === femaleId) ?? null;
  const selectedMale =
    maleList.find((p) => String(p.id) === maleId) ?? null;
  const hasCouple = Boolean(selectedFemale && selectedMale);

  useEffect(() => {
    if (!hasCouple && analysisType === "couple") {
      setAnalysisType("single");
    }
  }, [analysisType, hasCouple]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await fetch(`${backendUrl}/sentiment/participants`);
        if (!res.ok) throw new Error("출연자 정보를 불러오지 못했습니다.");
        const data = (await res.json()) as Participant[];
        setParticipants(data);
        const firstFemale = data.find((p) => p.gender === "female");
        const firstMale = data.find((p) => p.gender === "male");
        setFemaleId(firstFemale ? String(firstFemale.id) : "");
        setMaleId(firstMale ? String(firstMale.id) : "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류입니다.");
      }
    };

    fetchParticipants();
  }, []);

  useEffect(() => {
    const shouldFetchCouple = analysisType === "couple" && hasCouple;
    const targetId =
      analysisType === "single"
        ? selectedFemale?.id ?? selectedMale?.id
        : null;

    if (!shouldFetchCouple && !targetId) {
      setOverview(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (shouldFetchCouple && selectedFemale && selectedMale) {
          params.set("female_id", String(selectedFemale.id));
          params.set("male_id", String(selectedMale.id));
        } else if (targetId) {
          params.set("target_id", String(targetId));
        }
        const res = await fetch(
          `${backendUrl}/sentiment/overview?${params.toString()}`
        );
        if (!res.ok) throw new Error("민심 데이터를 불러오지 못했습니다.");
        const data = (await res.json()) as SentimentOverview;
        if (isMounted) {
          setOverview(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "알 수 없는 오류입니다.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOverview();
    timer = setInterval(fetchOverview, 30000);

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [analysisType, hasCouple, selectedFemale, selectedMale]);

  const targetLabel = useMemo(() => {
    if (analysisType === "couple" && selectedFemale && selectedMale) {
      return `${selectedFemale.name} ♥ ${selectedMale.name}`;
    }
    const target = selectedFemale ?? selectedMale;
    return target ? target.name : "";
  }, [analysisType, selectedFemale, selectedMale]);

  const chartData = useMemo(() => {
    if (!overview || overview.history.length === 0) return fallbackChart;
    const base = new Date(overview.history[0].captured_at);
    return overview.history.map((point) => {
      const time = formatMinutesLabel(base, new Date(point.captured_at));
      return { time, value: point.support_rate };
    });
  }, [overview]);

  const highlight = useMemo(() => {
    if (!overview?.event || overview.event.event_type === "stable") return null;
    const base = overview.history[0]?.captured_at
      ? new Date(overview.history[0].captured_at)
      : null;
    const endAt = new Date(overview.event.end_at);
    const timeLabel = base ? `${formatMinutesLabel(base, endAt)} 구간` : "최근 구간";
    return {
      direction: overview.event.event_type,
      change: Math.abs(overview.event.delta),
      label: overview.event.event_type === "up" ? "급상승" : "급하락",
      time: timeLabel,
    };
  }, [overview]);

  const accent =
    analysisType === "couple" ? accentPalette.couple : accentPalette.single;
  const deltaLabel = `${overview?.delta_5m ?? 0 >= 0 ? "+" : ""}${
    overview?.delta_5m ?? 0
  }%`;
  const trendUp = (overview?.delta_5m ?? 0) >= 0;

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
                  src={resolveImageUrl(selectedFemale)}
                  alt={selectedFemale.name}
                  className="h-20 w-20 rounded-full border-2 border-rose-300 object-cover shadow-sm"
                />
                <span className="text-sm font-bold text-slate-700">
                  {selectedFemale.name}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-rose-500">
                <Heart className="h-6 w-6 fill-rose-500" />
                <span className="text-xs font-bold">HOT</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <img
                  src={resolveImageUrl(selectedMale)}
                  alt={selectedMale.name}
                  className="h-20 w-20 rounded-full border-2 border-slate-300 object-cover shadow-sm"
                />
                <span className="text-sm font-bold text-slate-700">
                  {selectedMale.name}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <img
                src={resolveImageUrl(selectedFemale ?? selectedMale)}
                alt={targetLabel || "선택 안됨"}
                className="h-24 w-24 rounded-full border-2 border-slate-200 object-cover shadow-sm"
              />
              <span className="text-base font-bold text-slate-700">
                {targetLabel || "출연자를 선택하세요"}
              </span>
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-slate-400">
            {analysisType === "couple" ? "커플 민심 분석" : "개인 민심 분석"}
          </p>
          <p className="text-base font-bold text-slate-700">{targetLabel || ""}</p>
        </div>
      </div>

      <div className="rounded-[2.75rem] border border-slate-100 bg-white p-8 shadow-sm space-y-6">
        {loading && (
          <p className="text-sm font-semibold text-slate-400">
            데이터 불러오는 중...
          </p>
        )}
        {!loading && error && (
          <p className="text-sm font-semibold text-rose-500">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">
              현재 {analysisType === "couple" ? "커플 지지율" : "호감도"}
            </p>
            <p className="text-[52px] font-black text-slate-900">
              {overview ? `${overview.support_rate}%` : "--"}
            </p>
            <p className="text-xs font-semibold text-slate-400">최근 5분 대비</p>
          </div>
          <div
            className={`flex items-center gap-2 text-sm font-bold ${
              trendUp ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {trendUp ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
            <span>{overview ? deltaLabel : "--"}</span>
          </div>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accent.line} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={accent.line} stopOpacity={0} />
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
                stroke={accent.line}
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#sentimentFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm font-bold text-slate-800">
          {analysisType === "couple" ? "커플 인기도 변화 추이" : "개인 호감도 변화 추이"}
        </p>
      </div>

      <div className="rounded-[2.75rem] border border-slate-100 bg-white p-8 shadow-sm space-y-5">
        <h3 className="text-lg font-black text-slate-900">주요 변화 구간</h3>
        {highlight ? (
          <div
            className={`flex items-center gap-4 rounded-[2rem] border px-6 py-5 ${accent.soft} ${
              highlight.direction === "up" ? "border-emerald-200" : "border-rose-200"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                highlight.direction === "up" ? "bg-emerald-500" : "bg-rose-500"
              } text-white`}
            >
              {highlight.direction === "up" ? <TrendingUp /> : <TrendingDown />}
            </div>
            <div>
              <p className="text-base font-black text-slate-900">
                {highlight.label} +{highlight.change}%
              </p>
              <p className="text-sm font-semibold text-slate-500">{highlight.time}</p>
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
              {analysisType === "couple" ? "커플" : "개인"} 인사이트
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold leading-7 text-slate-600">
          {overview?.summary || "아직 요약 데이터가 없습니다."}
        </p>
      </div>
    </div>
  );
}
