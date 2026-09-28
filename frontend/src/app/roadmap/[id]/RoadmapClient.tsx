'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, ExternalLink, FolderCheck, Network } from 'lucide-react';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import { CivicProcess, ProcessStep } from '@/types/roadmap';
import { useLanguage } from '@/context/LanguageContext';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { RoadmapHeader } from '@/components/roadmap/RoadmapHeader';
import { RoadmapReviewNotice } from '@/components/roadmap/RoadmapReviewNotice';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { StepListView } from '@/components/roadmap/StepListView';
import { DetailPanel } from '@/components/roadmap/DetailPanel';
import { DocumentVaultDrawer } from '@/components/roadmap/DocumentVaultDrawer';
import { TrackingWorkspacePane } from '@/components/roadmap/TrackingWorkspacePane';
import {
  RoadmapFilters,
  INDIAN_LOCATIONS,
  DEFAULT_TEMPLATE_LOCATION,
  adaptRoadmapForContext,
  requestAIRoadmapAdaptation,
} from '@/lib/roadmap-adapters';
import {
  getRoadmapPreferences,
  saveRoadmapPreferences,
  saveLastVisitedSession,
} from '@/lib/storage';
import styles from '@/app/page.module.css';

interface RoadmapClientProps {
  initialProcess: CivicProcess;
}

export default function RoadmapClient({ initialProcess }: RoadmapClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getLocalizedRoadmap, t } = useLanguage();

  const isResumeRequested =
    searchParams?.get('track') === 'true' ||
    searchParams?.get('resume') === 'true';

  const [selectedStepId, setSelectedStepId] = useState<string | null>(() => {
    const stepParam = searchParams?.get('step');
    if (stepParam && initialProcess.steps.some((s) => s.id === stepParam)) {
      return stepParam;
    }
    if (isResumeRequested) {
      return initialProcess.steps[0]?.id || null;
    }
    return null;
  });

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isTrackingMode, setIsTrackingMode] = useState(isResumeRequested);
  const [currentProcessRaw, setCurrentProcessRaw] = useState<CivicProcess>(initialProcess);

  // Match default location based on URL param, process location, or process title
  const defaultLocation = useMemo(() => {
    const locParam = searchParams?.get('location');
    if (locParam && INDIAN_LOCATIONS.some((l) => l.id === locParam)) {
      return locParam;
    }
    if (!initialProcess.review) return DEFAULT_TEMPLATE_LOCATION;
    const match = INDIAN_LOCATIONS.find(
      (l) =>
        initialProcess.location.toLowerCase().includes(l.id) ||
        l.name.toLowerCase().includes(initialProcess.location.toLowerCase()) ||
        initialProcess.title.toLowerCase().includes(l.id)
    );
    return match ? match.id : 'all-india';
  }, [searchParams, initialProcess.location, initialProcess.title, initialProcess.review]);

  const [filters, setFilters] = useState<RoadmapFilters>(() => ({
    location: searchParams?.get('location') || defaultLocation,
    applicantProfile: searchParams?.get('profile') || 'individual',
    serviceMode: searchParams?.get('mode') || 'online',
  }));

  // Keep raw process in sync if initialProcess changes
  useEffect(() => {
    setCurrentProcessRaw(initialProcess);
    if (!searchParams?.get('location')) {
      setFilters((prev) => ({
        ...prev,
        location: defaultLocation,
      }));
    }
  }, [initialProcess, defaultLocation, searchParams]);

  // Contextual and deterministic adaptation
  const adaptationResult = useMemo(() => {
    return adaptRoadmapForContext(currentProcessRaw, filters);
  }, [currentProcessRaw, filters]);

  // AI adaptation integration hook for teammates
  const [isAdapting, setIsAdapting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (currentProcessRaw.review) return;
    async function checkAIAdaptation() {
      setIsAdapting(true);
      try {
        const aiResult = await requestAIRoadmapAdaptation(currentProcessRaw.id, filters);
        if (!cancelled && aiResult && aiResult.adaptedProcess) {
          // Teammate's AI adapter can enrich the process here
        }
      } catch {
        // Fallback safely to deterministic rules
      } finally {
        if (!cancelled) setIsAdapting(false);
      }
    }
    checkAIAdaptation();
    return () => {
      cancelled = true;
    };
  }, [currentProcessRaw.id, currentProcessRaw.review, filters]);

  // Update filters and URL search params cleanly
  const handleUpdateFilters = useCallback((updates: Partial<RoadmapFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        params.set('location', next.location);
        params.set('profile', next.applicantProfile);
        params.set('mode', next.serviceMode);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
      }
      return next;
    });
  }, []);

  // Localized current process and all processes
  const currentProcess = useMemo(() => {
    return getLocalizedRoadmap(adaptationResult.adaptedProcess);
  }, [adaptationResult.adaptedProcess, getLocalizedRoadmap]);

  const allProcesses = useMemo(() => {
    const samples = MOCK_ROADMAPS.map((p) => getLocalizedRoadmap(p));
    return samples.some((process) => process.id === currentProcess.id)
      ? samples
      : [currentProcess, ...samples];
  }, [currentProcess, getLocalizedRoadmap]);

  // Load progress engine and document vault for current process
  const {
    completedStepIds,
    isLoaded,
    stepStatusMap,
    unmetDependenciesMap,
    toggleStep,
    setStepCompleted,
    resetProgress,
    progressPercent,
    isTrackingActive,
    hasStartedTracking,
    documents,
    startTracking,
    uploadDocument,
    removeDocument,
    downloadDoc,
    exportDossier,
    requirementDocumentsMap,
    isTrackerDrawerOpen,
    openTrackerDrawer,
    closeTrackerDrawer,
  } = useRoadmapProgress(currentProcess);

  // Initialize and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('untangle_theme') as 'light' | 'dark' | null;
    const initialTheme =
      savedTheme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('untangle_theme', next);
      } catch {
        // Fallback
      }
      return next;
    });
  }, []);

  // Handle process change by routing to new URL
  const handleSelectProcess = useCallback(
    (newProcessId: string) => {
      router.push(`/roadmap/${newProcessId}`);
      setSelectedStepId(null);
      setIsPanelOpen(false);
    },
    [router]
  );

  const handleSelectStep = useCallback((step: ProcessStep) => {
    setSelectedStepId(step.id);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const [showRightPane, setShowRightPane] = useState(isResumeRequested);

  const [activeStepId, setActiveStepId] = useState<string>(() => {
    const stepParam = searchParams?.get('step');
    if (stepParam && initialProcess.steps.some((s) => s.id === stepParam)) {
      return stepParam;
    }
    return initialProcess.steps[0]?.id || '';
  });

  const [advancingStepId, setAdvancingStepId] = useState<string | null>(null);

  const isPreferencesLoadedRef = useRef(false);

  // Synchronize preferences on client mount and when switching roadmaps
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefs = getRoadmapPreferences(currentProcessRaw.id);
    if (prefs) {
      const hasLocationParam = !!searchParams?.get('location');
      const hasProfileParam = !!searchParams?.get('profile');
      const hasModeParam = !!searchParams?.get('mode');

      if (prefs.filters && (!hasLocationParam || !hasProfileParam || !hasModeParam)) {
        setFilters((prev) => ({
          location: hasLocationParam ? prev.location : prefs.filters?.location || prev.location,
          applicantProfile: hasProfileParam ? prev.applicantProfile : prefs.filters?.applicantProfile || prev.applicantProfile,
          serviceMode: hasModeParam ? prev.serviceMode : prefs.filters?.serviceMode || prev.serviceMode,
        }));
      }

      if (!searchParams?.get('step')) {
        if (prefs.lastActiveStepId && currentProcessRaw.steps.some((s) => s.id === prefs.lastActiveStepId)) {
          setActiveStepId(prefs.lastActiveStepId);
          setSelectedStepId(prefs.lastActiveStepId);
        } else if (prefs.selectedStepId && currentProcessRaw.steps.some((s) => s.id === prefs.selectedStepId)) {
          setSelectedStepId(prefs.selectedStepId);
        }
      }

      if (isResumeRequested) {
        setViewMode('graph');
        setIsTrackingMode(true);
        setShowRightPane(true);
        startTracking();
      } else {
        if (prefs.viewMode) {
          setViewMode(prefs.viewMode);
        }
        if (typeof prefs.isTrackingMode === 'boolean') {
          setIsTrackingMode(prefs.isTrackingMode);
          setShowRightPane(prefs.isTrackingMode);
        }
      }
    } else if (isResumeRequested) {
      setViewMode('graph');
      setIsTrackingMode(true);
      setShowRightPane(true);
      startTracking();
    }

    isPreferencesLoadedRef.current = true;
  }, [currentProcessRaw.id, currentProcessRaw.steps, searchParams, isResumeRequested, startTracking]);

  // Checkbox state persisted per process
  const storageKey = `untangle_tasks_${currentProcess.id}`;
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return setCheckedTasks(JSON.parse(stored));
    } catch {
      // Fallback
    }
    setCheckedTasks({});
  }, [storageKey]);

  const saveTasks = useCallback(
    (newTasks: Record<string, boolean>) => {
      setCheckedTasks(newTasks);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newTasks));
      } catch {
        // Storage quota
      }
    },
    [storageKey]
  );

  // Automatically persist roadmap preferences & active session state once initial preferences have been loaded
  useEffect(() => {
    if (!isPreferencesLoadedRef.current) return;

    const currentActiveStep =
      currentProcess.steps.find((s) => s.id === (activeStepId || selectedStepId)) ||
      currentProcess.steps[0];

    saveRoadmapPreferences(currentProcess.id, {
      lastActiveStepId: activeStepId,
      selectedStepId: selectedStepId || undefined,
      viewMode,
      isTrackingMode,
      filters: {
        location: filters.location,
        applicantProfile: filters.applicantProfile,
        serviceMode: filters.serviceMode,
      },
    });

    if (!isLoaded || !hasStartedTracking) return;

    saveLastVisitedSession({
      id: currentProcess.id,
      title: currentProcess.title,
      location: currentProcess.location,
      lastActiveStepId: currentActiveStep?.id,
      lastActiveStepTitle: currentActiveStep?.shortTitle || currentActiveStep?.title,
      lastVisitedAt: new Date().toISOString(),
      completedCount: completedStepIds.length,
      totalSteps: currentProcess.steps.length,
      progressPercent,
      hasStartedTracking,
      viewMode,
      isTrackingMode,
      filters: {
        location: filters.location,
        applicantProfile: filters.applicantProfile,
        serviceMode: filters.serviceMode,
      },
      urlPath: `/roadmap/${currentProcess.id}?location=${filters.location}&profile=${filters.applicantProfile}&mode=${filters.serviceMode}${currentActiveStep?.id ? `&step=${currentActiveStep.id}` : ''}${isTrackingMode ? '&track=true&resume=true' : ''}`,
    });
  }, [
    currentProcess.id,
    currentProcess.title,
    currentProcess.location,
    currentProcess.steps,
    activeStepId,
    selectedStepId,
    viewMode,
    isTrackingMode,
    filters,
    completedStepIds.length,
    progressPercent,
    isLoaded,
    hasStartedTracking,
  ]);

  const activeStep = useMemo(() => {
    return (
      currentProcess.steps.find((s) => s.id === (selectedStepId || activeStepId)) ||
      currentProcess.steps[0]
    );
  }, [currentProcess.steps, selectedStepId, activeStepId]);

  const activeStepIndex = useMemo(() => {
    return currentProcess.steps.findIndex((s) => s.id === activeStep?.id);
  }, [currentProcess.steps, activeStep]);

  const nextStep =
    activeStepIndex < currentProcess.steps.length - 1
      ? currentProcess.steps[activeStepIndex + 1]
      : null;

  const handleToggleTask = useCallback(
    (taskId: string, allChecked: boolean) => {
      const nextChecked = !checkedTasks[taskId];
      const updated = { ...checkedTasks, [taskId]: nextChecked };
      saveTasks(updated);

      if (allChecked) {
        setStepCompleted(activeStep.id, true);

        // Auto-advance to next step
        if (nextStep) {
          setAdvancingStepId(activeStep.id);
          setTimeout(() => {
            setActiveStepId(nextStep.id);
            setSelectedStepId(nextStep.id);
            setAdvancingStepId(null);
          }, 550);
        }
      } else {
        if (completedStepIds.includes(activeStep.id)) {
          setStepCompleted(activeStep.id, false);
        }
        setAdvancingStepId(null);
      }
    },
    [checkedTasks, saveTasks, setStepCompleted, activeStep.id, nextStep, completedStepIds]
  );

  const handleSelectNextStep = useCallback(() => {
    if (nextStep) {
      setActiveStepId(nextStep.id);
      setSelectedStepId(nextStep.id);
    }
  }, [nextStep]);

  const handleStartTracking = useCallback(() => {
    closeTrackerDrawer();
    startTracking(true);
    setIsPanelOpen(false);
    setShowRightPane(false);
    setIsTrackingMode(true);
  }, [closeTrackerDrawer, startTracking]);

  const handleExitTracking = useCallback(() => {
    setShowRightPane(false);
    setIsTrackingMode(false);
  }, []);

  const handleMorphComplete = useCallback(() => {
    setShowRightPane(true);
  }, []);

  const handleSelectStepFromCanvas = useCallback(
    (step: ProcessStep) => {
      setActiveStepId(step.id);
      setSelectedStepId(step.id);
      if (!isTrackingMode) {
        setIsPanelOpen(true);
      } else {
        setShowRightPane(true);
      }
    },
    [isTrackingMode]
  );

  // Escape key listener for panel close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        setIsPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen]);

  const selectedStep = useMemo(() => {
    if (!selectedStepId) return null;
    return currentProcess.steps.find((s) => s.id === selectedStepId) || null;
  }, [selectedStepId, currentProcess.steps]);

  const selectedStepStatus = selectedStep
    ? stepStatusMap.get(selectedStep.id) || 'pending'
    : 'pending';

  const selectedStepUnmet = selectedStep
    ? unmetDependenciesMap.get(selectedStep.id) || []
    : [];

  const isSelectedCompleted = selectedStep
    ? completedStepIds.includes(selectedStep.id)
    : false;

  const handleResetProgress = useCallback(() => {
    resetProgress();
    setCheckedTasks({});
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    saveRoadmapPreferences(currentProcess.id, {
      lastActiveStepId: currentProcess.steps[0]?.id,
      selectedStepId: undefined,
    });
    setActiveStepId(currentProcess.steps[0]?.id || '');
    setSelectedStepId(null);
  }, [resetProgress, storageKey, currentProcess.id, currentProcess.steps]);

  return (
    <div className={styles.mainContainer}>
      <RoadmapHeader
        currentProcess={currentProcess}
        allProcesses={allProcesses}
        onSelectProcess={handleSelectProcess}
        viewMode={viewMode}
        onToggleViewMode={(mode) => {
          setViewMode(mode);
          setIsTrackingMode(false);
          setShowRightPane(false);
        }}
        progressPercent={progressPercent}
        completedCount={completedStepIds.length}
        totalSteps={currentProcess.steps.length}
        onResetProgress={handleResetProgress}
        theme={theme}
        onToggleTheme={toggleTheme}
        filters={filters}
        onUpdateFilters={handleUpdateFilters}
        appliedContexts={adaptationResult.appliedContexts}
        isAdapting={isAdapting}
        onStartTracking={handleStartTracking}
        onOpenDocuments={openTrackerDrawer}
      />

      {currentProcess.review && (
        <RoadmapReviewNotice review={currentProcess.review} />
      )}

      <main className={styles.contentArea}>
        {viewMode === 'graph' ? (
          <>
            <RoadmapCanvas
              process={currentProcess}
              stepStatusMap={stepStatusMap}
              completedStepIds={completedStepIds}
              unmetDependenciesMap={unmetDependenciesMap}
              selectedStepId={activeStep?.id || null}
              onSelectStep={handleSelectStepFromCanvas}
              isTrackingMode={isTrackingMode}
              onMorphComplete={handleMorphComplete}
              theme={theme}
            />

            <TrackingWorkspacePane
              isOpen={isTrackingMode && showRightPane}
              process={currentProcess}
              activeStep={activeStep}
              activeStepIndex={activeStepIndex}
              totalCount={currentProcess.steps.length}
              isCompleted={completedStepIds.includes(activeStep.id)}
              stepStatus={stepStatusMap.get(activeStep.id) || 'pending'}
              checkedTasks={checkedTasks}
              onToggleTask={handleToggleTask}
              onSetStepCompleted={setStepCompleted}
              onSelectStep={handleSelectStepFromCanvas}
              onSelectNextStep={handleSelectNextStep}
              advancingStepId={advancingStepId}
              nextStep={nextStep}
              requirementDocumentsMap={requirementDocumentsMap}
              onUploadDocument={uploadDocument}
              onRemoveDocument={removeDocument}
              onDownloadDocument={downloadDoc}
              onOpenVault={openTrackerDrawer}
              onClose={() => setShowRightPane(false)}
            />
          </>
        ) : (
          <StepListView
            process={currentProcess}
            stepStatusMap={stepStatusMap}
            completedStepIds={completedStepIds}
            unmetDependenciesMap={unmetDependenciesMap}
            onSelectStep={handleSelectStep}
            onToggleComplete={toggleStep}
          />
        )}

        <DetailPanel
          location={currentProcess.location}
          step={selectedStep}
          status={selectedStepStatus}
          isCompleted={isSelectedCompleted}
          unmetPrereqs={selectedStepUnmet}
          totalStepsCount={currentProcess.steps.length}
          isOpen={isPanelOpen && (!isTrackingMode || viewMode === 'list')}
          onClose={handleClosePanel}
          onToggleComplete={toggleStep}
          requirementDocumentsMap={requirementDocumentsMap}
          onUploadDocument={uploadDocument}
          onRemoveDocument={removeDocument}
          onDownloadDocument={downloadDoc}
          onOpenVault={openTrackerDrawer}
        />

        {/* Floating pill-shaped button in bottom middle */}
        <div className={styles.floatingTrackerContainer}>
          {isTrackingMode ? (
            <button
              type="button"
              className={`${styles.floatingTrackerBtn} ${styles.floatingTrackerBtnActive}`}
              onClick={handleExitTracking}
              id="track-progress-btn"
              title="Return to full interactive canvas view"
              aria-label="Return to full canvas view"
            >
              <Network size={16} className={styles.floatingTrackerIcon} />
              <span className={styles.floatingTrackerText}>Back to Full Canvas</span>
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.floatingTrackerBtn} ${isTrackingActive ? styles.floatingTrackerBtnActive : ''}`}
              onClick={handleStartTracking}
              id="track-progress-btn"
              title="Track progress, view vertical checklist, and complete steps"
              aria-label="Track Your Progress"
            >
              <FolderCheck size={16} className={styles.floatingTrackerIcon} />
              <span className={styles.floatingTrackerText}>Track Your Progress</span>
              <span className={styles.floatingTrackerBadge}>
                {completedStepIds.length}/{currentProcess.steps.length}
              </span>
            </button>
          )}
        </div>
      </main>

      <DocumentVaultDrawer
        isOpen={isTrackerDrawerOpen}
        onClose={closeTrackerDrawer}
        process={currentProcess}
        completedStepIds={completedStepIds}
        documents={documents}
        onUploadDocument={uploadDocument}
        onRemoveDocument={removeDocument}
        onDownloadDocument={downloadDoc}
        onExportDossier={exportDossier}
        requirementDocumentsMap={requirementDocumentsMap}
      />

      <footer className={styles.bottomDisclaimer} role="contentinfo">
        <div className={styles.disclaimerText}>
          <ShieldAlert size={14} style={{ color: 'var(--color-warning-500)', flexShrink: 0 }} />
          <span>{t.footer.disclaimer}</span>
        </div>
        <div>
          {t.roadmap.officialPortal}:{' '}
          <a
            href={currentProcess.officialPortal}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.disclaimerLink}
          >
            {(() => {
              try {
                return new URL(currentProcess.officialPortal).hostname;
              } catch {
                return currentProcess.officialPortal;
              }
            })()}
            <ExternalLink size={10} style={{ marginLeft: 3, verticalAlign: -1, display: 'inline' }} />
          </a>
        </div>
      </footer>
    </div>
  );
}
