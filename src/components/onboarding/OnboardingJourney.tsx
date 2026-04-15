import { useMemo, useState } from "react";
import { AvatarFigure, getAvatarTheme } from "@/components/ui/avatar-figure";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { SwipeablePollCard } from "./SwipeablePollCard";
import type { OnboardingStep, Poll, User } from "@/store/useRawStore";
import type { Comment } from "./PollComments";

type OnboardingPoll = {
  id: string;
  question: string;
  options: string[];
};

interface OnboardingJourneyProps {
  user: User;
  polls: Poll[];
  avatarLevel: number;
  onAvatarLevelChange: (level: number) => void;
  onboardingStep: OnboardingStep;
  onboardingAnsweredPollIds: Set<string>;
  onSetOnboardingStep: (step: OnboardingStep) => void;
  onMarkPollAnswered: (pollId: string) => void;
  selectedCommunityIds: string[];
  onToggleCommunity: (communityId: string) => void;
  onCompleteOnboarding: () => void;
  onLogout: () => void;
}

const STEP_ORDER: OnboardingStep[] = ["avatar", "polls", "communities", "marketplace", "ready"];
const STEP_LABELS: Record<OnboardingStep, string> = {
  avatar: "avatar",
  polls: "polls",
  communities: "communities",
  marketplace: "insights",
  ready: "ready",
};

const FALLBACK_POLLS: OnboardingPoll[] = [
  {
    id: "core-safety",
    question: "Should all high-impact content claims require visible evidence labels?",
    options: ["Always", "Only on flagged topics", "Community should decide", "Not necessary"],
  },
  {
    id: "core-moderation",
    question: "What should happen first when harmful content is reported?",
    options: ["Temporary freeze", "Community review", "Auto-hide for 1 hour", "No action until human review"],
  },
  {
    id: "core-identity",
    question: "How should trust be built in anonymous spaces?",
    options: ["Reputation over time", "Verified circles", "Peer endorsements", "Badges from activity"],
  },
];

const EXTRA_ONBOARDING_POLLS: OnboardingPoll[] = [
  {
    id: "launch-feedback-loop",
    question: "How often should raW ask members for product feedback during launch?",
    options: ["Every week", "Every 2 weeks", "Monthly", "Only when major changes ship"],
  },
  {
    id: "launch-community-priority",
    question: "What matters most in your first community?",
    options: ["Serious debate", "Constructive support", "Fast insights", "Creative freedom"],
  },
];

const ONBOARDING_COMMUNITIES = [
  {
    id: "signal-room",
    title: "Late Night Talks",
    description: "Unfiltered conversations that only happen after midnight. For night owls and deep thinkers.",
    members: "13.4k",
    activeNow: "1.3k active",
    image:
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "build-lab",
    title: "Self-Improvement Circle",
    description: "Atomic habits, stoicism, and the relentless pursuit of the better self. Peer-driven accountability.",
    members: "8.7k",
    activeNow: "843 active",
    image:
      "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "healing-circle",
    title: "Healing Circle",
    description: "Mental wellness, emotional check-ins, and anonymous support with respectful moderation.",
    members: "9.2k",
    activeNow: "2.5k active",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "money-guild",
    title: "Money Guild",
    description: "Income, investing, debt, and practical finance in clear language with no flex culture.",
    members: "11.1k",
    activeNow: "1.1k active",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  },
];

function toOnboardingPolls(polls: Poll[]): OnboardingPoll[] {
  const core = polls.slice(0, 3).map((poll) => ({
    id: poll.id,
    question: poll.question,
    options: poll.options.map((option) => option.text),
  }));

  const neededFallback = Math.max(0, 3 - core.length);
  const fallback = FALLBACK_POLLS.slice(0, neededFallback);

  return [...core, ...fallback, ...EXTRA_ONBOARDING_POLLS];
}

function getNextStep(step: OnboardingStep): OnboardingStep {
  const currentIndex = STEP_ORDER.indexOf(step);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return "ready";
  }

  return STEP_ORDER[currentIndex + 1];
}

function StepPill({ label, active, complete }: { label: string; active: boolean; complete: boolean }) {
  return (
    <div
      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] transition-all ${
        active
          ? "border-raw-gold/60 bg-raw-gold/15 text-raw-gold"
          : complete
            ? "border-raw-gold/30 bg-raw-gold/5 text-raw-gold/70"
            : "border-raw-border/40 bg-raw-surface/20 text-raw-silver/35"
      }`}
    >
      {label}
    </div>
  );
}

export function OnboardingJourney({
  user,
  polls,
  avatarLevel,
  onAvatarLevelChange,
  onboardingStep,
  onboardingAnsweredPollIds,
  onSetOnboardingStep,
  onMarkPollAnswered,
  selectedCommunityIds,
  onToggleCommunity,
  onCompleteOnboarding,
  onLogout,
}: OnboardingJourneyProps) {
  const onboardingPolls = useMemo(() => toOnboardingPolls(polls), [polls]);
  const [pollSelections, setPollSelections] = useState<Record<string, string>>({});
  const [pollComments, setPollComments] = useState<Record<string, Comment[]>>({});
  const [pollStats, setPollStats] = useState<Record<string, Record<string, number>>>({});
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const answeredCount = onboardingPolls.filter((poll) => onboardingAnsweredPollIds.has(poll.id)).length;

  const canContinueFromAvatar = avatarLevel >= 1;
  const canContinueFromPolls = answeredCount >= onboardingPolls.length;
  const canContinueFromCommunities = selectedCommunityIds.length === 2;

  // Initialize poll stats with mock data
  useMemo(() => {
    const stats: Record<string, Record<string, number>> = {};
    onboardingPolls.forEach((poll) => {
      stats[poll.id] = {};
      poll.options.forEach((option) => {
        stats[poll.id][option] = Math.floor(Math.random() * 1000) + 50;
      });
    });
    setPollStats(stats);
  }, [onboardingPolls]);

  const goToNextStep = () => {
    onSetOnboardingStep(getNextStep(onboardingStep));
  };

  const currentStepIndex = STEP_ORDER.indexOf(onboardingStep);
  const avatarTheme = getAvatarTheme(avatarLevel);

  return (
    <div className="min-h-screen bg-raw-black">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.35em] text-raw-gold/60">Welcome to raW</p>
            <h1 className="mt-3 font-display text-2xl tracking-wide text-raw-text sm:text-3xl">
              Complete your identity path, {user.username}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-raw-silver/50">
              One flow. No skipping. Finish the sequence to unlock full dashboard access.
            </p>
          </div>

          <button
            onClick={onLogout}
            className="rounded-xl border border-raw-border/50 px-4 py-2 text-xs uppercase tracking-[0.16em] text-raw-silver/55 transition-colors hover:border-raw-border hover:text-raw-silver"
          >
            Log out
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {STEP_ORDER.map((step, index) => (
            <StepPill
              key={step}
              label={STEP_LABELS[step]}
              active={step === onboardingStep}
              complete={index < currentStepIndex}
            />
          ))}
        </div>

        <div className="rounded-3xl border border-raw-border/40 bg-gradient-to-b from-raw-surface/40 to-raw-black/90 p-6 sm:p-8">
          {onboardingStep === "avatar" && (
            <section>
              <h2 className="font-display text-xl tracking-wide text-raw-text">1. Choose your avatar</h2>
              <p className="mt-2 text-sm text-raw-silver/45">
                Your avatar is your public signal. You can evolve it later, but choose your starting form now.
              </p>

              <div className="mt-8 grid gap-8 grid-cols-2 items-center">
                {/* Left: Avatar Selector Grid (3 rows) */}
                <div className="flex flex-col items-center justify-center min-w-0">
                  <div className="space-y-6">
                    {/* Row 1: Levels 1-3 */}
                    <div className="flex items-center justify-center gap-4">
                      {Array.from({ length: 3 }, (_, i) => i + 1).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => onAvatarLevelChange(lvl)}
                          className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
                        >
                          <div
                            className={`rounded-full p-1 transition-all ${
                              lvl === avatarLevel
                                ? "border-2 border-raw-gold ring-2 ring-raw-gold/30"
                                : "border-2 border-raw-border hover:border-raw-gold/50"
                            }`}
                          >
                            <AvatarFigure level={lvl} size="lg" selected={lvl === avatarLevel} />
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Row 2: Levels 4-6 */}
                    <div className="flex items-center justify-center gap-4">
                      {Array.from({ length: 3 }, (_, i) => i + 4).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => onAvatarLevelChange(lvl)}
                          className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
                        >
                          <div
                            className={`rounded-full p-1 transition-all ${
                              lvl === avatarLevel
                                ? "border-2 border-raw-gold ring-2 ring-raw-gold/30"
                                : "border-2 border-raw-border hover:border-raw-gold/50"
                            }`}
                          >
                            <AvatarFigure level={lvl} size="lg" selected={lvl === avatarLevel} />
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Row 3: Levels 7-9 */}
                    <div className="flex items-center justify-center gap-4">
                      {Array.from({ length: 3 }, (_, i) => i + 7).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => onAvatarLevelChange(lvl)}
                          className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
                        >
                          <div
                            className={`rounded-full p-1 transition-all ${
                              lvl === avatarLevel
                                ? "border-2 border-raw-gold ring-2 ring-raw-gold/30"
                                : "border-2 border-raw-border hover:border-raw-gold/50"
                            }`}
                          >
                            <AvatarFigure level={lvl} size="lg" selected={lvl === avatarLevel} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Phone Mockup */}
                <div className="flex flex-col items-center justify-center">
                  <PhoneMockup>
                    <div className="bg-gradient-to-b from-slate-50 to-slate-100 px-3 py-2 flex flex-col h-full overflow-hidden">
                      {/* App Grid - 5 column iOS layout */}
                      <div className="grid grid-cols-5 gap-3 px-2 py-3 flex-1 overflow-y-auto auto-rows-max">
                        {/* FaceTime */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-4xl shadow-md">📹</div>
                          <span className="text-[7px] text-slate-600 font-medium text-center line-clamp-1">FaceTime</span>
                        </div>

                        {/* Calendar */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-[22px] bg-white border border-slate-200 flex items-center justify-center font-bold text-2xl shadow-md">23</div>
                          <span className="text-[7px] text-slate-600 font-medium text-center line-clamp-1">Calendar</span>
                        </div>

                        {/* Camera */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center text-4xl shadow-md">📷</div>
                          <span className="text-[7px] text-slate-600 font-medium text-center line-clamp-1">Camera</span>
                        </div>

                        {/* Clock */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-[22px] bg-slate-800 flex items-center justify-center text-4xl shadow-md">🕐</div>
                          <span className="text-[7px] text-slate-600 font-medium text-center line-clamp-1">Clock</span>
                        </div>

                        {/* Weather */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-3xl shadow-md">☁️</div>
                          <span className="text-[7px] text-slate-600 font-medium text-center line-clamp-1">Weather</span>
                        </div>

                        {/* Notes */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-[22px] bg-yellow-400 flex items-center justify-center text-4xl shadow-md">📝</div>
                          <span className="text-[7px] text-slate-600 font-medium text-center line-clamp-1">Notes</span>
                        </div>

                        {/* Reminders */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-4xl shadow-md">✓</div>
                          <span className="text-[7px] text-slate-600 font-medium text-center line-clamp-1">Reminders</span>
                        </div>

                        {/* Stocks */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-[22px] bg-slate-900 flex items-center justify-center text-3xl shadow-md">📈</div>
                          <span className="text-[7px] text-slate-600 font-medium text-center line-clamp-1">Stocks</span>
                        </div>

                        {/* Maps */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center text-4xl shadow-md">🗺️</div>
                          <span className="text-[7px] text-slate-600 font-medium text-center line-clamp-1">Maps</span>
                        </div>

                        {/* Your raW Avatar - 2x2 Featured App */}
                        <div className="col-span-2 row-span-2 flex flex-col items-center justify-center gap-2">
                          <div
                            className="w-full aspect-square rounded-[28px] flex items-center justify-center shadow-xl border-2 border-white relative overflow-hidden"
                            style={{ background: avatarTheme.bg }}
                          >
                            <div
                              className="absolute inset-0 opacity-50 blur-2xl"
                              style={{ background: avatarTheme.glow !== "none" ? avatarTheme.glow : avatarTheme.ring }}
                            />
                            <div className="relative z-10 scale-100">
                              <AvatarFigure level={avatarLevel} size="xl" />
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-600 font-bold text-center">raW</span>
                        </div>
                      </div>

                      {/* Dock */}
                      <div className="mt-1 mx-1 bg-white/60 backdrop-blur rounded-2xl py-1 px-1 flex gap-1 justify-center shadow-lg border border-white/40">
                        <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center text-lg shadow">📞</div>
                        <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-lg shadow">🧭</div>
                        <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center text-lg shadow">💬</div>
                        <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center text-lg shadow">🎵</div>
                      </div>
                    </div>
                  </PhoneMockup>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromAvatar}
                  className="rounded-xl bg-raw-gold px-5 py-2.5 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next: Polls
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "polls" && (
            <section>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl tracking-wide text-raw-text">2. Answer 5 launch polls</h2>
                  <p className="mt-2 text-sm text-raw-silver/45">
                    One question at a time. Swipe or use buttons to navigate through all 5 polls.
                  </p>
                </div>
                <p className="rounded-full border border-raw-border/40 px-3 py-1 text-xs text-raw-gold/75">
                  {answeredCount}/{onboardingPolls.length} completed
                </p>
              </div>

              {/* Single Poll Card */}
              <div className="mt-8">
                {onboardingPolls.length > 0 && (
                  <div className="w-full">
                    {(() => {
                      const poll = onboardingPolls[currentPollIndex];
                      const selectedOption = pollSelections[poll.id];
                      const isAnswered = onboardingAnsweredPollIds.has(poll.id);
                      const pollStatData = pollStats[poll.id] || {};

                      return (
                        <div>
                          <p className="text-xs text-raw-silver/50 mb-4 font-medium uppercase tracking-[0.12em]">
                            Question {currentPollIndex + 1} of {onboardingPolls.length}
                          </p>
                          <SwipeablePollCard
                            id={poll.id}
                            question={poll.question}
                            options={poll.options}
                            selectedOption={selectedOption}
                            isAnswered={isAnswered}
                            totalResponses={Object.values(pollStatData).reduce((a, b) => a + b, 0)}
                            responseStats={pollStatData}
                            comments={pollComments[poll.id] || []}
                            onSwipe={(option) => {
                              setPollSelections((prev) => ({ ...prev, [poll.id]: option }));
                              onMarkPollAnswered(poll.id);
                            }}
                            onAddComment={(content) => {
                              const newComment: Comment = {
                                id: `${poll.id}-${Date.now()}`,
                                author: user.username,
                                avatar: avatarLevel,
                                content,
                                timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                                likes: 0,
                                replies: [],
                                isAnonymous: Math.random() > 0.7,
                              };
                              setPollComments((prev) => ({
                                ...prev,
                                [poll.id]: [...(prev[poll.id] || []), newComment],
                              }));
                            }}
                          />

                          {/* Navigation Buttons */}
                          <div className="mt-6 flex gap-3">
                            <button
                              onClick={() => setCurrentPollIndex(Math.max(0, currentPollIndex - 1))}
                              disabled={currentPollIndex === 0}
                              className="flex-1 rounded-lg border border-raw-border/30 bg-raw-black/20 px-4 py-2.5 text-xs font-medium text-raw-silver/70 hover:border-raw-gold/35 hover:text-raw-gold/75 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              ← Previous
                            </button>

                            {currentPollIndex < onboardingPolls.length - 1 ? (
                              <button
                                onClick={() => setCurrentPollIndex(Math.min(onboardingPolls.length - 1, currentPollIndex + 1))}
                                className="flex-1 rounded-lg border border-raw-border/30 bg-raw-black/20 px-4 py-2.5 text-xs font-medium text-raw-silver/70 hover:border-raw-gold/35 hover:text-raw-gold/75 transition-all"
                              >
                                Next →
                              </button>
                            ) : (
                              <button
                                onClick={goToNextStep}
                                disabled={!canContinueFromPolls}
                                className="flex-1 rounded-lg bg-raw-gold px-4 py-2.5 text-xs font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Complete →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </section>
          )}

          {onboardingStep === "communities" && (
            <section>
              <h2 className="font-display text-xl tracking-wide text-raw-text">3. Pick 2 communities to unlock first</h2>
              <p className="mt-2 text-sm text-raw-silver/45">
                Choose the 2 communities you'd love first access to as a new member. You can join more after onboarding.
              </p>
              <p className="mt-3 inline-flex rounded-full border border-raw-border/40 px-3 py-1 text-xs text-raw-gold/75">
                {selectedCommunityIds.length}/2 selected
              </p>

              <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {ONBOARDING_COMMUNITIES.map((community) => {
                  const isSelected = selectedCommunityIds.includes(community.id);
                  const selectionLimitReached = selectedCommunityIds.length >= 2;
                  const isSelectionDisabled = selectionLimitReached && !isSelected;

                  return (
                    <button
                      key={community.id}
                      onClick={() => onToggleCommunity(community.id)}
                      disabled={isSelectionDisabled}
                      className={`group overflow-hidden rounded-[26px] border text-left transition-all duration-300 ${
                        isSelected
                          ? "border-raw-gold/70 bg-raw-surface/80 shadow-[0_18px_36px_rgba(241,196,45,0.18)]"
                          : "border-raw-border/35 bg-raw-surface/65 hover:-translate-y-0.5 hover:border-raw-gold/35 hover:shadow-[0_14px_28px_rgba(0,0,0,0.35)]"
                      }`}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={community.image}
                          alt={community.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

                        <div className="absolute bottom-3 left-3 rounded-full border border-raw-border/60 bg-black/55 px-2.5 py-1 backdrop-blur-sm">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-raw-silver/80">
                            <span className="mr-1 text-raw-gold">●</span>
                            {community.activeNow}
                          </p>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="font-display text-[30px] leading-[1.06] text-raw-text">{community.title}</p>
                        <p className="mt-3 text-[13px] leading-relaxed text-raw-silver/58">{community.description}</p>

                        <div className="mt-5">
                          <span
                            className={`inline-flex rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                              isSelected
                                ? "border-raw-gold/80 bg-raw-gold/15 text-raw-gold"
                                : isSelectionDisabled
                                  ? "border-raw-border/35 text-raw-silver/35"
                                  : "border-raw-border/50 text-raw-gold/85 group-hover:border-raw-gold/45"
                            }`}
                          >
                            {isSelected ? "Selected" : "Enter Circle"}
                          </span>
                        </div>

                        <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-raw-gold/70">{community.members} members</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromCommunities}
                  className="rounded-xl bg-raw-gold px-5 py-2.5 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next: Insights
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "marketplace" && (
            <section>
              <h2 className="font-display text-xl tracking-wide text-raw-text">4. Insights are coming soon</h2>
              <p className="mt-2 text-sm text-raw-silver/45">
                The raW insights layer will unlock pattern tracking, personalized signal summaries, and community-powered perspective snapshots.
                At launch, this section is in preview mode while we calibrate the first release.
              </p>

              <div className="mt-6 rounded-2xl border border-raw-border/35 bg-raw-black/35 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-raw-gold/75">Preview features</p>
                <ul className="mt-3 space-y-2 text-sm text-raw-silver/55">
                  <li>Live behavioral trend snapshots from your answered polls</li>
                  <li>Signal timelines that highlight how your stance changes over time</li>
                  <li>Anonymous cohort comparisons with context-aware interpretations</li>
                </ul>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={goToNextStep}
                  className="rounded-xl bg-raw-gold px-5 py-2.5 text-sm font-semibold text-raw-ink"
                >
                  Next: Ready
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "ready" && (
            <section className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-raw-gold/70">Final step</p>
              <h2 className="mt-3 font-display text-3xl tracking-wide text-raw-text">Click if you are ready to be raW</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-raw-silver/50">
                You are now configured and ready for full free-roam mode. This action unlocks your dashboard.
              </p>

              <button
                onClick={onCompleteOnboarding}
                className="mt-8 rounded-2xl bg-raw-gold px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-raw-ink"
              >
                Click If You Are Ready To Be raW
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
