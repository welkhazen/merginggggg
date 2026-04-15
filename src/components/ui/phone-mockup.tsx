import type { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
  /** Show status bar (time, signal, battery) */
  showStatusBar?: boolean;
}

export function PhoneMockup({ children, className = "", showStatusBar = true }: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto h-[740px] w-[356px] ${className}`}>
      {/* Side buttons */}
      <div className="pointer-events-none absolute -left-[3px] top-32 h-14 w-[3px] rounded-l-full bg-zinc-600/80" />
      <div className="pointer-events-none absolute -left-[3px] top-52 h-20 w-[3px] rounded-l-full bg-zinc-600/80" />
      <div className="pointer-events-none absolute -left-[3px] top-79 h-20 w-[3px] rounded-l-full bg-zinc-600/80" />
      <div className="pointer-events-none absolute -right-[3px] top-60 h-24 w-[3px] rounded-r-full bg-zinc-600/85" />

      {/* Outer shell */}
      <div className="relative h-full overflow-hidden rounded-[3.6rem] border border-zinc-500/60 bg-gradient-to-b from-zinc-500 to-zinc-800 p-[4px] shadow-[0_30px_70px_rgba(0,0,0,0.7)]">
        {/* Metallic ring */}
        <div className="h-full rounded-[3.3rem] bg-gradient-to-b from-zinc-300 via-zinc-700 to-zinc-950 p-[3px]">
          {/* Glass + bezel */}
          <div className="relative flex h-full flex-col overflow-hidden rounded-[3.05rem] border border-black/70 bg-black">
            {/* Speaker / sensor island */}
            <div className="relative h-8 bg-black">
              <div className="absolute left-1/2 top-[8px] h-[4px] w-14 -translate-x-1/2 rounded-full bg-zinc-600" />
              <div className="absolute left-1/2 top-[7px] ml-10 h-[6px] w-[6px] rounded-full bg-zinc-700" />
            </div>

            {/* Status bar */}
            {showStatusBar && (
              <div className="flex items-center justify-between bg-white px-5 py-0.5">
                <span className="text-[11px] font-semibold text-zinc-900">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="flex items-end gap-[1px]">
                    <div className="h-[3px] w-[2px] rounded-[0.5px] bg-zinc-900" />
                    <div className="h-[5px] w-[2px] rounded-[0.5px] bg-zinc-900" />
                    <div className="h-[7px] w-[2px] rounded-[0.5px] bg-zinc-900" />
                    <div className="h-[9px] w-[2px] rounded-[0.5px] bg-zinc-900" />
                  </div>
                  <span className="ml-0.5 text-[8px] font-medium text-zinc-600">5G</span>
                  <div className="ml-1 flex h-[9px] w-[20px] items-center rounded-[2.5px] border-[0.5px] border-zinc-900 p-[1px]">
                    <div className="h-full w-4/5 rounded-[1px] bg-zinc-900" />
                  </div>
                </div>
              </div>
            )}

            {/* Screen content */}
            <div className="relative flex-1 overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              {children}
            </div>

            {/* Home indicator area */}
            <div className="flex items-center justify-center bg-white py-2">
              <div className="h-1 w-32 rounded-full bg-zinc-900" />
            </div>
          </div>
        </div>

        {/* Gloss edge highlight */}
        <div className="pointer-events-none absolute inset-x-8 top-2 h-8 rounded-full bg-white/12 blur-md" />
      </div>
    </div>
  );
}
