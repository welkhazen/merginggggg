import { useMemo, useState } from "react";
import { Bell, BellOff, Clock3, MessageCircle, Send, Users } from "lucide-react";

type CommunityStatus = "Active" | "Early Access";

interface CommunityRoom {
  id: string;
  abbr: string;
  title: string;
  description: string;
  topic: string;
  members: number;
  active: number;
  status: CommunityStatus;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  pinned?: boolean;
}

const communities: CommunityRoom[] = [
  {
    id: "lnt",
    abbr: "LNT",
    title: "Late Night Talks",
    description: "Honest conversation when the world gets quiet and people finally say what they actually mean.",
    topic: "What thought has been following you all week?",
    members: 342,
    active: 47,
    status: "Active",
  },
  {
    id: "sic",
    abbr: "SIC",
    title: "Self-Improvement Circle",
    description: "Discipline, accountability, and momentum with people who are trying to become sharper every day.",
    topic: "What are you building discipline around right now?",
    members: 518,
    active: 83,
    status: "Active",
  },
  {
    id: "mw",
    abbr: "MW",
    title: "Mental Wellness",
    description: "Grounded reflection, support, and conversation that feels safe, useful, and real.",
    topic: "What has helped your head feel clearer this week?",
    members: 276,
    active: 31,
    status: "Early Access",
  },
  {
    id: "sg",
    abbr: "SG",
    title: "Signal Guild",
    description: "Culture, tech, money, and current events discussed without noise, clout, or recycled takes.",
    topic: "Which signal do you think people are missing right now?",
    members: 401,
    active: 62,
    status: "Active",
  },
];

const seededMessages: Record<string, ChatMessage[]> = {
  lnt: [
    { id: "l1", user: "ghost_mind", text: "Does anyone else feel more alive at 2am than at 2pm?", time: "12m", pinned: true },
    { id: "l2", user: "neon_drift", text: "Night strips away performance. People sound more honest here.", time: "8m" },
    { id: "l3", user: "silent_ash", text: "I only journal when the house is asleep. Feels like my thoughts can breathe.", time: "3m" },
  ],
  sic: [
    { id: "s1", user: "iron_will", text: "Day 30 of cold showers. The real win is doing it when I don’t want to.", time: "24m", pinned: true },
    { id: "s2", user: "steady_form", text: "Micro consistency beats motivation every time.", time: "17m" },
    { id: "s3", user: "updraft", text: "Who else is tracking sleep and training together instead of separately?", time: "5m" },
  ],
  mw: [
    { id: "m1", user: "soft_signal", text: "Gratitude check: one thing you’re thankful for today.", time: "41m", pinned: true },
    { id: "m2", user: "quiet_flame", text: "Naming the feeling early has saved me from spiraling later.", time: "11m" },
    { id: "m3", user: "still_water", text: "Walked without headphones today. My nervous system needed the silence.", time: "6m" },
  ],
  sg: [
    { id: "g1", user: "signal_hunter", text: "Everyone is watching headlines. Nobody is watching behavioral shift.", time: "33m", pinned: true },
    { id: "g2", user: "market_echo", text: "Trust is becoming the rarest product online.", time: "13m" },
    { id: "g3", user: "frictionless", text: "The next big products will feel smaller, quieter, and more intimate.", time: "4m" },
  ],
};

export function DashboardCommunities() {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(communities[0].id);
  const [messageDraft, setMessageDraft] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState<Record<string, boolean>>({
    lnt: true,
    sic: false,
    mw: true,
    sg: false,
  });
  const [messagesByCommunity, setMessagesByCommunity] = useState(seededMessages);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId) ?? communities[0],
    [selectedCommunityId]
  );

  const activeMessages = messagesByCommunity[selectedCommunity.id] ?? [];
  const latestMessage = activeMessages[activeMessages.length - 1];

  const handleSendMessage = () => {
    const trimmedMessage = messageDraft.trim();
    if (!trimmedMessage) {
      return;
    }

    const nextMessage: ChatMessage = {
      id: `${selectedCommunity.id}-${Date.now()}`,
      user: "you_now",
      text: trimmedMessage,
      time: "now",
    };

    setMessagesByCommunity((previous) => ({
      ...previous,
      [selectedCommunity.id]: [...(previous[selectedCommunity.id] ?? []), nextMessage],
    }));
    setMessageDraft("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-raw-text">Communities</h1>
        <p className="mt-2 text-sm text-raw-silver/40">
          Every community is an in-app chat room. Enter, speak, listen, and manage notifications without leaving raW.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          {communities.map((community) => {
            const isSelected = selectedCommunity.id === community.id;
            const previewMessage = (messagesByCommunity[community.id] ?? []).at(-1);

            return (
              <button
                key={community.id}
                onClick={() => setSelectedCommunityId(community.id)}
                className={`w-full rounded-2xl border p-5 text-left transition-all ${
                  isSelected
                    ? "border-raw-gold/50 bg-raw-gold/10"
                    : "border-raw-border/30 bg-raw-surface/30 hover:border-raw-gold/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-raw-gold/15 to-raw-surface text-sm font-display text-raw-gold/70">
                        {community.abbr}
                      </div>
                      <div>
                        <p className="font-display text-sm tracking-wide text-raw-text">{community.title}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-raw-gold/65">{community.status}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-raw-silver/45">{community.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-[10px] text-raw-silver/30">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {community.members}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" /> {community.active} online
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-raw-border/20 bg-raw-black/35 px-3 py-2">
                  <p className="truncate text-[11px] text-raw-silver/40">
                    {previewMessage ? `${previewMessage.user}: ${previewMessage.text}` : "No messages yet."}
                  </p>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="rounded-3xl border border-raw-border/35 bg-raw-surface/30 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-raw-border/20 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-raw-gold/15 to-raw-surface text-base font-display text-raw-gold/70">
                  {selectedCommunity.abbr}
                </div>
                <div>
                  <h2 className="font-display text-lg tracking-wide text-raw-text">{selectedCommunity.title}</h2>
                  <p className="mt-1 text-xs text-raw-silver/40">Topic prompt: {selectedCommunity.topic}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-raw-border/30 px-3 py-1 text-[11px] text-raw-silver/40">
                {selectedCommunity.active} online now
              </div>
              <button
                onClick={() =>
                  setNotificationsEnabled((previous) => ({
                    ...previous,
                    [selectedCommunity.id]: !previous[selectedCommunity.id],
                  }))
                }
                className="flex items-center gap-2 rounded-full border border-raw-gold/20 bg-raw-gold/[0.05] px-3 py-1.5 text-[11px] text-raw-gold/70 transition-colors hover:bg-raw-gold/[0.09]"
              >
                {notificationsEnabled[selectedCommunity.id] ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                {notificationsEnabled[selectedCommunity.id] ? "Notifications On" : "Notifications Off"}
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4">
            {activeMessages.map((message) => {
              const isOwnMessage = message.user === "you_now";

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isOwnMessage
                        ? "bg-raw-gold/12 text-raw-text"
                        : "border border-raw-border/20 bg-raw-surface/30 text-raw-silver/70"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em]">
                      <span className={isOwnMessage ? "text-raw-gold/80" : "text-raw-gold/60"}>{message.user}</span>
                      <span className="text-raw-silver/25">{message.time}</span>
                      {message.pinned && <span className="text-raw-gold/75">Pinned</span>}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{message.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-[11px] text-raw-silver/35">
            <span className="flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" /> Latest activity: {latestMessage?.time ?? "No activity yet"}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> In-app chat only
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-raw-border/20 bg-raw-black/40 p-4">
            <label className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-raw-silver/35">
              Say something real in {selectedCommunity.title}
            </label>
            <div className="flex gap-3">
              <input
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-raw-border/30 bg-raw-surface/30 px-4 py-3 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/25 focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="flex items-center gap-2 rounded-xl bg-raw-gold px-4 py-3 text-sm font-semibold text-raw-black"
              >
                <Send className="h-4 w-4" /> Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
