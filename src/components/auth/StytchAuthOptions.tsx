import { useStytchSession } from '@stytch/react';
import { Mail } from 'lucide-react';

interface StytchAuthOptionsProps {
  onAuthSuccess?: () => void;
}

/**
 * Component that provides Stytch authentication options
 * Can be embedded in the signup modal for alternative login methods
 */
export function StytchAuthOptions({ onAuthSuccess }: StytchAuthOptionsProps) {
  const { session } = useStytchSession();

  // If already authenticated via Stytch, show login status
  if (session) {
    const email = session.user.emails?.[0]?.email;
    return (
      <div className="text-center p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-xl">
        <p className="text-emerald-300 text-sm font-medium">
          ✓ Logged in as {email}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-raw-border/40"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-raw-black text-raw-silver/50 text-[11px] uppercase tracking-[0.24em] font-medium">
            Or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          // User should navigate to /login to use Stytch
          window.location.href = '/login';
        }}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-raw-black/40 hover:bg-raw-black/60 border border-raw-border/70 rounded-xl text-raw-silver transition-all duration-200 hover:border-raw-gold/50 group"
      >
        <Mail size={18} className="group-hover:text-raw-gold transition-colors" />
        <span className="font-semibold text-sm">Sign in with Email</span>
      </button>

      <p className="text-center text-raw-silver/40 text-[11px] tracking-wide">
        Magic link or Google OAuth
      </p>
    </div>
  );
}
