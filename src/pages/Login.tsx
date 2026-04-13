import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStytchSession } from '@stytch/react';
import { StytchLoginForm } from '@/components/auth/StytchLoginForm';

export default function Login() {
  const { session, isInitialized } = useStytchSession();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (session && isInitialized) {
      navigate('/dashboard');
    }
  }, [session, isInitialized, navigate]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-raw-black to-raw-black/80">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold mb-4"></div>
          <p className="text-raw-silver/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <StytchLoginForm />;
}
