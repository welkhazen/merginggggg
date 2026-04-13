import { Terminal } from "@/components/ui/terminal";

const howItWorksSteps = [
  "01 Sign up anonymously and enter your raW app",
  "02 Build your identity - choose your avatar and change it if earned",
  "03 Answer anonymously",
  "04 Enter your personalized ecosystem",
  "05 Find your people. Find your place. Find yourself",
];

const howItWorksOutputs = {
  0: ["Create a username and step into raW without using your real-world identity."],
  1: ["Build your identity through the avatar you choose and the upgrades you earn."],
  2: ["Start with a few honest questions - if you can...."],
  3: [
    "Join communities available for now.",
    "Answer questions consistently and honestly so you can unlock:",
    "The Cumulative Mind - The Brain",
  ],
  4: [
    "And, for now, as we build your real application...",
    "enjoy your 24/7 online world. always living and always accepting.",
    "join the communities and speak freely.",
    "Express yourself, say what you think, be heard,",
    "and feel like you belong.",
    "you will figure out the rest.",
    "Join now. surprises are waiting for you...",
  ],
} satisfies Record<number, string[]>;

export function HowItWorks() {
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center font-display text-2xl tracking-wide text-raw-text sm:text-3xl">
          How it works
        </h2>
        <p className="mx-auto mb-14 max-w-2xl text-center text-sm leading-relaxed text-raw-silver/40">
          raW learns through honest participation. This shell now walks people in the same order
          the real product will.
        </p>

        <div className="rounded-[2rem] border border-raw-border/40 bg-gradient-to-b from-raw-surface/60 to-raw-black/90 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-6">
          <Terminal
            className="max-w-4xl"
            username="raw-world"
            commands={howItWorksSteps}
            outputs={howItWorksOutputs}
            typingSpeed={26}
            delayBetweenCommands={950}
            initialDelay={200}
            enableSound={false}
          />
        </div>
      </div>
    </section>
  );
}
