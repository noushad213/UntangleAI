'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SavedRoadmapSession,
  getLastVisitedSession,
  getRecentRoadmapSessions,
  saveLastVisitedSession,
  removeRecentRoadmap,
  clearAllUntangleData,
} from '@/lib/storage';

export function usePersistentSession() {
  const [lastSession, setLastSession] = useState<SavedRoadmapSession | null>(null);
  const [recentRoadmaps, setRecentRoadmaps] = useState<SavedRoadmapSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync state from storage
  const syncSessions = useCallback(() => {
    const last = getLastVisitedSession();
    const recents = getRecentRoadmapSessions();
    setLastSession(last);
    setRecentRoadmaps(recents);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    syncSessions();

    const handleSessionUpdate = () => {
      syncSessions();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key?.startsWith('untangle_') ||
        e.key === null // Storage was cleared
      ) {
        syncSessions();
      }
    };

    window.addEventListener('untangle:session-updated', handleSessionUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('untangle:session-updated', handleSessionUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncSessions]);

  const updateSession = useCallback((session: SavedRoadmapSession) => {
    if (session.hasStartedTracking !== true) return;
    saveLastVisitedSession(session);
    setLastSession(session);
    setRecentRoadmaps((prev) => {
      const filtered = prev.filter((r) => r.id !== session.id);
      return [session, ...filtered].slice(0, 10);
    });
  }, []);

  const removeSession = useCallback((id: string) => {
    removeRecentRoadmap(id);
    const updated = getRecentRoadmapSessions();
    const last = getLastVisitedSession();
    setRecentRoadmaps(updated);
    setLastSession(last);
  }, []);

  const clearAll = useCallback(() => {
    clearAllUntangleData();
    setLastSession(null);
    setRecentRoadmaps([]);
  }, []);

  return {
    lastSession,
    recentRoadmaps,
    hasSavedSession: Boolean(lastSession && isLoaded),
    isLoaded,
    updateSession,
    removeSession,
    clearAll,
    refresh: syncSessions,
  };
}
