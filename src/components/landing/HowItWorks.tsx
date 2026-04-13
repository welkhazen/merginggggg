import { Tabs } from "@/components/ui/tabs-aceternity";
import { GlareCard } from "@/components/ui/glare-card";

const tabs = [
  {
    title: "Answer",
    value: "answer",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
        <p>01 — Answer <span className="text-raw-gold">anonymously</span></p>
        <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">Start with a few honest questions. See where you stand instantly.</p>
      </div>
    ),
  },
  {
    title: "Join",
    value: "join",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
        <p>02 — Join the right <span className="text-raw-gold">community</span></p>
        <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">Enter 24/7 spaces built around real needs, not public image.</p>
      </div>
    ),
  },
  {
    title: "Build",
    value: "build",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
        <p>03 — Build your <span className="text-raw-gold">identity</span></p>
        <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">Choose your avatar, level up over time, and make raW feel like yours.</p>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-28 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center font-display text-2xl tracking-wide text-raw-text sm:text-3xl">
          How it works
        </h2>
        <p className="mb-14 text-center text-sm text-raw-silver/40">
          The more you answer, the better raW understands you.
        </p>

        <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative flex flex-col w-full items-start justify-start">
          <Tabs tabs={tabs} />
        </div>
      </div>
    </section>
  );
}
