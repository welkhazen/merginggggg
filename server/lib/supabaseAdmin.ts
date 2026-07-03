import { env } from "../config/env";

type QueryValue = string | number | boolean | null | undefined;

export class SupabaseAdminError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    ...extra,
  };
}

function queryString(params: Record<string, QueryValue>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? (JSON.parse(text) as { message?: string; code?: string }) : null;
  if (!response.ok) {
    throw new SupabaseAdminError(body?.message ?? body?.code ?? "supabase_request_failed", response.status);
  }
  return body as T;
}

export async function rpc<T>(name: string, payload: Record<string, unknown>): Promise<T> {
  return parseResponse<T>(
    await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }),
  );
}

export async function selectRows<T>(table: string, params: Record<string, QueryValue> = {}): Promise<T[]> {
  return parseResponse<T[]>(
    await fetch(`${env.SUPABASE_URL}/rest/v1/${table}${queryString(params)}`, {
      headers: headers(),
    }),
  );
}

export async function insertRow<T>(table: string, payload: Record<string, unknown>): Promise<T> {
  const rows = await parseResponse<T[]>(
    await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: headers({ prefer: "return=representation" }),
      body: JSON.stringify(payload),
    }),
  );
  return rows[0];
}

export async function updateRows<T>(
  table: string,
  params: Record<string, QueryValue>,
  payload: Record<string, unknown>,
): Promise<T[]> {
  return parseResponse<T[]>(
    await fetch(`${env.SUPABASE_URL}/rest/v1/${table}${queryString(params)}`, {
      method: "PATCH",
      headers: headers({ prefer: "return=representation" }),
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteRows(table: string, params: Record<string, QueryValue>): Promise<void> {
  await parseResponse<unknown>(
    await fetch(`${env.SUPABASE_URL}/rest/v1/${table}${queryString(params)}`, {
      method: "DELETE",
      headers: headers(),
    }),
  );
}
