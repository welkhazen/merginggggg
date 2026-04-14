import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Index from "@/pages/Index";
import { persistAuthSession, registerOrUpdateUser } from "@/lib/adminData";

vi.mock("@/components/landing/Navbar", () => ({
  Navbar: () => <div data-testid="landing-navbar" />,
}));

vi.mock("@/components/landing/Hero", () => ({
  Hero: () => <div data-testid="landing-hero" />,
}));

vi.mock("@/components/landing/HowItWorks", () => ({
  HowItWorks: () => <div data-testid="landing-how-it-works" />,
}));

vi.mock("@/components/landing/PollSection", () => ({
  PollSection: () => <div data-testid="landing-polls" />,
}));

vi.mock("@/components/landing/Communities", () => ({
  Communities: () => <div data-testid="landing-communities" />,
}));

vi.mock("@/components/landing/AvatarIdentity", () => ({
  AvatarIdentity: () => <div data-testid="landing-avatar" />,
}));

vi.mock("@/components/landing/WhyAnonymity", () => ({
  WhyAnonymity: () => <div data-testid="landing-why" />,
}));

vi.mock("@/components/landing/FoundingProviders", () => ({
  FoundingProviders: () => <div data-testid="landing-founders" />,
}));

vi.mock("@/components/landing/FinalCTA", () => ({
  FinalCTA: () => <div data-testid="landing-cta" />,
}));

vi.mock("@/components/landing/SignupModal", () => ({
  SignupModal: () => null,
}));

vi.mock("@/components/onboarding/OnboardingJourney", () => ({
  OnboardingJourney: () => <div data-testid="onboarding-journey" />,
}));

vi.mock("@/pages/Dashboard", () => ({
  default: () => <div data-testid="dashboard-screen" />,
}));

vi.mock("@/hooks/use-host-mode", () => ({
  useHostMode: () => ({
    hostname: "localhost",
    isMyRawApp: false,
    isTheRawMe: false,
  }),
}));

vi.mock("@/hooks/useSyncStytchAuth", () => ({
  useSyncStytchAuth: () => ({
    isInitialized: true,
    isStytchAuthenticated: false,
  }),
}));

describe("onboarding restore flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the dashboard for a returning user with completed onboarding", async () => {
    const user = registerOrUpdateUser("returning-user");
    persistAuthSession(user.id);
    window.localStorage.setItem(
      "raw.onboarding.v1",
      JSON.stringify({
        [user.id]: {
          completed: true,
          step: "ready",
          answeredPollIds: ["poll-1"],
          selectedCommunityId: null,
        },
      })
    );

    render(<Index />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("onboarding-journey")).not.toBeInTheDocument();
  });
});