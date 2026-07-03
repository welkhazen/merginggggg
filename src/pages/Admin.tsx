import { useEffect, useState } from "react";
import { Ban, Lock, LogOut, Plus, RefreshCw, ShieldCheck, Sparkles, Ticket, Trash2, TriangleAlert, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  addBlockedWord,
  createStaffAccount,
  deleteDonationInterest,
  fetchBlockedWords,
  fetchDonationInterests,
  getSession,
  grantInviteCodes,
  login,
  logout,
  moderateUser,
  removeBlockedWord,
  updateDonationInterestStatus,
  type AdminUser,
  type BlockedWordRecord,
  type DonationInterestRecord,
  type StaffRole,
} from "@/lib/adminApi";
import { captureAdminEvent, captureAdminException, identifyAdmin, posthog } from "@/lib/analytics";

const TIMEOUTS = [
  { label: "10 min", minutes: 10 },
  { label: "1 hour", minutes: 60 },
  { label: "24 hours", minutes: 60 * 24 },
];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-raw-black text-raw-text">
      <div className="fixed inset-0 -z-10 opacity-45 [background-image:radial-gradient(rgba(241,196,45,.14)_1px,transparent_1px)] [background-size:12px_12px]" />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-raw-border/20 py-6 last:border-b-0">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-raw-text">{title}</h2>
        <p className="mt-1 text-xs text-raw-silver/40">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="min-h-11 rounded-xl border border-raw-border/30 bg-raw-black/45 px-3 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/50 focus:outline-none"
    />
  );
}

function AdminButton({
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

function LoginView({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      identifyAdmin(user);
      captureAdminEvent("admin_signed_in", { role: user.role });
      onLogin(user);
      toast({ title: "Signed in" });
    } catch (error) {
      captureAdminException(error, { action: "admin_sign_in" });
      captureAdminEvent("admin_sign_in_failed");
      toast({ title: "Could not sign in", description: "Use an admin or moderator account." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="m-auto w-full max-w-sm rounded-2xl border border-raw-border/30 bg-raw-surface/45 p-5 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-raw-gold text-raw-ink">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg tracking-wide">Admin portal</h1>
            <p className="text-xs text-raw-silver/45">Sign in to manage RAW.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" autoComplete="username" />
          <Field value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" autoComplete="current-password" />
          <AdminButton disabled={loading || !username.trim() || !password} className="w-full">
            {loading ? "Signing in..." : "Sign in"}
          </AdminButton>
        </form>
      </div>
    </Shell>
  );
}

export default function Admin() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    getSession()
      .then((sessionUser) => {
        if (sessionUser) {
          identifyAdmin(sessionUser);
          captureAdminEvent("admin_session_restored", { role: sessionUser.role });
        }
        setUser(sessionUser);
      })
      .catch((error) => captureAdminException(error, { action: "admin_session_restore" }))
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <Shell>
        <div className="m-auto text-sm text-raw-silver/50">Loading admin portal...</div>
      </Shell>
    );
  }

  if (!user) return <LoginView onLogin={setUser} />;

  return (
    <Shell>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-raw-gold/65">Standalone admin</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide sm:text-3xl">RAW admin settings</h1>
          <p className="mt-1 text-xs text-raw-silver/45">Connected to the same Supabase project as the main website.</p>
        </div>
        <AdminButton
          tone="outline"
          onClick={() => {
            captureAdminEvent("admin_signed_out", { role: user.role });
            posthog.reset();
            void logout().finally(() => setUser(null));
          }}
        >
          <LogOut className="h-4 w-4" />
          @{user.username}
        </AdminButton>
      </header>

      <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/35 p-4 sm:p-6">
        <ModerateUser />
        {user.role === "admin" && (
          <>
            <CreateStaff />
            <GrantInvites currentUsername={user.username} />
            <BlockedWords />
            <DonationRequests />
          </>
        )}
      </div>
    </Shell>
  );
}

function ModerateUser() {
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function run(action: "warn" | "timeout" | "ban" | "unban", minutes?: number) {
    const target = username.trim();
    if (!target) return toast({ title: "Enter a username" });
    setPending(`${action}-${minutes ?? ""}`);
    try {
      await moderateUser(target, action, minutes);
      captureAdminEvent("admin_user_moderated", { action, minutes, target_username: target });
      toast({ title: "Action applied", description: `@${target} updated.` });
    } catch (error) {
      captureAdminException(error, { action: "admin_user_moderation", moderation_action: action });
      toast({ title: "Action failed", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setPending(null);
    }
  }

  return (
    <Panel title="Moderate a user" hint="Warn, time out, ban, or unban by username.">
      <div className="space-y-3">
        <Field value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
        <div className="flex flex-wrap gap-2">
          <AdminButton tone="outline" disabled={pending !== null} onClick={() => void run("warn")}>
            <TriangleAlert className="h-4 w-4" /> Warn
          </AdminButton>
          {TIMEOUTS.map((timeout) => (
            <AdminButton key={timeout.minutes} tone="teal" disabled={pending !== null} onClick={() => void run("timeout", timeout.minutes)}>
              Timeout {timeout.label}
            </AdminButton>
          ))}
          <AdminButton tone="danger" disabled={pending !== null} onClick={() => void run("ban")}>
            <Ban className="h-4 w-4" /> Ban
          </AdminButton>
          <AdminButton tone="teal" disabled={pending !== null} onClick={() => void run("unban")}>
            <ShieldCheck className="h-4 w-4" /> Unban
          </AdminButton>
        </div>
      </div>
    </Panel>
  );
}

function CreateStaff() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("moderator");
  const [creating, setCreating] = useState(false);

  async function submit() {
    setCreating(true);
    try {
      await createStaffAccount(username.trim(), password, role);
      captureAdminEvent("admin_staff_account_created", { role });
      setUsername("");
      setPassword("");
      toast({ title: "Staff account created" });
    } catch (error) {
      captureAdminException(error, { action: "admin_staff_account_create", role });
      toast({ title: "Could not create account", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setCreating(false);
    }
  }

  return (
    <Panel title="Create staff account" hint="Create a new moderator or admin login.">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_150px_auto]">
        <Field value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
        <Field value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        <select value={role} onChange={(event) => setRole(event.target.value as StaffRole)} className="min-h-11 rounded-xl border border-raw-border/30 bg-raw-black/45 px-3 text-sm text-raw-text focus:outline-none">
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <AdminButton disabled={creating || !username.trim() || password.length < 6} onClick={() => void submit()}>
          <UserPlus className="h-4 w-4" /> Create
        </AdminButton>
      </div>
    </Panel>
  );
}

function GrantInvites({ currentUsername }: { currentUsername: string }) {
  const [selfCount, setSelfCount] = useState("10");
  const [username, setUsername] = useState("");
  const [count, setCount] = useState("3");
  const [loading, setLoading] = useState(false);

  async function grant(target: string, amount: number) {
    setLoading(true);
    try {
      const codes = await grantInviteCodes(target, amount);
      captureAdminEvent("admin_invite_codes_granted", { amount: codes.length, target_self: target === currentUsername });
      toast({ title: "Invite codes granted", description: `${codes.length} code(s) created for @${target}.` });
      if (target !== currentUsername) setUsername("");
    } catch (error) {
      captureAdminException(error, { action: "admin_invite_codes_grant", amount });
      toast({ title: "Could not grant codes", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Grant invite codes" hint="Give a user extra founding invite codes beyond their base allotment.">
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_90px_auto] sm:items-center">
          <div>
            <p className="text-sm font-medium text-raw-text">Generate for yourself</p>
            <p className="text-xs text-raw-silver/40">Create a batch of invite codes on @{currentUsername} to send out.</p>
          </div>
          <Field type="number" min={1} max={100} value={selfCount} onChange={(event) => setSelfCount(event.target.value)} />
          <AdminButton disabled={loading} onClick={() => void grant(currentUsername, Number.parseInt(selfCount, 10))}>
            <Sparkles className="h-4 w-4" /> Generate
          </AdminButton>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_90px_auto]">
          <Field value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
          <Field type="number" min={1} max={100} value={count} onChange={(event) => setCount(event.target.value)} />
          <AdminButton tone="outline" disabled={loading || !username.trim()} onClick={() => void grant(username.trim(), Number.parseInt(count, 10))}>
            <Ticket className="h-4 w-4" /> Grant to user
          </AdminButton>
        </div>
      </div>
    </Panel>
  );
}

function BlockedWords() {
  const [words, setWords] = useState<BlockedWordRecord[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setWords(await fetchBlockedWords());
    } catch {
      captureAdminEvent("admin_blocked_words_load_failed");
      toast({ title: "Could not load blocked words" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    try {
      const saved = await addBlockedWord(term.trim());
      captureAdminEvent("admin_blocked_word_added");
      setWords((current) => [...current.filter((word) => word.id !== saved.id), saved]);
      setTerm("");
      toast({ title: "Blocked word saved" });
    } catch {
      captureAdminEvent("admin_blocked_word_add_failed");
      toast({ title: "Could not save word" });
    }
  }

  async function remove(id: string) {
    await removeBlockedWord(id);
    captureAdminEvent("admin_blocked_word_removed");
    setWords((current) => current.filter((word) => word.id !== id));
  }

  return (
    <Panel title="Blocked words" hint="Manage global terms blocked by admin moderation.">
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Field value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Word or phrase" />
          <AdminButton tone="outline" disabled={loading} onClick={() => void load()} aria-label="Refresh blocked words">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
          <AdminButton disabled={!term.trim()} onClick={() => void save()}>
            <Plus className="h-4 w-4" /> Save word
          </AdminButton>
        </div>
        <div className="space-y-2">
          {words.map((word) => (
            <div key={word.id} className="flex items-center justify-between gap-3 rounded-xl border border-raw-border/25 bg-raw-black/30 px-3 py-2">
              <div>
                <p className="text-sm text-raw-text">{word.term}</p>
                <p className="text-[10px] text-raw-silver/35">Saved {new Date(word.createdAt).toLocaleDateString()}</p>
              </div>
              <AdminButton tone="danger" onClick={() => void remove(word.id)} aria-label={`Delete ${word.term}`}>
                <Trash2 className="h-4 w-4" />
              </AdminButton>
            </div>
          ))}
          {!loading && words.length === 0 && <p className="text-sm text-raw-silver/45">No blocked words saved yet.</p>}
        </div>
      </div>
    </Panel>
  );
}

function DonationRequests() {
  const [requests, setRequests] = useState<DonationInterestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setRequests(await fetchDonationInterests());
    } catch (error) {
      captureAdminException(error, { action: "admin_donation_requests_load" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markReviewed(id: string) {
    await updateDonationInterestStatus(id, "reviewed");
    captureAdminEvent("admin_donation_interest_reviewed");
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status: "reviewed" } : request));
  }

  async function remove(id: string) {
    await deleteDonationInterest(id);
    captureAdminEvent("admin_donation_interest_deleted");
    setRequests((current) => current.filter((request) => request.id !== id));
  }

  const pendingCount = requests.filter((request) => request.status === "pending").length;

  return (
    <Panel title={`Donation Interest Submissions ${pendingCount ? `(${pendingCount} pending)` : ""}`} hint="Review and clear donation interest submissions.">
      {loading ? (
        <p className="text-sm text-raw-silver/45">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-raw-silver/45">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-raw-border/25 bg-raw-black/30 px-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-raw-text">{request.name}</p>
                <p className="truncate text-xs text-raw-silver/55">{request.email}</p>
                {request.phone && <p className="text-xs text-raw-silver/60">{request.phone}</p>}
                <p className="mt-1 text-[10px] text-raw-silver/35">{new Date(request.submittedAt).toLocaleString()} - {request.status}</p>
              </div>
              <div className="flex gap-2">
                {request.status === "pending" && (
                  <AdminButton tone="teal" onClick={() => void markReviewed(request.id)}>Mark reviewed</AdminButton>
                )}
                <AdminButton tone="outline" onClick={() => void remove(request.id)}>Delete</AdminButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
