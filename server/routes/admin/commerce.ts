import { Router } from "express";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../../lib/analytics.js";
import { writeAudit } from "../../lib/audit.js";
import { deleteRows, rpc, selectRows, SupabaseAdminError, updateRows } from "../../lib/supabaseAdmin.js";
import { adminSession } from "../../middleware/adminAuth.js";

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
  tokens: number | null;
  price_usd: number | null;
  reasons: string[] | null;
  note: string | null;
  status: string;
  created_at: string;
};

type TokenRequestRowWithoutTokens = Omit<TokenRequestRow, "tokens">;

const idSchema = z.object({ id: z.string().uuid() });

const donationStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "reviewed"]),
});

const tokenStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  tokens: z.number().int().positive().max(100000).optional(),
  tokenAmount: z.number().int().positive().max(100000).optional(),
});

function parseRequestedTokens(row: Pick<TokenRequestRow, "reasons" | "note">): number | null {
  const text = [...(row.reasons ?? []), row.note ?? ""].join(" ");
  const match = text.match(/\b(\d+)\s+tokens?\b/i);
  if (!match) return null;

  const amount = Number(match[1]);
  return Number.isInteger(amount) && amount > 0 ? amount : null;
}

function tokenApprovalErrorResponse(error: unknown): { error: string; status: number } | null {
  if (!(error instanceof SupabaseAdminError)) return null;
  if (error.message === "token_request_not_found") return { error: error.message, status: 404 };
  if (error.message === "token_request_already_reviewed") return { error: error.message, status: 409 };
  if (
    error.message === "token_amount_required" ||
    error.message === "token_request_missing_user" ||
    error.message === "user_not_found"
  ) {
    return { error: error.message, status: 400 };
  }
  return null;
}

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

function mapTokenRequest(row: TokenRequestRow | TokenRequestRowWithoutTokens) {
  const status = row.status === "new" ? "pending" : row.status === "fulfilled" ? "approved" : row.status;

  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    tokens: "tokens" in row ? row.tokens : null,
    priceUsd: row.price_usd,
    reasons: row.reasons ?? [],
    note: row.note,
    status,
    createdAt: row.created_at,
  };
}

function tokenRequestStatusFilter(status: string): string | undefined {
  if (status === "pending") return "in.(pending,new)";
  if (status === "approved") return "in.(approved,fulfilled)";
  if (status === "new") return "eq.new";
  if (status === "all") return undefined;
  return `eq.${status}`;
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
  await writeAudit(session, {
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
  await writeAudit(session, {
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
    select: "id,user_id,username,tokens,price_usd,reasons,note,status,created_at",
    order: "created_at.desc",
    limit: 100,
  };
  const statusFilter = tokenRequestStatusFilter(status);
  if (statusFilter) params.status = statusFilter;

  let rows: Array<TokenRequestRow | TokenRequestRowWithoutTokens>;
  try {
    rows = await selectRows<TokenRequestRow>("token_requests", params);
  } catch (error) {
    if (!(error instanceof SupabaseAdminError) || !error.message.includes("token_requests.tokens")) throw error;
    rows = await selectRows<TokenRequestRowWithoutTokens>("token_requests", {
      ...params,
      select: "id,user_id,username,price_usd,reasons,note,status,created_at",
    });
  }

  return res.status(200).json({
    tokenRequests: rows.map(mapTokenRequest),
  });
});

commerceRouter.patch("/token-requests/:id", async (req, res) => {
  const parsed = tokenStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });
  const requestedTokenAmount = parsed.data.tokens ?? parsed.data.tokenAmount;
  if (requestedTokenAmount !== undefined && parsed.data.status !== "approved") {
    return res.status(400).json({ error: "tokens_only_allowed_on_approval" });
  }

  const requestRows = await selectRows<TokenRequestRow>("token_requests", {
    select: "id,user_id,username,price_usd,reasons,note,status,created_at",
    id: `eq.${req.params.id}`,
    limit: 1,
  });
  const requestRow = requestRows[0];
  if (!requestRow) return res.status(404).json({ error: "token_request_not_found" });
  if (!["pending", "new"].includes(requestRow.status) && ["approved", "rejected"].includes(parsed.data.status)) {
    return res.status(409).json({ error: "token_request_already_reviewed" });
  }

  let rows: TokenRequestRow[];
  let creditedTokens: number | undefined;
  if (parsed.data.status === "approved") {
    const tokenAmount = requestedTokenAmount ?? parseRequestedTokens(requestRow);
    if (!tokenAmount) return res.status(400).json({ error: "token_amount_required" });

    if (requestRow.status === "new") {
      await updateRows<TokenRequestRow>("token_requests", { id: `eq.${req.params.id}` }, { status: "pending" });
    }

    let approvedRows: Array<{ id: string; username: string | null; credited_tokens: number }>;
    try {
      approvedRows = await rpc<Array<{ id: string; username: string | null; credited_tokens: number }>>(
        "approve_token_request_atomic",
        {
          p_request_id: req.params.id,
          p_token_amount: tokenAmount,
        },
      );
    } catch (error) {
      if (error instanceof SupabaseAdminError && error.message === "user_not_found") {
        approvedRows = await updateRows<Array<{ id: string; username: string | null; credited_tokens: number }>[number]>(
          "token_requests",
          { id: `eq.${req.params.id}`, status: "in.(pending,new)" },
          { tokens: tokenAmount, status: "fulfilled" },
        ).then((updatedRows) =>
          updatedRows.map((row) => ({
            id: row.id,
            username: row.username,
            credited_tokens: tokenAmount,
          })),
        );
        if (approvedRows.length === 0) return res.status(409).json({ error: "token_request_already_reviewed" });
      } else {
        const mapped = tokenApprovalErrorResponse(error);
        if (mapped) return res.status(mapped.status).json({ error: mapped.error });
        throw error;
      }
    }
    rows = [{ ...requestRow, status: "approved", username: approvedRows[0]?.username ?? requestRow.username }];
    creditedTokens = tokenAmount;
  } else {
    rows = await updateRows<TokenRequestRow>(
      "token_requests",
      { id: `eq.${req.params.id}` },
      { status: parsed.data.status },
    );
  }
  if (rows.length === 0) return res.status(404).json({ error: "token_request_not_found" });

  await writeAudit(adminSession(res), {
    action: "token_request_updated",
    targetType: "token_request",
    targetId: req.params.id,
    targetLabel: rows[0].username ?? undefined,
    details: { status: parsed.data.status, creditedTokens },
  });
  return res.status(200).json({ ok: true });
});
