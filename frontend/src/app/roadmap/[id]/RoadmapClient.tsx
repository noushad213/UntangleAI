'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import { CivicProcess, ProcessStep } from '@/types/roadmap';
import { useLanguage } from '@/context/LanguageContext';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { RoadmapHeader } from '@/components/roadmap/RoadmapHeader';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { StepListView } from '@/components/roadmap/StepListView';
import { DetailPanel } from '@/components/roadmap/DetailPanel';
import { DocumentVaultDrawer } from '@/components/roadmap/DocumentVaultDrawer';
import {
  RoadmapFilters,
  INDIAN_LOCATIONS,
  adaptRoadmapForContext,
  requestAIRoadmapAdaptation,
} from '@/lib/roadmap-adapters';
import styles from '@/app/page.module.css';

interface RoadmapClientProps {
  initialProcess: CivicProcess;
}

export default function RoadmapClient({ initialProcess }: RoadmapClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getLocalizedRoadmap, t } = useLanguage();

  const [currentProcessRaw, setCurrentProcessRaw] = useState<CivicProcess>(initialProcess);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Match default location based on process title or location
  const defaultLocation = useMemo(() => {
    const locParam = searchParams?.get('location');
    if (locParam && INDIAN_LOCATIONS.some((l) => l.id === locParam)) {
      return locParam;
    }
    const match = INDIAN_LOCATIONS.find(
      (l) =>
        initialProcess.location.toLowerCase().includes(l.id) ||
        l.name.toLowerCase().includes(initialProcess.location.toLowerCase()) ||
        initialProcess.title.toLowerCase().includes(l.id)
    );
    return match ? match.id : 'delhi';
  }, [searchParams, initialProcess.location, initialProcess.title]);

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
  }, [currentProcessRaw.id, filters]);

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
    return MOCK_ROADMAPS.map((p) => getLocalizedRoadmap(p));
  }, [getLocalizedRoadmap]);

  // Load progress engine and document vault for current process
  const {
    completedStepIds,
    stepStatusMap,
    unmetDependenciesMap,
    toggleStep,
    resetProgress,
    progressPercent,
    isTrackingActive,
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

  return (
    <div className={styles.mainContainer}>
      <RoadmapHeader
        currentProcess={currentProcess}
        allProcesses={allProcesses}
        onSelectProcess={handleSelectProcess}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        progressPercent={progressPercent}
        completedCount={completedStepIds.length}
        totalSteps={currentProcess.steps.length}
        onResetProgress={resetProgress}
        theme={theme}
        onToggleTheme={toggleTheme}
        filters={filters}
        onUpdateFilters={handleUpdateFilters}
        appliedContexts={adaptationResult.appliedContexts}
        isAdapting={isAdapting}
        isTrackingActive={isTrackingActive}
        onStartTracking={isTrackingActive ? openTrackerDrawer : startTracking}
        documentsCount={documents.length}
      />

      <main className={styles.contentArea}>
        {viewMode === 'graph' ? (
          <RoadmapCanvas
            process={currentProcess}
            stepStatusMap={stepStatusMap}
            completedStepIds={completedStepIds}
            unmetDependenciesMap={unmetDependenciesMap}
            selectedStepId={selectedStepId}
            onSelectStep={handleSelectStep}
            theme={theme}
          />
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
          step={selectedStep}
          status={selectedStepStatus}
          isCompleted={isSelectedCompleted}
          unmetPrereqs={selectedStepUnmet}
          totalStepsCount={currentProcess.steps.length}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          onToggleComplete={toggleStep}
          requirementDocumentsMap={requirementDocumentsMap}
          onUploadDocument={uploadDocument}
          onRemoveDocument={removeDocument}
          onDownloadDocument={downloadDoc}
          onOpenVault={openTrackerDrawer}
        />
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
        onToggleStep={toggleStep}
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
