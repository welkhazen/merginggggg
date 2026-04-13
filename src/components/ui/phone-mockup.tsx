import type { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
  /** Show status bar (time, signal, battery) */
  showStatusBar?: boolean;
}

export function PhoneMockup({ children, className = "", showStatusBar = true }: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto w-[340px] h-[720px] ${className}`}>
      {/* Outer frame - iPhone bezel */}
      <div className="rounded-[4rem] border-[10px] border-black bg-black p-[3px] shadow-2xl shadow-black/80 h-full">
        {/* Inner bezel color ring */}
        <div className="rounded-[3.8rem] bg-gradient-to-b from-gray-900 to-black p-[2px] h-full">
          {/* Screen area with rounded corners */}
          <div className="rounded-[3.6rem] bg-black overflow-hidden flex flex-col h-full">
            {/* Dynamic Island */}
            <div className="relative h-6 flex items-center justify-center bg-black pt-1">
              <div className="h-[26px] w-[120px] rounded-[26px] bg-black border-[0.5px] border-gray-800 shadow-lg" />
            </div>

            {/* Status bar */}
            {showStatusBar && (
              <div className="flex items-center justify-between px-5 py-0.5 bg-gradient-to-b from-slate-50 to-slate-50">
                <span className="text-[11px] font-semibold text-slate-900">9:41</span>
                <div className="flex items-center gap-1">
                  {/* Signal bars */}
                  <div className="flex items-end gap-[0.5px]">
                    <div className="w-[2px] h-[3px] rounded-[0.5px] bg-slate-900" />
                    <div className="w-[2px] h-[5px] rounded-[0.5px] bg-slate-900" />
                    <div className="w-[2px] h-[7px] rounded-[0.5px] bg-slate-900" />
                    <div className="w-[2px] h-[9px] rounded-[0.5px] bg-slate-900" />
                  </div>
                  <span className="text-[8px] text-slate-600 ml-0.5 font-medium">5G</span>
                  {/* Battery */}
                  <div className="ml-1 w-[20px] h-[9px] rounded-[2.5px] border-[0.5px] border-slate-900 flex items-center p-[1px]">
                    <div className="h-full w-4/5 rounded-[1px] bg-slate-900" />
                  </div>
                </div>
              </div>
            )}

            {/* Screen content - proper iPhone proportions */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>

            {/* Home indicator */}
            <div className="flex items-center justify-center py-2 bg-gradient-to-b from-slate-100 to-slate-50">
              <div className="h-1 w-32 rounded-full bg-slate-900" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
