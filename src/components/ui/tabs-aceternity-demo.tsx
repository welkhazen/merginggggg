"use client";
import { Tabs } from "./tabs-aceternity";
export function TabsDemo() {
  const tabs = [
    {
      title: "Polls",
      value: "polls",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
          <p>Answer <span className="text-raw-gold">anonymously</span></p>
          <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">Start with a few honest questions. See where you stand instantly.</p>
        </div>
      ),
    },
    {
      title: "Communities",
      value: "communities",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
          <p>24/7 <span className="text-raw-gold">communities</span></p>
          <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">Enter spaces built around real needs, not public image.</p>
        </div>
      ),
    },
    {
      title: "Avatar",
      value: "avatar",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
          <p>Build your <span className="text-raw-gold">identity</span></p>
          <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">Choose your avatar, level up over time, and make raW feel like yours.</p>
        </div>
      ),
    },
    {
      title: "Support",
      value: "support",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
          <p>Better-fit <span className="text-raw-gold">support</span></p>
          <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">Access coaches, mentors, and therapists matched to your real needs.</p>
        </div>
      ),
    },
  ];
  return (
    <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative flex flex-col max-w-5xl mx-auto w-full items-start justify-start my-40">
      <Tabs tabs={tabs} />
    </div>
  );
}
