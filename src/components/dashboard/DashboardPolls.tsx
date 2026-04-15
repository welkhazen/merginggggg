import { useEffect, useMemo, useRef, useState } from "react";
import type { Poll } from "@/store/useRawStore";
import { GlareCard } from "@/components/ui/glare-card";
import { BarChart3, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, TrendingUp, Users } from "lucide-react";

interface PollHistoryComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface DashboardPollsProps {
  polls: Poll[];
  votedPolls: Set<string>;
  userId: string;
  username: string;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  isDailyPollLimitReached: boolean;
  onVote: (pollId: string, optionId: string) => void;
}

function PollCard({
  poll,
  hasVoted,
  selectedOptionId,
  isDailyPollLimitReached,
  onAnswered,
  onVote,
}: {
  poll: Poll;
  hasVoted: boolean;
  selectedOptionId?: string;
  isDailyPollLimitReached: boolean;
  onAnswered: () => void;
  onVote: (optionId: string) => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const canSwipe = poll.options.length >= 2 && !hasVoted && !isDailyPollLimitReached;

  const handleVote = (optionId: string) => {
    if (hasVoted || isDailyPollLimitReached) {
      return;
    }

    onVote(optionId);
    onAnswered();
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !cardRef.current || !canSwipe) {
        return;
      }

      const deltaX = event.clientX - dragStartXRef.current;
      setDragX(Math.max(-120, Math.min(120, deltaX)));
    };

    const handleMouseUp = () => {
      if (!isDragging || !canSwipe) {
        return;
      }

      if (Math.abs(dragX) >= 60) {
        const chosenOption = dragX > 0 ? poll.options[0] : poll.options[1];
        handleVote(chosenOption.id);
      }

      setDragX(0);
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [canSwipe, dragX, isDragging, poll.options]);

  const yesNoMode = poll.options.length >= 2;
  const leftOption = poll.options[0];
  const rightOption = poll.options[1];
  const leftPct = totalVotes > 0 ? Math.round((leftOption?.votes ?? 0) / totalVotes * 100) : 0;
  const rightPct = totalVotes > 0 ? Math.round((rightOption?.votes ?? 0) / totalVotes * 100) : 0;

  return (
    <GlareCard>
      <div
        ref={cardRef}
        onMouseDown={(event) => {
          if (!canSwipe) {
            return;
          }
          dragStartXRef.current = event.clientX;
          setIsDragging(true);
        }}
        onTouchStart={(event) => {
          if (!canSwipe) {
            return;
          }
          dragStartXRef.current = event.touches[0].clientX;
          setIsDragging(true);
        }}
        onTouchMove={(event) => {
          if (!isDragging || !canSwipe) {
            return;
          }

          const deltaX = event.touches[0].clientX - dragStartXRef.current;
          setDragX(Math.max(-120, Math.min(120, deltaX)));
        }}
        onTouchEnd={() => {
          if (!isDragging || !canSwipe) {
            return;
          }

          if (Math.abs(dragX) >= 60) {
            const chosenOption = dragX > 0 ? poll.options[0] : poll.options[1];
            handleVote(chosenOption.id);
          }

          setDragX(0);
          setIsDragging(false);
        }}
        className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-6 transition-all"
        style={{
          transform: canSwipe ? `translateX(${dragX * 0.5}px)` : undefined,
        }}
      >
        <p className="font-display text-sm tracking-wide text-raw-text">{poll.question}</p>
        {canSwipe && yesNoMode && (
          <p className="mt-2 text-[11px] text-raw-silver/35">Swipe right for {leftOption.text}, swipe left for {rightOption.text}</p>
        )}
        <div className="mt-5 space-y-2.5">
          {poll.options.map((option) => {
            const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted || isDailyPollLimitReached}
                className={`relative w-full overflow-hidden rounded-xl border text-left transition-all ${
                  hasVoted
                    ? "border-raw-border/20 bg-raw-black/40 cursor-default"
                    : isDailyPollLimitReached
                      ? "border-raw-border/20 bg-raw-black/20 cursor-not-allowed opacity-55"
                      : "border-raw-border/40 bg-raw-black/30 hover:border-raw-gold/20 cursor-pointer"
                }`}
              >
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 bg-raw-gold/10 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-4 py-2.5">
                  <span className={`text-xs ${selectedOptionId === option.id ? "text-raw-gold" : "text-raw-silver/70"}`}>{option.text}</span>
                  {hasVoted && (
                    <span className="text-[11px] font-medium text-raw-gold/60">{pct}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {hasVoted && (
          <div className="mt-3 flex items-center justify-between text-[10px] text-raw-silver/35">
            <span>{totalVotes.toLocaleString()} anonymous responses</span>
            {yesNoMode && (
              <span>{leftPct}% / {rightPct}%</span>
            )}
          </div>
        )}
      </div>
    </GlareCard>
  );
}

export function DashboardPolls({
  polls,
  votedPolls,
  userId,
  username,
  dailyAnsweredCount,
  dailyPollLimit,
  isDailyPollLimitReached,
  onVote,
}: DashboardPollsProps) {
  const historyAnswersStorageKey = `raw.poll-history.answers.${userId}`;
  const historyCommentsStorageKey = `raw.poll-history.comments.${userId}`;
  const [answerHistory, setAnswerHistory] = useState<Record<string, string>>({});
  const [historyComments, setHistoryComments] = useState<Record<string, PollHistoryComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [currentPollIndex, setCurrentPollIndex] = useState(0);

  useEffect(() => {
    try {
      const rawAnswers = window.localStorage.getItem(historyAnswersStorageKey);
      const parsedAnswers = rawAnswers ? (JSON.parse(rawAnswers) as Record<string, string>) : {};
      setAnswerHistory(parsedAnswers && typeof parsedAnswers === "object" ? parsedAnswers : {});
    } catch {
      setAnswerHistory({});
    }

    try {
      const rawComments = window.localStorage.getItem(historyCommentsStorageKey);
      const parsedComments = rawComments ? (JSON.parse(rawComments) as Record<string, PollHistoryComment[]>) : {};
      setHistoryComments(parsedComments && typeof parsedComments === "object" ? parsedComments : {});
    } catch {
      setHistoryComments({});
    }
  }, [historyAnswersStorageKey, historyCommentsStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(historyAnswersStorageKey, JSON.stringify(answerHistory));
  }, [answerHistory, historyAnswersStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(historyCommentsStorageKey, JSON.stringify(historyComments));
  }, [historyComments, historyCommentsStorageKey]);

  const handleVote = (pollId: string, optionId: string) => {
    setAnswerHistory((prev) => ({ ...prev, [pollId]: optionId }));
    if (!votedPolls.has(pollId)) {
      onVote(pollId, optionId);
    }
  };

  const answeredPolls = useMemo(
    () => polls.filter((poll) => votedPolls.has(poll.id) || Boolean(answerHistory[poll.id])),
    [answerHistory, polls, votedPolls]
  );

  useEffect(() => {
    if (currentPollIndex >= polls.length && polls.length > 0) {
      setCurrentPollIndex(polls.length - 1);
    }
  }, [currentPollIndex, polls.length]);

  const totalResponses = polls.reduce(
    (sum, p) => sum + p.options.reduce((s, o) => s + o.votes, 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl tracking-wide text-raw-text">Polls</h1>
        <p className="mt-2 text-sm text-raw-silver/40">
          Answer anonymously. See live results. Shape the community signal.
        </p>
        <div className="mt-4 rounded-xl border border-raw-border/30 bg-raw-black/30 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-raw-silver/50">Daily progress</span>
            <span className="font-medium text-raw-gold">{dailyAnsweredCount}/{dailyPollLimit} complete for today</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-raw-border/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-raw-gold/70 to-raw-gold transition-all"
              style={{ width: `${Math.min(100, Math.round((dailyAnsweredCount / dailyPollLimit) * 100))}%` }}
            />
          </div>
          {isDailyPollLimitReached && (
            <p className="mt-2 text-[11px] text-raw-silver/45">Daily limit reached. You can answer more polls tomorrow.</p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-4 text-center">
          <BarChart3 className="h-4 w-4 text-raw-gold/40 mx-auto mb-2" />
          <p className="text-lg font-bold text-raw-text">{polls.length}</p>
          <p className="text-[9px] uppercase tracking-wider text-raw-silver/30">Active Polls</p>
        </div>
        <div className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-4 text-center">
          <Users className="h-4 w-4 text-raw-gold/40 mx-auto mb-2" />
          <p className="text-lg font-bold text-raw-text">{totalResponses.toLocaleString()}</p>
          <p className="text-[9px] uppercase tracking-wider text-raw-silver/30">Total Votes</p>
        </div>
        <div className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-4 text-center">
          <TrendingUp className="h-4 w-4 text-raw-gold/40 mx-auto mb-2" />
          <p className="text-lg font-bold text-raw-text">{votedPolls.size}</p>
          <p className="text-[9px] uppercase tracking-wider text-raw-silver/30">Your Answers</p>
        </div>
      </div>

      {/* Single poll page */}
      {polls.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.14em] text-raw-silver/35">
              Poll {currentPollIndex + 1} of {polls.length}
            </p>
            <div className="flex items-center gap-1.5">
              {polls.map((poll, index) => (
                <button
                  key={poll.id}
                  onClick={() => setCurrentPollIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${index === currentPollIndex ? "w-5 bg-raw-gold" : "w-1.5 bg-raw-border/60"}`}
                  aria-label={`Go to poll ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <PollCard
            poll={polls[currentPollIndex]}
            hasVoted={votedPolls.has(polls[currentPollIndex].id)}
            selectedOptionId={answerHistory[polls[currentPollIndex].id]}
            isDailyPollLimitReached={isDailyPollLimitReached}
            onAnswered={() => {
              if (polls.length <= 1) {
                return;
              }

              setCurrentPollIndex((previous) => (previous + 1) % polls.length);
            }}
            onVote={(optionId) => handleVote(polls[currentPollIndex].id, optionId)}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPollIndex((previous) => Math.max(0, previous - 1))}
              disabled={currentPollIndex === 0}
              className="flex-1 rounded-xl border border-raw-border/35 bg-raw-black/20 px-4 py-2.5 text-xs font-medium text-raw-silver/65 transition-all hover:border-raw-gold/35 hover:text-raw-gold disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="inline-flex items-center gap-1"><ChevronLeft className="h-3.5 w-3.5" /> Previous</span>
            </button>
            <button
              onClick={() => setCurrentPollIndex((previous) => Math.min(polls.length - 1, previous + 1))}
              disabled={currentPollIndex === polls.length - 1}
              className="flex-1 rounded-xl border border-raw-border/35 bg-raw-black/20 px-4 py-2.5 text-xs font-medium text-raw-silver/65 transition-all hover:border-raw-gold/35 hover:text-raw-gold disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="inline-flex items-center gap-1">Next <ChevronRight className="h-3.5 w-3.5" /></span>
            </button>
          </div>
        </div>
      )}

      {/* Personal history */}
      <div className="rounded-2xl border border-raw-border/35 bg-raw-surface/25 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg tracking-wide text-raw-text">Personal History</h2>
            <p className="mt-1 text-xs text-raw-silver/45">
              Review your answered polls and the comments you left.
            </p>
          </div>
          <div className="rounded-full border border-raw-border/40 px-3 py-1 text-[11px] text-raw-gold/70">
            {answeredPolls.length} answered
          </div>
        </div>

        {answeredPolls.length === 0 ? (
          <div className="mt-5 rounded-xl border border-raw-border/30 bg-raw-black/35 p-5 text-center">
            <p className="text-sm text-raw-silver/45">No answers yet. Vote on a poll to start your history.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {answeredPolls.map((poll) => {
              const selectedOptionId = answerHistory[poll.id];
              const selectedOption = poll.options.find((option) => option.id === selectedOptionId) ?? null;
              const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
              const selectedPct = selectedOption && totalVotes > 0
                ? Math.round((selectedOption.votes / totalVotes) * 100)
                : null;
              const comments = historyComments[poll.id] ?? [];

              return (
                <div key={poll.id} className="rounded-xl border border-raw-border/30 bg-raw-black/35 p-4">
                  <p className="text-sm font-medium text-raw-text">{poll.question}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-raw-gold/30 bg-raw-gold/[0.08] px-2.5 py-1 text-[11px] text-raw-gold/80">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Your answer: {selectedOption?.text ?? "Recorded"}
                    </span>
                    {selectedPct !== null && (
                      <span className="rounded-full border border-raw-border/45 px-2.5 py-1 text-[11px] text-raw-silver/65">
                        {selectedPct}% chose this
                      </span>
                    )}
                  </div>

                  <div className="mt-4 rounded-xl border border-raw-border/30 bg-raw-black/30 p-3">
                    <div className="flex items-center justify-between">
                      <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-raw-silver/55">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Comments
                      </p>
                      <span className="text-[11px] text-raw-silver/45">{comments.length}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        value={commentDrafts[poll.id] ?? ""}
                        onChange={(event) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [poll.id]: event.target.value,
                          }))
                        }
                        placeholder="Add a comment to your history..."
                        className="flex-1 rounded-full border border-raw-border/35 bg-raw-black/45 px-4 py-2 text-xs text-raw-text placeholder-raw-silver/30 focus:outline-none focus:border-raw-gold/45"
                      />
                      <button
                        onClick={() => {
                          const content = (commentDrafts[poll.id] ?? "").trim();
                          if (!content) {
                            return;
                          }

                          const nextComment: PollHistoryComment = {
                            id: `${poll.id}-${Date.now()}`,
                            author: username,
                            content,
                            createdAt: new Date().toLocaleString(),
                          };

                          setHistoryComments((prev) => ({
                            ...prev,
                            [poll.id]: [nextComment, ...(prev[poll.id] ?? [])],
                          }));

                          setCommentDrafts((prev) => ({ ...prev, [poll.id]: "" }));
                        }}
                        disabled={!(commentDrafts[poll.id] ?? "").trim()}
                        className="rounded-full border border-raw-gold/30 bg-raw-gold/[0.08] px-3 py-2 text-[11px] font-medium text-raw-gold/80 transition-all hover:bg-raw-gold/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {comments.length === 0 ? (
                        <p className="text-xs text-raw-silver/40">No comments yet for this poll.</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="rounded-lg border border-raw-border/25 bg-raw-black/45 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-raw-silver/75">{comment.author}</span>
                              <span className="text-[10px] text-raw-silver/35">{comment.createdAt}</span>
                            </div>
                            <p className="mt-1 text-xs text-raw-silver/60">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
