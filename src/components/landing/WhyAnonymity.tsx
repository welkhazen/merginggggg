import { GlareCard } from "@/components/ui/glare-card";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const cards = [
  {
    title: "Less pressure",
    description: "People answer more honestly when they are not performing.",
  },
  {
    title: "Better communities",
    description: "Real connection starts when people stop managing appearances.",
  },
  {
    title: "Stronger signals",
    description: "Honest participation creates better recommendations over time.",
  },
];

const testimonials = [
  {
    quote: "I've never felt this comfortable being honest online. No judgment, just real talk.",
    name: "anon_wolf",
    title: "LVL 7 · Late Night Talks",
  },
  {
    quote: "The anonymity actually makes the community stronger. People show up as who they really are.",
    name: "midnight_sage",
    title: "LVL 5 · Self-Improvement Circle",
  },
  {
    quote: "Finally a place where I don't have to perform. I just exist and connect.",
    name: "quiet_storm",
    title: "LVL 4 · Mental Wellness",
  },
  {
    quote: "My avatar feels more like me than my real profile ever did. That says something.",
    name: "echo_mind",
    title: "LVL 8 · Late Night Talks",
  },
  {
    quote: "The polls are addictive. Seeing how others think without the social pressure is powerful.",
    name: "raw_thinker",
    title: "LVL 6 · Self-Improvement Circle",
  },
];

export function WhyAnonymity() {
  return (
    <section className="relative py-28 px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center font-display text-2xl tracking-wide text-raw-text sm:text-3xl">
          No real names. Better honesty. Better matching.
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <GlareCard key={card.title}>
              <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/30 p-7 text-center">
                <h3 className="font-display text-sm tracking-wide text-raw-text">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-raw-silver/45">{card.description}</p>
              </div>
            </GlareCard>
          ))}
        </div>

        {/* Testimonials marquee */}
        <div className="mt-16">
          <p className="mb-6 text-center font-display text-[10px] tracking-[0.3em] uppercase text-raw-silver/40">
            From the community
          </p>
          <InfiniteMovingCards
            items={testimonials}
            direction="left"
            speed="slow"
            className="mx-auto"
          />
        </div>
      </div>
    </section>
  );
}
