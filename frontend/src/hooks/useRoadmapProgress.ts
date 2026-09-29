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
import {
  verifyDocumentType,
  guessVerifiableDocumentType,
  dataUrlToBlob,
  VerificationResult,
} from '@/lib/document-verification';

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
        const parsed = JSON.parse(stored);
        setCompletedStepIds(Array.isArray(parsed) ? parsed.filter((id): id is string =>
          typeof id === 'string' && process.steps.some((step) => step.id === id)
        ) : []);
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
  }, [process.id, process.steps]);

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
  const startTracking = useCallback((enableResume = false) => {
    setTrackingState((prev) => {
      const next: RoadmapTrackingState = {
        ...prev,
        isTrackingActive: true,
        hasStartedTracking: prev.hasStartedTracking === true || enableResume,
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

  // Upload and persist document (with auto-OCR verification when requirement type is known)
  const uploadDocument = useCallback(
    async (file: File, stepId: string, requirementId?: string): Promise<TrackedDocument> => {
      const base64 = await fileToBase64(file);

      const req = requirementId
        ? process.steps.flatMap((s) => s.requirements || []).find((r) => r.id === requirementId)
        : undefined;
      const guessedType = guessVerifiableDocumentType(req?.title);
      const requirementIndex = process.steps
        .find((step) => step.id === stepId)
        ?.requirements?.findIndex((requirement) => requirement.id === requirementId) ?? -1;

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
        verificationStatus: guessedType ? 'checking' : undefined,
        expectedType: guessedType || undefined,
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

      // If document type is identifiable, run OCR verification in background
      if (guessedType && requirementIndex >= 0) {
        verifyDocumentType(file, file.name, {
          workflowId: process.id,
          stepId,
          requirementIndex,
        }, true)
          .then((res) => {
            setTrackingState((prev) => {
              const next: RoadmapTrackingState = {
                ...prev,
                documents: prev.documents.map((d) => {
                  if (d.id !== newDoc.id) return d;
                  return {
                    ...d,
                    verificationStatus: res.valid
                      ? 'verified'
                      : res.status === 'mismatch'
                      ? 'mismatch'
                      : 'unverified',
                    detectedType: res.detectedDocumentType || undefined,
                    expectedType: res.expectedDocumentType || guessedType,
                    verificationMessage: res.message,
                    verificationConfidence: res.confidence,
                  };
                }),
              };
              saveTrackingState(process.id, next);
              return next;
            });
          })
          .catch(() => {
            // Keep local document intact even if OCR is offline
            setTrackingState((prev) => {
              const next: RoadmapTrackingState = {
                ...prev,
                documents: prev.documents.map((d) =>
                  d.id === newDoc.id ? { ...d, verificationStatus: 'unverified' } : d
                ),
              };
              saveTrackingState(process.id, next);
              return next;
            });
          });
      }

      return newDoc;
    },
    [process.id, process.steps]
  );

  // Manually verify or re-verify a document
  const verifyDocument = useCallback(
    async (docId: string): Promise<VerificationResult | null> => {
      const doc = trackingState.documents.find((d) => d.id === docId);
      if (!doc || !doc.dataUrl) return null;

      const step = process.steps.find((item) => item.id === doc.stepId);
      const requirementIndex = step?.requirements?.findIndex((item) => item.id === doc.requirementId) ?? -1;
      const requirement = requirementIndex >= 0 ? step?.requirements?.[requirementIndex] : undefined;
      const expectedType = guessVerifiableDocumentType(requirement?.title) || undefined;
      if (!expectedType || requirementIndex < 0) return null;

      setTrackingState((prev) => {
        const next: RoadmapTrackingState = {
          ...prev,
          documents: prev.documents.map((d) =>
            d.id === docId ? { ...d, verificationStatus: 'checking' } : d
          ),
        };
        saveTrackingState(process.id, next);
        return next;
      });

      try {
        const blob = dataUrlToBlob(doc.dataUrl);
        const result = await verifyDocumentType(blob, doc.fileName, {
          workflowId: process.id,
          stepId: doc.stepId,
          requirementIndex,
        }, true);

        setTrackingState((prev) => {
          const next: RoadmapTrackingState = {
            ...prev,
            documents: prev.documents.map((d) => {
              if (d.id !== docId) return d;
              return {
                ...d,
                verificationStatus: result.valid
                  ? 'verified'
                  : result.status === 'mismatch'
                  ? 'mismatch'
                  : 'unverified',
                detectedType: result.detectedDocumentType || undefined,
                expectedType: result.expectedDocumentType || expectedType,
                verificationMessage: result.message,
                verificationConfidence: result.confidence,
              };
            }),
          };
          saveTrackingState(process.id, next);
          return next;
        });

        return result;
      } catch (err) {
        setTrackingState((prev) => {
          const next: RoadmapTrackingState = {
            ...prev,
            documents: prev.documents.map((d) =>
              d.id === docId ? { ...d, verificationStatus: 'failed' } : d
            ),
          };
          saveTrackingState(process.id, next);
          return next;
        });
        return null;
      }
    },
    [process.id, process.steps, trackingState.documents]
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
    hasStartedTracking: trackingState.hasStartedTracking === true,
    documents: trackingState.documents,
    startTracking,
    stopTracking,
    uploadDocument,
    verifyDocument,
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
