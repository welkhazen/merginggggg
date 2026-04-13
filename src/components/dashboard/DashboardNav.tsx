import { Bell } from "lucide-react";
import { AvatarFigure } from "@/components/ui/avatar-figure";

export type DashboardTab = "polls" | "communities" | "marketplace" | "profile";

interface DashboardNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  username: string;
  avatarLevel: number;
}

const tabs: { label: string; value: DashboardTab }[] = [
  { label: "Polls", value: "polls" },
  { label: "Communities", value: "communities" },
  { label: "Marketplace", value: "marketplace" },
  { label: "Profile", value: "profile" },
];

export function DashboardNav({ activeTab, onTabChange, username, avatarLevel }: DashboardNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-raw-border/50 bg-raw-black/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <a href="/" className="font-display text-lg tracking-[0.3em] text-raw-text shrink-0">
          ra<span className="text-raw-gold">W</span>
        </a>

        {/* Center tabs */}
        <div className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`relative px-5 py-1.5 rounded-full text-sm transition-all ${
                activeTab === tab.value
                  ? "text-raw-gold font-medium"
                  : "text-raw-silver/50 hover:text-raw-silver/80"
              }`}
            >
              {activeTab === tab.value && (
                <div className="absolute inset-0 rounded-full bg-raw-gold/[0.08] border border-raw-gold/20" />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: bell + avatar */}
        <div className="flex items-center gap-4 shrink-0">
          <button className="relative text-raw-silver/40 hover:text-raw-silver/70 transition-colors">
            <Bell className="h-[18px] w-[18px]" />
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-raw-gold" />
          </button>
          <button className="flex items-center gap-2.5">
            <AvatarFigure level={avatarLevel} size="sm" selected />
          </button>
        </div>
      </div>
    </nav>
  );
}
