'use client';

import React from 'react';
import { Check, Lock, Clock, IndianRupee, FileText, ChevronRight } from 'lucide-react';
import { CivicProcess, ProcessStep, StepStatus } from '@/types/roadmap';
import styles from './StepListView.module.css';

interface StepListViewProps {
  process: CivicProcess;
  stepStatusMap: Map<string, StepStatus>;
  completedStepIds: string[];
  unmetDependenciesMap: Map<string, string[]>;
  onSelectStep: (step: ProcessStep) => void;
  onToggleComplete: (stepId: string) => void;
}

export function StepListView({
  process,
  stepStatusMap,
  completedStepIds,
  unmetDependenciesMap,
  onSelectStep,
  onToggleComplete,
}: StepListViewProps) {
  const completedSet = new Set(completedStepIds);

  const getBadgeClass = (nodeType: string) => {
    if (nodeType === 'action') return styles.badgeAction;
    if (nodeType === 'document') return styles.badgeDocument;
    return styles.badgePrerequisite;
  };

  return (
    <div className={styles.listContainer}>
      <div className={styles.introSection}>
        <h2 className={styles.introTitle}>{process.title}</h2>
        <p className={styles.introDesc}>{process.description}</p>
      </div>

      <div className={styles.stepsWrapper}>
        {process.steps.map((step) => {
          const isCompleted = completedSet.has(step.id);
          const status = stepStatusMap.get(step.id) || 'pending';
          const unmet = unmetDependenciesMap.get(step.id) || [];
          const isLocked = status === 'locked';

          return (
            <div
              key={step.id}
              className={`${styles.stepCard} ${isCompleted ? styles.completed : ''} ${
                isLocked ? styles.locked : ''
              }`}
              onClick={() => onSelectStep(step)}
              id={`step-card-${step.id}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectStep(step);
                }
              }}
            >
              <div
                className={styles.checkboxContainer}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(step.id);
                }}
              >
                <button
                  type="button"
                  className={styles.checkboxBtn}
                  aria-label={isCompleted ? `Mark ${step.title} incomplete` : `Mark ${step.title} complete`}
                  id={`list-toggle-complete-${step.id}`}
                >
                  <Check size={14} strokeWidth={3} />
                </button>
              </div>

              <div className={styles.contentBlock}>
                <div className={styles.topLine}>
                  <div className={styles.badgeGroup}>
                    <span className={`${styles.typeBadge} ${getBadgeClass(step.nodeType)}`}>
                      {step.nodeType}
                    </span>
                    <span className={styles.stepIndex}>Step {step.stepOrder}</span>
                  </div>

                  <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>

                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>

                <div className={styles.metaRow}>
                  {step.timeEstimate && (
                    <span className={styles.metaItem}>
                      <Clock size={12} /> {step.timeEstimate}
                    </span>
                  )}
                  {step.fees && (
                    <span className={styles.metaItem}>
                      <IndianRupee size={12} /> {step.fees}
                    </span>
                  )}
                  {step.requirements && step.requirements.length > 0 && (
                    <span className={styles.metaItem}>
                      <FileText size={12} /> {step.requirements.length} doc{step.requirements.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {isLocked && unmet.length > 0 && (
                    <span className={styles.lockedAlert}>
                      <Lock size={12} /> Requires: {unmet.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
