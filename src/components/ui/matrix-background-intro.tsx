import { memo, useEffect, useRef } from "react";

interface MatrixBackgroundIntroProps {
  onComplete?: () => void;
  className?: string;
}

const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>{}[]|/\\";
const CHAR_ARRAY = CHARS.split("");
const FONT_SIZE = 14;
const START_INTERVAL = 16;
const END_INTERVAL = 52;
const SLOWDOWN_MS = 5000;
const FADE_DELAY_MS = 4000;
const FADE_DURATION_MS = 1800;

const MatrixBackgroundIntro = memo(function MatrixBackgroundIntro({
  onComplete,
  className = "",
}: MatrixBackgroundIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let rafId = 0;
    let ended = false;
    let columns = 0;
    let drops: number[] = [];
    const startTime = performance.now();
    let lastDrawTime = 0;

    const createDrops = () => {
      columns = Math.max(1, Math.floor(canvas.width / FONT_SIZE));
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * (canvas.height / FONT_SIZE)));
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      context.font = `${FONT_SIZE}px monospace`;
      createDrops();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const drawFrame = () => {
      context.fillStyle = "rgba(0, 0, 0, 0.05)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "#22c55e";

      for (let i = 0; i < drops.length; i += 1) {
        const glyph = CHAR_ARRAY[Math.floor(Math.random() * CHAR_ARRAY.length)];
        context.fillText(glyph, i * FONT_SIZE, drops[i] * FONT_SIZE);

        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i] += 1;
      }
    };

    const tick = (now: number) => {
      if (ended) return;

      const elapsed = now - startTime;
      const slowProgress = Math.min(elapsed / SLOWDOWN_MS, 1);
      const interval = START_INTERVAL + (END_INTERVAL - START_INTERVAL) * (1 - Math.pow(1 - slowProgress, 3));

      if (now - lastDrawTime >= interval) {
        drawFrame();
        lastDrawTime = now;
      }

      let opacity = 0.32;
      if (elapsed > FADE_DELAY_MS) {
        const fadeProgress = Math.min((elapsed - FADE_DELAY_MS) / FADE_DURATION_MS, 1);
        opacity = 0.32 * (1 - fadeProgress * fadeProgress);
      }

      canvas.style.opacity = `${opacity}`;

      if (opacity <= 0.001) {
        ended = true;
        context.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      ended = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-[2] ${className}`}
      style={{ opacity: 0 }}
      aria-hidden="true"
    />
  );
});

export default MatrixBackgroundIntro;
