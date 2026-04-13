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
import { ErrorBoundary } from "@/components/ui/error-boundary";
import Dashboard from "@/pages/Dashboard";
import { useRawStore } from "@/store/useRawStore";
import { useState } from "react";
import MatrixBackgroundIntro from "@/components/ui/matrix-background-intro";

const Index = () => {
  const [showMatrixIntro, setShowMatrixIntro] = useState(true);

  const {
    user,
    isLoggedIn,
    polls,
    votedPolls,
    votedOptions,
    purchasedInsights,
    freeVotesUsed,
    showSignup,
    setShowSignup,
    avatarLevel,
    setAvatarLevel,
    vote,
    signup,
    purchaseInsight,
  } = useRawStore();

  // Show dashboard when logged in
  if (isLoggedIn && user) {
    return (
      <Dashboard
        user={user}
        polls={polls}
        votedPolls={votedPolls}
        votedOptions={votedOptions}
        purchasedInsights={purchasedInsights}
        avatarLevel={avatarLevel}
        setAvatarLevel={setAvatarLevel}
        vote={vote}
        purchaseInsight={purchaseInsight}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {showMatrixIntro ? <MatrixBackgroundIntro onComplete={() => setShowMatrixIntro(false)} /> : null}
      <Navbar
        isLoggedIn={isLoggedIn}
        username={user?.username}
        onSignupClick={() => setShowSignup(true)}
      />

      <Hero onSignupClick={() => setShowSignup(true)} />
      <div className="section-shell">
        <ErrorBoundary
          fallback={
            <div className="mx-auto max-w-3xl px-6 py-20 text-center">
              <p className="font-display text-xl text-raw-text">Poll section is reloading.</p>
              <p className="mt-2 text-sm text-raw-silver/50">Please refresh once to load the latest bundle.</p>
            </div>
          }
        >
          <PollSection
            polls={polls}
            votedPolls={votedPolls}
            isLoggedIn={isLoggedIn}
            freeVotesUsed={freeVotesUsed}
            onVote={vote}
            onSignupClick={() => setShowSignup(true)}
          />
        </ErrorBoundary>
      </div>
      <div className="section-shell">
        <HowItWorks />
      </div>
      <div className="section-shell">
        <Communities onSignupClick={() => setShowSignup(true)} />
      </div>
      <div className="section-shell">
        <AvatarIdentity avatarLevel={avatarLevel} onLevelChange={setAvatarLevel} />
      </div>
      <div className="section-shell">
        <WhyAnonymity />
      </div>
      <div className="section-shell">
        <FoundingProviders />
      </div>
      <div className="section-shell">
        <FinalCTA onSignupClick={() => setShowSignup(true)} />
      </div>

      <SignupModal
        open={showSignup}
        onClose={() => setShowSignup(false)}
        onSignup={signup}
      />
    </div>
  );
};

export default Index;
