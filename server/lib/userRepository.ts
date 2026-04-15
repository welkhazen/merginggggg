import { env } from "../config/env";
import type { UserRecord } from "../types";
import {
  createUser,
  findUserById,
  findUserByUsername,
  phoneHashExists,
  updateUserPasswordHash,
  updateUserProfile,
  usernameExists,
  type UpdateUserProfileInput,
} from "./store";

type CreateUserInput = {
  username: string;
  passwordHash: string;
  phoneHash: string;
};

type UpdateProfileResult =
  | { status: "ok"; user: UserRecord }
  | { status: "not_found" | "username_taken" };

export interface UserRepository {
  findById(userId: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  usernameExists(username: string): Promise<boolean>;
  phoneHashExists(phoneHash: string): Promise<boolean>;
  create(input: CreateUserInput): Promise<UserRecord>;
  updateProfile(userId: string, updates: UpdateUserProfileInput): Promise<UpdateProfileResult>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<boolean>;
}

class MemoryUserRepository implements UserRepository {
  async findById(userId: string): Promise<UserRecord | null> {
    return findUserById(userId);
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    return findUserByUsername(username);
  }

  async usernameExists(username: string): Promise<boolean> {
    return usernameExists(username);
  }

  async phoneHashExists(userPhoneHash: string): Promise<boolean> {
    return phoneHashExists(userPhoneHash);
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    return createUser(input.username, input.passwordHash, input.phoneHash);
  }

  async updateProfile(userId: string, updates: UpdateUserProfileInput): Promise<UpdateProfileResult> {
    const result = updateUserProfile(userId, updates);
    if (result.status !== "ok" || !result.user) {
      return { status: result.status };
    }

    return { status: "ok", user: result.user };
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<boolean> {
    return updateUserPasswordHash(userId, passwordHash);
  }
}

type SupabaseUserRow = {
  id: string;
  username: string;
  password_hash: string;
  phone_hash: string;
  display_name: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  password_changed_at: string;
};

type RuntimeUserState = {
  votedPollIds: Set<string>;
};

class SupabaseUserRepository implements UserRepository {
  private readonly baseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly table: string;
  private readonly schema: string;
  private readonly runtimeStateByUserId = new Map<string, RuntimeUserState>();

  constructor() {
    this.baseUrl = env.SUPABASE_URL as string;
    this.serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY as string;
    this.table = env.SUPABASE_USERS_TABLE;
    this.schema = env.SUPABASE_SCHEMA;
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const rows = await this.selectRows(`id=eq.${encodeURIComponent(userId)}&limit=1`);
    return rows.length > 0 ? this.toUserRecord(rows[0]) : null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const rows = await this.selectRows(`username=eq.${encodeURIComponent(username)}&limit=1`);
    return rows.length > 0 ? this.toUserRecord(rows[0]) : null;
  }

  async usernameExists(username: string): Promise<boolean> {
    const rows = await this.selectRows(`username=eq.${encodeURIComponent(username)}&select=id&limit=1`);
    return rows.length > 0;
  }

  async phoneHashExists(phoneHash: string): Promise<boolean> {
    const rows = await this.selectRows(`phone_hash=eq.${encodeURIComponent(phoneHash)}&select=id&limit=1`);
    return rows.length > 0;
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const nowIso = new Date().toISOString();
    const rows = await this.query<SupabaseUserRow[]>("POST", "", {
      username: input.username,
      password_hash: input.passwordHash,
      phone_hash: input.phoneHash,
      display_name: null,
      bio: null,
      created_at: nowIso,
      updated_at: nowIso,
      password_changed_at: nowIso,
    });

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("Supabase create user failed.");
    }

    return this.toUserRecord(rows[0]);
  }

  async updateProfile(userId: string, updates: UpdateUserProfileInput): Promise<UpdateProfileResult> {
    const existing = await this.findById(userId);
    if (!existing) {
      return { status: "not_found" };
    }

    if (typeof updates.username === "string" && updates.username !== existing.username) {
      const taken = await this.usernameExists(updates.username);
      if (taken) {
        return { status: "username_taken" };
      }
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (Object.prototype.hasOwnProperty.call(updates, "username")) {
      payload.username = updates.username;
    }
    if (Object.prototype.hasOwnProperty.call(updates, "displayName")) {
      payload.display_name = updates.displayName ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(updates, "bio")) {
      payload.bio = updates.bio ?? null;
    }

    const rows = await this.query<SupabaseUserRow[]>("PATCH", `id=eq.${encodeURIComponent(userId)}`, payload);

    if (!Array.isArray(rows) || rows.length === 0) {
      return { status: "not_found" };
    }

    return { status: "ok", user: this.toUserRecord(rows[0]) };
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    const rows = await this.query<SupabaseUserRow[]>("PATCH", `id=eq.${encodeURIComponent(userId)}`, {
      password_hash: passwordHash,
      password_changed_at: nowIso,
      updated_at: nowIso,
    });

    return Array.isArray(rows) && rows.length > 0;
  }

  private async selectRows(filters: string): Promise<SupabaseUserRow[]> {
    const hasSelect = filters.includes("select=");
    const query = hasSelect ? filters : `${filters}&select=*`;
    const rows = await this.query<SupabaseUserRow[]>("GET", query);
    return Array.isArray(rows) ? rows : [];
  }

  private async query<T>(method: "GET" | "POST" | "PATCH", queryString: string, body?: Record<string, unknown>): Promise<T> {
    const queryPrefix = queryString.length > 0 ? `?${queryString}` : "";
    const url = `${this.baseUrl}/rest/v1/${this.table}${queryPrefix}`;
    const response = await fetch(url, {
      method,
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        "Accept-Profile": this.schema,
        "Content-Profile": this.schema,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const reason = await response.text();
      throw new Error(`Supabase query failed (${response.status}): ${reason}`);
    }

    return (await response.json()) as T;
  }

  private toUserRecord(row: SupabaseUserRow): UserRecord {
    const state = this.ensureRuntimeState(row.id);

    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      createdAt: Date.parse(row.created_at),
      updatedAt: Date.parse(row.updated_at),
      passwordChangedAt: Date.parse(row.password_changed_at),
      passwordHash: row.password_hash,
      phoneHash: row.phone_hash,
      votedPollIds: state.votedPollIds,
    };
  }

  private ensureRuntimeState(userId: string): RuntimeUserState {
    const existing = this.runtimeStateByUserId.get(userId);
    if (existing) {
      return existing;
    }

    const state: RuntimeUserState = {
      votedPollIds: new Set<string>(),
    };

    this.runtimeStateByUserId.set(userId, state);
    return state;
  }
}

let repository: UserRepository | null = null;

function shouldUseSupabaseRepository(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getUserRepository(): UserRepository {
  if (repository) {
    return repository;
  }

  repository = shouldUseSupabaseRepository() ? new SupabaseUserRepository() : new MemoryUserRepository();
  return repository;
}
