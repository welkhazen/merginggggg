import { useEffect } from 'react';
import { useStytchSession } from '@stytch/react';
import { useRawStore } from '@/store/useRawStore';

/**
 * Hook to sync Stytch authentication with RawStore
 * When a user logs in via Stytch, this automatically updates the RawStore state
 */
export function useSyncStytchAuth() {
  const { session, isInitialized } = useStytchSession();
  const { setStytchSession } = useRawStore();

  useEffect(() => {
    if (!isInitialized) return;

    if (session) {
      // User is logged in via Stytch
      const email = session.user.emails?.[0]?.email;
      const userId = session.user.user_id;
      
      setStytchSession({
        authenticated: true,
        userId,
        email,
        sessionToken: session.session_token,
      });
    } else {
      // User is not logged in via Stytch - don't call logout, just reset session
      setStytchSession(null);
    }
  }, [session, isInitialized, setStytchSession]);

  return { isInitialized, isStytchAuthenticated: !!session };
}
