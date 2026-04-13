import { useStytchSession } from '@stytch/react';
import { useEffect, useState } from 'react';

export function useAuthStatus() {
  const { session, isInitialized } = useStytchSession();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (isInitialized) {
      setIsLoadingAuth(false);
    }
  }, [isInitialized]);

  return {
    isAuthenticated: !!session,
    session,
    isInitialized,
    isLoadingAuth,
  };
}
