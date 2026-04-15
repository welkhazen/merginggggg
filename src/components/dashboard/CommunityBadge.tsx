interface CommunityBadgeProps {
  abbr: string;
  title: string;
  logoUrl?: string;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "h-9 w-9 rounded-xl text-xs",
  md: "h-12 w-12 rounded-2xl text-sm",
};

export function CommunityBadge({ abbr, title, logoUrl, size = "md" }: CommunityBadgeProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${title} logo`}
        className={`${sizeClasses[size]} border border-raw-border/20 object-cover bg-raw-black/40`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-raw-gold/15 to-raw-surface font-display text-raw-gold/70 ${sizeClasses[size]}`}>
      {abbr}
    </div>
  );
}