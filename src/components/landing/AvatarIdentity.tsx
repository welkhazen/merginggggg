import { useState } from "react";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { getAvatarTheme } from "@/lib/avatar-theme";

interface AvatarIdentityProps {
  avatarLevel: number;
  onLevelChange: (level: number) => void;
}

const features = [
  {
    title: "Anonymous",
    desc: "No real names. Just your username and your chosen identity.",
  },
  {
    title: "Personal",
    desc: "Pick a theme that feels like you and evolve it through participation.",
  },
  {
    title: "Recognizable",
    desc: "Your avatar becomes your symbol across raW and even your phone icon.",
  },
  {
    title: "Progressive",
    desc: "Start at LVL 1. Grow toward higher forms as you engage more.",
  },
];

export function AvatarIdentity({
  avatarLevel,
  onLevelChange,
}: AvatarIdentityProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const displayLevel = hoveredLevel ?? avatarLevel;
  const theme = getAvatarTheme(displayLevel);

  return (
    <section id="avatar" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl tracking-wide text-raw-text sm:text-4xl">
            Your avatar is your identity.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-raw-silver/50">
            Choose your theme. Level up over time. Make your avatar your app icon.
          </p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-raw-gold/40" />
                <div>
                  <h3 className="font-display text-sm tracking-wide text-raw-text">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-raw-silver/50">{feature.desc}</p>
                </div>
              </div>
            ))}
            <p className="text-sm italic text-raw-gold/60">
              Earn your look. Don't just pick it.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-2">
              <AvatarFigure level={displayLevel} size="xl" selected />
            </div>
            <p className="mt-1 font-display text-sm uppercase tracking-[0.2em] text-raw-text">
              Level {displayLevel}
            </p>
            <p className="mt-0.5 text-xs text-raw-silver/40">{theme.name}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
                <button
                  key={level}
                  onClick={() => onLevelChange(level)}
                  onMouseEnter={() => setHoveredLevel(level)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  className="group flex flex-col items-center gap-1"
                >
                  <AvatarFigure
                    level={level}
                    size="sm"
                    selected={level === avatarLevel}
                  />
                  <span
                    className={`text-[9px] font-bold tracking-wider transition-colors ${
                      level === avatarLevel
                        ? "text-raw-gold"
                        : "text-raw-silver/30 group-hover:text-raw-silver/60"
                    }`}
                  >
                    LVL {level}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-10">
              <p className="mb-4 text-center font-display text-[10px] uppercase tracking-[0.3em] text-raw-silver/30">
                Your app icon
              </p>
              <PhoneMockup>
                <div className="min-h-[480px] bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0] px-5 py-4">
                  <div className="grid grid-cols-4 gap-x-4 gap-y-5">
                    <AppIcon color="#32D74B" label="FaceTime" />
                    <AppIcon color="#FF3B30" label="Calendar" />
                    <AppIcon color="#FF9500" label="Photos" />
                    <AppIcon color="#5856D6" label="Camera" />
                    <AppIcon color="#000000" label="Clock" />
                    <AppIcon color="#34C759" label="Maps" />
                    <AppIcon color="#5AC8FA" label="Weather" />
                    <AppIcon color="#FFCC00" label="Notes" />
                    <AppIcon color="#FF2D55" label="Music" />
                    <AppIcon color="#AF52DE" label="Podcasts" />
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[12px] shadow-md"
                        style={{ background: theme.bg }}
                      >
                        <AvatarFigure level={displayLevel} size="sm" />
                      </div>
                      <span className="text-[8px] font-medium text-[#333]">raW</span>
                    </div>
                    <AppIcon color="#007AFF" label="Safari" />
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppIcon({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-[52px] w-[52px] rounded-[12px] shadow-sm"
        style={{ background: color, opacity: 0.7 }}
      />
      <span className="text-[8px] font-medium text-[#333]">{label}</span>
    </div>
  );
}
