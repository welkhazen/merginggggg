interface NavbarProps {
  isLoggedIn: boolean;
  username?: string;
  onSignupClick: () => void;
}

export function Navbar({ isLoggedIn, username, onSignupClick }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-raw-border/50 bg-raw-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="font-display text-xl tracking-[0.3em] text-raw-text">
          ra<span className="text-raw-gold">W</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#communities" className="text-sm text-raw-silver/60 transition-colors hover:text-raw-silver">
            Communities
          </a>
          <a href="#polls" className="text-sm text-raw-silver/60 transition-colors hover:text-raw-silver">
            Polls
          </a>
          <a href="#avatar" className="text-sm text-raw-silver/60 transition-colors hover:text-raw-silver">
            Avatar
          </a>
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-raw-gold/30 to-raw-gold/10 flex items-center justify-center">
              <span className="text-xs font-medium text-raw-gold">{username?.[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm text-raw-silver/80">{username}</span>
          </div>
        ) : (
          <button
            onClick={onSignupClick}
            className="rounded-full bg-raw-gold px-5 py-2 text-sm font-semibold text-raw-ink transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20"
          >
            Join Free
          </button>
        )}
      </div>
    </nav>
  );
}
