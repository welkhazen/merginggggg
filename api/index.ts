// Vercel serverless entry: every /api/* request is rewritten here (see
// vercel.json) and handled by the same Express app used in local dev.
//
// The app is loaded lazily inside the handler so that if anything throws while
// the module graph loads (bad config, a missing dependency, a broken route),
// the function answers with a readable JSON error instead of an opaque
// FUNCTION_INVOCATION_FAILED that gives operators nothing to act on.
import type { IncomingMessage, ServerResponse } from "node:http";

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => unknown;

let cachedApp: NodeHandler | null = null;

async function loadApp(): Promise<NodeHandler> {
  if (cachedApp) return cachedApp;
  const mod = (await import("../server/index")) as { default: NodeHandler };
  cachedApp = mod.default;
  return cachedApp;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api] Failed to initialize server", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "server_init_failed", detail }));
  }
}
