import { GlareCard } from "../ui/glare-card";

export function GlareCardDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      <GlareCard className="flex flex-col items-center justify-center bg-raw-surface">
        <span className="font-display text-4xl tracking-[0.3em] text-raw-text">
          ra<span className="text-raw-gold">W</span>
        </span>
      </GlareCard>
      <GlareCard className="flex flex-col items-center justify-center bg-raw-surface">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-raw-gold/30 to-raw-gold/5 flex items-center justify-center">
          <span className="font-display text-3xl text-raw-gold">W</span>
        </div>
      </GlareCard>
      <GlareCard className="flex flex-col items-start justify-end py-8 px-6 bg-raw-surface">
        <p className="font-display text-lg text-raw-text">Anonymous.</p>
        <p className="font-normal text-base text-raw-silver/60 mt-4">
          No real names. Just your username and your chosen identity.
        </p>
      </GlareCard>
    </div>
  );
}
