/**
 * UntangleAI Persistent Storage Layer
 * 
 * Provides robust, privacy-first local persistence across browser sessions:
 * - Last visited roadmap, step, and workspace preferences
 * - Recent roadmaps history and completion tracking
 * - Safe error handling (Storage quota, SSR guards, private browsing)
 * - Cross-tab synchronization via storage event dispatch
 * - Data export / import for privacy and multi-device portability
 */

export interface SavedRoadmapFilters {
  location: string;
  applicantProfile: string;
  serviceMode: string;
}

export interface SavedRoadmapSession {
  id: string;
  title: string;
  location: string;
  lastActiveStepId?: string;
  lastActiveStepTitle?: string;
  lastVisitedAt: string; // ISO string
  completedCount: number;
  totalSteps: number;
  progressPercent: number;
  viewMode?: 'graph' | 'list';
  isTrackingMode?: boolean;
  hasStartedTracking?: boolean;
  filters?: SavedRoadmapFilters;
  urlPath?: string;
}

export interface RoadmapPreferences {
  lastActiveStepId?: string;
  selectedStepId?: string;
  viewMode?: 'graph' | 'list';
  isTrackingMode?: boolean;
  filters?: SavedRoadmapFilters;
  lastVisitedAt?: string;
}

const STORAGE_KEYS = {
  LAST_SESSION: 'untangle_last_session',
  RECENT_ROADMAPS: 'untangle_recent_roadmaps',
  PREFS_PREFIX: 'untangle_roadmap_prefs_',
  PROGRESS_PREFIX: 'untangle_progress_',
  TASKS_PREFIX: 'untangle_tasks_',
  TRACKING_PREFIX: 'untangle_tracking_',
  THEME: 'untangle_theme',
  LANG: 'untangle_lang',
} as const;

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__untangle_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the last visited roadmap session
 */
export function getLastVisitedSession(): SavedRoadmapSession | null {
  if (!isStorageAvailable()) return null;
  try {
    const data = window.localStorage.getItem(STORAGE_KEYS.LAST_SESSION);
    if (!data) return getRecentRoadmapSessions()[0] || null;
    const session = JSON.parse(data) as SavedRoadmapSession;
    return session?.hasStartedTracking === true
      ? session
      : getRecentRoadmapSessions()[0] || null;
  } catch {
    return null;
  }
}

/**
 * Build resume URL that opens the roadmap directly in tracking workspace mode
 */
export function buildResumeUrl(session: { id: string; urlPath?: string; lastActiveStepId?: string }): string {
  const base = session.urlPath || `/roadmap/${session.id}`;
  const [path, query] = base.split('?');
  const params = new URLSearchParams(query || '');
  params.set('track', 'true');
  params.set('resume', 'true');
  if (session.lastActiveStepId && !params.has('step')) {
    params.set('step', session.lastActiveStepId);
  }
  return `${path}?${params.toString()}`;
}

/**
 * Save the last visited roadmap session and add to recent roadmaps
 */
export function saveLastVisitedSession(session: SavedRoadmapSession): void {
  if (session.hasStartedTracking !== true) return;
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify(session));

    // Also update recent roadmaps list
    updateRecentRoadmaps(session);

    // Dispatch event so other components / tabs update reactively
    window.dispatchEvent(
      new CustomEvent('untangle:session-updated', {
        detail: session,
      })
    );
  } catch (err) {
    console.warn('UntangleAI: Failed to save last visited session to localStorage', err);
  }
}

/**
 * Get list of all recent roadmap sessions (up to 10)
 */
export function getRecentRoadmapSessions(): SavedRoadmapSession[] {
  if (!isStorageAvailable()) return [];
  try {
    const data = window.localStorage.getItem(STORAGE_KEYS.RECENT_ROADMAPS);
    if (!data) return [];
    const list = JSON.parse(data) as SavedRoadmapSession[];
    return Array.isArray(list) ? list.filter((session) => session?.hasStartedTracking === true) : [];
  } catch {
    return [];
  }
}

/**
 * Internal: Update or insert session in recent roadmaps list
 */
function updateRecentRoadmaps(session: SavedRoadmapSession): void {
  if (!isStorageAvailable()) return;
  try {
    const currentList = getRecentRoadmapSessions();
    const filtered = currentList.filter((item) => item.id !== session.id);
    const updated = [session, ...filtered].slice(0, 10);
    window.localStorage.setItem(STORAGE_KEYS.RECENT_ROADMAPS, JSON.stringify(updated));
  } catch (err) {
    console.warn('UntangleAI: Failed to update recent roadmaps', err);
  }
}

/**
 * Remove a specific roadmap from recent sessions
 */
export function removeRecentRoadmap(id: string): void {
  if (!isStorageAvailable()) return;
  try {
    const currentList = getRecentRoadmapSessions();
    const updated = currentList.filter((item) => item.id !== id);
    window.localStorage.setItem(STORAGE_KEYS.RECENT_ROADMAPS, JSON.stringify(updated));

    // If removing the active session, clear last session or set to next available
    const lastSession = getLastVisitedSession();
    if (lastSession?.id === id) {
      if (updated.length > 0) {
        window.localStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify(updated[0]));
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.LAST_SESSION);
      }
    }

    window.dispatchEvent(
      new CustomEvent('untangle:session-updated', {
        detail: updated[0] || null,
      })
    );
  } catch (err) {
    console.warn('UntangleAI: Failed to remove recent roadmap', err);
  }
}

/**
 * Get preferences for a specific roadmap (last active step, view mode, filters)
 */
export function getRoadmapPreferences(roadmapId: string): RoadmapPreferences | null {
  if (!isStorageAvailable()) return null;
  try {
    const data = window.localStorage.getItem(`${STORAGE_KEYS.PREFS_PREFIX}${roadmapId}`);
    if (!data) return null;
    return JSON.parse(data) as RoadmapPreferences;
  } catch {
    return null;
  }
}

/**
 * Save preferences for a specific roadmap
 */
export function saveRoadmapPreferences(
  roadmapId: string,
  prefs: Partial<RoadmapPreferences>
): void {
  if (!isStorageAvailable()) return;
  try {
    const existing = getRoadmapPreferences(roadmapId) || {};
    const updated: RoadmapPreferences = {
      ...existing,
      ...prefs,
      lastVisitedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      `${STORAGE_KEYS.PREFS_PREFIX}${roadmapId}`,
      JSON.stringify(updated)
    );
  } catch (err) {
    console.warn(`UntangleAI: Failed to save preferences for ${roadmapId}`, err);
  }
}

/**
 * Export all UntangleAI local data as a JSON string for user backup / portability
 */
export function exportAllUntangleData(): string {
  if (!isStorageAvailable()) return '{}';
  const dump: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data: {},
  };

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith('untangle_') || key.startsWith('untangle:'))) {
        try {
          dump.data[key] = JSON.parse(window.localStorage.getItem(key) || '');
        } catch {
          dump.data[key] = window.localStorage.getItem(key);
        }
      }
    }
  } catch (err) {
    console.warn('UntangleAI: Error generating data export', err);
  }

  return JSON.stringify(dump, null, 2);
}

/**
 * Import UntangleAI local data from a JSON backup string
 */
export function importUntangleData(jsonString: string): boolean {
  if (!isStorageAvailable()) return false;
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed.data !== 'object') return false;

    Object.entries(parsed.data).forEach(([key, val]) => {
      if (key.startsWith('untangle_')) {
        const strVal = typeof val === 'string' ? val : JSON.stringify(val);
        window.localStorage.setItem(key, strVal);
      }
    });

    window.dispatchEvent(new CustomEvent('untangle:session-updated'));
    return true;
  } catch (err) {
    console.warn('UntangleAI: Failed to import data', err);
    return false;
  }
}

/**
 * Clear all UntangleAI local data
 */
export function clearAllUntangleData(): void {
  if (!isStorageAvailable()) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith('untangle_') || key.startsWith('untangle:'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('untangle:session-updated', { detail: null }));
  } catch (err) {
    console.warn('UntangleAI: Failed to clear storage', err);
  }
}
