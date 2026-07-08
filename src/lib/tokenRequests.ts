const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export type TokenRequestInput = {
  userId?: string | null;
  username?: string | null;
  tokens: number;
  priceUsd: number;
  reasons: string[];
  note?: string | null;
};

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export async function submitTokenRequest(input: TokenRequestInput): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Token requests are not configured right now.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/token_requests`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: isUuid(input.userId) ? input.userId : null,
      username: input.username?.trim() || null,
      tokens: input.tokens,
      price_usd: input.priceUsd,
      reasons: input.reasons,
      note: input.note?.trim() || null,
      status: "pending",
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Could not submit token request.");
  }
}
