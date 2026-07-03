import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import rateLimit from "express-rate-limit";
import session from "express-session";
import { env } from "./config/env";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";

const app = express();
const isProduction = env.NODE_ENV === "production";
const port = env.API_PORT;
const corsOrigin = env.CORS_ORIGIN;
const sessionSecret = env.SESSION_SECRET;

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

if (isProduction) {
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
  session({
    name: "raw.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

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

const clientDist = path.resolve(process.cwd(), "dist");
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  return res.sendFile(path.join(clientDist, "index.html"));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  return res.status(500).json({ error: "Internal server error." });
});

app.listen(port, () => {
  console.info(`Auth API listening on http://localhost:${port}`);
});
