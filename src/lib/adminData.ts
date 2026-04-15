export type UserRole = "member" | "admin";
export type ModerationStatus = "active" | "warned" | "banned";
export type CommunityRequestStatus = "pending" | "approved" | "rejected";
export type ChatReportStatus = "open" | "dismissed" | "warned" | "banned";

export interface PersistedUserRecord {
  id: string;
  username: string;
  role: UserRole;
  moderationStatus: ModerationStatus;
  warnings: number;
  createdAt: string;
  lastSeenAt: string;
  moderatedBy?: string;
  lastModeratedAt?: string;
}

export interface CommunityRequestRecord {
  id: string;
  requesterId: string;
  requesterName: string;
  communityName: string;
  focusArea: string;
  audience: string;
  whyNow: string;
  samplePrompt: string;
  submittedAt: string;
  status: CommunityRequestStatus;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ChatReportRecord {
  id: string;
  communityId: string;
  communityTitle: string;
  messageId: string;
  messageText: string;
  reportedUserId: string;
  reportedUsername: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  createdAt: string;
  status: ChatReportStatus;
  resolvedAt?: string;
  resolvedBy?: string;
}

const USER_STORAGE_KEY = "raw.users.v1";
const AUTH_SESSION_STORAGE_KEY = "raw.auth-session.v1";
export const COMMUNITY_REQUESTS_STORAGE_KEY = "raw.community-requests.v1";
export const CHAT_REPORTS_STORAGE_KEY = "raw.chat-reports.v1";

const ADMIN_USERNAMES = new Set(["admin", "rawadmin", "founder", "owner"]);

function readJsonArray<T>(storageKey: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(storageKey: string, entries: T[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(entries));
}

function normalizeUsernameKey(username: string): string {
  return username.trim().toLowerCase();
}

export function toUserId(username: string): string {
  return `user-${normalizeUsernameKey(username).replace(/[^a-z0-9_-]/g, "-")}`;
}

export function resolveUserRole(username: string): UserRole {
  return ADMIN_USERNAMES.has(normalizeUsernameKey(username)) ? "admin" : "member";
}

export function readPersistedUsers(): PersistedUserRecord[] {
  return readJsonArray<PersistedUserRecord>(USER_STORAGE_KEY);
}

export function writePersistedUsers(users: PersistedUserRecord[]): void {
  writeJsonArray(USER_STORAGE_KEY, users);
}

export function getPersistedUserById(userId: string): PersistedUserRecord | null {
  return readPersistedUsers().find((user) => user.id === userId) ?? null;
}

export function getPersistedUserByUsername(username: string): PersistedUserRecord | null {
  const normalized = normalizeUsernameKey(username);
  return readPersistedUsers().find((user) => normalizeUsernameKey(user.username) === normalized) ?? null;
}

export function registerOrUpdateUser(username: string, role?: UserRole): PersistedUserRecord {
  const users = readPersistedUsers();
  const normalizedUsername = username.trim();
  const userId = toUserId(normalizedUsername);
  const now = new Date().toISOString();
  const existing = users.find((user) => user.id === userId);

  const nextUser: PersistedUserRecord = {
    id: userId,
    username: normalizedUsername,
    role: existing?.role ?? role ?? resolveUserRole(normalizedUsername),
    moderationStatus: existing?.moderationStatus ?? "active",
    warnings: existing?.warnings ?? 0,
    createdAt: existing?.createdAt ?? now,
    lastSeenAt: now,
    moderatedBy: existing?.moderatedBy,
    lastModeratedAt: existing?.lastModeratedAt,
  };

  writePersistedUsers([nextUser, ...users.filter((user) => user.id !== userId)]);
  return nextUser;
}

export function ensureUserRecord(username: string): PersistedUserRecord {
  return getPersistedUserByUsername(username) ?? registerOrUpdateUser(username, "member");
}

export function updateUserModerationStatus(
  userId: string,
  status: ModerationStatus,
  moderatedBy: string,
  warningIncrement = 0,
): PersistedUserRecord | null {
  const users = readPersistedUsers();
  const targetUser = users.find((user) => user.id === userId);
  if (!targetUser) {
    return null;
  }

  const nextUser: PersistedUserRecord = {
    ...targetUser,
    moderationStatus: status,
    warnings: status === "warned" ? targetUser.warnings + Math.max(warningIncrement, 1) : targetUser.warnings,
    moderatedBy,
    lastModeratedAt: new Date().toISOString(),
  };

  writePersistedUsers([nextUser, ...users.filter((user) => user.id !== userId)]);
  return nextUser;
}

export function persistAuthSession(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, userId);
}

export function readAuthSession(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

export function readCommunityRequests(): CommunityRequestRecord[] {
  return readJsonArray<CommunityRequestRecord>(COMMUNITY_REQUESTS_STORAGE_KEY);
}

export function writeCommunityRequests(requests: CommunityRequestRecord[]): void {
  writeJsonArray(COMMUNITY_REQUESTS_STORAGE_KEY, requests);
}

export function readChatReports(): ChatReportRecord[] {
  return readJsonArray<ChatReportRecord>(CHAT_REPORTS_STORAGE_KEY);
}

export function writeChatReports(reports: ChatReportRecord[]): void {
  writeJsonArray(CHAT_REPORTS_STORAGE_KEY, reports);
}

export function formatAdminTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}