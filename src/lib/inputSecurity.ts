const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const MULTIPLE_SPACES_REGEX = /\s+/g;
const ALLOWED_USERNAME_CHARS_REGEX = /[^a-zA-Z0-9._-]/g;

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS_REGEX, "");
}

export function sanitizeUsernameInput(value: string): string {
  return stripControlChars(value)
    .replace(ALLOWED_USERNAME_CHARS_REGEX, "")
    .slice(0, 24);
}

export function normalizePlainText(value: string): string {
  return stripControlChars(value).replace(MULTIPLE_SPACES_REGEX, " ").trim();
}

export function isValidUsername(value: string): boolean {
  return /^[a-zA-Z0-9._-]{3,24}$/.test(value);
}

export function sanitizePasswordInput(value: string): string {
  return stripControlChars(value).slice(0, 128);
}