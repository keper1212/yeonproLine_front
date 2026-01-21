"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Crown, Medal, Sparkles, Trophy } from "lucide-react";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RankingEntry = {
  user_id: number;
  nickname: string;
  points: number;
  rank: number;
  primary_badge_icon_url?: string | null;
  primary_badge_name?: string | null;
};

type RankingOverview = {
  me?: RankingEntry | null;
  leaders: RankingEntry[];
};

const badgeFallbackMap: Record<string, string> = {
  "연프 촉": "🔮",
  "편집 읽는 사람": "🎬",
  "역배 전문가": "🎲",
  "분석왕": "📊",
  "초심자": "🌱",
  "열정팬": "🔥",
};

export default function RankingTab() {
  const { data: session, status } = useSession();
  const token = session?.appAccessToken;
  const [ranking, setRanking] = useState<RankingOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      if (status !== "loading") {
        setLoading(false);
        setError("로그인이 필요합니다.");
      }
      return;
    }

    const fetchRanking = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${backendUrl}/rankings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("순위 정보를 불러오지 못했습니다.");
        const data = (await res.json()) as RankingOverview;
        setRanking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류입니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [token, status]);

  const leaders = ranking?.leaders ?? [];
  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  const getBadgeVisual = (entry: RankingEntry) => {
    if (entry.primary_badge_icon_url) {
      return (
        <img
          src={entry.primary_badge_icon_url}
          alt={entry.primary_badge_name ?? "대표 배지"}
          className="h-full w-full object-cover"
        />
      );
    }
    if (entry.primary_badge_name) {
      return badgeFallbackMap[entry.primary_badge_name] ?? "🏅";
    }
    return "🏅";
  };

  const meEntry = useMemo(() => ranking?.me ?? null, [ranking]);

  return (
    <div className="w-full space-y-6 pb-24 px-1 text-slate-800">
      <div className="pt-4 text-left">
        <h1 className="text-3xl font-bold mb-1">순위</h1>
        <p className="text-slate-400 font-medium text-sm">
          전체 유저 랭킹을 확인하세요
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
        <>
          {meEntry && (
            <div className="bg-[#FFF5F8] rounded-[2.5rem] p-6 border-2 border-[#FFD1E0] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-2">
                  내 현재 순위
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-pink-500">
                    #{meEntry.rank}
                  </span>
                  <div>
                    <p className="text-lg font-bold">{meEntry.nickname}</p>
                    <p className="text-amber-500 font-bold">
                      ⚡ {meEntry.points} pt
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border-2 border-white bg-white shadow-md overflow-hidden flex items-center justify-center text-2xl">
                  {getBadgeVisual(meEntry)}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {topThree.map((entry, index) => {
              const highlightClasses = [
                "border-[#FDE047] bg-[#FFFDEB]",
                "border-[#CBD5F5] bg-[#F8FAFF]",
                "border-[#FCD34D] bg-[#FFF7ED]",
              ];
              const iconList = [Crown, Trophy, Medal];
              const Icon = iconList[index] ?? Medal;

              return (
                <div
                  key={entry.user_id}
                  className={`rounded-[2rem] border-2 p-5 shadow-sm flex items-center gap-4 ${highlightClasses[index] ?? "border-gray-200 bg-white"}`}
                >
                  <Icon className="w-7 h-7 text-amber-500" />
                  <div className="w-14 h-14 rounded-full border border-white shadow-sm overflow-hidden bg-white flex items-center justify-center text-xl">
                    {getBadgeVisual(entry)}
                  </div>
                  <div>
                    <p className="text-lg font-bold">{entry.nickname}</p>
                    <p className="text-amber-500 font-bold">⚡ {entry.points} pt</p>
                  </div>
                  <span className="ml-auto text-sm font-bold text-slate-400">
                    #{entry.rank}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            {rest.map((entry) => (
              <div
                key={entry.user_id}
                className="rounded-[2rem] border border-gray-200 p-5 bg-white flex items-center gap-4 shadow-sm"
              >
                <span className="w-8 text-center text-lg font-bold text-slate-400">
                  #{entry.rank}
                </span>
                <div className="w-12 h-12 rounded-full border border-white shadow-sm overflow-hidden bg-white flex items-center justify-center text-lg">
                  {getBadgeVisual(entry)}
                </div>
                <div>
                  <p className="text-lg font-bold">{entry.nickname}</p>
                  <p className="text-amber-500 font-bold">⚡ {entry.points} pt</p>
                </div>
                <Sparkles className="ml-auto w-5 h-5 text-slate-300" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
