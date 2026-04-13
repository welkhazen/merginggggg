import { describe, expect, it } from "vitest";
import { computeRawInsights } from "./insights-engine";
import type { InsightComputationContext } from "./types";

const baseContext: InsightComputationContext = {
  polls: [
    {
      id: "poll-1",
      question: "Q1",
      locked: false,
      options: [
        { id: "p1-yes", text: "Yes", votes: 10 },
        { id: "p1-no", text: "No", votes: 8 },
      ],
    },
    {
      id: "poll-2",
      question: "Q2",
      locked: false,
      options: [
        { id: "p2-yes", text: "Yes", votes: 11 },
        { id: "p2-no", text: "No", votes: 7 },
      ],
    },
    {
      id: "poll-3",
      question: "Q3",
      locked: false,
      options: [
        { id: "p3-yes", text: "Yes", votes: 12 },
        { id: "p3-no", text: "No", votes: 6 },
      ],
    },
  ],
  votedPolls: new Set<string>(),
  votedOptions: {},
  avatarLevel: 1,
  purchasedInsightIds: new Set<string>(),
};

describe("computeRawInsights", () => {
  it("keeps the first insight unlocked at level 1 because it is free", () => {
    const [first] = computeRawInsights(baseContext);
    expect(first.id).toBe("signal-discipline");
    expect(first.status).toBe("ready");
  });

  it("locks premium insights by level before purchase state", () => {
    const insights = computeRawInsights(baseContext);
    const growth = insights.find((x) => x.id === "growth-friction-index");

    expect(growth?.status).toBe("locked-level");
  });

  it("uses votedPolls coverage only for polls currently available", () => {
    const insights = computeRawInsights({
      ...baseContext,
      votedPolls: new Set(["poll-1", "poll-x-stale"]),
      votedOptions: {
        "poll-1": "p1-yes",
      },
    });

    const discipline = insights.find((x) => x.id === "signal-discipline");
    expect(discipline?.confidence).toBe(40);
  });
});
