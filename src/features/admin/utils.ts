export const TAG_TONES = {
  gold: "border-raw-gold/40 bg-raw-gold/10 text-raw-gold",
  red: "border-red-500/40 bg-red-500/10 text-red-300",
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  teal: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  gray: "border-raw-border/40 bg-raw-black/40 text-raw-silver/70",
} as const;

export type TagTone = keyof typeof TAG_TONES;

export function statusTone(status: string | null | undefined): TagTone {
  switch (status) {
    case "active":
    case "approved":
    case "resolved":
    case "reviewed":
    case "sent_code":
      return "green";
    case "contacted":
      return "teal";
    case "banned":
    case "rejected":
    case "denied":
    case "error":
    case "fatal":
      return "red";
    case "warned":
    case "pending":
    case "open":
      return "gold";
    default:
      return "gray";
  }
}

export function formatDate(value: string | number | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}
