import twilio from "twilio";
import { env } from "../config/env";
import { audit } from "./audit";

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export type OtpChannel = "sms" | "whatsapp";

export type OtpSendResult =
  | { ok: true; channels: OtpChannel[] }
  | { ok: false; error: string };

function getTwilioErrorDetails(error: unknown): { code?: number; message: string } {
  if (error && typeof error === "object") {
    const maybeError = error as { code?: unknown; message?: unknown };
    return {
      code: typeof maybeError.code === "number" ? maybeError.code : undefined,
      message: typeof maybeError.message === "string" ? maybeError.message : String(error),
    };
  }

  return { message: String(error) };
}

function getOtpFailureMessage(errors: Array<{ code?: number; message: string }>): string {
  if (errors.some((error) => error.code === 20003)) {
    return "Twilio authentication failed. Check your Account SID and Auth Token.";
  }

  if (errors.some((error) => error.code === 21608)) {
    return "This Twilio trial account can only send codes to verified phone numbers. Verify the destination number in your Twilio console or upgrade the account.";
  }

  if (errors.some((error) => error.message.toLowerCase().includes("whatsapp"))) {
    return "WhatsApp OTP delivery is not enabled for this Twilio account yet.";
  }

  return "Failed to send verification code. Please try again.";
}

/**
 * Sends a Twilio Verify OTP to the given E.164 phone via BOTH SMS and WhatsApp simultaneously.
 * At least one channel must succeed for the result to be ok.
 * WhatsApp delivery requires the Twilio sandbox opt-in (dev) or Meta approval (prod).
 */
export async function sendOtp(phone: string): Promise<OtpSendResult> {
  const service = client.verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID);
  const channels: OtpChannel[] = [];
  const failures: Array<{ code?: number; message: string }> = [];

  const [smsResult, waResult] = await Promise.allSettled([
    service.verifications.create({ to: phone, channel: "sms" }),
    service.verifications.create({ to: phone, channel: "whatsapp" }),
  ]);

  if (smsResult.status === "fulfilled" && smsResult.value.status === "pending") {
    channels.push("sms");
  } else {
    const details =
      smsResult.status === "rejected"
        ? getTwilioErrorDetails(smsResult.reason)
        : { message: smsResult.value.status };
    failures.push(details);
    audit(
      "otp.send.sms.failed",
      {
        reason:
          smsResult.status === "rejected"
            ? String(smsResult.reason)
            : smsResult.value.status,
      },
      "warn"
    );
  }

  if (waResult.status === "fulfilled" && waResult.value.status === "pending") {
    channels.push("whatsapp");
  } else {
    const details =
      waResult.status === "rejected"
        ? getTwilioErrorDetails(waResult.reason)
        : { message: waResult.value.status };
    failures.push(details);
    audit(
      "otp.send.whatsapp.failed",
      {
        reason:
          waResult.status === "rejected"
            ? String(waResult.reason)
            : waResult.value.status,
      },
      "warn"
    );
  }

  if (channels.length === 0) {
    return { ok: false, error: getOtpFailureMessage(failures) };
  }

  return { ok: true, channels };
}

/**
 * Checks a 6-digit OTP code against the active Twilio Verify record for this phone.
 * Returns true only when Twilio confirms status === "approved".
 */
export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  try {
    const check = await client.verify.v2
      .services(env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });

    return check.status === "approved";
  } catch {
    return false;
  }
}
