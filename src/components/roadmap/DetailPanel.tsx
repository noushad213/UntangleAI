'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  IndianRupee,
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Undo2,
} from 'lucide-react';
import { ProcessStep, StepStatus } from '@/types/roadmap';
import { useLanguage } from '@/context/LanguageContext';
import styles from './DetailPanel.module.css';

interface DetailPanelProps {
  step: ProcessStep | null;
  status: StepStatus;
  isCompleted: boolean;
  unmetPrereqs: string[];
  totalStepsCount: number;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (stepId: string) => void;
}

export function DetailPanel({
  step,
  status,
  isCompleted,
  unmetPrereqs,
  totalStepsCount,
  isOpen,
  onClose,
  onToggleComplete,
}: DetailPanelProps) {
  const { t } = useLanguage();
  // Local document checklist tracking for user satisfaction
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  if (!step) return null;

  const toggleDoc = (reqId: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [reqId]: !prev[reqId],
    }));
  };

  const getBadgeClass = () => {
    if (step.nodeType === 'action') return styles.badgeAction;
    if (step.nodeType === 'document') return styles.badgeDocument;
    return styles.badgePrerequisite;
  };

  const getNodeTypeName = () => {
    if (step.nodeType === 'action') return t.roadmap.action;
    if (step.nodeType === 'document') return t.roadmap.document;
    return t.roadmap.prerequisite;
  };

  const isLocked = status === 'locked';

  return (
    <>
      <div
        className={`${styles.panelOverlay} ${isOpen ? styles.open : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.panelContainer} ${isOpen ? styles.open : ''}`}
        aria-labelledby="step-panel-title"
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <div className={styles.typeRow}>
              <span className={`${styles.badge} ${getBadgeClass()}`}>
                {getNodeTypeName()}
              </span>
              <span className={styles.stepOrder}>
                {t.roadmap.step} {step.stepOrder} {t.roadmap.of} {totalStepsCount}
              </span>
            </div>
            <h2 id="step-panel-title" className={styles.panelTitle}>
              {step.title}
            </h2>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t.roadmap.close}
            id="close-detail-panel-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.contentScroll}>
          {isLocked && unmetPrereqs.length > 0 && (
            <div className={styles.warningBox} role="alert">
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div className={styles.warningText}>
                <strong>{t.roadmap.prerequisitesRequired}</strong>
                <ul className={styles.warningList}>
                  {unmetPrereqs.map((prereqName, index) => (
                    <li key={index}>{prereqName}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <section className={styles.section}>
            <span className={styles.sectionTitle}>{t.roadmap.info}</span>
            <p className={styles.descriptionText}>{step.description}</p>
          </section>

          <div className={styles.quickStatsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>{t.roadmap.estimatedTimeline}</span>
              <span className={styles.statValue}>
                <Clock size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                {step.timeEstimate || '—'}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>{t.roadmap.statutoryFee}</span>
              <span className={styles.statValue}>
                <IndianRupee size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                {step.fees || '—'}
              </span>
            </div>
          </div>

          {step.office && (
            <section className={styles.section}>
              <span className={styles.sectionTitle}>{t.roadmap.department}</span>
              <div className={styles.officeInfo}>
                <Building2 size={18} style={{ color: 'var(--color-brand-500)', marginTop: 2, flexShrink: 0 }} />
                <div className={styles.officeText}>
                  <span className={styles.officeName}>{step.office}</span>
                  {step.officeLocation && (
                    <span className={styles.officeLoc}>{step.officeLocation}</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {step.requirements && step.requirements.length > 0 && (
            <section className={styles.section}>
              <span className={styles.sectionTitle}>
                {t.roadmap.requiredDocs} ({step.requirements.length})
              </span>
              <div className={styles.reqList}>
                {step.requirements.map((req) => {
                  const isChecked = !!checkedDocs[req.id];
                  return (
                    <label key={req.id} className={styles.reqItem}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDoc(req.id)}
                        className={styles.reqCheckbox}
                        aria-label={`${req.title}`}
                      />
                      <div className={styles.reqDetails}>
                        <span
                          className={styles.reqName}
                          style={{
                            textDecoration: isChecked ? 'line-through' : 'none',
                            opacity: isChecked ? 0.7 : 1,
                          }}
                        >
                          {req.title}
                        </span>
                        <div className={styles.reqTag}>
                          <FileCheck2 size={12} />
                          <span>{req.isMandatory ? t.roadmap.mandatory : t.roadmap.optional}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {step.sourceUrl && (
            <section className={styles.section}>
              <span className={styles.sectionTitle}>{t.roadmap.legalBasis}</span>
              <div className={styles.sourceBox}>
                <div className={styles.sourceHeader}>
                  <span className={styles.verifiedBadge}>
                    <ShieldCheck size={14} /> {t.roadmap.officialSource}
                  </span>
                </div>

                {step.sourceSnippet && (
                  <p className={styles.sourceSnippet}>"{step.sourceSnippet}"</p>
                )}

                <a
                  href={step.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                  id={`external-source-link-${step.id}`}
                >
                  <span>{t.roadmap.officialPortal}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </section>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.completeButton} ${isCompleted ? styles.completedBtnState : ''}`}
            onClick={() => onToggleComplete(step.id)}
            id="toggle-step-completion-btn"
          >
            {isCompleted ? (
              <>
                <Undo2 size={16} />
                <span>{t.roadmap.markIncomplete}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{t.roadmap.markCompleted}</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
