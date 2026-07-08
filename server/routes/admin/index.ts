import { Router } from "express";
import { requireTier } from "../../middleware/adminAuth.js";
import { analyticsRouter } from "./analytics.js";
import { auditLogRouter } from "./auditLog.js";
import { commerceRouter } from "./commerce.js";
import { communitiesRouter } from "./communities.js";
import { flagsRouter } from "./flags.js";
import { invitesRouter } from "./invites.js";
import { reportsRouter } from "./reports.js";
import { requestsRouter } from "./requests.js";
import { staffRouter } from "./staff.js";
import { statsRouter } from "./stats.js";
import { systemRouter } from "./system.js";
import { usersRouter } from "./users.js";
import { wordsRouter } from "./words.js";

export const adminRouter = Router();

// Tier ladder: moderator < admin < owner < super_admin.
// Content moderation and community request visibility are open to every staff tier.
adminRouter.use(requireTier("moderator"), statsRouter, communitiesRouter, reportsRouter, flagsRouter, usersRouter, requestsRouter);

// Community programs, commerce, filters, invites, analytics: admin and up.
adminRouter.use(requireTier("admin"), commerceRouter, wordsRouter, invitesRouter, analyticsRouter);

// Staff management and the audit trail: owner and up.
adminRouter.use(requireTier("owner"), staffRouter, auditLogRouter);

// System health, error events, infrastructure: super admin only.
adminRouter.use(requireTier("super_admin"), systemRouter);
