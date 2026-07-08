// Fire a push notification to a user via the user app's notifications endpoint
// (welkhazen/wzwznew: POST /api/notifications/send, guarded by PUSH_SEND_SECRET).
//
// Best-effort: admin actions must never fail because a push could not be sent,
// so all errors are swallowed and logged. Requires two env vars on this
// deployment; if either is missing the call is a no-op.
//   USER_APP_URL     e.g. https://www.myraw.app
//   PUSH_SEND_SECRET shared secret matching the user app's PUSH_SEND_SECRET

const userAppUrl = process.env.USER_APP_URL ?? "";
const pushSendSecret = process.env.PUSH_SEND_SECRET ?? "";

export async function sendUserPush(args: {
  userId: string;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  if (!userAppUrl || !pushSendSecret) return;
  try {
    const response = await fetch(`${userAppUrl.replace(/\/$/, "")}/api/notifications/send`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${pushSendSecret}`,
      },
      body: JSON.stringify(args),
    });
    if (!response.ok) {
      console.error("[pushNotify] push send failed", response.status, await response.text().catch(() => ""));
    }
  } catch (error) {
    console.error("[pushNotify] push send error", error);
  }
}
