import { useState } from "react";
import { AvatarFigure, getAvatarTheme } from "@/components/ui/avatar-figure";
import {
  Trophy,
  Target,
  MessageCircle,
  Flame,
  TrendingUp,
  Calendar,
  Award,
} from "lucide-react";

interface DashboardProfileProps {
  username: string;
  avatarLevel: number;
  onLevelChange: (level: number) => void;
  pollsAnswered: number;
}

const stats = [
  { icon: Target, label: "Polls Answered", value: "12", key: "polls" },
  { icon: MessageCircle, label: "Messages Sent", value: "47", key: "messages" },
  { icon: Flame, label: "Day Streak", value: "7", key: "streak" },
  { icon: TrendingUp, label: "XP Earned", value: "1,850", key: "xp" },
  { icon: Calendar, label: "Member Since", value: "Mar 2026", key: "member" },
  { icon: Award, label: "Badges", value: "3", key: "badges" },
];

const badges = [
  { name: "Founding Member", desc: "Joined during the founding era", earned: true },
  { name: "First Vote", desc: "Answered your first poll", earned: true },
  { name: "Week Warrior", desc: "7-day activity streak", earned: true },
  { name: "Voice of Reason", desc: "50 community messages", earned: false },
  { name: "Gold Standard", desc: "Reach Level 10", earned: false },
];

export function DashboardProfile({
  username,
  avatarLevel,
  onLevelChange,
  pollsAnswered,
}: DashboardProfileProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const displayLevel = hoveredLevel ?? avatarLevel;
  const theme = getAvatarTheme(displayLevel);
  const xpForNext = displayLevel * 500;
  const currentXp = 1850;
  const xpPct = Math.min(Math.round((currentXp / xpForNext) * 100), 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl tracking-wide text-raw-text">Profile</h1>
        <p className="mt-2 text-sm text-raw-silver/40">
          Your anonymous identity. Your progress. Your growth.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Avatar column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar card */}
          <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-6 flex flex-col items-center text-center">
            <AvatarFigure level={displayLevel} size="xl" selected />
            <p className="mt-3 font-display text-lg tracking-wide text-raw-text">{username}</p>
            <p className="text-xs text-raw-gold/60 mt-0.5">Level {displayLevel}</p>
            <p className="text-[10px] text-raw-silver/30">{theme.name}</p>

            {/* XP Progress */}
            <div className="w-full mt-5">
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="text-raw-silver/30">XP to Level {Math.min(displayLevel + 1, 10)}</span>
                <span className="text-raw-gold/60">{currentXp} / {xpForNext}</span>
              </div>
              <div className="h-1.5 rounded-full bg-raw-border/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-raw-gold/60 to-raw-gold transition-all duration-500"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>

            {/* Level selector */}
            <div className="mt-5 flex items-center gap-1 flex-wrap justify-center">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onLevelChange(lvl)}
                  onMouseEnter={() => setHoveredLevel(lvl)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  className="flex flex-col items-center group"
                >
                  <AvatarFigure level={lvl} size="sm" selected={lvl === avatarLevel} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats + Badges column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-4 text-center"
                >
                  <Icon className="h-4 w-4 text-raw-gold/40 mx-auto mb-2" />
                  <p className="text-lg font-bold text-raw-text">
                    {stat.key === "polls" ? pollsAnswered : stat.value}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-raw-silver/30 mt-0.5">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Badges */}
          <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/30 p-5">
            <h3 className="font-display text-sm tracking-wide text-raw-text mb-4">Badges</h3>
            <div className="space-y-2.5">
              {badges.map((badge) => (
                <div
                  key={badge.name}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                    badge.earned
                      ? "border-raw-gold/15 bg-raw-gold/[0.03]"
                      : "border-raw-border/15 bg-raw-black/20 opacity-40"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    badge.earned ? "bg-raw-gold/10" : "bg-raw-surface/50"
                  }`}>
                    <Trophy className={`h-4 w-4 ${badge.earned ? "text-raw-gold/60" : "text-raw-silver/20"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${badge.earned ? "text-raw-text" : "text-raw-silver/30"}`}>
                      {badge.name}
                    </p>
                    <p className="text-[10px] text-raw-silver/25">{badge.desc}</p>
                  </div>
                  {badge.earned && (
                    <span className="ml-auto text-[9px] text-raw-gold/50 font-medium shrink-0">Earned</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
