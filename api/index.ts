// Vercel serverless entry: every /api/* request is rewritten here (see
// vercel.json) and handled by the same Express app used in local dev.
import app from "../server/index";

export default app;
