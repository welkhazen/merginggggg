import { useState } from "react";
import { AvatarFigure, getAvatarTheme } from "@/components/ui/avatar-figure";
import { PhoneMockup } from "@/components/ui/phone-mockup";

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
    desc: "Your avatar becomes your symbol across raW — and even your phone icon.",
  },
  {
    title: "Progressive",
    desc: "Start at LVL 1. Grow toward higher forms as you engage more.",
  },
];

export function AvatarIdentity({ avatarLevel, onLevelChange }: AvatarIdentityProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const displayLevel = hoveredLevel ?? avatarLevel;
  const theme = getAvatarTheme(displayLevel);

  return (
    <section id="avatar" className="relative py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl tracking-wide text-raw-text sm:text-4xl">
            Your avatar is your identity.
          </h2>
          <p className="mt-4 text-base text-raw-silver/50 max-w-xl mx-auto">
            Choose your theme. Level up over time. Make your avatar your app icon.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left: Features */}
          <div className="space-y-8">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-raw-gold/40" />
                <div>
                  <h3 className="font-display text-sm tracking-wide text-raw-text">{f.title}</h3>
                  <p className="mt-1 text-sm text-raw-silver/50">{f.desc}</p>
                </div>
              </div>
            ))}
            <p className="text-sm text-raw-gold/60 italic">
              Earn your look. Don't just pick it.
            </p>
          </div>

          {/* Right: Phone mockup showing avatar profile */}
          <div className="flex flex-col items-center">
            <PhoneMockup>
              <div className="bg-[#0a0a0a] px-4 py-4 min-h-[480px] flex flex-col">
                {/* Avatar display area */}
                <div className="flex flex-col items-center pt-4 pb-3">
                  {/* Large selected avatar with glow ring */}
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-full opacity-20 blur-xl"
                      style={{ background: theme.glow !== "none" ? theme.glow : theme.ring }}
                    />
                    <AvatarFigure level={displayLevel} size="xl" selected />
                  </div>
                  <p className="font-display text-sm tracking-[0.25em] uppercase text-white mt-3">
                    Level {displayLevel}
                  </p>
                  <p className="text-[11px] text-white/35 mt-0.5">{theme.name}</p>
                </div>

                {/* Level selector grid */}
                <div className="mt-4">
                  {/* Row 1: Levels 1-6 */}
                  <div className="flex items-center justify-center gap-1.5">
                    {Array.from({ length: 6 }, (_, i) => i + 1).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => onLevelChange(lvl)}
                        onMouseEnter={() => setHoveredLevel(lvl)}
                        onMouseLeave={() => setHoveredLevel(null)}
                        className="flex flex-col items-center gap-0.5 group"
                      >
                        <AvatarFigure
                          level={lvl}
                          size="sm"
                          selected={lvl === avatarLevel}
                        />
                        <span className={`text-[7px] font-bold tracking-wider transition-colors ${
                          lvl === avatarLevel
                            ? "text-white"
                            : "text-white/25 group-hover:text-white/50"
                        }`}>
                          LVL {lvl}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Row 2: Levels 7-10 */}
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    {Array.from({ length: 4 }, (_, i) => i + 7).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => onLevelChange(lvl)}
                        onMouseEnter={() => setHoveredLevel(lvl)}
                        onMouseLeave={() => setHoveredLevel(null)}
                        className="flex flex-col items-center gap-0.5 group"
                      >
                        <AvatarFigure
                          level={lvl}
                          size="sm"
                          selected={lvl === avatarLevel}
                        />
                        <span className={`text-[7px] font-bold tracking-wider transition-colors ${
                          lvl === avatarLevel
                            ? "text-raw-gold"
                            : "text-white/25 group-hover:text-white/50"
                        }`}>
                          LVL {lvl}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5 mt-4 pt-3">
                  <p className="text-center text-[9px] text-white/20 tracking-wider uppercase font-display">
                    Your app icon
                  </p>
                </div>

                {/* App icon preview */}
                <div className="flex items-center justify-center mt-3 pb-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className="h-[60px] w-[60px] rounded-[14px] flex items-center justify-center shadow-lg overflow-hidden border border-white/10"
                      style={{ background: theme.bg }}
                    >
                      <AvatarFigure level={displayLevel} size="sm" />
                    </div>
                    <span className="text-[9px] text-white/50 font-medium">raW</span>
                  </div>
                </div>
              </div>
            </PhoneMockup>
          </div>
        </div>
      </div>
    </section>
  );
}
