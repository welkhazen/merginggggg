import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { Boxes } from "@/components/ui/background-boxes";
import { Logo3D } from "@/components/ui/logo-3d";

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
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pb-16 pt-24 sm:pt-28">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-raw-black via-raw-black to-raw-surface/30" />
        <Boxes className="opacity-30" />
      </div>

      <div className="absolute left-1/2 top-[28%] z-[1] h-[62vw] max-h-[620px] w-[62vw] max-w-[620px] -translate-x-1/2 rounded-full bg-raw-gold/[0.035] blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <div className="mb-7 sm:mb-8">
          <Logo3D size={118} interactive className="sm:[width:136px] sm:[height:136px] md:[width:148px] md:[height:148px]" />
        </div>

        <p className="mb-5 font-display text-[10px] uppercase tracking-[0.33em] text-raw-gold/70 sm:text-[11px]">
          Anonymous &bull; Community-First &bull; Identity-Driven
        </p>

        <TypewriterEffect
          words={words}
          className="!text-center !font-display !text-[2rem] !leading-[1.15] !tracking-wide sm:!text-[2.7rem] md:!text-[3.25rem]"
        />

        <p className="mt-4 font-display text-lg tracking-wide text-metallic sm:text-2xl">Grow behind your avatar.</p>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-raw-silver/60 sm:text-lg">
          Answer a few honest questions, join the right 24/7 communities, and build an identity that feels like yours —
          without using your real name.
        </p>

        <div className="mt-9 flex w-full max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <button
            type="button"
            onClick={onSignupClick}
            className="w-full rounded-full bg-raw-gold px-8 py-3.5 text-sm font-bold text-raw-black transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20 sm:w-auto"
          >
            Join Free
          </button>

          <a
            href="#communities"
            className="w-full rounded-full border border-raw-border px-8 py-3.5 text-center text-sm font-medium text-raw-silver/80 transition-all hover:border-raw-silver/30 hover:text-raw-text sm:w-auto"
          >
            Explore the 3 Founding Communities
          </a>
        </div>

        <p className="mt-5 text-xs text-raw-silver/40">Username + password only.</p>
      </div>
    </section>
  );
}
