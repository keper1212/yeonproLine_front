"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Medal,
  TrendingUp,
  Sparkles,
  Calendar,
  CheckCircle2,
  XCircle,
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

const badgeIconMap: Record<string, string> = {
  "연프 촉": "🔮",
  "편집 읽는 사람": "🎬",
  "역배 전문가": "🎲",
  "분석왕": "📊",
  "초심자": "🌱",
  "열정팬": "🔥",
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const predictionLabelMap: Record<string, string> = {
  season_final_couple: "최종 커플 예측",
  final_zero_vote: "최종 0표 출연자 예측",
  season_popular_one: "시즌 인기 1위 출연자 예측",
  message_target: "누가 문자를 받을까?",
  like_up: "호감도 상승 출연자는?",
  like_down: "민심 나락 출연자는?",
};

type UserSummary = {
  nickname: string;
  points: number;
  accuracy_rate: number;
  participated_episodes: number;
  primary_badge_id?: number | null;
  primary_badge_name?: string | null;
  primary_badge_icon_url?: string | null;
};

type BadgeItem = {
  id: number;
  name: string;
  description?: string | null;
  icon_url?: string | null;
  is_owned: boolean;
  earned_at?: string | null;
};

type BadgeCollection = {
  badges: BadgeItem[];
};

type Participant = {
  id: number;
  name: string;
  gender: "male" | "female";
};

type OverviewResponse = {
  participants: Participant[];
};

type AccuracyPoint = {
  episode_id: number;
  accuracy_rate: number;
  correct_predictions: number;
  total_predictions: number;
};

type AccuracyTrend = {
  points: AccuracyPoint[];
};

type PredictionItem = {
  id: number;
  prediction_item_id?: number | null;
  prediction_type: string;
  question_text?: string | null;
  category?: string | null;
  target_participant_id?: number | null;
  selected_value: string;
  betting_points: number;
  is_correct?: boolean | null;
  earned_points: number;
};

type EpisodePredictions = {
  episode_id: number;
  predictions: PredictionItem[];
};

type PredictionHistory = {
  episodes: EpisodePredictions[];
};

export default function ProfileTab() {
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [accuracy, setAccuracy] = useState<AccuracyPoint[]>([]);
  const [history, setHistory] = useState<EpisodePredictions[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const [badgeUpdateLoading, setBadgeUpdateLoading] = useState(false);
  const [badgeUpdateError, setBadgeUpdateError] = useState<string | null>(null);
  const [newBadges, setNewBadges] = useState<BadgeItem[]>([]);
  const [showNewBadgeDialog, setShowNewBadgeDialog] = useState(false);
  const [showPointShop, setShowPointShop] = useState(false);
  const [pointShopTab, setPointShopTab] = useState<"profile" | "badge">("profile");

  useEffect(() => {
    const token = session?.appAccessToken;
    if (!token) {
      if (status !== "loading") {
        setLoading(false);
        setError("로그인이 필요합니다.");
      }
      return;
    }

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [summaryRes, badgesRes, accuracyRes, historyRes, overviewRes] =
          await Promise.all([
            fetch(`${backendUrl}/users/me`, { headers }),
            fetch(`${backendUrl}/users/me/badges`, { headers }),
            fetch(`${backendUrl}/users/me/stats/accuracy`, { headers }),
            fetch(`${backendUrl}/users/me/predictions`, { headers }),
            fetch(`${backendUrl}/predictions/overview`, { headers }),
          ]);

        if (!summaryRes.ok) throw new Error("요약 정보를 불러오지 못했습니다.");
        if (!badgesRes.ok) throw new Error("배지 정보를 불러오지 못했습니다.");
        if (!accuracyRes.ok) throw new Error("적중률 데이터를 불러오지 못했습니다.");
        if (!historyRes.ok) throw new Error("히스토리를 불러오지 못했습니다.");

        const summaryData = (await summaryRes.json()) as UserSummary;
        const badgesData = (await badgesRes.json()) as BadgeCollection;
        const accuracyData = (await accuracyRes.json()) as AccuracyTrend;
        const historyData = (await historyRes.json()) as PredictionHistory;
        const overviewData = overviewRes.ok
          ? ((await overviewRes.json()) as OverviewResponse)
          : { participants: [] };

        setSummary(summaryData);
        setNicknameDraft(summaryData.nickname);
        setBadges(badgesData.badges ?? []);
        setAccuracy(accuracyData.points ?? []);
        setHistory(historyData.episodes ?? []);
        setParticipants(overviewData.participants ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [session?.appAccessToken, status]);

  useEffect(() => {
    if (loading) return;
    if (!badges.length) return;
    try {
      const lastSeenRaw = localStorage.getItem("lastBadgeSeenAt");
      const lastSeen = lastSeenRaw ? new Date(lastSeenRaw) : null;
      const earnedBadges = badges
        .filter((badge) => badge.is_owned && badge.earned_at)
        .map((badge) => ({
          badge,
          earnedAt: new Date(badge.earned_at as string),
        }))
        .filter((item) => !Number.isNaN(item.earnedAt.getTime()))
        .sort((a, b) => a.earnedAt.getTime() - b.earnedAt.getTime());

      if (!earnedBadges.length) return;

      const fresh = lastSeen
        ? earnedBadges.filter((item) => item.earnedAt > lastSeen)
        : earnedBadges;

      if (fresh.length) {
        setNewBadges(fresh.map((item) => item.badge));
        setShowNewBadgeDialog(true);
      }
    } catch (err) {
      console.warn("배지 알림 처리 실패", err);
    }
  }, [badges, loading]);

  const userEarnedBadges = useMemo(
    () => badges.filter((badge) => badge.is_owned),
    [badges]
  );
  const primaryBadgeEmoji = useMemo(() => {
    if (!summary?.primary_badge_name) return "👤";
    return badgeIconMap[summary.primary_badge_name] ?? "👤";
  }, [summary?.primary_badge_name]);

  const handleNicknameSave = async () => {
    const token = session?.appAccessToken;
    if (!token || !summary) return;
    const trimmed = nicknameDraft.trim();
    if (!trimmed || trimmed === summary.nickname) {
      setEditingNickname(false);
      setNicknameDraft(summary.nickname);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/users/me/nickname`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: trimmed }),
      });
      if (!res.ok) {
        throw new Error("닉네임 변경에 실패했습니다.");
      }
      const nextSummary = (await res.json()) as UserSummary;
      setSummary(nextSummary);
      setNicknameDraft(nextSummary.nickname);
      setEditingNickname(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryBadgeUpdate = async (badgeId: number) => {
    const token = session?.appAccessToken;
    if (!token || !summary) return;
    try {
      setBadgeUpdateLoading(true);
      setBadgeUpdateError(null);
      const res = await fetch(`${backendUrl}/users/me/primary-badge`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ badge_id: badgeId }),
      });
      if (!res.ok) {
        throw new Error("프로필 배지 변경에 실패했습니다.");
      }
      const nextSummary = (await res.json()) as UserSummary;
      setSummary(nextSummary);
      setShowBadgePicker(false);
    } catch (err) {
      setBadgeUpdateError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setBadgeUpdateLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: "적중률",
        value: `${summary.accuracy_rate.toFixed(0)}%`,
        color: "#FF4D77",
      },
      { label: "총 포인트", value: String(summary.points), color: "#7C3AED" },
      {
        label: "참여 회차",
        value: String(summary.participated_episodes),
        color: "#3B82F6",
      },
    ];
  }, [summary]);

  const chartData = useMemo(
    () =>
      accuracy.map((point) => ({
        name: `EP.${point.episode_id}`,
        rate: point.accuracy_rate,
      })),
    [accuracy]
  );

  const historyData = useMemo(() => {
    const participantMap = new Map(participants.map((p) => [p.id, p]));
    const formatValue = (item: PredictionItem) => {
      if (!item.selected_value) return "";
      if (item.prediction_type === "season_final_couple") {
        const [femaleId, maleId] = item.selected_value.split(":").map(Number);
        const femaleName = participantMap.get(femaleId)?.name;
        const maleName = participantMap.get(maleId)?.name;
        if (femaleName && maleName) {
          return `${femaleName} ♥ ${maleName}`;
        }
      }
      if (item.selected_value.includes(":")) {
        const [firstId, secondId] = item.selected_value.split(":").map(Number);
        const firstName = participantMap.get(firstId)?.name;
        const secondName = participantMap.get(secondId)?.name;
        if (firstName && secondName) {
          return `${firstName} ♥ ${secondName}`;
        }
      }
      const numericValue = Number(item.selected_value);
      if (!Number.isNaN(numericValue)) {
        const name = participantMap.get(numericValue)?.name;
        if (name) return name;
      }
      return item.selected_value;
    };

    return history.map((episode) => {
      const totalPoints = episode.predictions.reduce(
        (acc, item) => acc + (item.earned_points || 0),
        0
      );
      const correctCount = episode.predictions.filter(
        (item) => item.is_correct
      ).length;
      const totalCount = episode.predictions.length;

      return {
        episode: `EP.${episode.episode_id}`,
        date: "",
        totalPoints: `${totalPoints >= 0 ? "+" : ""}${totalPoints} pt`,
        correctRatio: `${correctCount}/${totalCount} 정답`,
        details: episode.predictions.map((item) => ({
          label:
            item.question_text ||
            predictionLabelMap[item.prediction_type] ||
            item.prediction_type,
          value: formatValue(item),
          points:
            item.earned_points > 0
              ? `+${item.earned_points}`
              : item.earned_points < 0
              ? String(item.earned_points)
              : "",
          correct: item.is_correct ?? false,
        })),
      };
    });
  }, [history, participants]);

  const fontMain = "font-sans antialiased tracking-tight text-slate-800";

  const shopProfileItems = [
    {
      id: "frame-gold",
      name: "엔티크 골든 로즈",
      price: 800,
      image: "/frame/gold.png",
    },
    {
      id: "frame-heart",
      name: "핑크 하트 시그널",
      price: 800,
      image: "/frame/heart.png",
    },
    {
      id: "frame-water",
      name: "흩날리는 물보라",
      price: 800,
      image: "/frame/water.png",
    },
    {
      id: "frame-tree",
      name: "숲속의 작은 초대",
      price: 800,
      image: "/frame/tree.png",
    },
    {
      id: "frame-flower",
      name: "벚꽃 아래, 우리",
      price: 800,
      image: "/frame/flower.png",
    },
    {
      id: "frame-black",
      name: "금지된 다크 글리치",
      price: 800,
      image: "/frame/black.png",
    },
  ];
  const shopBadgeItems = [
    { id: "badge-ring", name: "링 배지", price: 1000, image: "/badges/ring.png" },
    {
      id: "badge-heart-bit",
      name: "하트 비트",
      price: 1000,
      image: "/badges/heart_bit.png",
    },
  ];

  return (
    <div className={`w-full space-y-6 pb-20 px-1 ${fontMain}`}>
      <div className="pt-4 text-left">
        <h1 className="text-3xl font-bold mb-1">내 정보</h1>
        <p className="text-slate-400 font-medium text-sm">
          내 예측 기록과 통계를 확인하세요
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

      {!loading && !error && summary && (
        <>
          <div className="bg-[#FFF5F8] rounded-[2.5rem] p-6 border-2 border-[#FFD1E0] shadow-sm text-left">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 flex-shrink-0 rounded-full border-4 border-white overflow-hidden shadow-md bg-white flex items-center justify-center">
                    {summary.primary_badge_icon_url ? (
                      <img
                        src={summary.primary_badge_icon_url}
                        alt={summary.primary_badge_name ?? "대표 배지"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{primaryBadgeEmoji}</span>
                    )}
                  </div>
                  {editingNickname ? (
                    <input
                      value={nicknameDraft}
                      onChange={(event) => setNicknameDraft(event.target.value)}
                      className="rounded-lg border border-pink-200 bg-white px-3 py-1 text-sm font-semibold text-slate-800"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{summary.nickname}</h2>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingNickname ? (
                    <>
                      <button
                        type="button"
                        onClick={handleNicknameSave}
                        className="rounded-lg bg-pink-500 px-3 py-1 text-xs font-bold text-white"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNickname(false);
                          setNicknameDraft(summary.nickname);
                        }}
                        className="rounded-lg border border-pink-200 px-3 py-1 text-xs font-bold text-pink-500"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingNickname(true)}
                      className="rounded-lg border border-pink-200 px-3 py-1 text-xs font-bold text-pink-500"
                    >
                      닉네임 수정
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setBadgeUpdateError(null);
                      setShowBadgePicker(true);
                    }}
                    className="rounded-lg border border-pink-200 px-3 py-1 text-xs font-bold text-pink-500"
                  >
                    프로필 수정
                  </button>
                </div>
                <div className="flex gap-1.5 text-lg">
              {userEarnedBadges.map((badge) => (
                <span key={badge.id}>
                  {badge.icon_url ? (
                    <img
                      src={badge.icon_url}
                      alt={badge.name}
                      className="inline-block h-6 w-6 object-contain"
                    />
                  ) : (
                    badgeIconMap[badge.name] ?? "👤"
                  )}
                </span>
              ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPointShop(true)}
                className="rounded-full border border-pink-300 px-4 py-2 text-xs font-bold text-pink-500 bg-white"
              >
                포인트 샵
              </button>
            </div>

            <div className="flex flex-row justify-between gap-3 w-full">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex-1 bg-white rounded-2xl py-4 px-2 text-center shadow-sm border border-pink-50 min-w-0"
                >
                  <p className="text-xl font-bold mb-0.5" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {showBadgePicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-800">프로필 배지 선택</h4>
                  <button
                    type="button"
                    onClick={() => setShowBadgePicker(false)}
                    className="text-sm font-semibold text-slate-400 hover:text-slate-600"
                  >
                    닫기
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  획득한 배지 중 하나를 프로필 이미지로 설정하세요.
                </p>
                {badgeUpdateError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-500">
                    {badgeUpdateError}
                  </div>
                )}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {userEarnedBadges.map((badge) => {
                    const isSelected = summary.primary_badge_id === badge.id;
                    return (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => handlePrimaryBadgeUpdate(badge.id)}
                        disabled={badgeUpdateLoading}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 text-center transition-all ${
                          isSelected
                            ? "border-pink-500 bg-pink-50"
                            : "border-slate-100 hover:border-pink-200"
                        }`}
                      >
                        {badge.icon_url ? (
                          <img
                            src={badge.icon_url}
                            alt={badge.name}
                            className="mb-1 h-9 w-9 object-contain"
                          />
                        ) : (
                          <span className="text-2xl mb-1">
                            {badgeIconMap[badge.name] ?? "👤"}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-600">
                          {badge.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBadgePicker(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPointShop && summary && (
            <div className="fixed inset-0 z-50 bg-white px-6 pb-10 pt-8 text-slate-800">
              <button
                type="button"
                onClick={() => setShowPointShop(false)}
                className="text-sm font-semibold text-slate-500"
              >
                ← 뒤로
              </button>

              <h2 className="mt-6 text-3xl font-black">포인트 샵</h2>
              <div className="mt-2 text-2xl font-bold text-amber-500">
                ⚡ {summary.points.toLocaleString()} pt
              </div>

              <div className="mt-6 flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setPointShopTab("profile")}
                  className={`flex-1 rounded-full py-3 text-sm font-bold transition ${
                    pointShopTab === "profile"
                      ? "bg-pink-500 text-white"
                      : "text-slate-500"
                  }`}
                >
                  프레임
                </button>
                <button
                  type="button"
                  onClick={() => setPointShopTab("badge")}
                  className={`flex-1 rounded-full py-3 text-sm font-bold transition ${
                    pointShopTab === "badge"
                      ? "bg-pink-500 text-white"
                      : "text-slate-500"
                  }`}
                >
                  배지
                </button>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {(pointShopTab === "profile"
                  ? shopProfileItems
                  : shopBadgeItems
                ).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[2rem] border border-slate-200 p-6 text-center shadow-sm"
                  >
                    <div className="mx-auto mb-4 h-24 w-24 rounded-2xl bg-slate-100 flex items-center justify-center">
                      {"image" in item && item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl border-4 border-pink-200 bg-white" />
                      )}
                    </div>
                    <p className="text-lg font-bold">{item.name}</p>
                    <p className="mt-1 text-sm font-bold text-amber-500">
                      ⚡ {item.price}
                    </p>
                    <button
                      type="button"
                      className="mt-5 w-full rounded-full bg-pink-500 py-3 text-sm font-bold text-white"
                    >
                      구매하기
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 text-left">
            <div className="flex items-center gap-2 mb-6">
              <Medal className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h3 className="text-lg font-bold">획득한 배지</h3>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center justify-center py-4 px-1 rounded-2xl border-2 transition-all duration-300 ${
                    badge.is_owned
                      ? "bg-[#FFFDEB] border-[#FDE047] shadow-sm"
                      : "bg-gray-50 border-transparent opacity-30 grayscale"
                  }`}
                  title={badge.is_owned ? badge.description ?? "" : ""}
                >
                  {badge.icon_url ? (
                    <img
                      src={badge.icon_url}
                      alt={badge.name}
                      className="mb-1 h-8 w-8 object-contain"
                    />
                  ) : (
                    <span className="text-2xl mb-1">{badgeIconMap[badge.name] ?? "👤"}</span>
                  )}
                  <p className="text-[10px] font-bold text-center leading-tight px-1">
                    {badge.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {showNewBadgeDialog && newBadges.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl text-center">
                <h4 className="text-lg font-bold text-slate-800">
                  새로운 배지를 획득했어요!
                </h4>
                <p className="mt-2 text-xs text-slate-400">
                  내 정보 탭에서 획득한 배지를 확인하세요.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {newBadges.map((badge) => (
                    <div
                      key={`new-${badge.id}`}
                      className="flex flex-col items-center justify-center rounded-2xl border border-pink-100 bg-pink-50 px-2 py-3"
                    >
                      {badge.icon_url ? (
                        <img
                          src={badge.icon_url}
                          alt={badge.name}
                          className="mb-1 h-9 w-9 object-contain"
                        />
                      ) : (
                        <span className="text-2xl mb-1">
                          {badgeIconMap[badge.name] ?? "👤"}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-600">
                        {badge.name}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const latestEarned = newBadges
                      .map((badge) =>
                        badge.earned_at ? new Date(badge.earned_at) : null
                      )
                      .filter((date): date is Date => !!date)
                      .sort((a, b) => b.getTime() - a.getTime())[0];
                    const nextSeen = latestEarned ?? new Date();
                    localStorage.setItem("lastBadgeSeenAt", nextSeen.toISOString());
                    setShowNewBadgeDialog(false);
                  }}
                  className="mt-5 w-full rounded-full bg-pink-500 py-2 text-sm font-bold text-white"
                >
                  확인
                </button>
              </div>
            </div>
          )}

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
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    tick={{ fill: "#94a3b8", fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "15px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

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
              {(showAllHistory ? historyData : historyData.slice(0, 1)).map((item) => (
                <div
                  key={item.episode}
                  className="bg-slate-50 rounded-[1.8rem] p-6 border border-slate-100 animate-in fade-in duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">{item.episode}</h4>
                      <p className="text-[10px] font-medium text-slate-400">{item.date || ""}</p>
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
                          <span className="text-xs font-medium text-slate-600">
                            {detail.label}
                            {detail.value ? `: ${detail.value}` : ""}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-500">
                          {detail.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
