"use client";
import { Globe3D, GlobeMarker } from "@/components/ui/3d-globe";
const sampleMarkers: GlobeMarker[] = [
  {
    lat: 40.7128,
    lng: -74.006,
    src: "https://assets.aceternity.com/avatars/1.webp",
    label: "New York",
  },
  {
    lat: 51.5074,
    lng: -0.1278,
    src: "https://assets.aceternity.com/avatars/2.webp",
    label: "London",
  },
  {
    lat: 35.6762,
    lng: 139.6503,
    src: "https://assets.aceternity.com/avatars/3.webp",
    label: "Tokyo",
  },
  {
    lat: -33.8688,
    lng: 151.2093,
    src: "https://assets.aceternity.com/avatars/4.webp",
    label: "Sydney",
  },
  {
    lat: 48.8566,
    lng: 2.3522,
    src: "https://assets.aceternity.com/avatars/5.webp",
    label: "Paris",
  },
  {
    lat: 28.6139,
    lng: 77.209,
    src: "https://assets.aceternity.com/avatars/6.webp",
    label: "New Delhi",
  },
  {
    lat: 55.7558,
    lng: 37.6173,
    src: "https://assets.aceternity.com/avatars/7.webp",
    label: "Moscow",
  },
  {
    lat: -22.9068,
    lng: -43.1729,
    src: "https://assets.aceternity.com/avatars/8.webp",
    label: "Rio de Janeiro",
  },
  {
    lat: 31.2304,
    lng: 121.4737,
    src: "https://assets.aceternity.com/avatars/9.webp",
    label: "Shanghai",
  },
  {
    lat: 25.2048,
    lng: 55.2708,
    src: "https://assets.aceternity.com/avatars/10.webp",
    label: "Dubai",
  },
  {
    lat: -34.6037,
    lng: -58.3816,
    src: "https://assets.aceternity.com/avatars/11.webp",
    label: "Buenos Aires",
  },
  {
    lat: 1.3521,
    lng: 103.8198,
    src: "https://assets.aceternity.com/avatars/12.webp",
    label: "Singapore",
  },
  {
    lat: 37.5665,
    lng: 126.978,
    src: "https://assets.aceternity.com/avatars/13.webp",
    label: "Seoul",
  },
];
export function Globe3DDemoThird() {
  return (
    <div className="relative mx-auto h-[400px] w-full max-w-7xl overflow-hidden rounded-2xl bg-raw-black border border-raw-border">
      <div className="relative z-10 p-4 md:p-12">
        <h2 className="mb-4 max-w-2xl text-2xl font-display tracking-wide text-raw-text md:text-5xl lg:text-6xl">
          24/7 communities <span className="text-raw-gold">worldwide.</span>
        </h2>
        <p className="mt-2 max-w-lg text-balance text-raw-silver/50 md:mt-8 md:text-lg">
          Join founding communities and connect with people who think deeply, feel deeply, and want honest conversation.
        </p>
        <div className="mt-4 flex gap-4 md:mt-8">
          <button className="flex cursor-pointer items-center justify-center rounded-full bg-raw-gold px-6 py-2 font-semibold text-raw-ink transition-all duration-200 hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20 active:scale-98">
            Join Free
          </button>
          <button className="flex cursor-pointer items-center justify-center rounded-full border border-raw-border px-6 py-2 font-medium text-raw-silver/80 transition-all duration-200 hover:border-raw-silver/30 active:scale-98">
            Explore
          </button>
        </div>
      </div>
      {/* Globe container - sized and positioned just for the globe */}
      <div className="absolute -right-72 -bottom-96 z-10 size-160 md:-bottom-80 md:size-180">
        <Globe3D
          className="h-full w-full"
          markers={sampleMarkers}
          config={{
            atmosphereColor: "#F1C42D",
            atmosphereIntensity: 20,
            bumpScale: 5,
            autoRotateSpeed: 0.3,
          }}
          onMarkerClick={(marker) => {
            console.log("Clicked marker:", marker.label);
          }}
          onMarkerHover={(marker) => {
            if (marker) {
              console.log("Hovering:", marker.label);
            }
          }}
        />
      </div>
    </div>
  );
}
