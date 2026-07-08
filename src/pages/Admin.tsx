import { useEffect, useState } from "react";
import {
  ChartLine,
  Coins,
  Flag,
  Inbox,
  LayoutDashboard,
  Lock,
  LogOut,
  MessagesSquare,
  ScrollText,
  ServerCog,
  ShieldBan,
  Ticket,
  TriangleAlert,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getSession, login, logout, TIER_LABELS, tierAtLeast, type AdminUser, type StaffTier } from "@/lib/adminApi";
import { captureAdminEvent, captureAdminException, identifyAdmin, posthog } from "@/lib/analytics";
import { AdminButton, Field, Shell } from "@/features/admin/ui";
import { AnalyticsTab } from "@/features/admin/tabs/AnalyticsTab";
import { AuditTab } from "@/features/admin/tabs/AuditTab";
import { CommerceTab } from "@/features/admin/tabs/CommerceTab";
import { CommunitiesTab } from "@/features/admin/tabs/CommunitiesTab";
import { FlagsTab } from "@/features/admin/tabs/FlagsTab";
import { InvitesTab } from "@/features/admin/tabs/InvitesTab";
import { OverviewTab } from "@/features/admin/tabs/OverviewTab";
import { ReportsTab } from "@/features/admin/tabs/ReportsTab";
import { RequestsTab } from "@/features/admin/tabs/RequestsTab";
import { StaffTab } from "@/features/admin/tabs/StaffTab";
import { SystemTab } from "@/features/admin/tabs/SystemTab";
import { UsersTab } from "@/features/admin/tabs/UsersTab";
import { WordsTab } from "@/features/admin/tabs/WordsTab";

type TabId =
  | "overview"
  | "communities"
  | "reports"
  | "flags"
  | "users"
  | "requests"
  | "commerce"
  | "words"
  | "invites"
  | "staff"
  | "audit"
  | "analytics"
  | "system";

const TABS: Array<{ id: TabId; label: string; icon: typeof LayoutDashboard; minTier: StaffTier }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, minTier: "moderator" },
  { id: "communities", label: "Community rooms", icon: MessagesSquare, minTier: "moderator" },
  { id: "reports", label: "Reports", icon: Flag, minTier: "moderator" },
  { id: "flags", label: "Flagged content", icon: TriangleAlert, minTier: "moderator" },
  { id: "users", label: "Users & appeals", icon: Users, minTier: "admin" },
  { id: "requests", label: "Community requests", icon: Inbox, minTier: "moderator" },
  { id: "commerce", label: "Donations & tokens", icon: Coins, minTier: "admin" },
  { id: "words", label: "Word filters", icon: ShieldBan, minTier: "admin" },
  { id: "invites", label: "Invites", icon: Ticket, minTier: "admin" },
  { id: "analytics", label: "Analytics", icon: ChartLine, minTier: "admin" },
  { id: "staff", label: "Staff", icon: UserCog, minTier: "owner" },
  { id: "audit", label: "Audit log", icon: ScrollText, minTier: "owner" },
  { id: "system", label: "System & errors", icon: ServerCog, minTier: "super_admin" },
];

// Distinguishes bad credentials from a broken deployment so a lockout can be
// diagnosed from the toast instead of guessing.
function loginErrorDescription(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "Invalid username or password." || message === "Staff access only.") return message;
  if (message === "server_misconfigured") {
    return "The server is missing configuration. Check /api/health for the affected environment variables.";
  }
  return "The sign-in service did not respond. The deployment may be outdated or missing the API.";
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
      captureAdminEvent("admin_signed_in", { role: user.role, tier: user.tier });
      onLogin(user);
      toast({ title: "Signed in" });
    } catch (error) {
      captureAdminException(error, { action: "admin_sign_in" });
      captureAdminEvent("admin_sign_in_failed");
      toast({ title: "Could not sign in", description: loginErrorDescription(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8">
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
            <Field value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" autoComplete="username" className="w-full" />
            <Field value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" autoComplete="current-password" className="w-full" />
            <AdminButton disabled={loading || !username.trim() || !password} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </AdminButton>
          </form>
        </div>
      </main>
    </Shell>
  );
}

export default function Admin() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    getSession()
      .then((sessionUser) => {
        if (sessionUser) {
          identifyAdmin(sessionUser);
          captureAdminEvent("admin_session_restored", { role: sessionUser.role, tier: sessionUser.tier });
        }
        setUser(sessionUser);
      })
      .catch((error) => captureAdminException(error, { action: "admin_session_restore" }))
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <Shell>
        <main className="flex min-h-screen">
          <div className="m-auto text-sm text-raw-silver/50">Loading admin portal...</div>
        </main>
      </Shell>
    );
  }

  if (!user) return <LoginView onLogin={setUser} />;

  const visibleTabs = TABS.filter((entry) => tierAtLeast(user.tier, entry.minTier));
  const activeTab = visibleTabs.find((entry) => entry.id === tab) ?? visibleTabs[0];

  function selectTab(id: TabId) {
    setTab(id);
    captureAdminEvent("admin_tab_opened", { tab: id });
  }

  return (
    <Shell>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-raw-gold/65">Standalone admin</p>
            <h1 className="mt-2 font-display text-2xl tracking-wide sm:text-3xl">RAW moderation dashboard</h1>
            <p className="mt-1 text-xs text-raw-silver/45">
              Connected to the live myraw.app database · You are {TIER_LABELS[user.tier]}
            </p>
          </div>
          <AdminButton
            tone="outline"
            onClick={() => {
              captureAdminEvent("admin_signed_out", { role: user.role, tier: user.tier });
              posthog.reset();
              void logout().finally(() => setUser(null));
            }}
          >
            <LogOut className="h-4 w-4" />
            @{user.username}
          </AdminButton>
        </header>

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <nav className="flex shrink-0 gap-1 overflow-x-auto pb-2 lg:w-56 lg:flex-col lg:overflow-visible lg:pb-0">
            {visibleTabs.map((entry) => {
              const Icon = entry.icon;
              const isActive = activeTab?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => selectTab(entry.id)}
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-left text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-raw-gold text-raw-ink"
                      : "border border-raw-border/25 bg-raw-black/30 text-raw-silver/70 hover:border-raw-gold/40 hover:text-raw-text lg:border-transparent lg:bg-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {entry.label}
                </button>
              );
            })}
          </nav>

          <div className="min-w-0 flex-1 rounded-2xl border border-raw-border/30 bg-raw-surface/35 p-4 sm:p-6">
            {activeTab?.id === "overview" && <OverviewTab />}
            {activeTab?.id === "communities" && <CommunitiesTab />}
            {activeTab?.id === "reports" && <ReportsTab />}
            {activeTab?.id === "flags" && <FlagsTab />}
            {activeTab?.id === "users" && <UsersTab />}
            {activeTab?.id === "requests" && <RequestsTab currentTier={user.tier} />}
            {activeTab?.id === "commerce" && <CommerceTab />}
            {activeTab?.id === "words" && <WordsTab />}
            {activeTab?.id === "invites" && <InvitesTab currentUsername={user.username} />}
            {activeTab?.id === "analytics" && <AnalyticsTab />}
            {activeTab?.id === "staff" && <StaffTab currentUser={user} />}
            {activeTab?.id === "audit" && <AuditTab />}
            {activeTab?.id === "system" && <SystemTab />}
          </div>
        </div>
      </div>
    </Shell>
  );
}
