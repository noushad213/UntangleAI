'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CivicProcess, StepStatus } from '@/types/roadmap';
import {
  TrackedDocument,
  RoadmapTrackingState,
  getStoredTrackingState,
  saveTrackingState,
  fileToBase64,
  downloadTrackedDocument,
  exportDossierJSON,
} from '@/lib/document-vault';

const STORAGE_PREFIX = 'untangle_progress_';

export function useRoadmapProgress(process: CivicProcess) {
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Tracking state and document vault
  const [trackingState, setTrackingState] = useState<RoadmapTrackingState>({
    isTrackingActive: false,
    documents: [],
  });
  const [isTrackerDrawerOpen, setIsTrackerDrawerOpen] = useState(false);

  // Initialize from localStorage once on client
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${process.id}`);
      if (stored) {
        setCompletedStepIds(JSON.parse(stored));
      } else {
        setCompletedStepIds([]);
      }
    } catch {
      setCompletedStepIds([]);
    }

    // Load document vault state
    const vaultState = getStoredTrackingState(process.id);
    setTrackingState(vaultState);

    setIsLoaded(true);
  }, [process.id]);

  // Persist completed steps to localStorage
  const saveToStorage = useCallback(
    (newCompleted: string[]) => {
      setCompletedStepIds(newCompleted);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${process.id}`, JSON.stringify(newCompleted));
      } catch {
        // Quota or access error
      }
    },
    [process.id]
  );

  // Start tracking roadmap
  const startTracking = useCallback(() => {
    setTrackingState((prev) => {
      const next: RoadmapTrackingState = {
        ...prev,
        isTrackingActive: true,
        startedAt: prev.startedAt || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      saveTrackingState(process.id, next);
      return next;
    });
  }, [process.id]);

  // Stop / pause tracking roadmap
  const stopTracking = useCallback(() => {
    setTrackingState((prev) => {
      const next: RoadmapTrackingState = {
        ...prev,
        isTrackingActive: false,
      };
      saveTrackingState(process.id, next);
      return next;
    });
  }, [process.id]);

  // Upload and persist document
  const uploadDocument = useCallback(
    async (file: File, stepId: string, requirementId?: string): Promise<TrackedDocument> => {
      const base64 = await fileToBase64(file);

      const newDoc: TrackedDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        roadmapId: process.id,
        stepId,
        requirementId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        dataUrl: base64,
        status: 'attached_locally',
      };

      setTrackingState((prev) => {
        // If replacing an existing doc for this requirement, filter it out
        const filtered = requirementId
          ? prev.documents.filter((d) => d.requirementId !== requirementId)
          : prev.documents;

        const next: RoadmapTrackingState = {
          ...prev,
          isTrackingActive: true, // Auto-activate tracking upon upload
          startedAt: prev.startedAt || new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          documents: [newDoc, ...filtered],
        };
        saveTrackingState(process.id, next);
        return next;
      });

      return newDoc;
    },
    [process.id]
  );

  // Remove document
  const removeDocument = useCallback(
    (docId: string) => {
      setTrackingState((prev) => {
        const next: RoadmapTrackingState = {
          ...prev,
          lastActiveAt: new Date().toISOString(),
          documents: prev.documents.filter((d) => d.id !== docId),
        };
        saveTrackingState(process.id, next);
        return next;
      });
    },
    [process.id]
  );

  // Download document
  const downloadDoc = useCallback(
    (docId: string) => {
      const found = trackingState.documents.find((d) => d.id === docId);
      if (found) {
        downloadTrackedDocument(found);
      }
    },
    [trackingState.documents]
  );

  // Export dossier JSON
  const exportDossier = useCallback(() => {
    exportDossierJSON(
      process.title,
      process.location,
      completedStepIds,
      process.steps.length,
      trackingState.documents
    );
  }, [process.title, process.location, completedStepIds, process.steps.length, trackingState.documents]);

  const completedSet = useMemo(() => new Set(completedStepIds), [completedStepIds]);

  // Map of stepId -> unmet prerequisite titles
  const unmetDependenciesMap = useMemo(() => {
    const map = new Map<string, string[]>();

    process.steps.forEach((step) => {
      const directPrereqs = process.dependencies.filter(
        (dep) => dep.stepId === step.id && dep.dependencyType === 'required'
      );

      const unmetNames: string[] = [];
      directPrereqs.forEach((dep) => {
        if (!completedSet.has(dep.dependsOnStepId)) {
          const prereqStep = process.steps.find((s) => s.id === dep.dependsOnStepId);
          if (prereqStep) {
            unmetNames.push(prereqStep.shortTitle || prereqStep.title);
          }
        }
      });

      map.set(step.id, unmetNames);
    });

    return map;
  }, [process.steps, process.dependencies, completedSet]);

  const stepStatusMap = useMemo(() => {
    const statusMap = new Map<string, StepStatus>();

    process.steps.forEach((step) => {
      if (completedSet.has(step.id)) {
        statusMap.set(step.id, 'completed');
        return;
      }

      const unmet = unmetDependenciesMap.get(step.id) || [];
      if (unmet.length > 0) {
        statusMap.set(step.id, 'locked');
      } else {
        statusMap.set(step.id, 'pending');
      }
    });

    return statusMap;
  }, [process.steps, completedSet, unmetDependenciesMap]);

  const toggleStep = useCallback(
    (stepId: string) => {
      const next = completedSet.has(stepId)
        ? completedStepIds.filter((id) => id !== stepId)
        : [...completedStepIds, stepId];
      saveToStorage(next);
    },
    [completedSet, completedStepIds, saveToStorage]
  );

  const setStepCompleted = useCallback(
    (stepId: string, completed: boolean) => {
      const isCurrentlyCompleted = completedSet.has(stepId);
      if (completed && !isCurrentlyCompleted) {
        saveToStorage([...completedStepIds, stepId]);
      } else if (!completed && isCurrentlyCompleted) {
        saveToStorage(completedStepIds.filter((id) => id !== stepId));
      }
    },
    [completedSet, completedStepIds, saveToStorage]
  );

  const resetProgress = useCallback(() => {
    saveToStorage([]);
    const resetVault: RoadmapTrackingState = {
      isTrackingActive: false,
      documents: [],
    };
    setTrackingState(resetVault);
    saveTrackingState(process.id, resetVault);
  }, [saveToStorage, process.id]);

  const progressPercent = useMemo(() => {
    if (process.steps.length === 0) return 0;
    return Math.round((completedStepIds.length / process.steps.length) * 100);
  }, [completedStepIds.length, process.steps.length]);

  // Documents mapped by stepId
  const stepDocumentsMap = useMemo(() => {
    const map = new Map<string, TrackedDocument[]>();
    trackingState.documents.forEach((doc) => {
      const existing = map.get(doc.stepId) || [];
      existing.push(doc);
      map.set(doc.stepId, existing);
    });
    return map;
  }, [trackingState.documents]);

  // Documents mapped by requirementId
  const requirementDocumentsMap = useMemo(() => {
    const map = new Map<string, TrackedDocument>();
    trackingState.documents.forEach((doc) => {
      if (doc.requirementId) {
        map.set(doc.requirementId, doc);
      }
    });
    return map;
  }, [trackingState.documents]);

  const openTrackerDrawer = useCallback(() => setIsTrackerDrawerOpen(true), []);
  const closeTrackerDrawer = useCallback(() => setIsTrackerDrawerOpen(false), []);

  return {
    completedStepIds,
    isLoaded,
    stepStatusMap,
    unmetDependenciesMap,
    toggleStep,
    setStepCompleted,
    resetProgress,
    progressPercent,
    // Tracking & Document Vault
    isTrackingActive: trackingState.isTrackingActive,
    documents: trackingState.documents,
    startTracking,
    stopTracking,
    uploadDocument,
    removeDocument,
    downloadDoc,
    exportDossier,
    stepDocumentsMap,
    requirementDocumentsMap,
    isTrackerDrawerOpen,
    openTrackerDrawer,
    closeTrackerDrawer,
  };
}
