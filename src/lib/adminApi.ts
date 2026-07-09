import { isPostHogEnabled, posthog } from "@/lib/analytics";

export type StaffTier = "moderator" | "admin" | "owner" | "super_admin";

export const STAFF_TIERS: StaffTier[] = ["moderator", "admin", "owner", "super_admin"];

export const TIER_RANK: Record<StaffTier, number> = {
  moderator: 1,
  admin: 2,
  owner: 3,
  super_admin: 4,
};

export function tierAtLeast(tier: StaffTier | null | undefined, minimum: StaffTier): boolean {
  return Boolean(tier && TIER_RANK[tier] >= TIER_RANK[minimum]);
}

export const TIER_LABELS: Record<StaffTier, string> = {
  moderator: "Moderator",
  admin: "Admin",
  owner: "Owner",
  super_admin: "Super admin",
};

export type AdminUser = {
  id: string;
  username: string;
  role: string;
  tier: StaffTier;
  status: string;
};

export type ModerationAction = "warn" | "timeout" | "ban" | "unban";

export type DashboardStats = {
  totalUsers: number;
  bannedUsers: number;
  newUsers7d: number;
  openReports: number;
  unreviewedFlags: number;
  pendingCommunityRequests: number;
  pendingDonations: number;
  pendingTokenRequests: number;
  pendingWaitlist: number;
  pendingAppeals: number;
  openErrors: number;
  totalCommunities: number;
  lockedCommunities: number;
};

export type CommunitySummary = {
  id: string;
  abbr: string | null;
  title: string;
  topic: string | null;
  status: string | null;
  locked: boolean;
  createdAt: string;
  memberCount: number;
};

export type CommunityMessage = {
  id: string;
  communityId: string;
  senderId: string | null;
  senderName: string | null;
  text: string;
  createdAt: string;
  isDeleted: boolean;
  deletedBy: string | null;
  deletedReason: string | null;
  moderationStatus: string | null;
  replyToSenderName: string | null;
  replyToText: string | null;
};

export type SendCommunityMessageInput = {
  text: string;
  replyToMessageId?: string;
};

export type CommunityMember = {
  userId: string;
  username: string | null;
  joinedAt: string | null;
  lastSeenAt: string | null;
};

export type ChatReport = {
  id: string;
  communityId: string | null;
  communityTitle: string | null;
  messageId: string | null;
  messageText: string | null;
  reporterId: string | null;
  reporterName: string | null;
  reportedUserId: string | null;
  reportedUsername: string | null;
  reason: string | null;
  details: string | null;
  status: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
};

export type ModerationFlag = {
  id: string;
  messageId: string | null;
  communityId: string | null;
  senderId: string | null;
  senderName: string | null;
  matchedWord: string | null;
  reason: string | null;
  verdict: string | null;
  aiScore: number | null;
  reviewed: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type ManagedUser = {
  id: string;
  username: string;
  role: string;
  tier: StaffTier | null;
  status: string;
  warnings: number;
  moderationStatus: string | null;
  bannedUntil: string | null;
  tokenBalance: number;
  avatarLevel: number;
  spamStrikes: number;
  createdAt: string;
  lastSeenAt: string | null;
  lastModeratedAt: string | null;
};

export type UserDetail = {
  user: ManagedUser;
  safetyScore: { score: number; total_flags: number; total_reports_against: number; total_actions: number } | null;
  actions: Array<{
    id: string;
    action: string;
    reason: string | null;
    actorId: string;
    communityId: string | null;
    expiresAt: string | null;
    createdAt: string;
  }>;
  appeals: Array<{ id: string; text: string; status: string; reviewedBy: string | null; createdAt: string }>;
};

export type Appeal = {
  id: string;
  userId: string;
  actionId: string | null;
  text: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type CommunityRequest = {
  id: string;
  requesterId: string | null;
  requesterName: string | null;
  communityName: string;
  genre: string | null;
  focusArea: string | null;
  audience: string | null;
  whyNow: string | null;
  samplePrompt: string | null;
  submittedAt: string;
  status: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

export type DonationInterestRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: "pending" | "reviewed";
};

export type TokenRequest = {
  id: string;
  userId: string | null;
  username: string | null;
  tokens: number | null;
  priceUsd: number | null;
  reasons: string[];
  note: string | null;
  status: string;
  createdAt: string;
};

export type BlockedWordRecord = {
  id: string;
  term: string;
  normalizedTerm: string;
  createdAt: string;
  createdBy?: string | null;
};

export type BannedWordRecord = {
  id: string;
  word: string;
  normalizedWord: string;
  action: string | null;
  category: string | null;
  addedBy: string | null;
  createdAt: string;
};

export type InviteRedemption = {
  id: string;
  inviterId: string | null;
  code: string;
  redeemedBy: string | null;
  redeemedUsername: string | null;
  createdAt: string;
};

export type WaitlistRequestStatus = "pending" | "contacted" | "sent_code" | "closed";

export type WaitlistRequest = {
  id: string;
  contact: string;
  note: string;
  source: string;
  submittedAt: string;
  status: WaitlistRequestStatus;
};

export type StaffMember = {
  id: string;
  username: string;
  role: string;
  tier: StaffTier | null;
  status: string;
  createdAt: string;
  lastSeenAt: string | null;
};

export type AuditEntry = {
  id: string;
  actorId: string;
  actorUsername: string | null;
  actorTier: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type HogQLResult =
  | { configured: false }
  | { configured: true; columns: string[]; results: unknown[][] }
  | { configured: true; error: string };

export type AnalyticsSummary =
  | { configured: false }
  | { configured: true; topEvents: HogQLResult; dailyUsers: HogQLResult; adminActivity: HogQLResult };

export type SystemStatus = {
  integrations: {
    vercel: boolean;
    supabaseMgmt: boolean;
    resendCrashAlerts: boolean;
    posthogQuery: boolean;
  };
  supabaseProjectRef: string;
};

export type ErrorEvent = {
  id: string;
  source: string;
  level: string;
  message: string;
  stack: string | null;
  context: Record<string, unknown>;
  createdAt: string;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
};

export type VercelStatus =
  | { configured: false }
  | { configured: true; error: string }
  | {
      configured: true;
      deployments: Array<{
        uid: string;
        name: string;
        state: string;
        target: string | null;
        url: string | null;
        createdAt: number;
        errorMessage?: string | null;
      }>;
    };

export type SupabaseStatus = {
  advisors:
    | { configured: false }
    | { configured: true; advisors: Array<{ name: string; title: string; level: string; description: string }> }
    | { configured: true; error: string };
  logs:
    | { configured: false }
    | { configured: true; logs: Array<Record<string, unknown>> }
    | { configured: true; error: string };
};

async function jsonRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const analyticsHeaders: Record<string, string> = {};
  if (isPostHogEnabled) {
    analyticsHeaders["x-posthog-distinct-id"] = posthog.get_distinct_id();
    const sessionId = posthog.get_session_id();
    if (sessionId) analyticsHeaders["x-posthog-session-id"] = sessionId;
  }

  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...analyticsHeaders,
      ...(init.headers ?? {}),
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "request_failed");
  return body;
}

// --- Auth ---

export async function getSession(): Promise<AdminUser | null> {
  try {
    const body = await jsonRequest<{ user: AdminUser }>("/api/auth/me");
    return body.user;
  } catch {
    return null;
  }
}

export async function login(username: string, password: string): Promise<AdminUser> {
  const body = await jsonRequest<{ user: AdminUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  // A stale static deployment can answer 200 with index.html; jsonRequest
  // then yields an empty body. Treat it as a broken API, not a success.
  if (!body?.user) throw new Error("api_unavailable");
  return body.user;
}

export async function logout(): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

// --- Overview ---

export async function fetchStats(): Promise<DashboardStats> {
  const body = await jsonRequest<{ stats: DashboardStats }>("/api/admin/stats");
  return body.stats;
}

// --- Communities ---

export async function fetchCommunities(): Promise<CommunitySummary[]> {
  const body = await jsonRequest<{ communities: CommunitySummary[] }>("/api/admin/communities");
  return body.communities;
}

export async function updateCommunity(id: string, updates: { locked?: boolean; status?: string }): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/communities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteCommunity(id: string): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/communities/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchCommunityMessages(
  id: string,
  filter: "all" | "deleted" | "flagged" = "all",
): Promise<CommunityMessage[]> {
  const body = await jsonRequest<{ messages: CommunityMessage[] }>(
    `/api/admin/communities/${encodeURIComponent(id)}/messages?filter=${filter}`,
  );
  return body.messages;
}

export async function sendCommunityMessage(id: string, input: SendCommunityMessageInput): Promise<CommunityMessage> {
  const body = await jsonRequest<{ message: CommunityMessage }>(
    `/api/admin/communities/${encodeURIComponent(id)}/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return body.message;
}

export async function fetchCommunityMembers(id: string): Promise<CommunityMember[]> {
  const body = await jsonRequest<{ members: CommunityMember[] }>(
    `/api/admin/communities/${encodeURIComponent(id)}/members`,
  );
  return body.members;
}

export async function deleteCommunityMessage(id: string, reason?: string): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/messages/${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
}

// --- Reports & flags ---

export async function fetchReports(status: "open" | "closed" | "all" = "open"): Promise<ChatReport[]> {
  const body = await jsonRequest<{ reports: ChatReport[] }>(`/api/admin/reports?status=${status}`);
  return body.reports;
}

export async function resolveReport(id: string, status: "resolved" | "dismissed"): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/reports/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchFlags(reviewed: "true" | "false" | "all" = "false"): Promise<ModerationFlag[]> {
  const body = await jsonRequest<{ flags: ModerationFlag[] }>(`/api/admin/flags?reviewed=${reviewed}`);
  return body.flags;
}

export async function reviewFlag(id: string, verdict?: "violation" | "ok" | "unclear"): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/flags/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ verdict }),
  });
}

// --- Users ---

export async function fetchUsers(options: { q?: string; status?: string; limit?: number; offset?: number } = {}): Promise<ManagedUser[]> {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  if (options.status) params.set("status", options.status);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));
  const body = await jsonRequest<{ users: ManagedUser[] }>(`/api/admin/users?${params}`);
  return body.users;
}

export async function searchUsers(q: string, limit: number = 8): Promise<ManagedUser[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  const body = await jsonRequest<{ users: ManagedUser[] }>(`/api/admin/users/search?${params}`);
  return body.users;
}

export async function fetchUserDetail(id: string): Promise<UserDetail> {
  return jsonRequest<UserDetail>(`/api/admin/users/${encodeURIComponent(id)}`);
}

export async function moderateUser(
  username: string,
  action: ModerationAction,
  minutes?: number,
  reason?: string,
): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/admin/moderate-user", {
    method: "POST",
    body: JSON.stringify({ username, action, minutes, reason }),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchAppeals(status: "pending" | "approved" | "denied" | "all" = "pending"): Promise<Appeal[]> {
  const body = await jsonRequest<{ appeals: Appeal[] }>(`/api/admin/appeals?status=${status}`);
  return body.appeals;
}

export async function reviewAppeal(id: string, status: "approved" | "denied"): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/appeals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// --- Community requests ---

export async function fetchCommunityRequests(
  status: "pending" | "approved" | "rejected" | "all" = "pending",
): Promise<CommunityRequest[]> {
  const body = await jsonRequest<{ requests: CommunityRequest[] }>(`/api/admin/community-requests?status=${status}`);
  return body.requests;
}

export async function reviewCommunityRequest(id: string, status: "approved" | "rejected"): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/community-requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// --- Donations & tokens ---

export async function fetchDonationInterests(): Promise<DonationInterestRecord[]> {
  const body = await jsonRequest<{ requests: DonationInterestRecord[] }>("/api/admin/donation-interests");
  return body.requests;
}

export async function updateDonationInterestStatus(id: string, status: "pending" | "reviewed"): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/admin/donation-interests", {
    method: "PATCH",
    body: JSON.stringify({ id, status }),
  });
}

export async function deleteDonationInterest(id: string): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/admin/donation-interests", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

export async function fetchTokenRequests(status: string = "all"): Promise<TokenRequest[]> {
  const body = await jsonRequest<{ tokenRequests: TokenRequest[] }>(`/api/admin/token-requests?status=${status}`);
  return body.tokenRequests;
}

export async function updateTokenRequest(
  id: string,
  status: "pending" | "approved" | "rejected",
  tokens?: number,
): Promise<void> {
  const payload: { status: "pending" | "approved" | "rejected"; tokens?: number } = { status };
  if (tokens !== undefined) payload.tokens = tokens;

  await jsonRequest<{ ok: true }>(`/api/admin/token-requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// --- Word filters ---

export async function fetchBlockedWords(): Promise<BlockedWordRecord[]> {
  const body = await jsonRequest<{ blockedWords: BlockedWordRecord[] }>("/api/admin/blocked-words");
  return body.blockedWords;
}

export async function addBlockedWord(term: string): Promise<BlockedWordRecord> {
  const body = await jsonRequest<{ blockedWord: BlockedWordRecord }>("/api/admin/blocked-words", {
    method: "POST",
    body: JSON.stringify({ term }),
  });
  return body.blockedWord;
}

export async function removeBlockedWord(id: string): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/admin/blocked-words", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

export async function fetchBannedWords(): Promise<BannedWordRecord[]> {
  const body = await jsonRequest<{ bannedWords: BannedWordRecord[] }>("/api/admin/banned-words");
  return body.bannedWords;
}

export async function addBannedWord(
  word: string,
  action: "block" | "flag" | "shadow",
  category?: string,
): Promise<BannedWordRecord> {
  const body = await jsonRequest<{ bannedWord: BannedWordRecord }>("/api/admin/banned-words", {
    method: "POST",
    body: JSON.stringify({ word, action, category }),
  });
  return body.bannedWord;
}

export async function removeBannedWord(id: string): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/admin/banned-words", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

// --- Invites ---

export async function grantInviteCodes(username: string, count: number): Promise<string[]> {
  const body = await jsonRequest<{ codes: string[] }>("/api/admin/grant-invite-codes", {
    method: "POST",
    body: JSON.stringify({ username, count }),
  });
  return body.codes;
}

export async function fetchInviteRedemptions(): Promise<InviteRedemption[]> {
  const body = await jsonRequest<{ redemptions: InviteRedemption[] }>("/api/admin/invite-redemptions");
  return body.redemptions;
}

export async function fetchWaitlistRequests(
  status: WaitlistRequestStatus | "all" = "pending",
): Promise<WaitlistRequest[]> {
  const body = await jsonRequest<{ requests: WaitlistRequest[] }>(`/api/admin/waitlist-requests?status=${status}`);
  return body.requests;
}

export async function updateWaitlistRequest(id: string, status: WaitlistRequestStatus): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/waitlist-requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// --- Staff ---

export async function fetchStaff(): Promise<StaffMember[]> {
  const body = await jsonRequest<{ staff: StaffMember[] }>("/api/admin/staff");
  return body.staff;
}

export async function createStaffAccount(username: string, password: string, tier: StaffTier): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/admin/create-staff-account", {
    method: "POST",
    body: JSON.stringify({ username, password, tier }),
  });
}

export async function updateStaffTier(userId: string, tier: StaffTier | null): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/admin/staff/tier", {
    method: "PATCH",
    body: JSON.stringify({ userId, tier }),
  });
}

// --- Audit log ---

export async function fetchAuditLog(options: { action?: string; actor?: string; limit?: number; offset?: number } = {}): Promise<AuditEntry[]> {
  const params = new URLSearchParams();
  if (options.action) params.set("action", options.action);
  if (options.actor) params.set("actor", options.actor);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));
  const body = await jsonRequest<{ entries: AuditEntry[] }>(`/api/admin/audit-log?${params}`);
  return body.entries;
}

// --- Analytics ---

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return jsonRequest<AnalyticsSummary>("/api/admin/analytics/summary");
}

// --- System & errors ---

export async function fetchSystemStatus(): Promise<SystemStatus> {
  return jsonRequest<SystemStatus>("/api/admin/system/status");
}

export async function fetchErrorEvents(
  resolved: "true" | "false" | "all" = "false",
  source: string = "all",
): Promise<ErrorEvent[]> {
  const body = await jsonRequest<{ errors: ErrorEvent[] }>(
    `/api/admin/system/errors?resolved=${resolved}&source=${source}`,
  );
  return body.errors;
}

export async function setErrorResolved(id: string, resolved: boolean): Promise<void> {
  await jsonRequest<{ ok: true }>(`/api/admin/system/errors/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ resolved }),
  });
}

export async function fetchVercelStatus(): Promise<VercelStatus> {
  return jsonRequest<VercelStatus>("/api/admin/system/vercel");
}

export async function fetchSupabaseStatus(): Promise<SupabaseStatus> {
  return jsonRequest<SupabaseStatus>("/api/admin/system/supabase");
}

// --- Crash reporting (no auth required) ---

export async function reportClientError(message: string, stack?: string, context?: Record<string, unknown>): Promise<void> {
  try {
    await jsonRequest<{ ok: true }>("/api/errors/report", {
      method: "POST",
      body: JSON.stringify({ source: "client", level: "error", message, stack, context }),
    });
  } catch {
    // Reporting must never throw.
  }
}
