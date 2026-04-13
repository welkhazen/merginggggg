import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface DiagonalSplitProgressProps {
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue?: number;
  leftColor?: string;
  rightColor?: string;
  leftTextColor?: string;
  rightTextColor?: string;
  className?: string;
  animate?: boolean;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  leftActive?: boolean;
  rightActive?: boolean;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

export function DiagonalSplitProgress({
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  leftColor = "#050505",
  rightColor = "#8b6d08",
  leftTextColor = "#ffffff",
  rightTextColor = "#f3d24f",
  className,
  animate = true,
  onLeftClick,
  onRightClick,
  leftActive = false,
  rightActive = false,
}: DiagonalSplitProgressProps) {
  const safeLeft = clampPercentage(leftValue);
  const safeRight = clampPercentage(rightValue ?? 100 - safeLeft);
  const total = safeLeft + safeRight;

  const leftPercentage = total > 0 ? Math.round((safeLeft / total) * 100) : 0;
  const rightPercentage = total > 0 ? 100 - leftPercentage : 0;
  const lowerPercentage = Math.min(leftPercentage, rightPercentage);
  const overlapWidth = Math.max(16, Math.min(28, 28 - lowerPercentage * 0.08));

  const style = {
    ["--dsp-left-color" as string]: leftColor,
    ["--dsp-right-color" as string]: rightColor,
    ["--dsp-left-text" as string]: leftTextColor,
    ["--dsp-right-text" as string]: rightTextColor,
    ["--dsp-left-width" as string]: `${leftPercentage}%`,
    ["--dsp-right-width" as string]: `${rightPercentage}%`,
    ["--dsp-overlap-width" as string]: `${overlapWidth}px`,
  } as CSSProperties;

  const transitionClass = animate ? "transition-all duration-500 ease-out" : "";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[999px] border border-white/15 bg-black/30 shadow-[0_14px_32px_rgba(0,0,0,0.28)]",
        className
      )}
      style={style}
    >
      <div
        aria-hidden="true"
        className={cn("absolute inset-0 rounded-[inherit]", transitionClass)}
        style={{ background: "var(--dsp-left-color)" }}
      />

      {rightPercentage > 0 && (
        <div
          aria-hidden="true"
          className={cn("absolute inset-y-0 right-0 rounded-r-[inherit]", transitionClass)}
          style={{
            width: `calc(var(--dsp-right-width) + var(--dsp-overlap-width))`,
            background: "var(--dsp-right-color)",
            clipPath: "polygon(var(--dsp-overlap-width) 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />
      )}

      <div className="relative min-h-[86px] w-full">
        <button
          type="button"
          onClick={onLeftClick}
          disabled={!onLeftClick}
          className={cn(
            "absolute inset-y-0 left-0 z-[1] flex items-center justify-center px-4 text-center disabled:cursor-default",
            transitionClass,
            leftActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.16)]" : ""
          )}
          style={{
            width: `var(--dsp-left-width)`,
            color: "var(--dsp-left-text)",
          }}
        >
          <div className="flex flex-col items-center justify-center gap-1 leading-none">
            <span className="text-sm font-semibold sm:text-base">{leftLabel}</span>
            <span className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">{leftPercentage}%</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onRightClick}
          disabled={!onRightClick}
          className={cn(
            "absolute inset-y-0 right-0 z-[1] flex items-center justify-center px-4 text-center disabled:cursor-default",
            transitionClass,
            rightActive ? "drop-shadow-[0_0_10px_rgba(241,196,45,0.22)]" : ""
          )}
          style={{
            width: `var(--dsp-right-width)`,
            color: "var(--dsp-right-text)",
          }}
        >
          <div className="flex flex-col items-center justify-center gap-1 leading-none">
            <span className="text-sm font-semibold sm:text-base">{rightLabel}</span>
            <span className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">{rightPercentage}%</span>
          </div>
        </button>
      </div>
    </div>
  );
}