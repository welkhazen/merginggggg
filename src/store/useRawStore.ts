import { useCallback, useEffect, useState } from "react";

export interface User {
  id: string;
  username: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  channels?: string[];
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

interface BootstrapResponse {
  user: User | null;
  isLoggedIn: boolean;
  polls: Poll[];
  votedPollIds: string[];
  freeVotesUsed: number;
}

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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

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

async function parseApiResponse<T>(response: Response): Promise<T> {
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed.";

    throw new Error(message);
  }

  return data as T;
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "GET",
    credentials: "include",
  });

  return parseApiResponse<T>(response);
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseApiResponse<T>(response);
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useRawStore() {
  const [user, setUser] = useState<User | null>(null);
  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [showSignup, setShowSignup] = useState(false);
  const [avatarLevel, setAvatarLevel] = useState(1);
  const [freeVotesUsed, setFreeVotesUsed] = useState(0);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("avatar");
  const [onboardingAnsweredPollIds, setOnboardingAnsweredPollIds] = useState<Set<string>>(new Set());
  const [onboardingSelectedCommunityId, setOnboardingSelectedCommunityId] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const isLoggedIn = user !== null;

  const syncFromBootstrap = useCallback((payload: BootstrapResponse) => {
    setUser(payload.user);
    setPolls(payload.polls);
    setVotedPolls(new Set(payload.votedPollIds));
    setFreeVotesUsed(payload.freeVotesUsed);
  }, []);

  const refreshBootstrap = useCallback(async () => {
    // Backend disabled — skip bootstrap fetch
  }, []);

  useEffect(() => {
    void refreshBootstrap();
  }, [refreshBootstrap]);

  useEffect(() => {
    if (!user) {
      setOnboardingStep("avatar");
      setOnboardingAnsweredPollIds(new Set());
      setOnboardingSelectedCommunityId(null);
      setOnboardingCompleted(false);
      return;
    }

    const onboardingMap = readOnboardingMap();
    const entry = onboardingMap[user.id];
    if (!entry) {
      setOnboardingStep("avatar");
      setOnboardingAnsweredPollIds(new Set());
      setOnboardingSelectedCommunityId(null);
      setOnboardingCompleted(false);
      return;
    }

    setOnboardingStep(entry.step ?? "avatar");
    setOnboardingAnsweredPollIds(new Set(entry.answeredPollIds ?? []));
    setOnboardingSelectedCommunityId(entry.selectedCommunityId ?? null);
    setOnboardingCompleted(Boolean(entry.completed));
  }, [user]);

  useEffect(() => {
    if (!user) {
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
  }, [onboardingAnsweredPollIds, onboardingCompleted, onboardingSelectedCommunityId, onboardingStep, user]);

  const vote = useCallback(
    (pollId: string, optionId: string) => {
      // Backend disabled — update vote state locally
      setVotedPolls((prev) => new Set([...prev, pollId]));
      setPolls((prev) =>
        prev.map((poll) =>
          poll.id === pollId
            ? { ...poll, options: poll.options.map((opt) => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt) }
            : poll
        )
      );
    },
    []
  );

  const requestSignupOtp = useCallback(async (username: string, _password: string, _phone: string): Promise<AuthResult> => {
    // OTP / Twilio disabled — mock signup locally
    setUser({ id: `local-${Date.now()}`, username });
    setShowSignup(false);
    return { ok: true };
  }, []);

  const verifySignupOtp = useCallback(async (_code: string): Promise<AuthResult> => {
    // OTP disabled — no-op
    return { ok: true };
  }, []);

  const login = useCallback(async (username: string, _password: string): Promise<AuthResult> => {
    // Backend disabled — mock login locally
    setUser({ id: `local-${Date.now()}`, username });
    setShowSignup(false);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    // Backend disabled — clear user locally
    setUser(null);
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

  return {
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
    onboardingSelectedCommunityId,
    setOnboardingSelectedCommunityId,
    onboardingCompleted,
    completeOnboarding,
    resetOnboardingProgress,
    vote,
    requestSignupOtp,
    verifySignupOtp,
    login,
    logout,
  };
}
