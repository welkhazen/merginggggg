import { useState } from "react";
import { LogOut } from "lucide-react";
import { DashboardNav, type DashboardTab } from "@/components/dashboard/DashboardNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DashboardPolls } from "@/components/dashboard/DashboardPolls";
import { DashboardCommunities } from "@/components/dashboard/DashboardCommunities";
import { DashboardMarketplace } from "@/components/dashboard/DashboardMarketplace";
import { DashboardProfile } from "@/components/dashboard/DashboardProfile";
import type { User, Poll } from "@/store/useRawStore";

interface DashboardProps {
  user: User;
  polls: Poll[];
  votedPolls: Set<string>;
  avatarLevel: number;
  setAvatarLevel: (level: number) => void;
  vote: (pollId: string, optionId: string) => void;
  onLogout: () => void;
}

export default function Dashboard({
  user,
  polls,
  votedPolls,
  avatarLevel,
  setAvatarLevel,
  vote,
  onLogout,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("polls");
  const [isHome, setIsHome] = useState(true);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setIsHome(false);
  };

  const handleHomeClick = () => {
    setIsHome(true);
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
            onVote={vote}
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
        onLogout={onLogout}
      />

      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        username={user.username}
        avatarLevel={avatarLevel}
        onHomeClick={handleHomeClick}
        isHome={isHome}
        onLogout={onLogout}
      />

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-raw-border/30 bg-raw-black/95 backdrop-blur-xl px-2 py-2 flex items-center justify-around lg:hidden">
        <MobileNavBtn label="Home" active={isHome} onClick={handleHomeClick} />
        <MobileNavBtn label="Polls" active={!isHome && activeTab === "polls"} onClick={() => handleTabChange("polls")} />
        <MobileNavBtn label="Groups" active={!isHome && activeTab === "communities"} onClick={() => handleTabChange("communities")} />
        <MobileNavBtn label="Shop" active={!isHome && activeTab === "marketplace"} onClick={() => handleTabChange("marketplace")} />
        <MobileNavBtn label="Me" active={!isHome && activeTab === "profile"} onClick={() => handleTabChange("profile")} />
        <MobileNavBtn label="Logout" active={false} onClick={onLogout} icon={<LogOut className="h-3.5 w-3.5" />} />
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
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
        active ? "text-raw-gold" : "text-raw-silver/35"
      }`}
    >
      {icon}
      <span className={`text-[10px] font-medium ${active ? "text-raw-gold" : ""}`}>{label}</span>
      {active && <div className="h-0.5 w-4 rounded-full bg-raw-gold" />}
    </button>
  );
}
