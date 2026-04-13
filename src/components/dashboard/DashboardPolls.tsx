import type { Poll } from "@/store/useRawStore";
import { GlareCard } from "@/components/ui/glare-card";
import { BarChart3, TrendingUp, Users } from "lucide-react";

interface DashboardPollsProps {
  polls: Poll[];
  votedPolls: Set<string>;
  onVote: (pollId: string, optionId: string) => void;
}

function PollCard({
  poll,
  hasVoted,
  onVote,
}: {
  poll: Poll;
  hasVoted: boolean;
  onVote: (optionId: string) => void;
}) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <GlareCard>
      <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-6">
        <p className="font-display text-sm tracking-wide text-raw-text">{poll.question}</p>
        <div className="mt-5 space-y-2.5">
          {poll.options.map((option) => {
            const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            return (
              <button
                key={option.id}
                onClick={() => !hasVoted && onVote(option.id)}
                disabled={hasVoted}
                className={`relative w-full overflow-hidden rounded-xl border text-left transition-all ${
                  hasVoted
                    ? "border-raw-border/20 bg-raw-black/40 cursor-default"
                    : "border-raw-border/40 bg-raw-black/30 hover:border-raw-gold/20 cursor-pointer"
                }`}
              >
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 bg-raw-gold/10 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-raw-silver/70">{option.text}</span>
                  {hasVoted && (
                    <span className="text-[11px] font-medium text-raw-gold/60">{pct}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {hasVoted && (
          <p className="mt-3 text-[10px] text-raw-silver/25">
            {totalVotes.toLocaleString()} anonymous responses
          </p>
        )}
      </div>
    </GlareCard>
  );
}

export function DashboardPolls({ polls, votedPolls, onVote }: DashboardPollsProps) {
  const totalResponses = polls.reduce(
    (sum, p) => sum + p.options.reduce((s, o) => s + o.votes, 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl tracking-wide text-raw-text">Polls</h1>
        <p className="mt-2 text-sm text-raw-silver/40">
          Answer anonymously. See live results. Shape the community signal.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-4 text-center">
          <BarChart3 className="h-4 w-4 text-raw-gold/40 mx-auto mb-2" />
          <p className="text-lg font-bold text-raw-text">{polls.length}</p>
          <p className="text-[9px] uppercase tracking-wider text-raw-silver/30">Active Polls</p>
        </div>
        <div className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-4 text-center">
          <Users className="h-4 w-4 text-raw-gold/40 mx-auto mb-2" />
          <p className="text-lg font-bold text-raw-text">{totalResponses.toLocaleString()}</p>
          <p className="text-[9px] uppercase tracking-wider text-raw-silver/30">Total Votes</p>
        </div>
        <div className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-4 text-center">
          <TrendingUp className="h-4 w-4 text-raw-gold/40 mx-auto mb-2" />
          <p className="text-lg font-bold text-raw-text">{votedPolls.size}</p>
          <p className="text-[9px] uppercase tracking-wider text-raw-silver/30">Your Answers</p>
        </div>
      </div>

      {/* Poll grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            hasVoted={votedPolls.has(poll.id)}
            onVote={(optionId) => onVote(poll.id, optionId)}
          />
        ))}
      </div>
    </div>
  );
}
