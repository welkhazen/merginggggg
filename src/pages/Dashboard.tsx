import { useEffect, useState } from "react";
import { LogOut, Shield } from "lucide-react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { DashboardNav, type DashboardTab } from "@/components/dashboard/DashboardNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DashboardPolls } from "@/components/dashboard/DashboardPolls";
import { DashboardCommunities } from "@/components/dashboard/DashboardCommunities";
import { DashboardChallenges } from "@/components/dashboard/DashboardChallenges";
import { DashboardDailySpin } from "@/components/dashboard/DashboardDailySpin";
import { DashboardProfile } from "@/components/dashboard/DashboardProfile";
import type { User, Poll } from "@/store/useRawStore";

interface DashboardProps {
  user: User;
  polls: Poll[];
  votedPolls: Set<string>;
  avatarLevel: number;
  setAvatarLevel: (level: number) => void;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  isDailyPollLimitReached: boolean;
  vote: (pollId: string, optionId: string) => void;
  onLogout: () => void;
}

export default function Dashboard({
  user,
  polls,
  votedPolls,
  avatarLevel,
  setAvatarLevel,
  dailyAnsweredCount,
  dailyPollLimit,
  isDailyPollLimitReached,
  vote,
  onLogout,
}: DashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<DashboardTab>("polls");
  const [isHome, setIsHome] = useState(true);
  const communityRouteMatch = matchPath("/dashboard/communities/:communityId", location.pathname);
  const activeCommunityId = communityRouteMatch?.params.communityId ?? null;

  useEffect(() => {
    if (activeCommunityId) {
      setActiveTab("communities");
      setIsHome(false);
      return;
    }

    if (location.pathname !== "/dashboard") {
      return;
    }
  }, [activeCommunityId, location.pathname]);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setIsHome(false);
    navigate("/dashboard");
  };

  const handleHomeClick = () => {
    setIsHome(true);
    navigate("/dashboard");
  };

  const handleOpenCommunity = (communityId: string) => {
    setActiveTab("communities");
    setIsHome(false);
    navigate(`/dashboard/communities/${communityId}`);
  };

  const handleBackToCommunities = () => {
    setActiveTab("communities");
    setIsHome(false);
    navigate("/dashboard");
  };

  const handleProfileClick = () => {
    setActiveTab("profile");
    setIsHome(false);
    navigate("/dashboard");
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
            avatarLevel={avatarLevel}
            userId={user.id}
            username={user.username}
            dailyAnsweredCount={dailyAnsweredCount}
            dailyPollLimit={dailyPollLimit}
            isDailyPollLimitReached={isDailyPollLimitReached}
            onVote={vote}
          />
        );
      case "communities":
        return (
          <DashboardCommunities
            user={user}
            activeCommunityId={activeCommunityId}
            onOpenCommunity={handleOpenCommunity}
            onBackToCommunities={handleBackToCommunities}
          />
        );
      case "challenges":
        return (
          <DashboardChallenges
            avatarLevel={avatarLevel}
            pollsAnswered={votedPolls.size}
            dailyAnsweredCount={dailyAnsweredCount}
            dailyPollLimit={dailyPollLimit}
          />
        );
      case "daily-spin":
        return <DashboardDailySpin userId={user.id} />;
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
        username={user.username}
        avatarLevel={avatarLevel}
        showAdminLink={user.role === "admin"}
        onProfileClick={handleProfileClick}
        onLogout={onLogout}
      />

      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userId={user.id}
        username={user.username}
        avatarLevel={avatarLevel}
        showAdminLink={user.role === "admin"}
        onHomeClick={handleHomeClick}
        isHome={isHome}
        onLogout={onLogout}
      />

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-raw-border/30 bg-raw-black/95 backdrop-blur-xl px-2 py-2 flex items-center justify-around lg:hidden">
        <MobileNavBtn label="Home" active={isHome} onClick={handleHomeClick} />
        <MobileNavBtn label="Polls" active={!isHome && activeTab === "polls"} onClick={() => handleTabChange("polls")} />
        <MobileNavBtn label="Challenges" active={!isHome && activeTab === "challenges"} onClick={() => handleTabChange("challenges")} />
        <MobileNavBtn label="Spin" active={!isHome && activeTab === "daily-spin"} onClick={() => handleTabChange("daily-spin")} />
        <MobileNavBtn label="Groups" active={!isHome && activeTab === "communities"} onClick={() => handleTabChange("communities")} />
        <MobileNavBtn label="Me" active={!isHome && activeTab === "profile"} onClick={() => handleTabChange("profile")} />
        {user.role === "admin" && <MobileNavLink label="Admin" href="/admin" icon={<Shield className="h-3.5 w-3.5" />} />}
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

function MobileNavLink({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <a href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-raw-gold/80 transition-all hover:text-raw-gold">
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </a>
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
