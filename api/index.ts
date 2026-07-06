// Vercel serverless entry: every /api/* request is rewritten here (see
// vercel.json) and handled by the same Express app used in local dev.
//
// Vercel only compiles TypeScript that lives inside `api/`, so it never built
// the `server/` tree — importing it directly failed at runtime with
// "Cannot find module '/var/task/server/index'". Instead the build step
// (`npm run build:api`) bundles the whole server into a single self-contained
// CommonJS file at api/_server/index.cjs, which Vercel includes in the
// function. Loading it is wrapped so any residual init error returns readable
// JSON instead of an opaque FUNCTION_INVOCATION_FAILED.
import { createRequire } from "node:module";
import type { IncomingMessage, ServerResponse } from "node:http";

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => unknown;

const require = createRequire(import.meta.url);

let app: NodeHandler;
try {
  const mod = require("./_server/index.cjs") as { default?: NodeHandler } | NodeHandler;
  app = (typeof mod === "function" ? mod : mod.default) as NodeHandler;
  if (typeof app !== "function") throw new Error("server bundle did not export an app");
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error("[api] Failed to load server bundle", error);
  app = (_req, res) => {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "server_init_failed", detail }));
  };
}

export default app;
