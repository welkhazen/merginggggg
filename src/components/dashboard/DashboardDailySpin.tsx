import { useEffect, useMemo, useState } from "react";
import { Gift, Sparkles, Star, Zap, Clock } from "lucide-react";
import { WheelOfFortune, type WheelPrize } from "@/components/wheel/WheelOfFortune";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DashboardDailySpinProps {
  userId: string;
}

const PRIZES: WheelPrize[] = [
  { id: "xp-50", label: "50 XP", shortLabel: "50 XP", color: "#121212", textColor: "#D9D9D9" },
  { id: "try-1", label: "Try Again", shortLabel: "TRY AGAIN", color: "#0e0e0e", textColor: "#666" },
  { id: "xp-100", label: "100 XP", shortLabel: "100 XP", color: "#121212", textColor: "#F1C42D" },
  { id: "streak", label: "Streak Shield", shortLabel: "SHIELD", color: "#0e0e0e", textColor: "#D9D9D9" },
  { id: "xp-200", label: "200 XP", shortLabel: "200 XP", color: "#121212", textColor: "#F1C42D" },
  { id: "try-2", label: "Try Again", shortLabel: "TRY AGAIN", color: "#0e0e0e", textColor: "#666" },
  { id: "theme", label: "Avatar Theme", shortLabel: "THEME", color: "#1a1508", textColor: "#F1C42D" },
  { id: "xp-50b", label: "50 XP", shortLabel: "50 XP", color: "#0e0e0e", textColor: "#D9D9D9" },
  { id: "try-3", label: "Try Again", shortLabel: "TRY AGAIN", color: "#121212", textColor: "#666" },
  { id: "xp-500", label: "500 XP Jackpot!", shortLabel: "500 XP", color: "#1a1508", textColor: "#F1C42D" },
  { id: "badge", label: "Community Badge", shortLabel: "BADGE", color: "#121212", textColor: "#D9D9D9" },
  { id: "xp-100b", label: "100 XP", shortLabel: "100 XP", color: "#0e0e0e", textColor: "#F1C42D" },
];

const prizeMessages: Record<string, { title: string; desc: string; icon: typeof Gift }> = {
  "xp-50": { title: "50 XP Earned!", desc: "Every bit counts on your journey.", icon: Zap },
  "xp-50b": { title: "50 XP Earned!", desc: "Every bit counts on your journey.", icon: Zap },
  "xp-100": { title: "100 XP Earned!", desc: "Solid spin! Your avatar grows stronger.", icon: Star },
  "xp-100b": { title: "100 XP Earned!", desc: "Solid spin! Your avatar grows stronger.", icon: Star },
  "xp-200": { title: "200 XP Earned!", desc: "Big win! You're leveling up fast.", icon: Sparkles },
  "xp-500": { title: "500 XP Jackpot!", desc: "Incredible! The wheel favors the bold.", icon: Gift },
  streak: { title: "Streak Shield!", desc: "Your streak is protected for one missed day.", icon: Sparkles },
  theme: { title: "Avatar Theme Unlocked!", desc: "A new look awaits you in the Marketplace.", icon: Gift },
  badge: { title: "Community Badge!", desc: "Show it off in your communities.", icon: Star },
  "try-1": { title: "Not This Time", desc: "The wheel will turn again tomorrow.", icon: Clock },
  "try-2": { title: "Not This Time", desc: "The wheel will turn again tomorrow.", icon: Clock },
  "try-3": { title: "Not This Time", desc: "The wheel will turn again tomorrow.", icon: Clock },
};

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function DashboardDailySpin({ userId }: DashboardDailySpinProps) {
  const storageKey = useMemo(() => `raw.daily-spin.${userId}`, [userId]);
  const [todayKey, setTodayKey] = useState(() => getTodayKey());
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [prizeModal, setPrizeModal] = useState<WheelPrize | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextKey = getTodayKey();
      setTodayKey((previous) => (previous === nextKey ? previous : nextKey));
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setHasSpunToday(false);
        setSelectedRewardId(null);
        return;
      }

      const parsed = JSON.parse(raw) as { date: string; rewardId: string };
      if (parsed.date === todayKey) {
        setSelectedRewardId(parsed.rewardId);
        setHasSpunToday(true);
        return;
      }

      setHasSpunToday(false);
      setSelectedRewardId(null);
      window.localStorage.removeItem(storageKey);
    } catch {
      setHasSpunToday(false);
      setSelectedRewardId(null);
    }
  }, [storageKey, todayKey]);

  const selectedPrize = PRIZES.find((prize) => prize.id === selectedRewardId) ?? null;

  const handleSpinEnd = (prize: WheelPrize) => {
    setSelectedRewardId(prize.id);
    setHasSpunToday(true);
    setPrizeModal(prize);
    window.localStorage.setItem(storageKey, JSON.stringify({ date: todayKey, rewardId: prize.id }));
  };

  const selectedMessage = selectedPrize ? prizeMessages[selectedPrize.id] : null;
  const modalMessage = prizeModal ? prizeMessages[prizeModal.id] : null;
  const ModalIcon = modalMessage?.icon ?? Gift;
  const isWin = prizeModal ? !prizeModal.id.startsWith("try") : false;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-raw-gold/50">
          Daily Reward
        </p>
        <h1 className="font-display text-2xl tracking-wide text-raw-text sm:text-3xl">Wheel of Fortune</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-raw-silver/40">
          Spin once daily for a chance to earn XP, avatar themes, streak shields, and more.
        </p>
      </div>

      <div className="rounded-[2rem] border border-raw-border/35 bg-[radial-gradient(circle_at_50%_10%,rgba(241,196,45,0.08),rgba(0,0,0,0.8)_48%)] p-6 sm:p-8">
        <div className="flex justify-center pt-2">
          <WheelOfFortune prizes={PRIZES} onSpinEnd={handleSpinEnd} disabled={hasSpunToday} />
        </div>
      </div>

      {hasSpunToday && selectedPrize && selectedMessage && (
        <div className="mx-auto max-w-sm rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-5 text-center">
          <p className="mb-1 text-xs text-raw-silver/40">Today&apos;s Result</p>
          <p className="font-display text-sm tracking-wide text-raw-gold">{selectedMessage.title}</p>
          <p className="mt-2 text-xs text-raw-silver/30">Come back tomorrow for another spin!</p>
        </div>
      )}

      <div className="mx-auto max-w-lg">
        <h2 className="mb-4 text-center font-display text-sm tracking-wide text-raw-text">Prize Pool</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "50 XP", rarity: "Common", color: "text-raw-silver/50" },
            { label: "100 XP", rarity: "Common", color: "text-raw-gold/60" },
            { label: "200 XP", rarity: "Rare", color: "text-raw-gold/80" },
            { label: "500 XP", rarity: "Jackpot", color: "text-raw-gold" },
            { label: "Streak Shield", rarity: "Rare", color: "text-raw-silver/70" },
            { label: "Avatar Theme", rarity: "Rare", color: "text-raw-gold/80" },
            { label: "Badge", rarity: "Uncommon", color: "text-raw-silver/60" },
          ].map((prize) => (
            <div key={prize.label} className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-3 text-center">
              <p className={`text-xs font-medium ${prize.color}`}>{prize.label}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-raw-silver/25">{prize.rarity}</p>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!prizeModal} onOpenChange={() => setPrizeModal(null)}>
        <DialogContent className="border-raw-border/40 bg-raw-black/95 backdrop-blur-xl sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                isWin ? "bg-raw-gold/15 shadow-[0_0_30px_rgba(241,196,45,0.2)]" : "bg-raw-surface"
              }`}
            >
              {modalMessage && <ModalIcon className={`h-8 w-8 ${isWin ? "text-raw-gold" : "text-raw-silver/40"}`} />}
            </div>
            <DialogTitle className={`font-display text-xl tracking-wide ${isWin ? "text-raw-gold" : "text-raw-silver/60"}`}>
              {modalMessage?.title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-raw-silver/40">
              {modalMessage?.desc}
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => setPrizeModal(null)}
            className={`mt-4 w-full rounded-full py-3 text-sm font-display uppercase tracking-[0.15em] transition-all ${
              isWin
                ? "bg-raw-gold text-raw-black hover:bg-raw-gold/90"
                : "border border-raw-border/40 text-raw-silver/50 hover:bg-raw-surface/50"
            }`}
          >
            {isWin ? "Claim" : "Close"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
