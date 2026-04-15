import { useEffect, useMemo, useRef, useState } from "react";
import type { Poll } from "@/store/useRawStore";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  SendHorizontal,
  Users,
} from "lucide-react";

interface PollHistoryComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface DashboardPollsProps {
  polls: Poll[];
  votedPolls: Set<string>;
  avatarLevel: number;
  userId: string;
  username: string;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  isDailyPollLimitReached: boolean;
  onVote: (pollId: string, optionId: string) => void;
}

export function DashboardPolls({
  polls,
  votedPolls,
  avatarLevel,
  userId,
  username,
  dailyAnsweredCount,
  dailyPollLimit,
  isDailyPollLimitReached,
  onVote,
}: DashboardPollsProps) {
  const answersStorageKey = `raw.poll-history.answers.${userId}`;
  const commentsStorageKey = `raw.poll-history.comments.${userId}`;
  const [answerHistory, setAnswerHistory] = useState<Record<string, string>>({});
  const [historyComments, setHistoryComments] = useState<Record<string, PollHistoryComment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const pointerStartXRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const rawAnswers = window.localStorage.getItem(answersStorageKey);
      const parsedAnswers = rawAnswers ? (JSON.parse(rawAnswers) as Record<string, string>) : {};
      setAnswerHistory(parsedAnswers && typeof parsedAnswers === "object" ? parsedAnswers : {});
    } catch {
      setAnswerHistory({});
    }

    try {
      const rawComments = window.localStorage.getItem(commentsStorageKey);
      const parsedComments = rawComments ? (JSON.parse(rawComments) as Record<string, PollHistoryComment[]>) : {};
      setHistoryComments(parsedComments && typeof parsedComments === "object" ? parsedComments : {});
    } catch {
      setHistoryComments({});
    }
  }, [answersStorageKey, commentsStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(answersStorageKey, JSON.stringify(answerHistory));
  }, [answerHistory, answersStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(commentsStorageKey, JSON.stringify(historyComments));
  }, [commentsStorageKey, historyComments]);

  useEffect(() => {
    if (currentPollIndex >= polls.length && polls.length > 0) {
      setCurrentPollIndex(polls.length - 1);
    }
  }, [currentPollIndex, polls.length]);

  const currentPoll = polls[currentPollIndex];
  const selectedOptionId = currentPoll ? answerHistory[currentPoll.id] : undefined;
  const hasVotedCurrent = Boolean(
    currentPoll && (votedPolls.has(currentPoll.id) || answerHistory[currentPoll.id])
  );
  const currentComments = currentPoll ? historyComments[currentPoll.id] ?? [] : [];

  const totalResponses = useMemo(
    () => polls.reduce((sum, poll) => sum + poll.options.reduce((acc, option) => acc + option.votes, 0), 0),
    [polls]
  );

  const pollsAnswered = votedPolls.size;
  const paidUnlocks = {
    bigFiveProfile: false,
    shadowSelf: false,
    decisionFingerprint: false,
    identityArc: false,
  };

  const insightsProgress = [
    {
      id: "myers-briggs",
      name: "Myers-Briggs",
      description: "Discover your personality type across 4 key dimensions of how you see the world.",
      unlockRequirements: ["Reach level 1", "OR answer 5 polls"],
      unlocked: avatarLevel >= 1 || pollsAnswered >= 5,
      lockedAction: "View Report",
    },
    {
      id: "big-five-profile",
      name: "Big Five Profile",
      description:
        "Measure your openness, conscientiousness, extraversion, agreeableness, and emotional range.",
      unlockRequirements: ["Reach level 2", "Answer 10 polls", "Pay $4 to unlock"],
      unlocked: avatarLevel >= 2 && pollsAnswered >= 10 && paidUnlocks.bigFiveProfile,
      lockedAction: "Complete to-do list",
    },
    {
      id: "emotional-intelligence",
      name: "Emotional Intelligence",
      description:
        "Understand how you process emotions, empathy, and interpersonal cues under pressure.",
      unlockRequirements: ["Reach level 3", "Answer 15 polls"],
      unlocked: avatarLevel >= 3 && pollsAnswered >= 15,
      lockedAction: "Complete to-do list",
    },
    {
      id: "shadow-self",
      name: "Shadow Self",
      description:
        "Reveal hidden patterns, blind spots, and traits that surface in difficult moments.",
      unlockRequirements: ["Path A", "Reach level 1", "Pay $8", "Path B", "Answer 50 polls"],
      unlocked: (avatarLevel >= 1 && paidUnlocks.shadowSelf) || pollsAnswered >= 50,
      lockedAction: "Unlock $8",
    },
    {
      id: "decision-fingerprint",
      name: "Decision Fingerprint",
      description: "Map your decision style: instinctive, strategic, reflective, or adaptive.",
      unlockRequirements: ["Reach level 4", "Answer 22 polls", "Pay $6 to unlock"],
      unlocked: avatarLevel >= 4 && pollsAnswered >= 22 && paidUnlocks.decisionFingerprint,
      lockedAction: "Complete to-do list",
    },
    {
      id: "identity-arc",
      name: "Identity Arc",
      description: "Track how your personality signal changes over time as your answers evolve.",
      unlockRequirements: ["Reach level 5", "Answer 30 polls", "Pay $9 to unlock"],
      unlocked: avatarLevel >= 5 && pollsAnswered >= 30 && paidUnlocks.identityArc,
      lockedAction: "Complete to-do list",
    },
  ];

  const unlockedReports = insightsProgress.filter((item) => item.unlocked).length;

  const handleVote = (pollId: string, optionId: string) => {
    if (isDailyPollLimitReached) {
      return;
    }

    setAnswerHistory((previous) => ({
      ...previous,
      [pollId]: optionId,
    }));

    if (!votedPolls.has(pollId)) {
      onVote(pollId, optionId);
    }
  };

  const voteFromSwipeDirection = (direction: "left" | "right") => {
    if (!currentPoll || hasVotedCurrent || isDailyPollLimitReached) {
      return;
    }

    const yesOption = currentPoll.options.find((option) => option.text.trim().toLowerCase() === "yes");
    const noOption = currentPoll.options.find((option) => option.text.trim().toLowerCase() === "no");

    if (direction === "right") {
      const selected = yesOption ?? currentPoll.options[0];
      if (selected) {
        handleVote(currentPoll.id, selected.id);
      }
      return;
    }

    const selected = noOption ?? currentPoll.options[1] ?? currentPoll.options[0];
    if (selected) {
      handleVote(currentPoll.id, selected.id);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartXRef.current = event.clientX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartXRef.current === null) {
      return;
    }

    const deltaX = event.clientX - pointerStartXRef.current;
    pointerStartXRef.current = null;

    const swipeThreshold = 60;
    if (Math.abs(deltaX) < swipeThreshold) {
      return;
    }

    voteFromSwipeDirection(deltaX > 0 ? "right" : "left");
  };

  const handleCommentAdd = () => {
    if (!currentPoll) {
      return;
    }

    const content = commentDraft.trim();
    if (!content) {
      return;
    }

    const nextComment: PollHistoryComment = {
      id: `${currentPoll.id}-${Date.now()}`,
      author: username,
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setHistoryComments((previous) => ({
      ...previous,
      [currentPoll.id]: [nextComment, ...(previous[currentPoll.id] ?? [])],
    }));

    setCommentDraft("");
  };

  if (!currentPoll) {
    return (
      <div className="rounded-2xl border border-raw-border/30 bg-raw-black/30 p-6 text-center text-sm text-raw-silver/55">
        No polls available yet.
      </div>
    );
  }

  const pollTotalVotes = currentPoll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl tracking-wide text-raw-text">Polls</h1>
        <p className="mt-2 text-sm text-raw-silver/45">
          Anonymous voting, live percentages, and reflections from the community.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-raw-border/35 bg-raw-surface/25 p-4 text-center">
          <BarChart3 className="mx-auto mb-2 h-4 w-4 text-raw-gold/45" />
          <p className="text-lg font-semibold text-raw-text">{polls.length}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-raw-silver/35">Live Polls</p>
        </div>
        <div className="rounded-xl border border-raw-border/35 bg-raw-surface/25 p-4 text-center">
          <Users className="mx-auto mb-2 h-4 w-4 text-raw-gold/45" />
          <p className="text-lg font-semibold text-raw-text">{totalResponses.toLocaleString()}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-raw-silver/35">Total Votes</p>
        </div>
        <div className="rounded-xl border border-raw-border/35 bg-raw-surface/25 p-4 text-center">
          <MessageCircle className="mx-auto mb-2 h-4 w-4 text-raw-gold/45" />
          <p className="text-lg font-semibold text-raw-text">{dailyAnsweredCount}/{dailyPollLimit}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-raw-silver/35">Daily Progress</p>
        </div>
      </section>

      <section className="relative mx-auto max-w-xl">
        <button
          onClick={() => setCurrentPollIndex((previous) => Math.max(0, previous - 1))}
          disabled={currentPollIndex === 0}
          className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-raw-border/45 bg-raw-black/70 p-2.5 text-raw-silver/70 transition hover:border-raw-gold/45 hover:text-raw-gold disabled:cursor-not-allowed disabled:opacity-35 md:inline-flex"
          aria-label="Previous poll"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => setCurrentPollIndex((previous) => Math.min(polls.length - 1, previous + 1))}
          disabled={currentPollIndex === polls.length - 1}
          className="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 rounded-full border border-raw-border/45 bg-raw-black/70 p-2.5 text-raw-silver/70 transition hover:border-raw-gold/45 hover:text-raw-gold disabled:cursor-not-allowed disabled:opacity-35 md:inline-flex"
          aria-label="Next poll"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="rounded-[2rem] border border-raw-border/40 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.12),rgba(0,0,0,0.05)_35%,rgba(0,0,0,0.6)_100%)] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.4)] sm:p-6">
          <div className="mb-4 flex items-center justify-between text-xs text-raw-silver/45">
            <span>
              {currentPollIndex + 1}/{polls.length} today
            </span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>

          <div className="mb-5 flex items-center justify-center gap-1.5">
            {polls.map((poll, index) => (
              <button
                key={poll.id}
                onClick={() => setCurrentPollIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentPollIndex ? "w-6 bg-raw-gold" : "w-2 bg-raw-border/60"
                }`}
                aria-label={`Go to poll ${index + 1}`}
              />
            ))}
          </div>

          <div
            className="rounded-[1.7rem] border border-white/10 bg-black/65 p-5 sm:p-6"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
            <h2 className="text-center font-display text-2xl leading-tight text-white sm:text-[2rem]">
              {currentPoll.question}
            </h2>

            {!hasVotedCurrent && !isDailyPollLimitReached && (
              <p className="mt-3 text-center text-[11px] uppercase tracking-[0.14em] text-white/40">
                Swipe right for Yes, left for No
              </p>
            )}

            <div className="mt-6 space-y-3">
              {currentPoll.options.map((option) => {
                const percentage = pollTotalVotes > 0 ? Math.round((option.votes / pollTotalVotes) * 100) : 0;
                const isSelected = selectedOptionId === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(currentPoll.id, option.id)}
                    disabled={hasVotedCurrent || isDailyPollLimitReached}
                    className={`relative w-full overflow-hidden rounded-2xl border text-left transition ${
                      hasVotedCurrent
                        ? "cursor-default border-white/10 bg-white/5"
                        : isDailyPollLimitReached
                          ? "cursor-not-allowed border-white/10 bg-white/[0.04] opacity-55"
                          : "border-white/15 bg-white/[0.06] hover:border-raw-gold/35"
                    }`}
                  >
                    {hasVotedCurrent && (
                      <div className="absolute inset-y-0 left-0 bg-raw-gold/20" style={{ width: `${percentage}%` }} />
                    )}

                    <div className="relative flex items-center justify-between px-4 py-3">
                      <span className={`text-base ${isSelected ? "text-white" : "text-white/88"}`}>{option.text}</span>
                      {hasVotedCurrent ? (
                        <span className="text-base font-semibold text-white">{percentage}%</span>
                      ) : (
                        <span className="text-xs text-white/40">Vote</span>
                      )}
                    </div>

                    {isSelected && hasVotedCurrent && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/90 p-0.5 text-black">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {hasVotedCurrent ? (
              <>
                <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <input
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                  />
                  <button
                    onClick={handleCommentAdd}
                    disabled={!commentDraft.trim()}
                    className="rounded-full border border-white/20 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Add comment"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {currentComments.length === 0 ? (
                    <p className="text-center text-xs text-white/45">No comments yet for this poll.</p>
                  ) : (
                    currentComments.slice(0, 3).map((comment) => (
                      <article key={comment.id} className="rounded-2xl border border-white/20 bg-black/55 px-3.5 py-2.5">
                        <div className="flex items-center justify-between text-[11px] text-white/50">
                          <span>@{comment.author}</span>
                          <span>{comment.createdAt}</span>
                        </div>
                        <p className="mt-1 text-sm text-white/80">{comment.content}</p>
                      </article>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="mt-5 text-center text-xs text-white/45">Answer this poll to unlock comments.</p>
            )}
          </div>

          {isDailyPollLimitReached && (
            <p className="mt-4 text-center text-xs text-raw-silver/55">
              Daily limit reached. You can answer more polls tomorrow.
            </p>
          )}

          <div className="mt-4 flex gap-3 md:hidden">
            <button
              onClick={() => setCurrentPollIndex((previous) => Math.max(0, previous - 1))}
              disabled={currentPollIndex === 0}
              className="flex-1 rounded-xl border border-raw-border/35 bg-raw-black/25 px-3 py-2 text-xs text-raw-silver/70 disabled:opacity-35"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPollIndex((previous) => Math.min(polls.length - 1, previous + 1))}
              disabled={currentPollIndex === polls.length - 1}
              className="flex-1 rounded-xl border border-raw-border/35 bg-raw-black/25 px-3 py-2 text-xs text-raw-silver/70 disabled:opacity-35"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="rounded-2xl border border-raw-border/35 bg-raw-surface/20 p-4 sm:p-5">
          <h2 className="font-display text-xl text-raw-text">Personality Insights</h2>
          <p className="mt-1 text-sm text-raw-silver/55">
            Your answers unlock deeper identity reports. Keep participating to reveal your full profile.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-raw-border/30 bg-raw-black/30 p-3.5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-raw-silver/40">Poll Coverage</p>
              <p className="mt-1 text-base font-semibold text-raw-text">{pollsAnswered} polls answered</p>
            </div>
            <div className="rounded-xl border border-raw-border/30 bg-raw-black/30 p-3.5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-raw-silver/40">Unlocked Reports</p>
              <p className="mt-1 text-base font-semibold text-raw-text">{unlockedReports}/6</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insightsProgress.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-raw-border/35 bg-raw-surface/25 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-base text-raw-text">{item.name}</p>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${
                    item.unlocked
                      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"
                      : "border-raw-border/45 bg-raw-black/40 text-raw-silver/50"
                  }`}
                >
                  {item.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-raw-silver/55">{item.description}</p>

              {!item.unlocked && (
                <div className="mt-3 rounded-xl border border-raw-border/35 bg-raw-black/35 p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-raw-silver/40">Unlock To-Do</p>
                  <div className="mt-2 space-y-1.5 text-xs text-raw-silver/60">
                    {item.unlockRequirements.map((requirement) => (
                      <p key={`${item.id}-${requirement}`}>{requirement}</p>
                    ))}
                    {item.unlockRequirements.some((requirement) => /polls/i.test(requirement)) && (
                      <p className="text-raw-silver/45">{pollsAnswered} polls answered</p>
                    )}
                  </div>
                </div>
              )}

              <button
                disabled={!item.unlocked}
                className={`mt-4 w-full rounded-xl border px-3 py-2 text-xs transition ${
                  item.unlocked
                    ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20"
                    : "cursor-not-allowed border-raw-border/40 bg-raw-black/35 text-raw-silver/45"
                }`}
              >
                {item.unlocked ? "View Report" : item.lockedAction}
              </button>
            </article>
          ))}
        </div>

        <p className="text-center text-xs text-raw-silver/45">More insight models coming soon</p>
      </section>
    </div>
  );
}