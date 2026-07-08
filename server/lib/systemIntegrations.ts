import { env } from "../config/env.js";

// Thin read-only clients for the System & Errors tab. Every helper degrades
// to { configured: false } when its env vars are missing so the portal can
// render a "not configured" state instead of failing.

export const isVercelConfigured = Boolean(env.VERCEL_TOKEN);

export type VercelDeployment = {
  uid: string;
  name: string;
  state: string;
  target: string | null;
  url: string | null;
  createdAt: number;
  errorMessage?: string | null;
};

export async function fetchVercelDeployments(limit = 15): Promise<
  { configured: false } | { configured: true; deployments: VercelDeployment[] } | { configured: true; error: string }
> {
  if (!env.VERCEL_TOKEN) return { configured: false };

  const params = new URLSearchParams({ limit: String(limit) });
  if (env.VERCEL_PROJECT_ID) params.set("projectId", env.VERCEL_PROJECT_ID);
  if (env.VERCEL_TEAM_ID) params.set("teamId", env.VERCEL_TEAM_ID);

  try {
    const response = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
      headers: { authorization: `Bearer ${env.VERCEL_TOKEN}` },
    });
    if (!response.ok) {
      return { configured: true, error: `vercel_api_${response.status}` };
    }
    const body = (await response.json()) as {
      deployments?: Array<{
        uid: string;
        name: string;
        state?: string;
        readyState?: string;
        target?: string | null;
        url?: string | null;
        createdAt?: number;
        created?: number;
        errorMessage?: string | null;
      }>;
    };
    const deployments = (body.deployments ?? []).map((deployment) => ({
      uid: deployment.uid,
      name: deployment.name,
      state: deployment.state ?? deployment.readyState ?? "UNKNOWN",
      target: deployment.target ?? null,
      url: deployment.url ?? null,
      createdAt: deployment.createdAt ?? deployment.created ?? 0,
      errorMessage: deployment.errorMessage ?? null,
    }));
    return { configured: true, deployments };
  } catch {
    return { configured: true, error: "vercel_api_unreachable" };
  }
}

export const supabaseProjectRef =
  env.SUPABASE_PROJECT_REF ?? (env.SUPABASE_URL ? new URL(env.SUPABASE_URL).hostname.split(".")[0] : "");

export const isSupabaseMgmtConfigured = Boolean(env.SUPABASE_MGMT_TOKEN);

export type SupabaseAdvisor = {
  name: string;
  title: string;
  level: string;
  description: string;
};

async function mgmtRequest<T>(path: string): Promise<T | { error: string }> {
  try {
    const response = await fetch(`https://api.supabase.com/v1${path}`, {
      headers: { authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}` },
    });
    if (!response.ok) return { error: `supabase_mgmt_${response.status}` };
    return (await response.json()) as T;
  } catch {
    return { error: "supabase_mgmt_unreachable" };
  }
}

export async function fetchSupabaseAdvisors(): Promise<
  { configured: false } | { configured: true; advisors: SupabaseAdvisor[] } | { configured: true; error: string }
> {
  if (!isSupabaseMgmtConfigured) return { configured: false };

  const results = await Promise.all([
    mgmtRequest<{ lints?: Array<{ name: string; title: string; level: string; detail?: string; description?: string }> }>(
      `/projects/${supabaseProjectRef}/advisors/security`,
    ),
    mgmtRequest<{ lints?: Array<{ name: string; title: string; level: string; detail?: string; description?: string }> }>(
      `/projects/${supabaseProjectRef}/advisors/performance`,
    ),
  ]);

  const advisors: SupabaseAdvisor[] = [];
  for (const result of results) {
    if ("error" in result) continue;
    for (const lint of result.lints ?? []) {
      advisors.push({
        name: lint.name,
        title: lint.title,
        level: lint.level,
        description: lint.description ?? lint.detail ?? "",
      });
    }
  }

  if (advisors.length === 0 && results.every((result) => "error" in result)) {
    return { configured: true, error: (results[0] as { error: string }).error };
  }
  return { configured: true, advisors };
}

export async function fetchSupabaseLogs(): Promise<
  { configured: false } | { configured: true; logs: Array<Record<string, unknown>> } | { configured: true; error: string }
> {
  if (!isSupabaseMgmtConfigured) return { configured: false };

  const sql =
    "select cast(timestamp as datetime) as ts, event_message, parsed.error_severity from postgres_logs" +
    " cross join unnest(metadata) as m cross join unnest(m.parsed) as parsed" +
    " where parsed.error_severity in ('ERROR','FATAL','PANIC') order by timestamp desc limit 50";
  const params = new URLSearchParams({ sql });
  const result = await mgmtRequest<{ result?: Array<Record<string, unknown>> }>(
    `/projects/${supabaseProjectRef}/analytics/endpoints/logs.all?${params}`,
  );
  if ("error" in result) return { configured: true, error: result.error };
  return { configured: true, logs: result.result ?? [] };
}
