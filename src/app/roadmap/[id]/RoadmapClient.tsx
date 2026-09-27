'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import { CivicProcess, ProcessStep } from '@/types/roadmap';
import { useLanguage } from '@/context/LanguageContext';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { RoadmapHeader } from '@/components/roadmap/RoadmapHeader';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { StepListView } from '@/components/roadmap/StepListView';
import { DetailPanel } from '@/components/roadmap/DetailPanel';
import styles from '@/app/page.module.css';

interface RoadmapClientProps {
  initialProcess: CivicProcess;
}

export default function RoadmapClient({ initialProcess }: RoadmapClientProps) {
  const router = useRouter();
  const { getLocalizedRoadmap, t } = useLanguage();

  const [currentProcessRaw, setCurrentProcessRaw] = useState<CivicProcess>(initialProcess);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Keep raw process in sync if initialProcess changes
  useEffect(() => {
    setCurrentProcessRaw(initialProcess);
  }, [initialProcess]);

  // Localized current process and all processes
  const currentProcess = useMemo(() => {
    return getLocalizedRoadmap(currentProcessRaw);
  }, [currentProcessRaw, getLocalizedRoadmap]);

  const allProcesses = useMemo(() => {
    return MOCK_ROADMAPS.map((p) => getLocalizedRoadmap(p));
  }, [getLocalizedRoadmap]);

  // Load progress engine for current process
  const {
    completedStepIds,
    stepStatusMap,
    unmetDependenciesMap,
    toggleStep,
    resetProgress,
    progressPercent,
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
        />
      </main>

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
