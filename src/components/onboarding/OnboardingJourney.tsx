import { useMemo, useState } from "react";
import { AvatarFigure, getAvatarTheme } from "@/components/ui/avatar-figure";
import type { OnboardingStep, Poll, User } from "@/store/useRawStore";

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
  selectedCommunityId: string | null;
  onSelectCommunity: (communityId: string) => void;
  onCompleteOnboarding: () => void;
  onLogout: () => void;
}

const STEP_ORDER: OnboardingStep[] = ["avatar", "polls", "communities", "marketplace", "ready"];

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
    title: "Signal Room",
    description: "High-context takes on trends, politics, and culture with evidence-first norms.",
    members: "13.4k",
  },
  {
    id: "build-lab",
    title: "Build Lab",
    description: "Founders, makers, and operators sharing launches, pivots, and hard-earned lessons.",
    members: "8.7k",
  },
  {
    id: "healing-circle",
    title: "Healing Circle",
    description: "Mental wellness, emotional check-ins, and anonymous support with respectful moderation.",
    members: "9.2k",
  },
  {
    id: "money-guild",
    title: "Money Guild",
    description: "Income, investing, debt, and practical finance in clear language with no flex culture.",
    members: "11.1k",
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
  selectedCommunityId,
  onSelectCommunity,
  onCompleteOnboarding,
  onLogout,
}: OnboardingJourneyProps) {
  const onboardingPolls = useMemo(() => toOnboardingPolls(polls), [polls]);
  const [pollSelections, setPollSelections] = useState<Record<string, string>>({});
  const answeredCount = onboardingPolls.filter((poll) => onboardingAnsweredPollIds.has(poll.id)).length;

  const canContinueFromAvatar = avatarLevel >= 1;
  const canContinueFromPolls = answeredCount >= onboardingPolls.length;
  const canContinueFromCommunities = Boolean(selectedCommunityId);

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
              label={step}
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

              <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
                <div className="rounded-2xl border border-raw-border/30 bg-raw-black/50 p-5">
                  <div className="flex justify-center">
                    <AvatarFigure level={avatarLevel} size="lg" selected />
                  </div>
                  <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-raw-gold">Level {avatarLevel}</p>
                  <p className="mt-1 text-center text-xs text-raw-silver/45">{avatarTheme.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                    <button
                      key={level}
                      onClick={() => onAvatarLevelChange(level)}
                      className={`rounded-2xl border px-3 py-3 transition-all ${
                        level === avatarLevel
                          ? "border-raw-gold/55 bg-raw-gold/10"
                          : "border-raw-border/30 bg-raw-black/30 hover:border-raw-gold/25"
                      }`}
                    >
                      <div className="flex justify-center">
                        <AvatarFigure level={level} size="sm" selected={level === avatarLevel} />
                      </div>
                      <p className={`mt-1 text-[10px] uppercase tracking-[0.15em] ${level === avatarLevel ? "text-raw-gold" : "text-raw-silver/45"}`}>
                        Lvl {level}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromAvatar}
                  className="rounded-xl bg-raw-gold px-5 py-2.5 text-sm font-semibold text-raw-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
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
                    Select one answer per question. All 5 are required to continue.
                  </p>
                </div>
                <p className="rounded-full border border-raw-border/40 px-3 py-1 text-xs text-raw-gold/75">
                  {answeredCount}/{onboardingPolls.length} completed
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {onboardingPolls.map((poll, index) => {
                  const selectedOption = pollSelections[poll.id];
                  const isAnswered = onboardingAnsweredPollIds.has(poll.id);

                  return (
                    <div key={poll.id} className="rounded-2xl border border-raw-border/30 bg-raw-black/35 p-4">
                      <p className="text-sm text-raw-text">
                        {index + 1}. {poll.question}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {poll.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setPollSelections((previous) => ({ ...previous, [poll.id]: option }));
                              onMarkPollAnswered(poll.id);
                            }}
                            className={`rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                              selectedOption === option
                                ? "border-raw-gold/55 bg-raw-gold/10 text-raw-gold"
                                : "border-raw-border/30 bg-raw-black/30 text-raw-silver/65 hover:border-raw-gold/25"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {isAnswered && (
                        <p className="mt-2 text-[11px] text-emerald-300/85">Answer captured</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromPolls}
                  className="rounded-xl bg-raw-gold px-5 py-2.5 text-sm font-semibold text-raw-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next: Communities
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "communities" && (
            <section>
              <h2 className="font-display text-xl tracking-wide text-raw-text">3. Pick from 4 communities</h2>
              <p className="mt-2 text-sm text-raw-silver/45">
                Choose a starting community. You can join more once you unlock the dashboard.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ONBOARDING_COMMUNITIES.map((community) => {
                  const isSelected = selectedCommunityId === community.id;

                  return (
                    <button
                      key={community.id}
                      onClick={() => onSelectCommunity(community.id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-raw-gold/55 bg-raw-gold/10"
                          : "border-raw-border/30 bg-raw-black/30 hover:border-raw-gold/25"
                      }`}
                    >
                      <p className="font-display text-sm tracking-wide text-raw-text">{community.title}</p>
                      <p className="mt-1 text-xs text-raw-silver/55">{community.description}</p>
                      <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-raw-gold/70">{community.members} members</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromCommunities}
                  className="rounded-xl bg-raw-gold px-5 py-2.5 text-sm font-semibold text-raw-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next: Marketplace
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "marketplace" && (
            <section>
              <h2 className="font-display text-xl tracking-wide text-raw-text">4. Marketplace is coming soon</h2>
              <p className="mt-2 text-sm text-raw-silver/45">
                The raW marketplace will unlock identity-based offers, trusted providers, and community-curated opportunities.
                At launch, this section is in preview mode while we onboard founding partners.
              </p>

              <div className="mt-6 rounded-2xl border border-raw-border/35 bg-raw-black/35 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-raw-gold/75">Preview features</p>
                <ul className="mt-3 space-y-2 text-sm text-raw-silver/55">
                  <li>Founding provider drops matched to your participation level</li>
                  <li>Anonymous group buying opportunities</li>
                  <li>Reputation-weighted recommendations from trusted circles</li>
                </ul>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={goToNextStep}
                  className="rounded-xl bg-raw-gold px-5 py-2.5 text-sm font-semibold text-raw-black"
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
                className="mt-8 rounded-2xl bg-raw-gold px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-raw-black"
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
