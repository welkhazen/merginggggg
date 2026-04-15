import { Bell, LogOut } from "lucide-react";
import { AvatarFigure } from "@/components/ui/avatar-figure";

export type DashboardTab = "polls" | "challenges" | "daily-spin" | "communities" | "profile";

interface DashboardNavProps {
  username: string;
  avatarLevel: number;
  showAdminLink?: boolean;
  onProfileClick: () => void;
  onLogout: () => void;
}

export function DashboardNav({ username, avatarLevel, showAdminLink = false, onProfileClick, onLogout }: DashboardNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-raw-border/50 bg-raw-black/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <a href="/" className="font-display text-lg tracking-[0.3em] text-raw-text shrink-0">
          ra<span className="text-raw-gold">W</span>
        </a>

        {/* Right: bell + avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {showAdminLink && (
            <a
              href="/admin"
              className="hidden rounded-full border border-raw-gold/25 bg-raw-gold/[0.06] px-3 py-1.5 text-xs font-medium text-raw-gold transition-colors hover:bg-raw-gold/[0.12] md:inline-flex"
            >
              Admin
            </a>
          )}
          <span className="hidden text-sm text-raw-silver/60 md:inline">@{username}</span>
          <button className="relative text-raw-silver/40 hover:text-raw-silver/70 transition-colors">
            <Bell className="h-[18px] w-[18px]" />
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-raw-gold" />
          </button>
          <button onClick={onProfileClick} className="flex items-center gap-2.5" aria-label="Open profile">
            <AvatarFigure level={avatarLevel} size="sm" selected />
          </button>
          <button
            onClick={onLogout}
            className="rounded-full border border-raw-border/60 px-3 py-1.5 text-xs font-medium text-raw-silver/60 transition-colors hover:border-raw-gold/30 hover:text-raw-gold"
          >
            <span className="hidden sm:inline">Log Out</span>
            <LogOut className="h-4 w-4 sm:hidden" />
          </button>
        </div>
      </div>
    </nav>
  );
}
