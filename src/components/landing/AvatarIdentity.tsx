import { useState } from "react";
import { AvatarFigure, getAvatarTheme } from "@/components/ui/avatar-figure";
import { PhoneMockup } from "@/components/ui/phone-mockup";

interface AvatarIdentityProps {
  avatarLevel: number;
  onLevelChange: (level: number) => void;
}

export function AvatarIdentity({ avatarLevel, onLevelChange }: AvatarIdentityProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const displayLevel = hoveredLevel ?? avatarLevel;
  const theme = getAvatarTheme(displayLevel);

  return (
    <section id="avatar" className="relative py-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl tracking-wide text-raw-text sm:text-4xl">
            Choose your identity level
          </h2>
          <p className="mt-3 text-sm text-raw-silver/50">
            Select your avatar and watch it evolve on your phone
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left: Avatar Selector Grid (3 rows) */}
          <div className="flex flex-col items-center justify-center">
            <div className="space-y-6">
              {/* Row 1: Levels 1-3 */}
              <div className="flex items-center justify-center gap-4">
                {Array.from({ length: 3 }, (_, i) => i + 1).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => onLevelChange(lvl)}
                    onMouseEnter={() => setHoveredLevel(lvl)}
                    onMouseLeave={() => setHoveredLevel(null)}
                    className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
                  >
                    <div
                      className={`rounded-full p-1 transition-all ${
                        lvl === avatarLevel
                          ? "border-2 border-raw-gold ring-2 ring-raw-gold/30"
                          : "border-2 border-raw-border hover:border-raw-gold/50"
                      }`}
                    >
                      <AvatarFigure level={lvl} size="lg" selected={lvl === avatarLevel} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Row 2: Levels 4-6 */}
              <div className="flex items-center justify-center gap-4">
                {Array.from({ length: 3 }, (_, i) => i + 4).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => onLevelChange(lvl)}
                    onMouseEnter={() => setHoveredLevel(lvl)}
                    onMouseLeave={() => setHoveredLevel(null)}
                    className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
                  >
                    <div
                      className={`rounded-full p-1 transition-all ${
                        lvl === avatarLevel
                          ? "border-2 border-raw-gold ring-2 ring-raw-gold/30"
                          : "border-2 border-raw-border hover:border-raw-gold/50"
                      }`}
                    >
                      <AvatarFigure level={lvl} size="lg" selected={lvl === avatarLevel} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Row 3: Levels 7-9 */}
              <div className="flex items-center justify-center gap-4">
                {Array.from({ length: 3 }, (_, i) => i + 7).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => onLevelChange(lvl)}
                    onMouseEnter={() => setHoveredLevel(lvl)}
                    onMouseLeave={() => setHoveredLevel(null)}
                    className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
                  >
                    <div
                      className={`rounded-full p-1 transition-all ${
                        lvl === avatarLevel
                          ? "border-2 border-raw-gold ring-2 ring-raw-gold/30"
                          : "border-2 border-raw-border hover:border-raw-gold/50"
                      }`}
                    >
                      <AvatarFigure level={lvl} size="lg" selected={lvl === avatarLevel} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="flex flex-col items-center justify-center">
            <PhoneMockup>
              <div className="bg-gradient-to-b from-slate-50 to-slate-100 px-2 py-1 flex flex-col h-full overflow-hidden">
                {/* App Grid - 5 column iOS layout */}
                <div className="grid grid-cols-5 gap-2 px-1 py-2 flex-1 overflow-y-auto">
                  {/* FaceTime */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl shadow-md">📹</div>
                    <span className="text-[8px] text-slate-600 font-medium text-center line-clamp-1">FaceTime</span>
                  </div>

                  {/* Calendar */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-[22px] bg-white border border-slate-200 flex items-center justify-center font-bold text-lg shadow-md">23</div>
                    <span className="text-[8px] text-slate-600 font-medium text-center line-clamp-1">Calendar</span>
                  </div>

                  {/* Camera */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center text-2xl shadow-md">📷</div>
                    <span className="text-[8px] text-slate-600 font-medium text-center line-clamp-1">Camera</span>
                  </div>

                  {/* Clock */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-[22px] bg-slate-800 flex items-center justify-center text-2xl shadow-md">🕐</div>
                    <span className="text-[8px] text-slate-600 font-medium text-center line-clamp-1">Clock</span>
                  </div>

                  {/* Weather */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xl shadow-md">☁️</div>
                    <span className="text-[8px] text-slate-600 font-medium text-center line-clamp-1">Weather</span>
                  </div>

                  {/* Notes */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-[22px] bg-yellow-400 flex items-center justify-center text-2xl shadow-md">📝</div>
                    <span className="text-[8px] text-slate-600 font-medium text-center line-clamp-1">Notes</span>
                  </div>

                  {/* Reminders */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-2xl shadow-md">✓</div>
                    <span className="text-[8px] text-slate-600 font-medium text-center line-clamp-1">Reminders</span>
                  </div>

                  {/* Stocks */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-[22px] bg-slate-900 flex items-center justify-center text-xl shadow-md">📈</div>
                    <span className="text-[8px] text-slate-600 font-medium text-center line-clamp-1">Stocks</span>
                  </div>

                  {/* Maps */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-[22px] bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center text-2xl shadow-md">🗺️</div>
                    <span className="text-[8px] text-slate-600 font-medium text-center line-clamp-1">Maps</span>
                  </div>

                  {/* Your raW Avatar */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-full aspect-square rounded-[22px] flex items-center justify-center shadow-lg border border-white relative overflow-hidden"
                      style={{ background: theme.bg }}
                    >
                      <div
                        className="absolute inset-0 opacity-40 blur-xl"
                        style={{ background: theme.glow !== "none" ? theme.glow : theme.ring }}
                      />
                      <div className="relative z-10 scale-50">
                        <AvatarFigure level={displayLevel} size="lg" />
                      </div>
                    </div>
                    <span className="text-[8px] text-slate-600 font-bold text-center line-clamp-1">raW</span>
                  </div>
                </div>

                {/* Dock */}
                <div className="mt-1 mx-1 bg-white/60 backdrop-blur rounded-2xl py-1 px-1 flex gap-1 justify-center shadow-lg border border-white/40">
                  <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center text-lg shadow">📞</div>
                  <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-lg shadow">🧭</div>
                  <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center text-lg shadow">💬</div>
                  <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center text-lg shadow">🎵</div>
                </div>
              </div>
            </PhoneMockup>
          </div>
        </div>
      </div>
    </section>
  );
}
