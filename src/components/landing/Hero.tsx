import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { Boxes } from "@/components/ui/background-boxes";

interface HeroProps {
  onSignupClick: () => void;
}

export function Hero({ onSignupClick }: HeroProps) {
  const words = [
    { text: "Find", className: "text-raw-text" },
    { text: "your", className: "text-raw-text" },
    { text: "people.", className: "text-raw-gold" },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background Boxes */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-raw-black via-raw-black to-raw-surface/30 z-[1]" />
        <Boxes className="opacity-30" />
      </div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-raw-gold/[0.03] blur-[120px] z-[1]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 w-full">
        <div className="flex items-center justify-center">
          {/* Copy */}
          <div className="animate-fade-in-up">
            <p className="mb-6 font-display text-[11px] tracking-[0.35em] uppercase text-raw-gold/70">
              Anonymous &bull; Community-First &bull; Identity-Driven
            </p>

            <TypewriterEffect
              words={words}
              className="!text-left !text-4xl sm:!text-5xl lg:!text-[3.4rem] !font-display !tracking-wide !leading-tight"
            />

            <p className="mt-4 font-display text-xl tracking-wide text-metallic sm:text-2xl lg:text-3xl">
              Grow behind your avatar.
            </p>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-raw-silver/60">
              Answer a few honest questions, join the right 24/7 communities,
              and build an identity that feels like yours — without using your real name.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={onSignupClick}
                className="rounded-full bg-raw-gold px-8 py-3.5 text-sm font-bold text-raw-black transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20"
              >
                Join Free
              </button>
              <a
                href="#communities"
                className="rounded-full border border-raw-border px-8 py-3.5 text-sm font-medium text-raw-silver/80 transition-all hover:border-raw-silver/30 hover:text-raw-text"
              >
                Explore the 3 Founding Communities
              </a>
            </div>

            <p className="mt-5 text-xs text-raw-silver/40">
              Username + password only.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
