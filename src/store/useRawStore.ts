import { useState, useCallback } from "react";

export interface User {
  id: string;
  username: string;
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

export function useRawStore() {
  const [user, setUser] = useState<User | null>(null);
  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [votedOptions, setVotedOptions] = useState<Record<string, string>>({});
  const [purchasedInsights, setPurchasedInsights] = useState<Set<string>>(new Set());
  const [showSignup, setShowSignup] = useState(false);
  const [avatarLevel, setAvatarLevel] = useState(1);

  const isLoggedIn = user !== null;
  const freeVotesUsed = votedPolls.size;

  const vote = useCallback(
    (pollId: string, optionId: string) => {
      if (!isLoggedIn && freeVotesUsed >= 3) {
        setShowSignup(true);
        return;
      }

      const poll = polls.find((p) => p.id === pollId);
      if (!poll) return;
      if (poll.locked && !isLoggedIn) {
        setShowSignup(true);
        return;
      }
      if (votedPolls.has(pollId)) return;

      setPolls((prev) =>
        prev.map((p) =>
          p.id === pollId
            ? {
                ...p,
                options: p.options.map((o) =>
                  o.id === optionId ? { ...o, votes: o.votes + 1 } : o
                ),
              }
            : p
        )
      );
      setVotedPolls((prev) => new Set(prev).add(pollId));
      setVotedOptions((prev) => ({ ...prev, [pollId]: optionId }));
    },
    [isLoggedIn, freeVotesUsed, polls, votedPolls]
  );

  const signup = useCallback((username: string, _password: string) => {
    setUser({ id: crypto.randomUUID(), username });
    setShowSignup(false);
  }, []);

  const purchaseInsight = useCallback((insightId: string) => {
    setPurchasedInsights((prev) => new Set(prev).add(insightId));
  }, []);

  return {
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
  };
}
