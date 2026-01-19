"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Clock, Heart, Sparkles } from "lucide-react";

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
  participants: Participant[];
  episode_items: PredictionItem[];
  season_final_zero_vote?: number | null;
  season_popular_one?: number | null;
}

interface PairSelection {
  femaleId: number | null;
  maleId: number | null;
}

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

  const [messageSelection, setMessageSelection] = useState<PairSelection>({
    femaleId: null,
    maleId: null,
  });
  const [messagePairs, setMessagePairs] = useState<SeasonPair[]>([]);

  const [episodeAnswers, setEpisodeAnswers] = useState<Record<number, string>>(
    {}
  );
  const [episodeSubmitting, setEpisodeSubmitting] = useState(false);

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
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setFinalSubmitting(false);
    }
  };

  const handleEpisodeSubmit = async () => {
    if (!token || !overview?.next_episode) return;
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
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setEpisodeSubmitting(false);
    }
  };

  const renderParticipantCard = (
    participant: Participant,
    active: boolean,
    disabled: boolean,
    onClick: () => void
  ) => (
    <button
      key={participant.id}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center gap-2 rounded-3xl border-2 px-4 py-5 transition-all ${
        active ? "border-pink-400 bg-pink-50" : "border-slate-200 bg-white"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
    >
      <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
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

        {!overview?.season_start_open ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            현재는 시즌 시작 예측 기간이 아닙니다.
          </div>
        ) : (
          <>
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
                {!overview?.season_couples_locked && (
                  <button
                    type="button"
                    onClick={() => setSeasonPairs([])}
                    className="text-xs font-semibold text-slate-400 hover:text-pink-500"
                  >
                    초기화
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-center text-xs font-semibold text-slate-500">여성 출연자</p>
                  <div className="grid grid-cols-3 gap-4">
                    {femaleParticipants.map((participant) => {
                      const disabled =
                        overview?.season_couples_locked ||
                        seasonPairs.some(
                          (pair) => pair.female_id === participant.id
                        );
                      return renderParticipantCard(
                        participant,
                        seasonSelection.femaleId === participant.id,
                        disabled,
                        () =>
                          setSeasonSelection((prev) => ({
                            ...prev,
                            femaleId: participant.id,
                          }))
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-center text-xs font-semibold text-slate-500">남성 출연자</p>
                  <div className="grid grid-cols-3 gap-4">
                    {maleParticipants.map((participant) => {
                      const disabled =
                        overview?.season_couples_locked ||
                        seasonPairs.some(
                          (pair) => pair.male_id === participant.id
                        );
                      return renderParticipantCard(
                        participant,
                        seasonSelection.maleId === participant.id,
                        disabled,
                        () =>
                          setSeasonSelection((prev) => ({
                            ...prev,
                            maleId: participant.id,
                          }))
                      );
                    })}
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
                      <div className="flex items-center gap-3">
                        <img
                          src={female.image_url ?? ""}
                          alt={female.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <span className="text-sm font-semibold text-slate-800">
                          {female.name}
                        </span>
                        <div className="relative mx-2 flex items-center">
                          <div className="h-[2px] w-10 bg-pink-300" />
                          <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-pink-500 p-1 text-white">
                            <Heart className="h-3 w-3 fill-white" />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">
                          {male.name}
                        </span>
                        <img
                          src={male.image_url ?? ""}
                          alt={male.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </div>
                      {!overview?.season_couples_locked && (
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
          </>
        )}
      </div>

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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
            disabled={finalSubmitting || !finalZeroVote || !popularOneVote}
            className="mt-6 w-full rounded-3xl bg-pink-500 py-4 text-base font-bold text-white disabled:bg-slate-300"
          >
            {finalSubmitting ? "제출 중..." : "투표 제출하기"}
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

            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {femaleParticipants.map((participant) =>
                  renderParticipantCard(
                    participant,
                    messageSelection.femaleId === participant.id,
                    false,
                    () =>
                      setMessageSelection((prev) => ({
                        ...prev,
                        femaleId: participant.id,
                      }))
                  )
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {maleParticipants.map((participant) =>
                  renderParticipantCard(
                    participant,
                    messageSelection.maleId === participant.id,
                    false,
                    () =>
                      setMessageSelection((prev) => ({
                        ...prev,
                        maleId: participant.id,
                      }))
                  )
                )}
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
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                        {female.name}
                        <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
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
          disabled={episodeSubmitting}
          className="mt-8 w-full rounded-3xl bg-pink-500 py-4 text-base font-bold text-white disabled:bg-slate-300"
        >
          {episodeSubmitting ? "제출 중..." : "예측 제출하기"}
        </button>
      </div>
    </div>
  );
}
