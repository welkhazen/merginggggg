import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { captureAdminException } from "@/lib/analytics";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-raw-black text-raw-text">
      <div className="fixed inset-0 -z-10 opacity-45 [background-image:radial-gradient(rgba(241,196,45,.14)_1px,transparent_1px)] [background-size:12px_12px]" />
      {children}
    </div>
  );
}

export function Panel({ title, hint, actions, children }: { title: string; hint?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-b border-raw-border/20 py-6 first:pt-2 last:border-b-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-raw-text">{title}</h2>
          {hint && <p className="mt-1 text-xs text-raw-silver/40">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-11 rounded-xl border border-raw-border/30 bg-raw-black/45 px-3 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/50 focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`min-h-11 rounded-xl border border-raw-border/30 bg-raw-black/45 px-3 text-sm text-raw-text focus:outline-none ${props.className ?? ""}`}
    >
      {props.children}
    </select>
  );
}

export function AdminButton({
  children,
  tone = "gold",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "gold" | "outline" | "danger" | "teal" }) {
  const toneClass =
    tone === "gold"
      ? "bg-raw-gold text-raw-ink hover:bg-raw-gold/90"
      : tone === "danger"
        ? "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15"
        : tone === "teal"
          ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15"
          : "border border-raw-border/30 bg-raw-black/40 text-raw-text hover:border-raw-gold/40";

  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors disabled:opacity-45 ${toneClass} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

const TAG_TONES: Record<string, string> = {
  gold: "border-raw-gold/40 bg-raw-gold/10 text-raw-gold",
  red: "border-red-500/40 bg-red-500/10 text-red-300",
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  teal: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  gray: "border-raw-border/40 bg-raw-black/40 text-raw-silver/70",
};

export function Tag({ tone = "gray", children }: { tone?: keyof typeof TAG_TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string | null | undefined): keyof typeof TAG_TONES {
  switch (status) {
    case "active":
    case "approved":
    case "resolved":
    case "reviewed":
      return "green";
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

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-sm text-raw-silver/45">{children}</p>;
}

export function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-raw-border/25 bg-raw-black/30 px-3 py-3">
      {children}
    </div>
  );
}

export function formatDate(value: string | number | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  // Only the latest request may write state, so a slow earlier response can't
  // overwrite fresher data after quick filter/tab switches.
  const requestIdRef = useRef(0);

  const reload = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    loader()
      .then((result) => {
        if (requestIdRef.current === requestId) setData(result);
      })
      .catch((error) => {
        if (requestIdRef.current !== requestId) return;
        captureAdminException(error, { action: "admin_data_load" });
        toast({ title: "Could not load data", description: error instanceof Error ? error.message : undefined });
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, reload };
}
