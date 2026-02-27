import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFacebookAdsConfig, useSyncFacebookAds } from "./useFacebookAdsConfig";
import { useFacebookTokenStatus } from "./useFacebookTokenStatus";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Global flag to prevent multiple tabs/components from triggering sync
let globalSyncInProgress = false;

export function useAutoSyncFacebookAds() {
  const queryClient = useQueryClient();
  const { data: config } = useFacebookAdsConfig();
  const { data: tokenStatus } = useFacebookTokenStatus(!!config?.is_active);
  const { mutate: syncFacebookAds, isPending: isSyncing } = useSyncFacebookAds();
  const hasSyncedThisSessionRef = useRef(false);

  useEffect(() => {
    if (hasSyncedThisSessionRef.current || globalSyncInProgress) return;

    const isDataStale = () => {
      if (!config?.last_sync_at) return true;
      const lastSync = new Date(config.last_sync_at).getTime();
      return Date.now() - lastSync > SIX_HOURS_MS;
    };

    const isTokenValid = tokenStatus?.isValid === true;
    
    if (config?.is_active && isTokenValid && isDataStale()) {
      hasSyncedThisSessionRef.current = true;
      globalSyncInProgress = true;
      syncFacebookAds({ syncMode: "quick" }, {
        onSettled: () => { globalSyncInProgress = false; }
      });
    }
  }, [config, tokenStatus, syncFacebookAds]);

  return { isSyncing, lastSyncAt: config?.last_sync_at, tokenStatus };
}
