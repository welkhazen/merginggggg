import { useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PollSection } from "@/components/landing/PollSection";
import { Communities } from "@/components/landing/Communities";
import { AvatarIdentity } from "@/components/landing/AvatarIdentity";
import { WhyAnonymity } from "@/components/landing/WhyAnonymity";
import { FoundingProviders } from "@/components/landing/FoundingProviders";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { SignupModal } from "@/components/landing/SignupModal";
import { OnboardingJourney } from "@/components/onboarding/OnboardingJourney";
import { useHostMode } from "@/hooks/use-host-mode";
import { useSyncStytchAuth } from "@/hooks/useSyncStytchAuth";
import Dashboard from "@/pages/Dashboard";
import { useRawStore } from "@/store/useRawStore";

const Index = () => {
  const {
    user,
    isLoggedIn,
    polls,
    votedPolls,
    freeVotesUsed,
    showSignup,
    setShowSignup,
    avatarLevel,
    setAvatarLevel,
    onboardingStep,
    setOnboardingStep,
    onboardingAnsweredPollIds,
    markOnboardingPollAnswered,
    onboardingSelectedCommunityIds,
    setOnboardingSelectedCommunityIds,
    onboardingCompleted,
    isOnboardingResolved,
    dailyAnsweredCount,
    dailyPollLimit,
    isDailyPollLimitReached,
    completeOnboarding,
    vote,
    requestSignupOtp,
    verifySignupOtp,
    login,
    logout,
  } = useRawStore();
  const { hostname, isMyRawApp, isTheRawMe } = useHostMode();
  
  // Sync Stytch authentication with the store
  useSyncStytchAuth();

  useEffect(() => {
    if (!isLoggedIn || !user || !isTheRawMe || typeof window === "undefined") {
      return;
    }

    const targetUrl = `${window.location.protocol}//myraw.app${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (window.location.hostname !== "myraw.app") {
      window.location.replace(targetUrl);
    }
  }, [hostname, isLoggedIn, isTheRawMe, user]);

  if (isLoggedIn && user && isTheRawMe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-raw-black px-6 text-center text-raw-silver/60">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.25em] text-raw-gold/70">Redirecting</p>
          <p className="mt-3 text-sm">Taking you to myraw.app...</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn && user && !isOnboardingResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-raw-black to-raw-black/80">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold mb-4"></div>
          <p className="text-raw-silver/60 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show dashboard when logged in
  if (isLoggedIn && user) {
    if (!onboardingCompleted) {
      return (
        <OnboardingJourney
          user={user}
          polls={polls}
          avatarLevel={avatarLevel}
          onAvatarLevelChange={setAvatarLevel}
          onboardingStep={onboardingStep}
          onboardingAnsweredPollIds={onboardingAnsweredPollIds}
          onSetOnboardingStep={setOnboardingStep}
          onMarkPollAnswered={markOnboardingPollAnswered}
          selectedCommunityIds={onboardingSelectedCommunityIds}
          onToggleCommunity={(communityId) => {
            setOnboardingSelectedCommunityIds((previous) => {
              if (previous.includes(communityId)) {
                return previous.filter((id) => id !== communityId);
              }

              if (previous.length >= 2) {
                return previous;
              }

              return [...previous, communityId];
            });
          }}
          onCompleteOnboarding={completeOnboarding}
          onLogout={logout}
        />
      );
    }

    return (
      <Dashboard
        user={user}
        polls={polls}
        votedPolls={votedPolls}
        avatarLevel={avatarLevel}
        setAvatarLevel={setAvatarLevel}
        dailyAnsweredCount={dailyAnsweredCount}
        dailyPollLimit={dailyPollLimit}
        isDailyPollLimitReached={isDailyPollLimitReached}
        vote={vote}
        onLogout={logout}
      />
    );
  }

  if (isMyRawApp) {
    return (
      <div className="min-h-screen bg-raw-black px-6 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center rounded-3xl border border-raw-border/40 bg-gradient-to-b from-raw-surface/40 to-raw-black/90 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-raw-gold/65">myraw.app</p>
          <h1 className="mt-3 font-display text-3xl tracking-wide text-raw-text sm:text-4xl">Sign in to your raW dashboard</h1>
          <p className="mt-4 max-w-xl text-sm text-raw-silver/50">
            This domain is app-only. Sign in or create your account to continue.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowSignup(true)}
              className="rounded-xl bg-raw-gold px-6 py-3 text-sm font-semibold text-raw-ink"
            >
              Sign In / Sign Up
            </button>
          </div>
          <p className="mt-6 text-xs text-raw-silver/35">Want the full public landing experience? Visit theraw.me.</p>
        </div>

        <SignupModal
          open={showSignup}
          onClose={() => setShowSignup(false)}
          onRequestSignupOtp={requestSignupOtp}
          onVerifySignupOtp={verifySignupOtp}
          onLogin={login}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raw-black">
      <Navbar
        isLoggedIn={isLoggedIn}
        username={user?.username}
        onSignupClick={() => setShowSignup(true)}
      />

      <Hero onSignupClick={() => setShowSignup(true)} />
      <PollSection
        polls={polls}
        votedPolls={votedPolls}
        isLoggedIn={isLoggedIn}
        freeVotesUsed={freeVotesUsed}
        onVote={vote}
        onSignupClick={() => setShowSignup(true)}
      />
      <HowItWorks />
      <Communities onSignupClick={() => setShowSignup(true)} />
      <AvatarIdentity avatarLevel={avatarLevel} onLevelChange={setAvatarLevel} />
      <WhyAnonymity />
      <FoundingProviders />
      <FinalCTA onSignupClick={() => setShowSignup(true)} />

      <SignupModal
        open={showSignup}
        onClose={() => setShowSignup(false)}
        onRequestSignupOtp={requestSignupOtp}
        onVerifySignupOtp={verifySignupOtp}
        onLogin={login}
      />
    </div>
  );
};

export default Index;
