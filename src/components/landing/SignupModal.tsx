import { useState } from "react";
import { X } from "lucide-react";

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  onSignup: (username: string, password: string) => void;
}

export function SignupModal({ open, onClose, onSignup }: SignupModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onSignup(username.trim(), password);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-raw-border/50 bg-raw-surface p-8 shadow-2xl mx-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-raw-silver/30 transition-colors hover:text-raw-silver/60"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-8">
          <p className="font-display text-lg tracking-wide text-raw-text">Enter raW</p>
          <p className="mt-2 text-sm text-raw-silver/50">
            Anonymous. No email. No real name.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-raw-silver/40 mb-1.5 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="w-full rounded-xl border border-raw-border bg-raw-black/50 px-4 py-3 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20 transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-raw-silver/40 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full rounded-xl border border-raw-border bg-raw-black/50 px-4 py-3 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-raw-gold py-3 text-sm font-bold text-raw-black transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20 mt-2"
          >
            Enter raW
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-raw-silver/30">
          Username + password only. That's it.
        </p>
      </div>
    </div>
  );
}
