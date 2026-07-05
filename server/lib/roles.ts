export const STAFF_TIERS = ["moderator", "admin", "owner", "super_admin"] as const;

export type StaffTier = (typeof STAFF_TIERS)[number];

export const TIER_RANK: Record<StaffTier, number> = {
  moderator: 1,
  admin: 2,
  owner: 3,
  super_admin: 4,
};

export function isStaffTier(value: unknown): value is StaffTier {
  return typeof value === "string" && (STAFF_TIERS as readonly string[]).includes(value);
}

// staff_tier is the portal's source of truth; role is kept for accounts created
// before tiers existed (and for compatibility with the main myraw.app checks).
export function resolveTier(user: { role?: string | null; staff_tier?: string | null }): StaffTier | null {
  if (isStaffTier(user.staff_tier)) return user.staff_tier;
  if (user.role === "admin") return "admin";
  if (user.role === "moderator") return "moderator";
  return null;
}

export function tierAtLeast(tier: StaffTier, minimum: StaffTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[minimum];
}

// The main myraw.app site only understands admin|moderator, so higher tiers
// are stored with role=admin there.
export function roleForTier(tier: StaffTier): "admin" | "moderator" {
  return tier === "moderator" ? "moderator" : "admin";
}
