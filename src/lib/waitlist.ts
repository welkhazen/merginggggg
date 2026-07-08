import { normalizePlainText } from "@/lib/inputSecurity";

export type InviteWaitlistRequestInput = {
  contact: string;
  note?: string;
  source?: string;
};

export async function submitInviteWaitlistRequest(input: InviteWaitlistRequestInput): Promise<void> {
  const contact = normalizePlainText(input.contact);
  const note = normalizePlainText(input.note ?? "");
  const source = normalizePlainText(input.source ?? "signup_modal") || "signup_modal";

  if (!contact) {
    throw new Error("Add Instagram, WhatsApp, email, or any contact we can use.");
  }

  const response = await fetch("/api/waitlist/invite", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contact, note, source }),
  });
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? "waitlist_request_failed");
}
