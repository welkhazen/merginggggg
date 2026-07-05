import { env } from "../config/env";

export const isPostHogQueryConfigured = Boolean(env.POSTHOG_PERSONAL_API_KEY && env.POSTHOG_PROJECT_ID);

// Private API lives on the app host (us.posthog.com), not the ingestion host
// (us.i.posthog.com) used by the client SDK.
function privateApiHost(): string {
  const host = env.POSTHOG_HOST ?? "https://us.i.posthog.com";
  return host.replace("//us.i.", "//us.").replace("//eu.i.", "//eu.");
}

export async function runHogQL(query: string): Promise<
  { configured: false } | { configured: true; columns: string[]; results: unknown[][] } | { configured: true; error: string }
> {
  if (!isPostHogQueryConfigured) return { configured: false };

  try {
    const response = await fetch(`${privateApiHost()}/api/projects/${env.POSTHOG_PROJECT_ID}/query/`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    });
    if (!response.ok) {
      return { configured: true, error: `posthog_api_${response.status}` };
    }
    const body = (await response.json()) as { columns?: string[]; results?: unknown[][] };
    return { configured: true, columns: body.columns ?? [], results: body.results ?? [] };
  } catch {
    return { configured: true, error: "posthog_api_unreachable" };
  }
}
