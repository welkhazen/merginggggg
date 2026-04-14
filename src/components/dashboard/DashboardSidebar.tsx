import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Home,
  MessageCircle,
  ShoppingBag,
  Target,
  Settings,
  HelpCircle,
  Flame,
  LogOut,
  Plus,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { CommunityBadge } from "@/components/dashboard/CommunityBadge";
import { countUnreadMessages, joinCommunityChat, readCommunityChats, type PersistedCommunityRecord } from "@/lib/communityChat";
import type { DashboardTab } from "./DashboardNav";

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  userId: string;
  username: string;
  avatarLevel: number;
  showAdminLink?: boolean;
  onHomeClick: () => void;
  isHome: boolean;
  onLogout: () => void;
}

const navItems: { icon: typeof Home; label: string; tab: DashboardTab | "home" }[] = [
  { icon: Home, label: "Home", tab: "home" },
  { icon: Target, label: "Polls", tab: "polls" },
  { icon: MessageCircle, label: "Communities", tab: "communities" },
  { icon: ShoppingBag, label: "Marketplace", tab: "marketplace" },
  { icon: BarChart3, label: "Growth Stats", tab: "profile" },
];

// Avatar colors now come from AvatarFigure component

export function DashboardSidebar({
  activeTab,
  onTabChange,
  userId,
  username,
  avatarLevel,
  showAdminLink = false,
  onHomeClick,
  isHome,
  onLogout,
}: DashboardSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [communities, setCommunities] = useState<PersistedCommunityRecord[]>(() => readCommunityChats());

  useEffect(() => {
    const reloadCommunities = () => {
      setCommunities(readCommunityChats());
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("raw.community")) {
        reloadCommunities();
      }
    };

    reloadCommunities();
    window.addEventListener("focus", reloadCommunities);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", reloadCommunities);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const quickCommunities = useMemo(() => communities.slice(0, 4), [communities]);

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-40 hidden w-[200px] flex-col border-r border-raw-border/30 bg-raw-black lg:flex">
      {/* User card */}
      <div className="p-4 pt-5">
        <div className="rounded-xl bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border/40 p-4">
          <div className="flex items-center gap-3">
            <AvatarFigure level={avatarLevel} size="sm" selected />
            <div className="min-w-0">
              <p className="text-sm font-medium text-raw-gold truncate">{username}</p>
              <p className="text-[10px] text-raw-silver/40">Level {avatarLevel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            (item.tab === "home" && isHome) ||
            (item.tab !== "home" && activeTab === item.tab && !isHome);
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.tab === "home") {
                  onHomeClick();
                } else {
                  onTabChange(item.tab as DashboardTab);
                }
              }}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-raw-gold/10 text-raw-gold border border-raw-gold/20"
                  : "text-raw-silver/50 hover:text-raw-silver/80 hover:bg-raw-surface/50 border border-transparent"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="mt-5 rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-3">
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-raw-silver/35">Fast Join</p>
            <button
              onClick={() => {
                onTabChange("communities");
                navigate("/dashboard");
              }}
              className="rounded-full p-1 text-raw-silver/35 transition-colors hover:bg-raw-surface/40 hover:text-raw-gold"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {quickCommunities.map((community) => {
              const isJoined = community.members.some((member) => member.userId === userId);
              const unreadCount = countUnreadMessages(community, userId);
              const isCommunityActive = location.pathname === `/dashboard/communities/${community.id}`;

              return (
                <div
                  key={community.id}
                  className={`flex items-center gap-2 rounded-xl px-2 py-2 transition-colors ${
                    isCommunityActive
                      ? "bg-raw-gold/10 text-raw-gold"
                      : "hover:bg-raw-surface/40 text-raw-silver/65"
                  }`}
                >
                  <button
                    onClick={() => navigate(`/dashboard/communities/${community.id}`)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                  <CommunityBadge abbr={community.abbr} title={community.title} logoUrl={community.logoUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-medium">{community.title}</p>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-raw-gold px-1.5 py-0.5 text-[9px] font-semibold text-raw-ink">{unreadCount}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-raw-silver/35">{isJoined ? "Open chat" : "Quick join"}</p>
                  </div>
                  </button>
                  {!isJoined && (
                    <button
                      onClick={(event) => {
                        joinCommunityChat(community.id, { userId, username });
                        setCommunities(readCommunityChats());
                        navigate(`/dashboard/communities/${community.id}`);
                      }}
                      className="rounded-full border border-raw-gold/20 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-raw-gold/75"
                    >
                      Join
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Streak */}
      <div className="px-4 pb-3">
        <div className="rounded-xl border border-raw-gold/15 bg-raw-gold/[0.04] p-3 text-center">
          <Flame className="h-5 w-5 text-raw-gold/60 mx-auto mb-1" />
          <p className="text-lg font-bold text-raw-gold">7</p>
          <p className="text-[9px] uppercase tracking-wider text-raw-silver/30">Day Streak</p>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-raw-border/20 p-3 space-y-0.5">
        {showAdminLink && (
          <a
            href="/admin"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-raw-gold/75 transition-colors hover:bg-raw-gold/[0.06] hover:text-raw-gold"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Admin</span>
          </a>
        )}
        <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-raw-silver/35 hover:text-raw-silver/60 transition-colors">
          <Settings className="h-3.5 w-3.5" />
          <span>Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-raw-silver/35 hover:text-raw-silver/60 transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Support</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-raw-silver/35 hover:text-raw-gold transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
