import { Products, StytchLogin } from '@stytch/react';

const config = {
  products: [Products.emailMagicLinks, Products.oauth],
  oauthOptions: {
    providers: [
      { type: 'google' as const },
    ],
  },
  sessionOptions: {
    sessionDurationMinutes: 60,
  },
};

export function StytchLoginForm() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-raw-black to-raw-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-raw-border/70 bg-raw-black/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="font-display text-2xl tracking-wide text-raw-text">Enter raW</p>
            <p className="mt-2 text-sm text-raw-silver/50">
              Anonymous. Email. No real name.
            </p>
          </div>

          {/* Stytch UI Container */}
          <div className="stytch-container">
            <style>{`
              /* Stytch custom styling to match raW design */
              .stytch-container {
                --stytch-primary-color: #ffd700;
                --stytch-text-color: #e8e8e8;
                --stytch-background-color: #0a0a0a;
                --stytch-border-color: #ffffff20;
              }

              .stytch-container input,
              .stytch-container button,
              .stytch-container select {
                background-color: rgba(10, 10, 10, 0.5) !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                color: #e8e8e8 !important;
                padding: 12px 16px !important;
                border-radius: 11px !important;
                font-size: 14px !important;
                transition: all 0.2s !important;
              }

              .stytch-container input::placeholder {
                color: rgba(232, 232, 232, 0.15) !important;
              }

              .stytch-container input:focus {
                border-color: rgba(255, 215, 0, 0.3) !important;
                outline: none !important;
                ring: 1px solid rgba(255, 215, 0, 0.2) !important;
              }

              .stytch-container button[type="submit"],
              .stytch-container button.stytch-button {
                background-color: #ffd700 !important;
                color: #0a0a0a !important;
                border: none !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                margin-top: 8px !important;
              }

              .stytch-container button[type="submit"]:hover,
              .stytch-container button.stytch-button:hover {
                background-color: #ffed4e !important;
                box-shadow: 0 8px 16px rgba(255, 215, 0, 0.2) !important;
              }

              .stytch-container button[type="submit"]:disabled {
                opacity: 0.7 !important;
                cursor: not-allowed !important;
              }

              .stytch-container label {
                color: rgba(232, 232, 232, 0.6) !important;
                font-size: 12px !important;
                margin-bottom: 6px !important;
              }

              .stytch-container a {
                color: #ffd700 !important;
              }

              .stytch-container a:hover {
                text-decoration: underline !important;
              }

              .stytch-container .stytch-error {
                color: #ff6b6b !important;
                background-color: rgba(255, 107, 107, 0.1) !important;
                border: 1px solid rgba(255, 107, 107, 0.3) !important;
                padding: 12px !important;
                border-radius: 8px !important;
                font-size: 12px !important;
              }

              .stytch-container .stytch-otp-button {
                background-color: #ffd700 !important;
                color: #0a0a0a !important;
                border-radius: 11px !important;
                font-weight: 600 !important;
              }
            `}</style>
            <StytchLogin config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
