import { ContainerTextFlip } from "@/components/ui/container-text-flip";

interface FinalCTAProps {
  onSignupClick: () => void;
}

export function FinalCTA({ onSignupClick }: FinalCTAProps) {
  return (
    <section className="relative py-32 px-6">
      {/* Subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-raw-gold/[0.04] blur-[100px]" />

      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl tracking-wide text-raw-text sm:text-4xl">
          Join early. Stay{" "}
        </h2>
        <div className="mt-4 flex items-center justify-center">
          <ContainerTextFlip
            words={["anonymous", "connected", "yourself", "raW"]}
            interval={2500}
            className="!text-3xl sm:!text-4xl"
          />
        </div>
        <p className="mt-6 text-base text-raw-silver/50 max-w-lg mx-auto">
          Be part of the first communities, shape the first signals, and build your identity from day one.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onSignupClick}
            className="rounded-full bg-raw-gold px-8 py-3.5 text-sm font-bold text-raw-ink transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20"
          >
            Create your anonymous account
          </button>
          <a
            href="#communities"
            className="rounded-full border border-raw-border px-8 py-3.5 text-sm font-medium text-raw-silver/80 transition-all hover:border-raw-silver/30 hover:text-raw-text"
          >
            Explore communities
          </a>
        </div>

        <p className="mt-5 text-xs text-raw-silver/40">Username + password only.</p>
      </div>

      {/* Footer */}
      <div className="mt-28 border-t border-raw-border/30 pt-8">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="font-display text-sm tracking-[0.2em] text-raw-silver/30">
            ra<span className="text-raw-gold/50">W</span>
          </p>
          <p className="text-xs text-raw-silver/20">
            theartofraw.me
          </p>
        </div>
      </div>
    </section>
  );
}
