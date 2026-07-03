export type AdminUser = {
  id: string;
  username: string;
  role: "admin" | "moderator";
  status: string;
};

export type ModerationAction = "warn" | "timeout" | "ban" | "unban";
export type StaffRole = "admin" | "moderator";

export type BlockedWordRecord = {
  id: string;
  term: string;
  normalizedTerm: string;
  createdAt: string;
  createdBy?: string | null;
};

export type DonationInterestRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: "pending" | "reviewed";
};

async function jsonRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "request_failed");
  return body;
}

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
  return body.user;
}

export async function logout(): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

export async function moderateUser(username: string, action: ModerationAction, minutes?: number): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/admin/moderate-user", {
    method: "POST",
    body: JSON.stringify({ username, action, minutes }),
  });
}

export async function createStaffAccount(username: string, password: string, role: StaffRole): Promise<void> {
  await jsonRequest<{ ok: true }>("/api/admin/create-staff-account", {
    method: "POST",
    body: JSON.stringify({ username, password, role }),
  });
}

export async function grantInviteCodes(username: string, count: number): Promise<string[]> {
  const body = await jsonRequest<{ codes: string[] }>("/api/admin/grant-invite-codes", {
    method: "POST",
    body: JSON.stringify({ username, count }),
  });
  return body.codes;
}

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
