import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStytchSession } from '@stytch/react';
import { StytchLoginForm } from '@/components/auth/StytchLoginForm';
import { getPersistedUserById, readAuthSession } from '@/lib/adminData';

export default function Login() {
  const { session, isInitialized } = useStytchSession();
  const navigate = useNavigate();
  const persistedSessionUserId = readAuthSession();
  const hasPersistedSession = Boolean(
    persistedSessionUserId && getPersistedUserById(persistedSessionUserId)
  );

  useEffect(() => {
    if (hasPersistedSession) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Redirect to dashboard if already authenticated
    if (session && isInitialized) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasPersistedSession, session, isInitialized, navigate]);

  if (hasPersistedSession || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-raw-black to-raw-black/80">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold mb-4"></div>
          <p className="text-raw-silver/60 text-sm">
            {hasPersistedSession ? 'Opening your dashboard...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return <StytchLoginForm />;
}
