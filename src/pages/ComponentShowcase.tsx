import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { BackgroundBoxesDemo } from "@/components/ui/background-boxes-demo";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/components/ui/draggable-card";
import { GlareCard } from "@/components/ui/glare-card";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { Tabs } from "@/components/ui/tabs-aceternity";
import { Terminal } from "@/components/ui/terminal";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { WorldMap } from "@/components/ui/world-map";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Input } from "@/components/ui/aceternity-input";
import { Label } from "@/components/ui/aceternity-label";
import { AvatarFigure } from "@/components/ui/avatar-figure";

const Globe3DLazy = lazy(() =>
  import("@/components/ui/3d-globe").then((m) => ({ default: m.Globe3D }))
);

/* ─── Section wrapper ─── */
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6">
        <h2 className="text-2xl font-display tracking-wide text-raw-text">
          {title}
        </h2>
        <p className="mt-1 text-sm text-raw-silver/50">{description}</p>
      </div>
      <div className="rounded-2xl border border-raw-border bg-raw-surface/30 p-6 overflow-hidden">
        {children}
      </div>
    </section>
  );
}

/* ─── Sample data ─── */
const testimonials = [
  { quote: "This changed how I think about community.", name: "anon_42", title: "Level 7" },
  { quote: "Finally, a place where I can be honest.", name: "shadow_x", title: "Level 5" },
  { quote: "The avatar system keeps me coming back.", name: "neon_drift", title: "Level 9" },
  { quote: "Anonymous doesn't mean alone.", name: "pulse_88", title: "Level 3" },
  { quote: "I found my people here.", name: "void_walker", title: "Level 6" },
];

const aceternityTabs = [
  {
    title: "Polls",
    value: "polls",
    content: (
      <div className="w-full h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
        <p>Answer <span className="text-raw-gold">anonymously</span></p>
        <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">
          Start with a few honest questions.
        </p>
      </div>
    ),
  },
  {
    title: "Communities",
    value: "communities",
    content: (
      <div className="w-full h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
        <p>24/7 <span className="text-raw-gold">communities</span></p>
        <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">
          Enter spaces built around real needs.
        </p>
      </div>
    ),
  },
  {
    title: "Avatar",
    value: "avatar",
    content: (
      <div className="w-full h-full rounded-2xl p-10 text-xl md:text-4xl font-display tracking-wide text-raw-text bg-gradient-to-br from-raw-surface to-raw-black border border-raw-border">
        <p>Build your <span className="text-raw-gold">identity</span></p>
        <p className="text-sm font-sans font-normal text-raw-silver/50 mt-4">
          Choose your avatar and level up over time.
        </p>
      </div>
    ),
  },
];

const worldMapDots = [
  { start: { lat: 40.71, lng: -74.0 }, end: { lat: 51.51, lng: -0.13 } },
  { start: { lat: 35.68, lng: 139.65 }, end: { lat: -33.87, lng: 151.21 } },
  { start: { lat: 28.61, lng: 77.21 }, end: { lat: 48.86, lng: 2.35 } },
];

const dockItems = [
  { title: "Home", icon: <span className="text-lg">🏠</span>, href: "#" },
  { title: "Polls", icon: <span className="text-lg">📊</span>, href: "#" },
  { title: "Community", icon: <span className="text-lg">👥</span>, href: "#" },
  { title: "Profile", icon: <span className="text-lg">👤</span>, href: "#" },
  { title: "Settings", icon: <span className="text-lg">⚙️</span>, href: "#" },
];

const globeMarkers = [
  { lat: 40.71, lng: -74.0, src: "https://assets.aceternity.com/avatars/1.webp", label: "New York" },
  { lat: 51.51, lng: -0.13, src: "https://assets.aceternity.com/avatars/2.webp", label: "London" },
  { lat: 35.68, lng: 139.65, src: "https://assets.aceternity.com/avatars/3.webp", label: "Tokyo" },
  { lat: -33.87, lng: 151.21, src: "https://assets.aceternity.com/avatars/4.webp", label: "Sydney" },
];

/* ─── Component list for sidebar ─── */
const components = [
  { id: "background-boxes", name: "Background Boxes" },
  { id: "container-text-flip", name: "Container Text Flip" },
  { id: "typewriter-effect", name: "Typewriter Effect" },
  { id: "glare-card", name: "Glare Card" },
  { id: "draggable-card", name: "Draggable Card" },
  { id: "infinite-moving-cards", name: "Infinite Moving Cards" },
  { id: "tabs-aceternity", name: "Tabs (Aceternity)" },
  { id: "terminal", name: "Terminal" },
  { id: "world-map", name: "World Map" },
  { id: "floating-dock", name: "Floating Dock" },
  { id: "phone-mockup", name: "Phone Mockup" },
  { id: "avatar-figure", name: "Avatar Figure" },
  { id: "aceternity-input", name: "Aceternity Input" },
  { id: "3d-globe", name: "3D Globe" },
];

export default function ComponentShowcase() {
  const [activeSection, setActiveSection] = useState("");

  return (
    <div className="min-h-screen bg-raw-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-raw-border bg-raw-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link to="/" className="font-display text-xl tracking-[0.3em] text-raw-text hover:text-raw-gold transition-colors">
              ra<span className="text-raw-gold">W</span>
            </Link>
            <span className="ml-4 text-sm text-raw-silver/50">Component Showcase</span>
          </div>
          <Link
            to="/"
            className="rounded-full border border-raw-border px-4 py-1.5 text-sm text-raw-silver/70 hover:border-raw-gold/30 hover:text-raw-text transition-colors"
          >
            Back to Site
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:flex lg:gap-10">
        {/* Sidebar nav */}
        <nav className="hidden lg:block lg:w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-raw-silver/40">
              Components
            </p>
            {components.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                onClick={() => setActiveSection(c.id)}
                className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  activeSection === c.id
                    ? "bg-raw-gold/10 text-raw-gold"
                    : "text-raw-silver/60 hover:text-raw-text hover:bg-raw-surface/50"
                }`}
              >
                {c.name}
              </a>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 space-y-16">
          {/* ── Background Boxes ── */}
          <Section
            id="background-boxes"
            title="Background Boxes"
            description="Animated grid background with hover-reactive cells. Great for hero sections."
          >
            <BackgroundBoxesDemo />
          </Section>

          {/* ── Container Text Flip ── */}
          <Section
            id="container-text-flip"
            title="Container Text Flip"
            description="Cycling text animation with blur transitions. Perfect for taglines."
          >
            <div className="flex items-center justify-center py-10">
              <span className="text-2xl font-display text-raw-text mr-3">
                ra<span className="text-raw-gold">W</span> is
              </span>
              <ContainerTextFlip
                words={["anonymous", "community", "identity", "honest"]}
              />
            </div>
          </Section>

          {/* ── Typewriter Effect ── */}
          <Section
            id="typewriter-effect"
            title="Typewriter Effect"
            description="Character-by-character text reveal triggered on scroll. Good for headlines."
          >
            <div className="flex items-center justify-center py-10">
              <TypewriterEffect
                words={[
                  { text: "Be" },
                  { text: "yourself," },
                  { text: "stay" },
                  { text: "anonymous.", className: "text-raw-gold" },
                ]}
              />
            </div>
          </Section>

          {/* ── Glare Card ── */}
          <Section
            id="glare-card"
            title="Glare Card"
            description="Mouse-tracking radial glare effect on cards. Use for feature highlights."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
              <GlareCard className="flex flex-col items-center justify-center bg-raw-surface">
                <span className="font-display text-4xl tracking-[0.3em] text-raw-text">
                  ra<span className="text-raw-gold">W</span>
                </span>
              </GlareCard>
              <GlareCard className="flex flex-col items-center justify-center bg-raw-surface">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-raw-gold/30 to-raw-gold/5 flex items-center justify-center">
                  <span className="font-display text-3xl text-raw-gold">W</span>
                </div>
              </GlareCard>
              <GlareCard className="flex flex-col items-start justify-end py-8 px-6 bg-raw-surface">
                <p className="font-display text-lg text-raw-text">Anonymous.</p>
                <p className="text-base text-raw-silver/60 mt-4">
                  No real names. Just your username and your chosen identity.
                </p>
              </GlareCard>
            </div>
          </Section>

          {/* ── Draggable Card ── */}
          <Section
            id="draggable-card"
            title="Draggable Card"
            description="3D perspective cards with drag physics and momentum. Interactive showcase element."
          >
            <DraggableCardContainer className="relative flex h-[500px] w-full items-center justify-center overflow-clip">
              <p className="absolute top-1/2 mx-auto max-w-sm -translate-y-3/4 text-center text-2xl font-display tracking-wide text-raw-silver/10 md:text-4xl">
                Drag the cards around
              </p>
              {[
                { title: "Late Night Talks", className: "absolute top-10 left-[20%] rotate-[-5deg]" },
                { title: "Mental Wellness", className: "absolute top-5 left-[45%] rotate-[8deg]" },
                { title: "Identity", className: "absolute top-20 right-[25%] rotate-[2deg]" },
              ].map((item) => (
                <DraggableCardBody key={item.title} className={item.className}>
                  <div className="h-48 w-48 rounded-xl bg-gradient-to-br from-raw-gold/20 to-raw-surface flex items-center justify-center">
                    <span className="font-display text-lg text-raw-text">{item.title}</span>
                  </div>
                </DraggableCardBody>
              ))}
            </DraggableCardContainer>
          </Section>

          {/* ── Infinite Moving Cards ── */}
          <Section
            id="infinite-moving-cards"
            title="Infinite Moving Cards"
            description="Auto-scrolling testimonial carousel with pause on hover. Great for social proof."
          >
            <div className="py-4">
              <InfiniteMovingCards
                items={testimonials}
                direction="left"
                speed="slow"
              />
            </div>
          </Section>

          {/* ── Tabs (Aceternity) ── */}
          <Section
            id="tabs-aceternity"
            title="Tabs (Aceternity)"
            description="3D stacked tab interface with spring animations. For multi-section content."
          >
            <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative flex flex-col w-full items-start justify-start">
              <Tabs tabs={aceternityTabs} />
            </div>
          </Section>

          {/* ── Terminal ── */}
          <Section
            id="terminal"
            title="Terminal"
            description="Animated terminal with typing effect and syntax highlighting. For code demos."
          >
            <div className="max-w-2xl mx-auto py-4">
              <Terminal
                commands={[
                  "npm install raw-war",
                  "raw init --anonymous",
                  "raw join community/late-night-talks",
                  "# Welcome to raW",
                ]}
                outputs={{
                  0: ["added 142 packages in 3.2s"],
                  1: ["Initialized anonymous identity: shadow_x"],
                  2: ["Joined: Late Night Talks (24 online)"],
                }}
                typingSpeed={40}
                enableSound={false}
              />
            </div>
          </Section>

          {/* ── World Map ── */}
          <Section
            id="world-map"
            title="World Map"
            description="Dotted world map with animated connection paths. For global presence visualization."
          >
            <div className="py-4">
              <WorldMap dots={worldMapDots} lineColor="#F1C42D" />
            </div>
          </Section>

          {/* ── Floating Dock ── */}
          <Section
            id="floating-dock"
            title="Floating Dock"
            description="macOS-style dock with hover expansion. For app-like navigation."
          >
            <div className="flex items-center justify-center py-16">
              <FloatingDock items={dockItems} />
            </div>
          </Section>

          {/* ── Phone Mockup ── */}
          <Section
            id="phone-mockup"
            title="Phone Mockup"
            description="iPhone-style device frame with status bar. For mobile UI previews."
          >
            <div className="flex items-center justify-center py-8">
              <PhoneMockup>
                <div className="p-4 space-y-3">
                  <h3 className="font-display text-sm text-raw-text">Late Night Talks</h3>
                  <p className="text-xs text-raw-silver/50">24 people online</p>
                  <div className="space-y-2">
                    {["Does anyone else feel like this?", "You're not alone", "Same here"].map((msg) => (
                      <div key={msg} className="rounded-lg bg-raw-surface p-2">
                        <p className="text-[10px] text-raw-silver/70">{msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </Section>

          {/* ── Avatar Figure ── */}
          <Section
            id="avatar-figure"
            title="Avatar Figure"
            description="10-level avatar progression system with SVG design. For user identity / gamification."
          >
            <div className="flex flex-wrap items-end justify-center gap-4 py-6">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <AvatarFigure level={i + 1} size="md" />
                  <span className="text-xs text-raw-silver/50">Lv.{i + 1}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Aceternity Input ── */}
          <Section
            id="aceternity-input"
            title="Aceternity Input & Label"
            description="Form input with mouse-tracking gradient border. For stylized forms."
          >
            <div className="max-w-md mx-auto space-y-4 py-6">
              <div>
                <Label>Username</Label>
                <Input placeholder="Enter your anonymous name" className="mt-2" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" className="mt-2" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" className="mt-2" />
              </div>
            </div>
          </Section>

          {/* ── 3D Globe ── */}
          <Section
            id="3d-globe"
            title="3D Globe"
            description="Interactive Three.js globe with avatar markers. For global community visualization. (Heavy — lazy loaded)"
          >
            <div className="relative h-[500px] w-full">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-raw-silver/40">
                    Loading 3D Globe...
                  </div>
                }
              >
                <Globe3DLazy
                  className="h-full w-full"
                  markers={globeMarkers}
                  config={{
                    atmosphereColor: "#F1C42D",
                    atmosphereIntensity: 20,
                    autoRotateSpeed: 0.5,
                  }}
                />
              </Suspense>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
