"use client";
import React from "react";
import { Boxes } from "./background-boxes";
import { cn } from "@/lib/utils";
export function BackgroundBoxesDemo() {
  return (
    <div className="h-96 relative w-full overflow-hidden bg-raw-black flex flex-col items-center justify-center rounded-lg">
      <div className="absolute inset-0 w-full h-full bg-raw-black z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      <Boxes />
      <h1 className={cn("md:text-4xl text-xl text-raw-text font-display tracking-wide relative z-20")}>
        ra<span className="text-raw-gold">W</span>
      </h1>
      <p className="text-center mt-2 text-raw-silver/50 relative z-20">
        Anonymous. Community-First. Identity-Driven.
      </p>
    </div>
  );
}
