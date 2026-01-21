"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Clock, Heart, MessageCircleHeart, Sparkles } from "lucide-react";

interface Participant {
  id: number;
  name: string;
  image_url?: string | null;
  gender?: string | null;
  is_newcomer?: boolean | null;
}

interface EpisodeSummary {
  id: number;
  episode_number: number;
  start_time: string;
}

interface SeasonPair {
  female_id: number;
  male_id: number;
}

interface PredictionItem {
  id: number;
  episode_id?: number | null;
  category?: string | null;
  question_text: string;
  odds?: number | null;
  is_multiple_choice: boolean;
  scope?: string | null;
  is_special: boolean;
}

interface OverviewResponse {
  next_episode?: EpisodeSummary | null;
  season_start_open: boolean;
  season_final_vote_open: boolean;
  season_couples_locked: boolean;
  season_couples: SeasonPair[];
  episode_predictions_locked?: boolean;
  participants: Participant[];
  episode_items: PredictionItem[];
  episode_answers?: {
    prediction_item_id: number;
    selected_value: string;
    target_participant_id?: number | null;
  }[];
  season_final_zero_vote?: number | null;
  season_popular_one?: number | null;
}

interface PairSelection {
  femaleId: number | null;
  maleId: number | null;
}

type LinkLine = {
  key: string;
  x1: number; y1: number;
  x2: number; y2: number;
  mx: number; my: number;
};

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function PredictTab() {
  const { data: session } = useSession();
  const token = (session as { appAccessToken?: string } | null)?.appAccessToken;

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("00:00:00");

  const [seasonSelection, setSeasonSelection] = useState<PairSelection>({
    femaleId: null,
    maleId: null,
  });
  const [seasonPairs, setSeasonPairs] = useState<SeasonPair[]>([]);
  const [seasonSubmitting, setSeasonSubmitting] = useState(false);

  const [finalZeroVote, setFinalZeroVote] = useState<number | "">("");
  const [popularOneVote, setPopularOneVote] = useState<number | "">("");
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const finalVoteLocked = Boolean(
    overview?.season_final_zero_vote && overview?.season_popular_one
  );

  const [messageSelection, setMessageSelection] = useState<PairSelection>({
    femaleId: null,
    maleId: null,
  });
  const [messagePairs, setMessagePairs] = useState<SeasonPair[]>([]);

  const [episodeAnswers, setEpisodeAnswers] = useState<Record<number, string>>(
    {}
  );
  const [episodeSubmitting, setEpisodeSubmitting] = useState(false);

  // ✅ 선 그리기 위한 ref/상태
  const pairBoardRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [seasonLines, setSeasonLines] = useState<LinkLine[]>([]);

  const messageBoardRef = useRef<HTMLDivElement | null>(null);
  const messageCardRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [messageLines, setMessageLines] = useState<LinkLine[]>([]);

  const participants = overview?.participants ?? [];
  const femaleParticipants = participants.filter((p) => p.gender === "female");
  const maleParticipants = participants.filter((p) => p.gender === "male");

  const messageItem = useMemo(
    () => overview?.episode_items.find((item) => item.category === "message_target"),
    [overview]
  );
  const likeUpItem = useMemo(
    () => overview?.episode_items.find((item) => item.category === "like_up"),
    [overview]
  );
  const likeDownItem = useMemo(
    () => overview?.episode_items.find((item) => item.category === "like_down"),
    [overview]
  );
  const specialItems = useMemo(
    () => overview?.episode_items.filter((item) => item.is_special) ?? [],
    [overview]
  );

  useEffect(() => {
    if (!token) return;
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/predictions/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("예측 데이터를 불러오지 못했어요.");
        }
        const data: OverviewResponse = await res.json();
        setOverview(data);
        setSeasonPairs(data.season_couples);
        if (data.season_final_zero_vote) {
          setFinalZeroVote(data.season_final_zero_vote);
        }
        if (data.season_popular_one) {
          setPopularOneVote(data.season_popular_one);
        }
        if (data.episode_answers && data.episode_answers.length > 0) {
          const nextMessagePairs: SeasonPair[] = [];
          const nextEpisodeAnswers: Record<number, string> = {};
          const messageItemData = data.episode_items.find(
            (item) => item.category === "message_target"
          );
          data.episode_answers.forEach((answer) => {
            if (messageItemData && answer.prediction_item_id === messageItemData.id) {
              const [femaleId, maleId] = answer.selected_value
                .split(":")
                .map((value) => Number(value));
              if (!Number.isNaN(femaleId) && !Number.isNaN(maleId)) {
                nextMessagePairs.push({ female_id: femaleId, male_id: maleId });
              }
            } else {
              nextEpisodeAnswers[answer.prediction_item_id] = answer.selected_value;
            }
          });
          if (nextMessagePairs.length > 0) {
            setMessagePairs(nextMessagePairs);
          }
          if (Object.keys(nextEpisodeAnswers).length > 0) {
            setEpisodeAnswers(nextEpisodeAnswers);
          }
        }
      } catch (fetchError) {
        setError((fetchError as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [token]);

  useEffect(() => {
    if (!overview?.next_episode) return;
    const target = new Date(overview.next_episode.start_time).getTime();
    const timer = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        clearInterval(timer);
      } else {
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        setTimeLeft(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [overview?.next_episode]);

  useEffect(() => {
    if (!seasonSelection.femaleId || !seasonSelection.maleId) return;
    const femaleId = seasonSelection.femaleId;
    const maleId = seasonSelection.maleId;
    const usedIds = new Set(seasonPairs.flatMap((pair) => [pair.female_id, pair.male_id]));
    if (usedIds.has(femaleId) || usedIds.has(maleId)) {
      setSeasonSelection({ femaleId: null, maleId: null });
      return;
    }
    setSeasonPairs((prev) => [...prev, { female_id: femaleId, male_id: maleId }]);
    setSeasonSelection({ femaleId: null, maleId: null });
  }, [seasonSelection, seasonPairs]);

  useEffect(() => {
    if (!messageSelection.femaleId || !messageSelection.maleId) return;
    const femaleId = messageSelection.femaleId;
    const maleId = messageSelection.maleId;
    const usedIds = new Set(
      messagePairs.flatMap((pair) => [pair.female_id, pair.male_id])
    );
    if (usedIds.has(femaleId) || usedIds.has(maleId)) {
      setMessageSelection({ femaleId: null, maleId: null });
      return;
    }
    setMessagePairs((prev) => [...prev, { female_id: femaleId, male_id: maleId }]);
    setMessageSelection({ femaleId: null, maleId: null });
  }, [messageSelection, messagePairs]);

  const handleSeasonSubmit = async () => {
    if (!token || seasonPairs.length === 0 || !overview?.season_start_open) return;
    try {
      setSeasonSubmitting(true);
      const res = await fetch(`${backendUrl}/predictions/season-couples`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pairs: seasonPairs }),
      });
      if (!res.ok) {
        throw new Error("시즌 예측 제출에 실패했어요.");
      }
      setOverview((prev) =>
        prev ? { ...prev, season_couples_locked: true } : prev
      );
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSeasonSubmitting(false);
    }
  };

  const handleFinalVoteSubmit = async () => {
    if (!token || !overview?.season_final_vote_open) return;
    if (!finalZeroVote || !popularOneVote) return;
    try {
      setFinalSubmitting(true);
      const res = await fetch(`${backendUrl}/predictions/season-final`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          final_zero_vote_participant_id: finalZeroVote,
          season_popular_participant_id: popularOneVote,
        }),
      });
      if (!res.ok) {
        throw new Error("최종 투표 제출에 실패했어요.");
      }
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              season_final_zero_vote: finalZeroVote,
              season_popular_one: popularOneVote,
            }
          : prev
      );
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setFinalSubmitting(false);
    }
  };

  const handleEpisodeSubmit = async () => {
    if (!token || !overview?.next_episode) return;
    if (overview?.episode_predictions_locked) return;
    const confirmed = window.confirm(
      "한번 예측하면 더이상 수정할 수 없습니다. 예측을 제출할까요?"
    );
    if (!confirmed) return;
    const answers: Array<{
      prediction_item_id: number;
      selected_value: string;
      target_participant_id?: number;
    }> = Object.entries(episodeAnswers).map(([key, value]) => ({
      prediction_item_id: Number(key),
      selected_value: value,
    }));
    if (messageItem && messagePairs.length > 0) {
      messagePairs.forEach((pair) => {
        answers.push({
          prediction_item_id: messageItem.id,
          selected_value: `${pair.female_id}:${pair.male_id}`,
          target_participant_id: pair.male_id,
        });
      });
    }
    if (answers.length === 0) return;

    try {
      setEpisodeSubmitting(true);
      const res = await fetch(`${backendUrl}/predictions/episode`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          episode_id: overview.next_episode.id,
          answers,
        }),
      });
      if (!res.ok) {
        throw new Error("회차 예측 제출에 실패했어요.");
      }
      setOverview((prev) =>
        prev ? { ...prev, episode_predictions_locked: true } : prev
      );
      window.alert("예측이 성공적으로 저장되었습니다.");
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setEpisodeSubmitting(false);
    }
  };

  // ✅ 직선 라인 계산
  const computeSeasonLines = () => {
    const board = pairBoardRef.current;
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    const lines: LinkLine[] = [];

    for (const pair of seasonPairs) {
      const femaleEl = cardRefs.current[pair.female_id];
      const maleEl = cardRefs.current[pair.male_id];
      if (!femaleEl || !maleEl) continue;

      const f = femaleEl.getBoundingClientRect();
      const m = maleEl.getBoundingClientRect();

      const x1 = (m.left + m.width / 2) - boardRect.left;
      const y1 = (m.top + m.height / 2) - boardRect.top;
      const x2 = (f.left + f.width / 2) - boardRect.left;
      const y2 = (f.top + f.height / 2) - boardRect.top;

      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      lines.push({ key: `${pair.male_id}-${pair.female_id}`, x1, y1, x2, y2, mx, my });
    }

    setSeasonLines(lines);
  };

  const computeMessageLines = () => {
    const board = messageBoardRef.current;
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    const lines: LinkLine[] = [];

    for (const pair of messagePairs) {
      const femaleEl = messageCardRefs.current[pair.female_id];
      const maleEl = messageCardRefs.current[pair.male_id];
      if (!femaleEl || !maleEl) continue;

      const f = femaleEl.getBoundingClientRect();
      const m = maleEl.getBoundingClientRect();

      const x1 = (m.left + m.width / 2) - boardRect.left;
      const y1 = (m.top + m.height / 2) - boardRect.top;
      const x2 = (f.left + f.width / 2) - boardRect.left;
      const y2 = (f.top + f.height / 2) - boardRect.top;

      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      lines.push({
        key: `msg-${pair.male_id}-${pair.female_id}`,
        x1, y1, x2, y2, mx, my
      });
    }

    setMessageLines(lines);
  };

  function getScrollParents(el: HTMLElement | null) {
    const parents: (HTMLElement | Window)[] = [];
    if (!el) return parents;

    let parent: HTMLElement | null = el.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;

      const isScrollableY = overflowY === "auto" || overflowY === "scroll";
      const isScrollableX = overflowX === "auto" || overflowX === "scroll";

      if (isScrollableY || isScrollableX) parents.push(parent);
      parent = parent.parentElement;
    }

    // 마지막으로 window도 포함 (페이지 스크롤일 때)
    parents.push(window);
    return parents;
  }

  useLayoutEffect(() => {
    computeSeasonLines();
    computeMessageLines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    seasonPairs,
    messagePairs,
    overview?.season_couples_locked,
    participants.length,
  ]);

  useEffect(() => {
    let raf = 0;

    const onScrollOrResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        computeSeasonLines();
        computeMessageLines();
        raf = 0;
      });
    };

    // ✅ 두 보드의 스크롤 부모들을 모두 합집합으로 등록
    const boards = [pairBoardRef.current, messageBoardRef.current].filter(Boolean) as HTMLElement[];
    const parentsSet = new Set<HTMLElement | Window>();

    boards.forEach((b) => {
      getScrollParents(b).forEach((p) => parentsSet.add(p));
    });

    const scrollParents = Array.from(parentsSet);

    window.addEventListener("resize", onScrollOrResize);

    scrollParents.forEach((p) => {
      if (p === window) {
        window.addEventListener("scroll", onScrollOrResize, { passive: true });
      } else {
        (p as HTMLElement).addEventListener("scroll", onScrollOrResize, { passive: true });
      }
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onScrollOrResize);
      window.visualViewport.addEventListener("scroll", onScrollOrResize);
    }

    onScrollOrResize();

    return () => {
      if (raf) cancelAnimationFrame(raf);

      window.removeEventListener("resize", onScrollOrResize);

      scrollParents.forEach((p) => {
        if (p === window) {
          window.removeEventListener("scroll", onScrollOrResize);
        } else {
          (p as HTMLElement).removeEventListener("scroll", onScrollOrResize);
        }
      });

      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onScrollOrResize);
        window.visualViewport.removeEventListener("scroll", onScrollOrResize);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderParticipantCard = (
    participant: Participant,
    active: boolean,
    disabled: boolean,
    onClick: () => void,
    registerRef?: (el: HTMLButtonElement | null) => void
  ) => (
    <button
      ref={registerRef}
      key={participant.id}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex w-full max-w-[140px] flex-col items-center justify-center gap-2 rounded-3xl border-2 px-3 py-3 transition-all sm:max-w-[190px] ${
        active ? "border-pink-400 bg-pink-50" : "border-slate-200 bg-white"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
    >
      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:h-24 sm:w-24">
        {participant.image_url ? (
          <img
            src={participant.image_url}
            alt={participant.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            NO IMG
          </div>
        )}
      </div>
      <span className="text-sm font-bold text-slate-800">{participant.name}</span>
      {participant.is_newcomer && (
        <span className="absolute -top-3 right-3 rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
          메기
        </span>
      )}
    </button>
  );

  if (loading) {
    return <div className="text-center text-sm text-slate-500">불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900">
          EP.{overview?.next_episode?.episode_number ?? "--"} 예측하기
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          다음 회차 시작 전까지 예측에 참여해 포인트를 획득하세요.
        </p>
      </div>

      <div className="rounded-[2rem] border border-pink-200 bg-pink-50/60 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Clock className="h-5 w-5 text-pink-500" />
            예측 마감까지
          </div>
          <span className="text-3xl font-black text-pink-500">{timeLeft}</span>
        </div>
      </div>

      <div className="space-y-6 rounded-[2rem] border border-pink-200 bg-white px-6 py-8">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-lg font-black text-slate-900">시즌 시작 예측</p>
            <p className="text-xs text-amber-600">시즌 종료까지 유지</p>
          </div>
        </div>

        {!overview?.season_start_open && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            현재는 시즌 시작 예측 기간이 아닙니다.
          </div>
        )}
        <div className="rounded-[2rem] border border-pink-200 bg-pink-50/60 px-6 py-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-base font-black text-slate-900">
                  최종 커플 예측 (Love-Line)
                </p>
                <p className="text-xs text-slate-500">
                  커플은 한번 제출하면 수정할 수 없어요.
                </p>
              </div>
              {!overview?.season_couples_locked && overview?.season_start_open && (
                <button
                  type="button"
                  onClick={() => setSeasonPairs([])}
                  className="text-xs font-semibold text-slate-400 hover:text-pink-500"
                >
                  초기화
                </button>
              )}
            </div>

            <div ref={pairBoardRef} className="relative">
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={{ zIndex: 5 }}
                aria-hidden
              >
                {seasonLines.map((l) => (
                  <g key={l.key}>
                    <line
                      x1={l.x1} y1={l.y1}
                      x2={l.x2} y2={l.y2}
                      stroke="#fb7185"
                      strokeWidth={6}
                      strokeLinecap="round"
                      opacity={0.85}
                    />
                    <circle
                      cx={l.mx} cy={l.my}
                      r={14}
                      fill="#fb7185"
                      opacity={0.95}
                    />
                    <text
                      x={l.mx}
                      y={l.my + 5}
                      textAnchor="middle"
                      fontSize="16"
                      fill="white"
                      fontWeight="700"
                    >
                      ♥
                    </text>
                  </g>
                ))}
              </svg>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-center text-xs font-semibold text-slate-500">남성 출연자</p>
                  <div className="flex flex-col items-center space-y-1">
                    {maleParticipants.map((participant) => {
                      const disabled =
                        !overview?.season_start_open ||
                        overview?.season_couples_locked ||
                        seasonPairs.some((pair) => pair.male_id === participant.id);

                      return renderParticipantCard(
                        participant,
                        seasonSelection.maleId === participant.id,
                        disabled,
                        () =>
                          setSeasonSelection((prev) => ({
                            ...prev,
                            maleId: participant.id,
                          })),
                        (el) => {
                          cardRefs.current[participant.id] = el;
                        }
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <p className="text-center text-xs font-semibold text-slate-500">여성 출연자</p>
                  <div className="flex flex-col items-center space-y-1">
                    {femaleParticipants.map((participant) => {
                      const disabled =
                        !overview?.season_start_open ||
                        overview?.season_couples_locked ||
                        seasonPairs.some((pair) => pair.female_id === participant.id);

                      return renderParticipantCard(
                        participant,
                        seasonSelection.femaleId === participant.id,
                        disabled,
                        () =>
                          setSeasonSelection((prev) => ({
                            ...prev,
                            femaleId: participant.id,
                          })),
                        (el) => {
                          cardRefs.current[participant.id] = el;
                        }
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold text-pink-500">
                예측된 커플 ({seasonPairs.length}쌍)
              </p>
              {seasonPairs.length === 0 && (
                <p className="text-sm text-slate-400">
                  아직 매칭된 커플이 없습니다.
                </p>
              )}
              {seasonPairs.map((pair) => {
                const female = participants.find((p) => p.id === pair.female_id);
                const male = participants.find((p) => p.id === pair.male_id);
                if (!female || !male) return null;
                return (
                  <div
                    key={`${pair.female_id}-${pair.male_id}`}
                    className="flex items-center justify-between rounded-2xl border border-pink-200 bg-white px-4 py-3"
                  >
                    <div className="flex flex-1 items-center justify-center gap-3 text-sm font-semibold text-slate-800">
                      {female.name}
                      <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                      {male.name}
                    </div>
                    {!overview?.season_couples_locked && overview?.season_start_open && (
                      <button
                        type="button"
                        onClick={() =>
                          setSeasonPairs((prev) =>
                            prev.filter(
                              (item) =>
                                !(
                                  item.female_id === pair.female_id &&
                                  item.male_id === pair.male_id
                                )
                            )
                          )
                        }
                        className="text-xs text-slate-400 hover:text-pink-500"
                      >
                        제거
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSeasonSubmit}
              disabled={
                seasonSubmitting ||
                !overview?.season_start_open ||
                overview?.season_couples_locked ||
                seasonPairs.length === 0
              }
              className="mt-8 w-full rounded-3xl bg-pink-500 py-4 text-base font-bold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {overview?.season_couples_locked
                ? "제출 완료"
                : seasonSubmitting
                ? "제출 중..."
                : "예측 제출하기"}
            </button>
          </div>
      </div>

      {/* 아래는 원본 그대로 (시즌 최종 투표 / 회차별 예측 등) */}
      {overview?.season_final_vote_open && (
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6">
          <p className="text-base font-black text-slate-900">
            시즌 최종 투표 (1회 한정)
          </p>
          <p className="mt-1 text-xs text-slate-500">
            메기가 모두 합류한 후 진행되는 최종 투표입니다.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">최종 0표 출연자</p>
              <select
                value={finalZeroVote}
                onChange={(event) => setFinalZeroVote(Number(event.target.value))}
                disabled={finalVoteLocked}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-200"
              >
                <option value="">선택하세요</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">시즌 인기 1위</p>
              <select
                value={popularOneVote}
                onChange={(event) => setPopularOneVote(Number(event.target.value))}
                disabled={finalVoteLocked}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-200"
              >
                <option value="">선택하세요</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinalVoteSubmit}
            disabled={finalSubmitting || finalVoteLocked || !finalZeroVote || !popularOneVote}
            className="mt-6 w-full rounded-3xl bg-pink-500 py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {finalVoteLocked ? "제출 완료" : finalSubmitting ? "제출 중..." : "투표 제출하기"}
          </button>
        </div>
      )}

      <div className="rounded-[2rem] border border-pink-200 bg-white px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-lg">📺</span>
          <div>
            <p className="text-base font-black text-slate-900">회차별 예측</p>
            <p className="text-xs text-pink-500">이번 회차만</p>
          </div>
        </div>

        {messageItem ? (
          <div className="rounded-[2rem] border border-pink-200 bg-pink-50/60 px-6 py-6">
            <p className="text-base font-black text-slate-900">문자 발송 대상 예측</p>
            <p className="text-xs text-slate-500">
              출연자를 선택해 문자 발송 커플을 만들어보세요.
            </p>

            <div ref={messageBoardRef} className="relative">
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={{ zIndex: 5 }}
                aria-hidden
              >
                {messageLines.map((l) => (
                  <g key={l.key}>
                    <line
                      x1={l.x1} y1={l.y1}
                      x2={l.x2} y2={l.y2}
                      stroke="#fb7185"
                      strokeWidth={6}
                      strokeLinecap="round"
                      opacity={0.85}
                    />
                    <circle
                      cx={l.mx} cy={l.my}
                      r={14}
                      fill="#fb7185"
                      opacity={0.95}
                    />
                    <text
                      x={l.mx}
                      y={l.my + 5}
                      textAnchor="middle"
                      fontSize="16"
                      fill="white"
                      fontWeight="700"
                    >
                      ♥
                    </text>
                  </g>
                ))}
              </svg>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-center text-xs font-semibold text-slate-500">남성 출연자</p>
                  <div className="flex flex-col items-center space-y-1">
                    {maleParticipants.map((participant) => {
                      const disabled = messagePairs.some((pair) => pair.male_id === participant.id);

                      return renderParticipantCard(
                        participant,
                        messageSelection.maleId === participant.id,
                        disabled,
                        () =>
                          setMessageSelection((prev) => ({
                            ...prev,
                            maleId: participant.id,
                          })),
                        (el) => {
                          messageCardRefs.current[participant.id] = el;
                        }
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <p className="text-center text-xs font-semibold text-slate-500">여성 출연자</p>
                  <div className="flex flex-col items-center space-y-1">
                    {femaleParticipants.map((participant) => {
                      const disabled = messagePairs.some((pair) => pair.female_id === participant.id);

                      return renderParticipantCard(
                        participant,
                        messageSelection.femaleId === participant.id,
                        disabled,
                        () =>
                          setMessageSelection((prev) => ({
                            ...prev,
                            femaleId: participant.id,
                          })),
                        (el) => {
                          messageCardRefs.current[participant.id] = el;
                        }
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {messagePairs.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold text-pink-500">
                  예측된 커플 ({messagePairs.length}쌍)
                </p>

                {messagePairs.map((pair) => {
                  const female = participants.find((p) => p.id === pair.female_id);
                  const male = participants.find((p) => p.id === pair.male_id);
                  if (!female || !male) return null;

                  return (
                    <div
                      key={`${pair.female_id}-${pair.male_id}`}
                      className="flex items-center justify-between rounded-2xl border border-pink-200 bg-white px-4 py-3"
                    >
                      <div className="flex flex-1 items-center justify-center gap-3 text-sm font-semibold text-slate-800">
                        {female.name}
                        <MessageCircleHeart className="h-4 w-4 text-pink-500" />
                        {male.name}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setMessagePairs((prev) =>
                            prev.filter(
                              (item) =>
                                !(
                                  item.female_id === pair.female_id &&
                                  item.male_id === pair.male_id
                                )
                            )
                          )
                        }
                        className="text-xs text-slate-400 hover:text-pink-500"
                      >
                        제거
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            이번 회차 예측 문항이 아직 열리지 않았습니다.
          </p>
        )}

        {(likeUpItem || likeDownItem) && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {likeUpItem && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4">
                <p className="text-xs font-semibold text-green-600">호감도 상승</p>
                <select
                  value={episodeAnswers[likeUpItem.id] ?? ""}
                  onChange={(event) =>
                    setEpisodeAnswers((prev) => ({
                      ...prev,
                      [likeUpItem.id]: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-green-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">선택하세요</option>
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {likeDownItem && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
                <p className="text-xs font-semibold text-rose-600">민심 나락</p>
                <select
                  value={episodeAnswers[likeDownItem.id] ?? ""}
                  onChange={(event) =>
                    setEpisodeAnswers((prev) => ({
                      ...prev,
                      [likeDownItem.id]: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">선택하세요</option>
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {specialItems.length > 0 && (
          <div className="mt-6 space-y-4">
            <p className="text-base font-black text-slate-900">특수 베팅</p>

            {specialItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[2rem] border border-slate-200 bg-white px-5 py-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    {item.question_text}
                  </p>

                  {item.odds !== null && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">
                      {item.odds}배
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {["O (예)", "X (아니오)"].map((label, index) => {
                    const value = index === 0 ? "yes" : "no";
                    const active = episodeAnswers[item.id] === value;

                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setEpisodeAnswers((prev) => ({
                            ...prev,
                            [item.id]: value,
                          }))
                        }
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                          active
                            ? "border-pink-500 bg-pink-50 text-pink-600"
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleEpisodeSubmit}
          disabled={episodeSubmitting || overview?.episode_predictions_locked}
          className="mt-8 w-full rounded-3xl bg-pink-500 py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {overview?.episode_predictions_locked
            ? "제출 완료"
            : episodeSubmitting
            ? "제출 중..."
            : "예측 제출하기"}
        </button>
      </div>
    </div>
  );
}
