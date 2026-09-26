'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CivicProcess, StepStatus } from '@/types/roadmap';

const STORAGE_PREFIX = 'untangle_progress_';

export function useRoadmapProgress(process: CivicProcess) {
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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
      // Fallback for private browsing or disabled storage
      setCompletedStepIds([]);
    } finally {
      setIsLoaded(true);
    }
  }, [process.id]);

  // Persist to localStorage
  const saveToStorage = useCallback(
    (newCompleted: string[]) => {
      setCompletedStepIds(newCompleted);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${process.id}`, JSON.stringify(newCompleted));
      } catch {
        // Silent catch for quota or access issues
      }
    },
    [process.id]
  );

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

  const resetProgress = useCallback(() => {
    saveToStorage([]);
  }, [saveToStorage]);

  const progressPercent = useMemo(() => {
    if (process.steps.length === 0) return 0;
    return Math.round((completedStepIds.length / process.steps.length) * 100);
  }, [completedStepIds.length, process.steps.length]);

  return {
    completedStepIds,
    isLoaded,
    stepStatusMap,
    unmetDependenciesMap,
    toggleStep,
    resetProgress,
    progressPercent,
  };
}
