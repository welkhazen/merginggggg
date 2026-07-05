import { Router } from "express";
import { requireTier } from "../../middleware/adminAuth";
import { analyticsRouter } from "./analytics";
import { auditLogRouter } from "./auditLog";
import { commerceRouter } from "./commerce";
import { communitiesRouter } from "./communities";
import { flagsRouter } from "./flags";
import { invitesRouter } from "./invites";
import { reportsRouter } from "./reports";
import { requestsRouter } from "./requests";
import { staffRouter } from "./staff";
import { statsRouter } from "./stats";
import { systemRouter } from "./system";
import { usersRouter } from "./users";
import { wordsRouter } from "./words";

export const adminRouter = Router();

// Tier ladder: moderator < admin < owner < super_admin.
// Content moderation is open to every staff tier.
adminRouter.use(requireTier("moderator"), statsRouter, communitiesRouter, reportsRouter, flagsRouter, usersRouter);

// Community programs, commerce, filters, invites, analytics: admin and up.
adminRouter.use(requireTier("admin"), requestsRouter, commerceRouter, wordsRouter, invitesRouter, analyticsRouter);

// Staff management and the audit trail: owner and up.
adminRouter.use(requireTier("owner"), staffRouter, auditLogRouter);

// System health, error events, infrastructure: super admin only.
adminRouter.use(requireTier("super_admin"), systemRouter);
