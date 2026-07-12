import type { StaffTier } from "./roles.js";
import { resolveTier, tierAtLeast } from "./roles.js";
import { updateRows } from "./supabaseAdmin.js";

type TieredUser = {
  id: string;
  role: string;
  staff_tier: string | null;
};

export async function resolveSyncedTier(cookieTier: StaffTier, user: TieredUser): Promise<StaffTier | null> {
  const databaseTier = resolveTier(user);

  // A few live deployments minted owner/super-admin cookies before the
  // staff_tier column was fully synced back to Supabase. Without this small
  // one-time reconciliation, the UI can show a higher signed session tier while
  // protected data routes downgrade the same person to legacy `admin`, producing
  // blank panels with "Insufficient permissions". Only fill an empty tier for
  // existing admin/moderator accounts; explicit demotions keep a non-null
  // staff_tier or change role to user and therefore are not undone.
  if (user.staff_tier === null && databaseTier && tierAtLeast(cookieTier, databaseTier) && cookieTier !== databaseTier) {
    await updateRows("users", { id: `eq.${user.id}` }, { staff_tier: cookieTier });
    return cookieTier;
  }

  return databaseTier;
}
