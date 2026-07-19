import { TAG_TONES, type TagTone } from "./utils";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-raw-black text-raw-text">
      <div className="fixed inset-0 -z-10 opacity-45 [background-image:radial-gradient(rgba(241,196,45,.14)_1px,transparent_1px)] [background-size:12px_12px]" />
      {children}
    </div>
  );
}

export function Panel({
  title,
  hint,
  actions,
  children,
}: {
  title: string;
  hint?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
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

export function SelectField(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
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
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "gold" | "outline" | "danger" | "teal";
}) {
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

export function Tag({
  tone = "gray",
  children,
}: {
  tone?: TagTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_TONES[tone]}`}
    >
      {children}
    </span>
  );
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
