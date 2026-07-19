import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { captureAdminException } from "@/lib/analytics";

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  // Only the latest request may write state, so a slow earlier response can't
  // overwrite fresher data after quick filter/tab switches.
  const requestIdRef = useRef(0);

  const reload = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    loader()
      .then((result) => {
        if (requestIdRef.current === requestId) setData(result);
      })
      .catch((error) => {
        if (requestIdRef.current !== requestId) return;
        captureAdminException(error, { action: "admin_data_load" });
        toast({
          title: "Could not load data",
          description: error instanceof Error ? error.message : undefined,
        });
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, reload };
}
