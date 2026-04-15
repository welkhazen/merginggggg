import { useCallback, useEffect, useRef, useState } from "react";

export interface WheelPrize {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  textColor: string;
}

interface WheelOfFortuneProps {
  prizes: WheelPrize[];
  onSpinEnd: (prize: WheelPrize) => void;
  disabled?: boolean;
}

const SPIN_DURATION = 5000;
const MIN_ROTATIONS = 5;
const MAX_ROTATIONS = 8;

function getSegmentPath(index: number, total: number, radius: number): string {
  const angle = 360 / total;
  const start = index * angle - 90;
  const end = start + angle;
  const startRad = (start * Math.PI) / 180;
  const endRad = (end * Math.PI) / 180;

  const x1 = radius + radius * Math.cos(startRad);
  const y1 = radius + radius * Math.sin(startRad);
  const x2 = radius + radius * Math.cos(endRad);
  const y2 = radius + radius * Math.sin(endRad);
  const largeArcFlag = angle > 180 ? 1 : 0;

  return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

function getTextPosition(index: number, total: number, radius: number): { x: number; y: number; rotation: number } {
  const angle = 360 / total;
  const center = index * angle + angle / 2 - 90;
  const rad = (center * Math.PI) / 180;
  const textRadius = radius * 0.62;

  return {
    x: radius + textRadius * Math.cos(rad),
    y: radius + textRadius * Math.sin(rad),
    rotation: center + 90,
  };
}

function getLabelLines(label: string): string[] {
  const parts = label.trim().split(/\s+/);
  if (parts.length <= 1) {
    return [label];
  }

  if (parts.length === 2) {
    return [parts[0], parts[1]];
  }

  const midpoint = Math.ceil(parts.length / 2);
  return [parts.slice(0, midpoint).join(" "), parts.slice(midpoint).join(" ")];
}

export function WheelOfFortune({ prizes, onSpinEnd, disabled = false }: WheelOfFortuneProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const currentPrizeRef = useRef<WheelPrize | null>(null);

  const radius = 200;
  const size = radius * 2;
  const total = prizes.length;

  const handleSpin = useCallback(() => {
    if (isSpinning || disabled || total === 0) {
      return;
    }

    setIsSpinning(true);

    const prizeIndex = Math.floor(Math.random() * total);
    currentPrizeRef.current = prizes[prizeIndex];

    const segmentAngle = 360 / total;
    const targetOffset = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
    const fullRotations = (MIN_ROTATIONS + Math.random() * (MAX_ROTATIONS - MIN_ROTATIONS)) * 360;
    const finalRotation = rotation + fullRotations + targetOffset;

    setRotation(finalRotation);
  }, [disabled, isSpinning, prizes, rotation, total]);

  useEffect(() => {
    if (!isSpinning) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSpinning(false);
      if (currentPrizeRef.current) {
        onSpinEnd(currentPrizeRef.current);
      }
    }, SPIN_DURATION + 180);

    return () => window.clearTimeout(timer);
  }, [isSpinning, onSpinEnd]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute -top-1 left-1/2 z-20 -translate-x-1/2">
        <svg width="32" height="40" viewBox="0 0 32 40">
          <defs>
            <linearGradient id="pointerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1C42D" />
              <stop offset="100%" stopColor="#B8941E" />
            </linearGradient>
            <filter id="pointerShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#F1C42D" floodOpacity="0.4" />
            </filter>
          </defs>
          <polygon points="16,4 28,4 16,30 4,4" fill="url(#pointerGrad)" filter="url(#pointerShadow)" />
        </svg>
      </div>

      <div className="relative h-[400px] w-[400px] rounded-full border border-[#f1c42d4d] bg-black/30 p-1.5 shadow-[0_0_45px_rgba(241,196,45,0.18)]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="block h-full w-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? `transform ${SPIN_DURATION}ms cubic-bezier(0.17,0.67,0.12,0.99)` : "none",
          }}
        >
          {prizes.map((prize, index) => {
            const textPosition = getTextPosition(index, total, radius);
            const labelLines = getLabelLines(prize.shortLabel);
            const fontSize = prize.shortLabel.length > 7 ? 12 : 14;
            return (
              <g key={prize.id}>
                <path d={getSegmentPath(index, total, radius)} fill={prize.color} stroke="#1f1f1f" strokeWidth="1" />
                <text
                  x={textPosition.x}
                  y={textPosition.y}
                  fill={prize.textColor}
                  fontSize={fontSize}
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  letterSpacing="0.6"
                  transform={`rotate(${textPosition.rotation} ${textPosition.x} ${textPosition.y})`}
                >
                  {labelLines.map((line, lineIndex) => (
                    <tspan
                      key={`${prize.id}-${line}`}
                      x={textPosition.x}
                      dy={lineIndex === 0 ? (labelLines.length === 1 ? 0 : -6) : 12}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}

          <circle cx={radius} cy={radius} r={radius * 0.15} fill="#080808" stroke="#F1C42D" strokeWidth="2" />
          <circle cx={radius} cy={radius} r={radius * 0.12} fill="#0c0c0c" stroke="#F1C42D" strokeWidth="0.5" />

          {prizes.map((_, index) => {
            const angle = (index * 360) / total - 90;
            const rad = (angle * Math.PI) / 180;
            const dotRadius = radius - 8;
            const cx = radius + dotRadius * Math.cos(rad);
            const cy = radius + dotRadius * Math.sin(rad);

            return <circle key={`dot-${index}`} cx={cx} cy={cy} r="3" fill="#F1C42D" opacity="0.5" />;
          })}
        </svg>
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning || disabled}
        className={`mt-8 relative overflow-hidden rounded-full px-10 py-3.5 font-display text-sm uppercase tracking-[0.2em] transition-all ${
          isSpinning || disabled
            ? "cursor-not-allowed border border-raw-border/30 bg-raw-surface text-raw-silver/30"
            : "bg-gradient-to-r from-raw-gold to-yellow-500 text-raw-black hover:scale-105 hover:shadow-[0_0_30px_rgba(241,196,45,0.3)] active:scale-95"
        }`}
      >
        {isSpinning ? "Spinning..." : disabled ? "Come Back Tomorrow" : "Spin"}
      </button>
    </div>
  );
}
