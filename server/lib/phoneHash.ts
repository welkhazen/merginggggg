import { createHmac } from "crypto";
import { env } from "../config/env";

const PHONE_HMAC_KEY = env.PHONE_HMAC_KEY;

/**
 * Normalizes a raw phone number input to strict E.164 format.
 * Returns null if the value is not a valid E.164 number.
 * E.164: + followed by 7-15 digits, no spaces or special chars.
 */
export function normalizePhone(raw: string): string | null {
  const stripped = raw.trim().replace(/\s+/g, "");
  if (!/^\+\d{7,15}$/.test(stripped)) {
    return null;
  }
  return stripped;
}

/**
 * Returns a one-way HMAC-SHA256 of an E.164 phone number.
 * Always store this — never store the raw phone number.
 */
export function hashPhone(phone: string): string {
  return createHmac("sha256", PHONE_HMAC_KEY).update(phone).digest("hex");
}

/**
 * Masks a phone number for display, e.g. "+905317093987" → "+905•••••••987"
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone;
  const visibleStart = 4;
  const visibleEnd = 3;
  const masked = "•".repeat(phone.length - visibleStart - visibleEnd);
  return phone.slice(0, visibleStart) + masked + phone.slice(-visibleEnd);
}
