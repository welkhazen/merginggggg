import { GlareCard } from "@/components/ui/glare-card";
import { WorldMap } from "@/components/ui/world-map";
import { Users, MessageCircle, Clock, ChevronRight } from "lucide-react";

const communities = [
  {
    id: "lnt",
    abbr: "LNT",
    title: "Late Night Talks",
    description: "For people who think deeply, feel deeply, and want honest conversation when the world gets quiet.",
    members: 342,
    active: 47,
    status: "Active" as const,
  },
  {
    id: "sic",
    abbr: "SIC",
    title: "Self-Improvement Circle",
    description: "For discipline, accountability, momentum, and becoming stronger with others who are trying too.",
    members: 518,
    active: 83,
    status: "Active" as const,
  },
  {
    id: "mw",
    abbr: "MW",
    title: "Mental Wellness",
    description: "For grounded reflection, support, and conversations that feel safe, real, and useful.",
    members: 276,
    active: 31,
    status: "Early Access" as const,
  },
];

const recentMessages = [
  { community: "Late Night Talks", user: "ghost_mind", text: "Does anyone else feel more alive at 2am?", time: "12m" },
  { community: "Self-Improvement", user: "iron_will", text: "Day 30 of cold showers. AMA.", time: "24m" },
  { community: "Mental Wellness", user: "soft_signal", text: "Gratitude check: one thing you're thankful for today.", time: "41m" },
  { community: "Late Night Talks", user: "neon_drift", text: "The silence between thoughts is where the truth is.", time: "1h" },
];

const mapDots = [
  { start: { lat: 40.7128, lng: -74.006 }, end: { lat: 51.5074, lng: -0.1278 } },
  { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 28.6139, lng: 77.209 } },
  { start: { lat: 28.6139, lng: 77.209 }, end: { lat: 35.6762, lng: 139.6503 } },
  { start: { lat: 35.6762, lng: 139.6503 }, end: { lat: -33.8688, lng: 151.2093 } },
  { start: { lat: 40.7128, lng: -74.006 }, end: { lat: -22.9068, lng: -43.1729 } },
];

export function DashboardCommunities() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl tracking-wide text-raw-text">Communities</h1>
        <p className="mt-2 text-sm text-raw-silver/40">
          24/7 spaces for real talk. No performance. No real names.
        </p>
      </div>

      {/* Community cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {communities.map((c) => (
          <GlareCard key={c.id}>
            <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-6 h-full">
              <div className="h-24 rounded-xl bg-gradient-to-br from-raw-gold/10 to-raw-surface mb-4 flex items-center justify-center">
                <span className="font-display text-2xl text-raw-gold/20">{c.abbr}</span>
              </div>
              <div className="mb-3 inline-block rounded-full border border-raw-gold/20 bg-raw-gold/5 px-2.5 py-0.5">
                <span className="text-[9px] font-medium tracking-wider text-raw-gold/70 uppercase">
                  {c.status}
                </span>
              </div>
              <h3 className="font-display text-sm tracking-wide text-raw-text">{c.title}</h3>
              <p className="mt-2 text-xs text-raw-silver/40 leading-relaxed">{c.description}</p>
              <div className="mt-4 flex items-center gap-4 text-[10px] text-raw-silver/30">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {c.members}
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500/60" /> {c.active} online
                </span>
              </div>
              <button className="mt-4 w-full rounded-xl border border-raw-gold/20 bg-raw-gold/[0.04] py-2 text-xs font-medium text-raw-gold/70 hover:bg-raw-gold/10 transition-all flex items-center justify-center gap-1">
                Enter <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </GlareCard>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="font-display text-base tracking-wide text-raw-text mb-4">Recent Activity</h2>
        <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/30 divide-y divide-raw-border/15">
          {recentMessages.map((msg, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-raw-gold/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="h-3.5 w-3.5 text-raw-gold/40" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-raw-gold/60">{msg.user}</span>
                  <span className="text-[9px] text-raw-silver/20">in {msg.community}</span>
                </div>
                <p className="mt-0.5 text-xs text-raw-silver/50 truncate">{msg.text}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-raw-silver/20 shrink-0">
                <Clock className="h-2.5 w-2.5" /> {msg.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* World Map */}
      <div>
        <p className="mb-3 font-display text-[10px] tracking-[0.3em] uppercase text-raw-silver/30 text-center">
          Members worldwide
        </p>
        <WorldMap dots={mapDots} lineColor="#F1C42D" />
      </div>
    </div>
  );
}
