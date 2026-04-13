import type { AuthSessionData, BootstrapResponse, Poll, User, UserRecord } from "../types";

const polls: Poll[] = [
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

const usersById = new Map<string, UserRecord>();
const userIdByUsername = new Map<string, string>();
const userIdByPhoneHash = new Map<string, string>();

function normalizeUsername(username: string): string {
  return username.toLowerCase();
}

export function findUserById(userId: string): UserRecord | null {
  return usersById.get(userId) ?? null;
}

export function findUserByUsername(username: string): UserRecord | null {
  const userId = userIdByUsername.get(normalizeUsername(username));
  return userId ? usersById.get(userId) ?? null : null;
}

export function findUserByPhoneHash(phoneHash: string): UserRecord | null {
  const userId = userIdByPhoneHash.get(phoneHash);
  return userId ? usersById.get(userId) ?? null : null;
}

export function createUser(username: string, passwordHash: string, phoneHash: string): UserRecord {
  const id = crypto.randomUUID();
  const user: UserRecord = {
    id,
    username,
    passwordHash,
    phoneHash,
    votedPollIds: new Set<string>(),
    createdAt: Date.now(),
  };

  usersById.set(id, user);
  userIdByUsername.set(normalizeUsername(username), id);
  userIdByPhoneHash.set(phoneHash, id);
  return user;
}

export function usernameExists(username: string): boolean {
  return userIdByUsername.has(normalizeUsername(username));
}

export function phoneHashExists(phoneHash: string): boolean {
  return userIdByPhoneHash.has(phoneHash);
}

function clonePolls(): Poll[] {
  return polls.map((poll) => ({
    ...poll,
    options: poll.options.map((option) => ({ ...option })),
  }));
}

export function getAnonymousVotes(sessionData: AuthSessionData): string[] {
  if (!Array.isArray(sessionData.anonymousVotes)) {
    sessionData.anonymousVotes = [];
  }

  return sessionData.anonymousVotes;
}

export function buildBootstrap(user: UserRecord | null, sessionData: AuthSessionData): BootstrapResponse {
  const votedPollIds = user ? [...user.votedPollIds] : getAnonymousVotes(sessionData);

  return {
    user: user ? toPublicUser(user) : null,
    isLoggedIn: Boolean(user),
    polls: clonePolls(),
    votedPollIds,
    freeVotesUsed: votedPollIds.length,
  };
}

export function toPublicUser(user: UserRecord): User {
  return {
    id: user.id,
    username: user.username,
  };
}

export function canVote(user: UserRecord | null, sessionData: AuthSessionData, pollId: string) {
  if (user) {
    if (user.votedPollIds.has(pollId)) {
      return { ok: false, reason: "already_voted" as const };
    }

    return { ok: true as const };
  }

  const anonVotes = getAnonymousVotes(sessionData);
  if (anonVotes.includes(pollId)) {
    return { ok: false, reason: "already_voted" as const };
  }

  if (anonVotes.length >= 3) {
    return { ok: false, reason: "auth_required" as const };
  }

  return { ok: true as const };
}

export function applyVote(user: UserRecord | null, sessionData: AuthSessionData, pollId: string, optionId: string): boolean {
  const poll = polls.find((item) => item.id === pollId);
  if (!poll) {
    return false;
  }

  const option = poll.options.find((item) => item.id === optionId);
  if (!option) {
    return false;
  }

  option.votes += 1;

  if (user) {
    user.votedPollIds.add(pollId);
  } else {
    getAnonymousVotes(sessionData).push(pollId);
  }

  return true;
}
