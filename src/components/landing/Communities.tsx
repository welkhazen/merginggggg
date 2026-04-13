import { GlareCard } from "@/components/ui/glare-card";
import { WorldMap } from "@/components/ui/world-map";

const communities = [
  {
    title: "Late Night Talks",
    description:
      "For people who think deeply, feel deeply, and want honest conversation when the world gets quiet.",
    badge: "Founding Community",
  },
  {
    title: "Self-Improvement Circle",
    description:
      "For discipline, accountability, momentum, and becoming stronger with others who are trying too.",
    badge: "Opening First",
  },
  {
    title: "Mental Wellness",
    description:
      "For grounded reflection, support, and conversations that feel safe, real, and useful.",
    badge: "Early Access",
  },
];

const communityConnections = [
  { start: { lat: 40.7128, lng: -74.006 }, end: { lat: 51.5074, lng: -0.1278 } },
  { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 28.6139, lng: 77.209 } },
  { start: { lat: 28.6139, lng: 77.209 }, end: { lat: 35.6762, lng: 139.6503 } },
  { start: { lat: 35.6762, lng: 139.6503 }, end: { lat: -33.8688, lng: 151.2093 } },
  { start: { lat: 40.7128, lng: -74.006 }, end: { lat: -22.9068, lng: -43.1729 } },
  { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 1.3521, lng: 103.8198 } },
];

interface CommunitiesProps {
  onSignupClick: () => void;
}

export function Communities({ onSignupClick }: CommunitiesProps) {
  return (
    <section id="communities" className="relative py-28 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl tracking-wide text-raw-text sm:text-4xl">
            24/7 communities for real talk.
          </h2>
          <p className="mt-4 text-base text-raw-silver/50 max-w-xl mx-auto">
            Start with 3 founding categories. Smaller micro-communities unlock as raW grows.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {communities.map((c) => (
            <GlareCard key={c.title}>
              <div className="rounded-2xl border border-raw-border/50 bg-raw-surface/50 p-8">
                <div className="mb-5 inline-block rounded-full border border-raw-gold/20 bg-raw-gold/5 px-3 py-1">
                  <span className="text-[10px] font-medium tracking-wider text-raw-gold/70 uppercase">
                    {c.badge}
                  </span>
                </div>
                <h3 className="font-display text-base tracking-wide text-raw-text">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-raw-silver/50">{c.description}</p>
              </div>
            </GlareCard>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={onSignupClick}
            className="rounded-full bg-raw-gold px-8 py-3.5 text-sm font-bold text-raw-black transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20"
          >
            Join the Founding Community
          </button>
        </div>

        {/* World Map showing community connections */}
        <div className="mt-16">
          <p className="mb-4 text-center font-display text-[10px] tracking-[0.3em] uppercase text-raw-silver/40">
            Communities worldwide
          </p>
          <WorldMap dots={communityConnections} lineColor="#F1C42D" />
        </div>
      </div>
    </section>
  );
}
