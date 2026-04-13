import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

type Three = typeof import("three");

interface Logo3DProps {
  size?: number;
  className?: string;
  interactive?: boolean;
}

function LogoPlaceholder({ size }: { size: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="chrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8e8e8e" />
            <stop offset="45%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#8a8a8a" />
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A0730D" />
            <stop offset="40%" stopColor="#F1C42D" />
            <stop offset="60%" stopColor="#FFE27A" />
            <stop offset="100%" stopColor="#A0730D" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#F1C42D" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F1C42D" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#glow)" />
        <path d="M28 76 L43 24 L49 24 L39 58 L49 58 L59 24 L65 24 L50 76 L44 76 L36 50 L28 76 Z" fill="url(#chrome)" />
        <path d="M48 76 L65 24 L72 24 L55 76 Z" fill="url(#gold)" />
      </svg>
    </div>
  );
}

export function Logo3D({ size = 132, className = "", interactive = true }: Logo3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<import("three").WebGLRenderer | null>(null);
  const animationRef = useRef<number>(0);
  const groupRef = useRef<import("three").Group | null>(null);
  const autoRotateRef = useRef(true);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(entries[0]?.isIntersecting ?? false);
      },
      { rootMargin: "80px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || !containerRef.current) return;

    let mounted = true;

    const init = async () => {
      const THREE: Three = await import("three");
      if (!mounted || !containerRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0.15, 3.4);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;
      containerRef.current.replaceChildren(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.9));
      const key = new THREE.DirectionalLight(0xffffff, 1.25);
      key.position.set(2.5, 3, 2.8);
      scene.add(key);
      const fill = new THREE.PointLight(0xf1c42d, 0.9, 10);
      fill.position.set(-2.5, 1.8, 2);
      scene.add(fill);

      const group = new THREE.Group();
      groupRef.current = group;

      const chromeMat = new THREE.MeshPhysicalMaterial({ color: 0xe9e9e9, metalness: 0.95, roughness: 0.2, clearcoat: 0.35 });
      const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xf1c42d, metalness: 0.85, roughness: 0.25, clearcoat: 0.5 });

      const beam = (w: number, h: number, x: number, y: number, rotZ = 0, mat = chromeMat) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), mat);
        mesh.position.set(x, y, 0);
        mesh.rotation.z = rotZ;
        mesh.castShadow = true;
        return mesh;
      };

      group.add(beam(0.24, 1.4, -0.88, 0, 0.3, chromeMat));
      group.add(beam(0.24, 1.4, -0.26, 0, -0.3, goldMat));
      group.add(beam(0.24, 1.4, 0.36, 0, 0.3, chromeMat));
      group.add(beam(0.24, 1.4, 0.98, 0, -0.3, goldMat));
      group.scale.setScalar(0.95);

      scene.add(group);
      setIsReady(true);

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const animate = () => {
        if (!mounted || !groupRef.current) return;
        animationRef.current = requestAnimationFrame(animate);

        if (!prefersReducedMotion) {
          if (interactive) {
            currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
            currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

            if (autoRotateRef.current) {
              groupRef.current.rotation.y += 0.01;
            } else {
              groupRef.current.rotation.x = currentRotationRef.current.x;
              groupRef.current.rotation.y = currentRotationRef.current.y;
            }
          } else {
            groupRef.current.rotation.y += 0.008;
          }
        }

        renderer.render(scene, camera);
      };

      animate();
    };

    init();

    return () => {
      mounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      rendererRef.current?.dispose();
    };
  }, [isInView, size, interactive]);

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!interactive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetRotationRef.current = { x: y * 0.45, y: x * 0.95 };
      autoRotateRef.current = false;
    },
    [interactive]
  );

  const onMouseLeave = useCallback(() => {
    autoRotateRef.current = true;
  }, []);

  return (
    <div
      className={`relative ${className} ${interactive ? "cursor-pointer" : ""}`}
      style={{ width: size, height: size }}
      onMouseMove={interactive ? onMouseMove : undefined}
      onMouseLeave={interactive ? onMouseLeave : undefined}
      role="img"
      aria-label="raW 3D logo"
    >
      <div
        style={{
          opacity: isReady ? 0 : 1,
          transition: "opacity 350ms ease",
          position: "absolute",
          inset: 0,
        }}
      >
        <LogoPlaceholder size={size} />
      </div>
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ opacity: isReady ? 1 : 0, transition: "opacity 350ms ease" }}
        aria-hidden="true"
      />
    </div>
  );
}
