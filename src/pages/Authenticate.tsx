import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStytchSession } from '@stytch/react';

export default function Authenticate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, isInitialized } = useStytchSession();

  useEffect(() => {
    if (!isInitialized) return;

    // If we have a session, redirect to dashboard
    if (session) {
      navigate('/dashboard');
      return;
    }

    // If no session but we have a token in the URL, something went wrong
    const token = searchParams.get('token');
    const tokenType = searchParams.get('stytch_token_type');
    
    if (token && tokenType) {
      // Token is in URL but session isn't active yet
      // This usually means Stytch SDK is processing it
      // Wait a moment for the SDK to process
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
      return () => clearTimeout(timer);
    }

    // No token and no session - redirect to login
    navigate('/login');
  }, [session, isInitialized, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-raw-black to-raw-black/80">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold mb-4"></div>
        <p className="text-raw-silver/60 text-sm">Completing authentication...</p>
      </div>
    </div>
  );
}
