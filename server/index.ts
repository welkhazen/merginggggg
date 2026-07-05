import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { existsSync } from "node:fs";
import path from "node:path";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { adminRouter } from "./routes/admin/index";
import { authRouter } from "./routes/auth";
import { errorsRouter } from "./routes/errors";

const app = express();
const isProduction = env.NODE_ENV === "production";
const port = env.API_PORT;
const corsOrigin = env.CORS_ORIGIN;
const isVercel = Boolean(process.env.VERCEL);

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

if (isProduction && !isVercel) {
  app.use((req, res, next) => {
    const forwardedProto = req.headers["x-forwarded-proto"];
    if (forwardedProto !== "https") {
      return res.status(400).json({ error: "HTTPS is required." });
    }

    return next();
  });
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => {
  return res.status(200).json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/errors", errorsRouter);

// Static SPA serving for the classic long-running deployment. On Vercel the
// CDN serves dist/ and only /api/* reaches this app.
const clientDist = path.resolve(process.cwd(), "dist");
if (!isVercel && existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  return res.status(500).json({ error: "Internal server error." });
});

if (!isVercel) {
  app.listen(port, () => {
    console.info(`Auth API listening on http://localhost:${port}`);
  });
}

export default app;
