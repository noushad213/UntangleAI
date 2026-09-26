'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import { CivicProcess, ProcessStep } from '@/types/roadmap';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { RoadmapHeader } from '@/components/roadmap/RoadmapHeader';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { StepListView } from '@/components/roadmap/StepListView';
import { DetailPanel } from '@/components/roadmap/DetailPanel';
import styles from '@/app/page.module.css';

interface RoadmapPageProps {
  params: Promise<{ id: string }>;
}

export default function RoadmapDetailPage({ params }: RoadmapPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const processId = resolvedParams.id;

  const currentProcess =
    MOCK_ROADMAPS.find((p) => p.id === processId) || MOCK_ROADMAPS[0];

  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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
      setSelectedStep(null);
      setIsPanelOpen(false);
    },
    [router]
  );

  const handleSelectStep = useCallback((step: ProcessStep) => {
    setSelectedStep(step);
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
        allProcesses={MOCK_ROADMAPS}
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
            selectedStepId={selectedStep?.id || null}
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
          <span>
            Civic Guide disclaimer: Roadmaps are compiled from publicly accessible government portals.
            Always confirm recent regulatory amendments on official department sites.
          </span>
        </div>
        <div>
          Official Portal:{' '}
          <a
            href={currentProcess.officialPortal}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.disclaimerLink}
          >
            {new URL(currentProcess.officialPortal).hostname}
            <ExternalLink size={10} style={{ marginLeft: 3, verticalAlign: -1, display: 'inline' }} />
          </a>
        </div>
      </footer>
    </div>
  );
}
