import { useMemo } from "react";

export type HostMode = "marketing" | "app";

function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function useHostMode() {
  return useMemo(() => {
    const hostname = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
    const isMyRawApp = matchesDomain(hostname, "myraw.app");
    const isTheRawMe = matchesDomain(hostname, "theraw.me");

    const mode: HostMode = isMyRawApp ? "app" : "marketing";

    return {
      mode,
      hostname,
      isMyRawApp,
      isTheRawMe,
    };
  }, []);
}
