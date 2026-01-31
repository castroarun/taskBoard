import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from '../store';
import { syncInbox, isSyncConfigured } from '../services/inbox-sync';

const SYNC_DEBOUNCE_MS = 5000;

export function useSyncScheduler() {
  const inbox = useAppStore((s) => s.inbox);
  const setInbox = useAppStore((s) => s.setInbox);
  const setLastSynced = useAppStore((s) => s.setLastSynced);
  const setSyncing = useAppStore((s) => s.setSyncing);

  const lastInboxLengthRef = useRef(inbox.length);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);

  const doSync = useCallback(async () => {
    if (isSyncingRef.current) return;

    const configured = await isSyncConfigured();
    if (!configured) return;

    isSyncingRef.current = true;
    setSyncing(true);

    try {
      const result = await syncInbox(inbox);

      if (result.newFromRemote > 0 || result.conflicts > 0) {
        setInbox(result.merged);
      }

      setLastSynced(new Date().toISOString());
    } catch (error) {
      console.warn('[SyncScheduler] Sync failed:', error);
    } finally {
      isSyncingRef.current = false;
      setSyncing(false);
    }
  }, [inbox, setInbox, setLastSynced, setSyncing]);

  // Sync when app comes to foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        doSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [doSync]);

  // Sync after inbox changes (debounced)
  useEffect(() => {
    if (inbox.length !== lastInboxLengthRef.current) {
      lastInboxLengthRef.current = inbox.length;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSync();
      }, SYNC_DEBOUNCE_MS);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inbox.length, doSync]);

  // Initial sync on mount
  useEffect(() => {
    doSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { syncNow: doSync };
}
