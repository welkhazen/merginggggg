import { useState } from "react";
import type { Poll } from "@/store/useRawStore";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import { DiagonalSplitProgress } from "@/components/ui/diagonal-split-progress";

interface PollSectionProps {
  polls: Poll[];
  votedPolls: Set<string>;
  isLoggedIn: boolean;
  freeVotesUsed: number;
  onVote: (pollId: string, optionId: string) => void;
  onSignupClick: () => void;
}

const mockComments: Record<string, { user: string; text: string; time: string; likes: number }[]> = {
  "poll-1": [
    { user: "zen_spark", text: "This really made me think about what's been weighing on me.", time: "2h ago", likes: 5 },
    { user: "wave_rider", text: "Your mindset is everything.", time: "3h ago", likes: 2 },
  ],
  "poll-2": [
    { user: "night_echo", text: "It depends how you use it honestly.", time: "1h ago", likes: 8 },
    { user: "raw_signal", text: "Deleted all my apps. Best decision.", time: "4h ago", likes: 3 },
  ],
  "poll-3": [
    { user: "ghost_mind", text: "Growth is uncomfortable but worth it.", time: "30m ago", likes: 12 },
    { user: "quiet_flame", text: "Comfort is underrated sometimes though.", time: "2h ago", likes: 6 },
  ],
};

function PollPhoneContent({
  poll,
  hasVoted,
  selectedOptionId,
  submittedOptionId,
  onVote,
  showNavButtons,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  pollIndex,
  totalPolls,
}: {
  poll: Poll;
  hasVoted: boolean;
  selectedOptionId?: string;
  submittedOptionId?: string;
  onVote: (optionId: string) => void;
  showNavButtons: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  pollIndex: number;
  totalPolls: number;
}) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const comments = mockComments[poll.id] || [];
  const yesOption = poll.options.find((o) => o.text === "Yes");
  const noOption = poll.options.find((o) => o.text === "No");
  const adjustedYesVotes = (() => {
    if (!yesOption) return 0;

    let value = yesOption.votes;
    if (submittedOptionId && selectedOptionId && submittedOptionId !== selectedOptionId) {
      if (submittedOptionId === yesOption.id) value -= 1;
      if (selectedOptionId === yesOption.id) value += 1;
    }
    return Math.max(0, value);
  })();

  const adjustedNoVotes = (() => {
    if (!noOption) return 0;

    let value = noOption.votes;
    if (submittedOptionId && selectedOptionId && submittedOptionId !== selectedOptionId) {
      if (submittedOptionId === noOption.id) value -= 1;
      if (selectedOptionId === noOption.id) value += 1;
    }
    return Math.max(0, value);
  })();

  const adjustedTotalVotes = adjustedYesVotes + adjustedNoVotes;
  const yesPct = adjustedTotalVotes > 0 ? Math.round((adjustedYesVotes / adjustedTotalVotes) * 100) : 0;
  const noPct = adjustedTotalVotes > 0 ? 100 - yesPct : 0;

  return (
    <div className="bg-black px-5 py-4 min-h-[480px] flex flex-col">
      {/* Poll header */}
      <div className="text-center mb-1">
        <p className="font-display text-[9px] tracking-[0.2em] uppercase text-white/30">
          Anonymous Poll
        </p>
        <div className="flex items-center justify-center gap-3 mt-1">
          <span className="text-[9px] text-white/25 flex items-center gap-1">
            <ThumbsUp className="h-2.5 w-2.5" /> {totalVotes}
          </span>
          <span className="text-[9px] text-white/25 flex items-center gap-1">
            <MessageCircle className="h-2.5 w-2.5" /> {comments.length}
          </span>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 mt-2 mb-3">
        {Array.from({ length: totalPolls }, (_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === pollIndex
                ? "w-4 bg-white"
                : "w-1 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Question card - black with rounded corners */}
      <div className="rounded-3xl bg-[#111] border border-white/10 p-6 flex-1 flex flex-col justify-center">
        <p className="font-display text-[17px] tracking-wide text-white text-center leading-relaxed font-medium">
          {poll.question}
        </p>

        {!hasVoted ? (
          <>
            <p className="text-[10px] text-white/30 text-center mt-4 mb-5">
              Swipe right for Yes, left for No
            </p>
            {/* Yes / No buttons */}
            <div className="flex gap-3">
              {yesOption && (
                <button
                  onClick={() => onVote(yesOption.id)}
                  className="flex-1 rounded-2xl bg-[#F1C42D] py-3.5 text-base font-bold text-black transition-all hover:bg-[#F1C42D]/90 active:scale-95"
                >
                  Yes
                </button>
              )}
              {noOption && (
                <button
                  onClick={() => onVote(noOption.id)}
                  className="flex-1 rounded-2xl bg-white py-3.5 text-base font-bold text-black transition-all hover:bg-white/90 active:scale-95"
                >
                  No
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Combined proportional results: larger percentage takes more space */}
            <DiagonalSplitProgress
              leftLabel="Yes"
              rightLabel="No"
              leftValue={yesPct}
              rightValue={noPct}
              leftColor="#050505"
              rightColor="#8b6d08"
              leftTextColor="#ffffff"
              rightTextColor="#f3d24f"
              leftActive={selectedOptionId === yesOption?.id}
              rightActive={selectedOptionId === noOption?.id}
              onLeftClick={yesOption ? () => onVote(yesOption.id) : undefined}
              onRightClick={noOption ? () => onVote(noOption.id) : undefined}
              className="mt-6 mx-auto w-full max-w-[320px]"
            />

            <p className="mt-3 text-[9px] text-white/25 text-center">
              {adjustedTotalVotes.toLocaleString()} anonymous responses
            </p>
          </>
        )}
      </div>

      {/* Comments section - only after voting */}
      {hasVoted && comments.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#111] border border-white/10 px-3 py-2 mb-2">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-[11px] text-white placeholder:text-white/20 outline-none"
              readOnly
            />
            <Send className="h-3.5 w-3.5 text-white/20" />
          </div>
          <div className="space-y-1.5">
            {comments.map((comment, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#111] border border-white/8 px-3 py-2"
              >
                <p className="text-[10px] text-white/50 leading-relaxed">
                  {comment.text}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[8px] font-medium text-white/30">
                    @{comment.user}
                  </span>
                  <span className="text-[8px] text-white/15">{comment.time}</span>
                  <span className="text-[8px] text-white/20">↑ {comment.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {showNavButtons && (
        <div className="flex gap-2 mt-3">
          {canGoPrev && (
            <button
              onClick={onPrev}
              className="flex-1 rounded-xl border border-white/15 py-2.5 text-[11px] font-medium text-white/50 hover:border-white/30 hover:text-white/70 transition-all flex items-center justify-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
          )}
          {canGoNext && (
            <button
              onClick={onNext}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-[11px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-1"
            >
              Next Question
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PollSection({
  polls,
  votedPolls,
  isLoggedIn,
  freeVotesUsed,
  onVote,
  onSignupClick,
}: PollSectionProps) {
  const [currentPoll, setCurrentPoll] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [submittedOptions, setSubmittedOptions] = useState<Record<string, string>>({});

  const goNext = () => setCurrentPoll((p) => Math.min(p + 1, polls.length - 1));
  const goPrev = () => setCurrentPoll((p) => Math.max(p - 1, 0));

  const currentPollId = polls[currentPoll].id;
  const currentHasVoted = votedPolls.has(currentPollId) || Boolean(selectedOptions[currentPollId]);
  const showSignupGate = !isLoggedIn && freeVotesUsed >= 3;

  const handleVote = (pollId: string, optionId: string) => {
    setSelectedOptions((previous) => ({
      ...previous,
      [pollId]: optionId,
    }));

    if (!submittedOptions[pollId]) {
      onVote(pollId, optionId);
      setSubmittedOptions((previous) => ({
        ...previous,
        [pollId]: optionId,
      }));
    }
  };

  return (
    <section id="polls" className="relative py-28 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl tracking-wide text-raw-text sm:text-4xl">
            Start with a question.
          </h2>
          <p className="mt-4 text-base text-raw-silver/50 max-w-xl mx-auto">
            Answer anonymously and see live results instantly.
            {!isLoggedIn && " Answer 3 questions free — then sign up to keep going."}
          </p>
        </div>

        {/* Phone mockup with poll */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {showSignupGate ? (
              <PhoneMockup>
                <div className="bg-black px-5 py-6 min-h-[480px] flex flex-col items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#F1C42D]/10 flex items-center justify-center">
                      <span className="text-2xl">🔒</span>
                    </div>
                    <p className="font-display text-lg tracking-wide text-white mb-2">
                      You've answered 3 polls!
                    </p>
                    <p className="text-sm text-white/40 mb-2 max-w-[200px] mx-auto leading-relaxed">
                      Sign up to earn your reward and keep answering.
                    </p>
                    <p className="text-xs text-[#F1C42D]/60 mb-6">
                      +3 coins per poll answered
                    </p>
                    <button
                      onClick={onSignupClick}
                      className="rounded-full bg-[#F1C42D] px-8 py-3 text-sm font-bold text-black hover:bg-[#F1C42D]/90 transition-all active:scale-95"
                    >
                      Sign Up & Earn Rewards
                    </button>
                  </div>
                </div>
              </PhoneMockup>
            ) : (
              <PhoneMockup>
                <PollPhoneContent
                  poll={polls[currentPoll]}
                  hasVoted={currentHasVoted}
                  selectedOptionId={selectedOptions[currentPollId]}
                  submittedOptionId={submittedOptions[currentPollId]}
                  onVote={(optionId) => handleVote(currentPollId, optionId)}
                  showNavButtons={currentHasVoted}
                  canGoPrev={currentPoll > 0}
                  canGoNext={currentPoll < polls.length - 1}
                  onPrev={goPrev}
                  onNext={goNext}
                  pollIndex={currentPoll}
                  totalPolls={polls.length}
                />
              </PhoneMockup>
            )}
          </div>
        </div>

        {/* Free votes counter */}
        {!isLoggedIn && !showSignupGate && (
          <p className="text-center text-xs text-raw-silver/30 mt-6">
            {freeVotesUsed} of 3 free polls answered
          </p>
        )}
      </div>
    </section>
  );
}
