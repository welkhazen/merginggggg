import { useMemo, useState } from "react";
import { DashboardNav, type DashboardTab } from "@/components/dashboard/DashboardNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DashboardPolls } from "@/components/dashboard/DashboardPolls";
import { DashboardCommunities } from "@/components/dashboard/DashboardCommunities";
import { DashboardMarketplace } from "@/components/dashboard/DashboardMarketplace";
import { DashboardProfile } from "@/components/dashboard/DashboardProfile";
import type { User, Poll } from "@/store/useRawStore";
import { computeRawInsights } from "@/features/insights/insights-engine";

interface DashboardProps {
  user: User;
  polls: Poll[];
  votedPolls: Set<string>;
  votedOptions: Record<string, string>;
  purchasedInsights: Set<string>;
  avatarLevel: number;
  setAvatarLevel: (level: number) => void;
  vote: (pollId: string, optionId: string) => void;
  purchaseInsight: (insightId: string) => void;
}

export default function Dashboard({
  user,
  polls,
  votedPolls,
  avatarLevel,
  setAvatarLevel,
  vote,
  votedOptions,
  purchasedInsights,
  purchaseInsight,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("polls");
  const [isHome, setIsHome] = useState(true);
  const computedInsights = useMemo(
    () =>
      computeRawInsights({
        polls,
        votedPolls,
        votedOptions,
        avatarLevel,
        purchasedInsightIds: purchasedInsights,
      }),
    [polls, votedPolls, votedOptions, avatarLevel, purchasedInsights]
  );

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setIsHome(false);
  };

  const handleHomeClick = () => {
    setIsHome(true);
  };

  const handlePurchaseInsight = (insightId: string) => {
    const selectedInsight = computedInsights.find((insight) => insight.id === insightId);
    if (!selectedInsight || selectedInsight.status !== "locked-premium") {
      return;
    }

    purchaseInsight(insightId);
  };

  const renderContent = () => {
    if (isHome) {
      return (
        <DashboardHome
          username={user.username}
          avatarLevel={avatarLevel}
          polls={polls}
          votedPolls={votedPolls}
          onNavigate={handleTabChange}
        />
      );
    }

    switch (activeTab) {
      case "polls":
        return (
          <DashboardPolls
            polls={polls}
            votedPolls={votedPolls}
            votedOptions={votedOptions}
            avatarLevel={avatarLevel}
            purchasedInsights={purchasedInsights}
            onVote={vote}
            onPurchaseInsight={handlePurchaseInsight}
          />
        );
      case "communities":
        return <DashboardCommunities />;
      case "marketplace":
        return <DashboardMarketplace avatarLevel={avatarLevel} />;
      case "profile":
        return (
          <DashboardProfile
            username={user.username}
            avatarLevel={avatarLevel}
            onLevelChange={setAvatarLevel}
            pollsAnswered={votedPolls.size}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-raw-black">
      <DashboardNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        username={user.username}
        avatarLevel={avatarLevel}
      />

      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        username={user.username}
        avatarLevel={avatarLevel}
        onHomeClick={handleHomeClick}
        isHome={isHome}
      />

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-raw-border/30 bg-raw-black/95 backdrop-blur-xl px-2 py-2 flex items-center justify-around lg:hidden">
        <MobileNavBtn label="Home" active={isHome} onClick={handleHomeClick} />
        <MobileNavBtn label="Polls" active={!isHome && activeTab === "polls"} onClick={() => handleTabChange("polls")} />
        <MobileNavBtn label="Groups" active={!isHome && activeTab === "communities"} onClick={() => handleTabChange("communities")} />
        <MobileNavBtn label="Shop" active={!isHome && activeTab === "marketplace"} onClick={() => handleTabChange("marketplace")} />
        <MobileNavBtn label="Me" active={!isHome && activeTab === "profile"} onClick={() => handleTabChange("profile")} />
      </div>

      {/* Main content */}
      <main className="pt-14 pb-20 lg:pl-[200px] lg:pb-8">
        <div className="mx-auto max-w-4xl px-5 py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function MobileNavBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
        active ? "text-raw-gold" : "text-raw-silver/35"
      }`}
    >
      <span className={`text-[10px] font-medium ${active ? "text-raw-gold" : ""}`}>{label}</span>
      {active && <div className="h-0.5 w-4 rounded-full bg-raw-gold" />}
    </button>
  );
}
