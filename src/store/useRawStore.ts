import { useCallback, useEffect, useState } from "react";
import {
  clearAuthSession,
  getPersistedUserById,
  persistAuthSession,
  readAuthSession,
  registerOrUpdateUser,
  type ModerationStatus,
  type UserRole,
} from "@/lib/adminData";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  moderationStatus: ModerationStatus;
  warnings: number;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface StytchSession {
  authenticated: boolean;
  userId?: string;
  email?: string;
  sessionToken?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  locked: boolean;
}

export type OnboardingStep = "avatar" | "polls" | "communities" | "marketplace" | "ready";

const INITIAL_POLLS: Poll[] = [
  {
    id: "poll-1",
    question: "Do you believe your thoughts shape your reality?",
    options: [
      { id: "p1-yes", text: "Yes", votes: 482 },
      { id: "p1-no", text: "No", votes: 187 },
    ],
    locked: false,
  },
  {
    id: "poll-2",
    question: "Do you think social media does more harm than good?",
    options: [
      { id: "p2-yes", text: "Yes", votes: 391 },
      { id: "p2-no", text: "No", votes: 274 },
    ],
    locked: false,
  },
  {
    id: "poll-3",
    question: "Would you sacrifice comfort for personal growth?",
    options: [
      { id: "p3-yes", text: "Yes", votes: 523 },
      { id: "p3-no", text: "No", votes: 146 },
    ],
    locked: false,
  },
];

const ONBOARDING_STATE_STORAGE_KEY = "raw.onboarding.v1";

interface PersistedOnboardingEntry {
  completed: boolean;
  step: OnboardingStep;
  answeredPollIds: string[];
  selectedCommunityId: string | null;
}

type PersistedOnboardingMap = Record<string, PersistedOnboardingEntry>;

function readOnboardingMap(): PersistedOnboardingMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(ONBOARDING_STATE_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue) as PersistedOnboardingMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOnboardingMap(map: PersistedOnboardingMap): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ONBOARDING_STATE_STORAGE_KEY, JSON.stringify(map));
}

function toUser(record: NonNullable<ReturnType<typeof getPersistedUserById>>): User {
  return {
    id: record.id,
    username: record.username,
    role: record.role,
    moderationStatus: record.moderationStatus,
    warnings: record.warnings,
  };
}

function readInitialUser(): User | null {
  const sessionUserId = readAuthSession();
  if (!sessionUserId) {
    return null;
  }

  const persistedUser = getPersistedUserById(sessionUserId);
  return persistedUser ? toUser(persistedUser) : null;
}

export function useRawStore() {
  const [user, setUser] = useState<User | null>(() => readInitialUser());
  const [stytchSession, setStytchSession] = useState<StytchSession | null>(null);
  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [showSignup, setShowSignup] = useState(false);
  const [avatarLevel, setAvatarLevel] = useState(1);
  const [freeVotesUsed, setFreeVotesUsed] = useState(0);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("avatar");
  const [onboardingAnsweredPollIds, setOnboardingAnsweredPollIds] = useState<Set<string>>(new Set());
  const [onboardingSelectedCommunityId, setOnboardingSelectedCommunityId] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isOnboardingResolved, setIsOnboardingResolved] = useState(false);

  const isLoggedIn = user !== null || (stytchSession?.authenticated ?? false);

  const refreshPersistedUser = useCallback(() => {
    const sessionUserId = readAuthSession();
    if (!sessionUserId) {
      setUser(null);
      return;
    }

    const persistedUser = getPersistedUserById(sessionUserId);
    setUser(persistedUser ? toUser(persistedUser) : null);
  }, []);

  useEffect(() => {
    refreshPersistedUser();
    window.addEventListener("focus", refreshPersistedUser);

    return () => {
      window.removeEventListener("focus", refreshPersistedUser);
    };
  }, [refreshPersistedUser]);

  useEffect(() => {
    if (!user) {
      setOnboardingStep("avatar");
      setOnboardingAnsweredPollIds(new Set());
      setOnboardingSelectedCommunityId(null);
      setOnboardingCompleted(false);
      setIsOnboardingResolved(true);
      return;
    }

    setIsOnboardingResolved(false);

    const onboardingMap = readOnboardingMap();
    const entry = onboardingMap[user.id];
    if (!entry) {
      setOnboardingStep("avatar");
      setOnboardingAnsweredPollIds(new Set());
      setOnboardingSelectedCommunityId(null);
      setOnboardingCompleted(false);
      setIsOnboardingResolved(true);
      return;
    }

    setOnboardingStep(entry.step ?? "avatar");
    setOnboardingAnsweredPollIds(new Set(entry.answeredPollIds ?? []));
    setOnboardingSelectedCommunityId(entry.selectedCommunityId ?? null);
    setOnboardingCompleted(Boolean(entry.completed));
    setIsOnboardingResolved(true);
  }, [user]);

  useEffect(() => {
    if (!user || !isOnboardingResolved) {
      return;
    }

    const onboardingMap = readOnboardingMap();
    onboardingMap[user.id] = {
      completed: onboardingCompleted,
      step: onboardingStep,
      answeredPollIds: [...onboardingAnsweredPollIds],
      selectedCommunityId: onboardingSelectedCommunityId,
    };
    writeOnboardingMap(onboardingMap);
  }, [isOnboardingResolved, onboardingAnsweredPollIds, onboardingCompleted, onboardingSelectedCommunityId, onboardingStep, user]);

  const vote = useCallback((pollId: string, optionId: string) => {
    setVotedPolls((previous) => new Set([...previous, pollId]));
    setPolls((previous) =>
      previous.map((poll) =>
        poll.id === pollId
          ? { ...poll, options: poll.options.map((option) => option.id === optionId ? { ...option, votes: option.votes + 1 } : option) }
          : poll
      )
    );
  }, []);

  const requestSignupOtp = useCallback(async (username: string, _password: string, _phone: string): Promise<AuthResult> => {
    const registeredUser = registerOrUpdateUser(username);
    if (registeredUser.moderationStatus === "banned") {
      return { ok: false, error: "This account has been banned after moderation review." };
    }

    persistAuthSession(registeredUser.id);
    setUser(toUser(registeredUser));
    setShowSignup(false);
    return { ok: true };
  }, []);

  const verifySignupOtp = useCallback(async (_code: string): Promise<AuthResult> => {
    return { ok: true };
  }, []);

  const login = useCallback(async (username: string, _password: string): Promise<AuthResult> => {
    const registeredUser = registerOrUpdateUser(username);
    if (registeredUser.moderationStatus === "banned") {
      return { ok: false, error: "This account has been banned after moderation review." };
    }

    persistAuthSession(registeredUser.id);
    setUser(toUser(registeredUser));
    setShowSignup(false);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setStytchSession(null);
  }, []);

  const markOnboardingPollAnswered = useCallback((pollId: string) => {
    setOnboardingAnsweredPollIds((previous) => {
      const next = new Set(previous);
      next.add(pollId);
      return next;
    });
  }, []);

  const resetOnboardingProgress = useCallback(() => {
    setOnboardingStep("avatar");
    setOnboardingAnsweredPollIds(new Set());
    setOnboardingSelectedCommunityId(null);
    setOnboardingCompleted(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    setOnboardingStep("ready");
  }, []);

  const setSyncStytchSession = useCallback((session: StytchSession | null) => {
    setStytchSession(session);

    if (session?.authenticated && session?.email) {
      const username = session.email.split("@")[0];
      const registeredUser = registerOrUpdateUser(username);
      persistAuthSession(registeredUser.id);
      setUser(toUser(registeredUser));
    }
  }, []);

  return {
    user,
    isLoggedIn,
    isAdmin: user?.role === "admin",
    stytchSession,
    setStytchSession: setSyncStytchSession,
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
    onboardingSelectedCommunityId,
    setOnboardingSelectedCommunityId,
    onboardingCompleted,
    isOnboardingResolved,
    completeOnboarding,
    resetOnboardingProgress,
    vote,
    requestSignupOtp,
    verifySignupOtp,
    login,
    logout,
  };
}