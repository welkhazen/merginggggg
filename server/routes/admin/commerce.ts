import { Router } from "express";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../../lib/analytics";
import { writeAudit } from "../../lib/audit";
import { deleteRows, selectRows, updateRows } from "../../lib/supabaseAdmin";
import { adminSession } from "../../middleware/adminAuth";

type DonationInterestRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  submitted_at: string;
  status: "pending" | "reviewed";
};

type TokenRequestRow = {
  id: string;
  user_id: string | null;
  username: string | null;
  price_usd: number | null;
  reasons: string[] | null;
  note: string | null;
  status: string;
  created_at: string;
};

const idSchema = z.object({ id: z.string().uuid() });

const donationStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "reviewed"]),
});

const tokenStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

function mapDonation(row: DonationInterestRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    submittedAt: row.submitted_at,
    status: row.status,
  };
}

export const commerceRouter = Router();

// Donation interests keep their original paths/shapes.
commerceRouter.get("/donation-interests", async (_req, res) => {
  const rows = await selectRows<DonationInterestRow>("donation_interests", {
    select: "id,name,email,phone,submitted_at,status",
    order: "submitted_at.desc",
  });
  return res.status(200).json({ requests: rows.map(mapDonation) });
});

commerceRouter.patch("/donation-interests", async (req, res) => {
  const parsed = donationStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  await updateRows("donation_interests", { id: `eq.${parsed.data.id}` }, { status: parsed.data.status });
  const session = adminSession(res);
  writeAudit(session, {
    action: "donation_interest_updated",
    targetType: "donation_interest",
    targetId: parsed.data.id,
    details: { status: parsed.data.status },
  });
  captureServerEvent(req, "admin_donation_interest_status_updated_server", getPostHogDistinctId(req, session.userId), {
    status: parsed.data.status,
  });
  return res.status(200).json({ ok: true });
});

commerceRouter.delete("/donation-interests", async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  await deleteRows("donation_interests", { id: `eq.${parsed.data.id}` });
  const session = adminSession(res);
  writeAudit(session, {
    action: "donation_interest_deleted",
    targetType: "donation_interest",
    targetId: parsed.data.id,
  });
  captureServerEvent(req, "admin_donation_interest_deleted_server", getPostHogDistinctId(req, session.userId));
  return res.status(200).json({ ok: true });
});

commerceRouter.get("/token-requests", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "all";
  const params: Record<string, string | number> = {
    select: "id,user_id,username,price_usd,reasons,note,status,created_at",
    order: "created_at.desc",
    limit: 100,
  };
  if (status !== "all") params.status = `eq.${status}`;

  const rows = await selectRows<TokenRequestRow>("token_requests", params);
  return res.status(200).json({
    tokenRequests: rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      priceUsd: row.price_usd,
      reasons: row.reasons ?? [],
      note: row.note,
      status: row.status,
      createdAt: row.created_at,
    })),
  });
});

commerceRouter.patch("/token-requests/:id", async (req, res) => {
  const parsed = tokenStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const rows = await updateRows<TokenRequestRow>(
    "token_requests",
    { id: `eq.${req.params.id}` },
    { status: parsed.data.status },
  );
  if (rows.length === 0) return res.status(404).json({ error: "token_request_not_found" });

  writeAudit(adminSession(res), {
    action: "token_request_updated",
    targetType: "token_request",
    targetId: req.params.id,
    targetLabel: rows[0].username ?? undefined,
    details: { status: parsed.data.status },
  });
  return res.status(200).json({ ok: true });
});
