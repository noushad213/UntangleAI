'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  IndianRupee,
  Building2,
  ExternalLink,
  ShieldCheck,
  Upload,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  FileText,
  KeyRound,
} from 'lucide-react';
import { CivicProcess, ProcessStep, StepStatus } from '@/types/roadmap';
import { TrackedDocument, formatFileSize } from '@/lib/document-vault';
import styles from './TrackingWorkspacePane.module.css';
import { CivicAssistance } from './CivicAssistance';

interface TaskItem {
  id: string;
  stepId: string;
  title: string;
  isMandatory: boolean;
  isDoc?: boolean;
}

interface TrackingWorkspacePaneProps {
  isOpen: boolean;
  process: CivicProcess;
  activeStep: ProcessStep | null;
  activeStepIndex: number;
  totalCount: number;
  isCompleted: boolean;
  stepStatus: StepStatus;
  checkedTasks: Record<string, boolean>;
  onToggleTask: (taskId: string, allChecked: boolean) => void;
  onSetStepCompleted: (stepId: string, completed: boolean) => void;
  onSelectStep: (step: ProcessStep) => void;
  onSelectNextStep: () => void;
  advancingStepId: string | null;
  nextStep: ProcessStep | null;
  requirementDocumentsMap?: Map<string, TrackedDocument>;
  onUploadDocument?: (file: File, stepId: string, requirementId?: string) => Promise<TrackedDocument>;
  onRemoveDocument?: (docId: string) => void;
  onDownloadDocument?: (docId: string) => void;
  onOpenVault?: () => void;
  onClose?: () => void;
}

export function TrackingWorkspacePane({
  isOpen,
  process,
  activeStep,
  activeStepIndex,
  totalCount,
  isCompleted,
  stepStatus,
  checkedTasks,
  onToggleTask,
  onSetStepCompleted,
  onSelectStep,
  onSelectNextStep,
  advancingStepId,
  nextStep,
  requirementDocumentsMap,
  onUploadDocument,
  onRemoveDocument,
  onDownloadDocument,
  onOpenVault,
  onClose,
}: TrackingWorkspacePaneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadReqId, setActiveUploadReqId] = useState<string | undefined>(undefined);

  // Generate tasks list for the active step
  const activeStepTasks = useMemo<TaskItem[]>(() => {
    if (!activeStep) return [];

    const tasks: TaskItem[] = [];

    if (activeStep.requirements && activeStep.requirements.length > 0) {
      activeStep.requirements.forEach((req) => {
        tasks.push({
          id: req.id,
          stepId: activeStep.id,
          title: req.title,
          isMandatory: req.isMandatory,
          isDoc: true,
        });
      });
    }

    if (tasks.length === 0) {
      tasks.push({
        id: `${activeStep.id}-task-eligibility`,
        stepId: activeStep.id,
        title: `Verify eligibility & prerequisites for ${activeStep.shortTitle || activeStep.title}`,
        isMandatory: true,
      });
      tasks.push({
        id: `${activeStep.id}-task-portal`,
        stepId: activeStep.id,
        title: `Submit application on official portal (${activeStep.office || 'Official Authority'})`,
        isMandatory: true,
      });
    } else if (tasks.length === 1) {
      tasks.push({
        id: `${activeStep.id}-task-submit`,
        stepId: activeStep.id,
        title: `Complete online submission and obtain reference acknowledgement`,
        isMandatory: true,
      });
    }

    return tasks;
  }, [activeStep]);

  const checkedCount = useMemo(() => {
    return activeStepTasks.filter((t) => !!checkedTasks[t.id]).length;
  }, [activeStepTasks, checkedTasks]);

  const isAllTasksChecked = useMemo(() => {
    return activeStepTasks.length > 0 && checkedCount === activeStepTasks.length;
  }, [activeStepTasks.length, checkedCount]);

  if (!activeStep) return null;

  const handleTaskClick = (taskId: string) => {
    const nextState = !checkedTasks[taskId];
    const nextTasks = { ...checkedTasks, [taskId]: nextState };
    const allChecked = activeStepTasks.every((t) => (t.id === taskId ? nextState : nextTasks[t.id]));
    onToggleTask(taskId, allChecked);
  };

  const handleTriggerUpload = (reqId?: string) => {
    setActiveUploadReqId(reqId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadDocument) return;
    try {
      await onUploadDocument(file, activeStep.id, activeUploadReqId);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setActiveUploadReqId(undefined);
    }
  };

  const nodeTypeIcon = (type: string) => {
    switch (type) {
      case 'action':
        return <Briefcase size={12} />;
      case 'document':
        return <FileText size={12} />;
      case 'prerequisite':
        return <KeyRound size={12} />;
      default:
        return null;
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'action':
        return styles.badgeAction;
      case 'document':
        return styles.badgeDocument;
      default:
        return styles.badgePrerequisite;
    }
  };

  return (
    <aside
      className={`${styles.workspaceWrapper} ${isOpen ? styles.workspaceWrapperVisible : ''}`}
      aria-label="Active Step Execution Workspace"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.docx"
        style={{ display: 'none' }}
      />

      {/* Mobile back button to view step list */}
      {onClose && (
        <div className={styles.mobileHeaderBar}>
          <button
            type="button"
            className={styles.mobileBackBtn}
            onClick={onClose}
            aria-label="Back to step list"
          >
            <ArrowLeft size={14} />
            <span>All Steps ({activeStepIndex + 1}/{totalCount})</span>
          </button>
        </div>
      )}

      {/* Step Header Card */}
      <section className={styles.stepHeaderCard}>
        <div className={styles.stepHeaderTop}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`${styles.nodeBadge} ${getBadgeClass(activeStep.nodeType)}`}>
              {nodeTypeIcon(activeStep.nodeType)}
              <span>{activeStep.nodeType}</span>
            </span>
            <span className={styles.stepOrderTag}>
              Step {activeStep.stepOrder} of {totalCount}
            </span>
          </div>

          {isCompleted && (
            <span className={styles.statusCompleted}>
              <Check size={13} strokeWidth={2.5} /> Completed
            </span>
          )}
        </div>

        <h1 className={styles.stepTitleMain}>{activeStep.title}</h1>
        <p className={styles.stepDescription}>{activeStep.description}</p>

        {/* Metadata Grid */}
        <div className={styles.statsGrid}>
          {activeStep.office && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Authority / Office</span>
              <span className={styles.statValue}>
                <Building2 size={13} style={{ color: 'var(--color-brand-600)', flexShrink: 0 }} />
                <span>{activeStep.office}</span>
              </span>
            </div>
          )}

          <div className={styles.statItem}>
            <span className={styles.statLabel}>Estimated Timeline</span>
            <span className={styles.statValue}>
              <Clock size={13} style={{ color: 'var(--color-info-500)', flexShrink: 0 }} />
              <span>{activeStep.timeEstimate || '10 - 20 minutes'}</span>
            </span>
          </div>

          <div className={styles.statItem}>
            <span className={styles.statLabel}>Statutory Fee</span>
            <span className={styles.statValue}>
              <IndianRupee size={13} style={{ color: 'var(--color-success-500)', flexShrink: 0 }} />
              <span>{activeStep.fees || '₹0'}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Official Links & Portal Banner */}
      {activeStep.sourceUrl && (
        <section className={styles.portalCard}>
          <div className={styles.portalCardInfo}>
            <div className={styles.portalIconWrapper}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className={styles.portalTitle}>Official Government Portal</div>
              <div className={styles.portalSnippet}>
                {activeStep.sourceSnippet
                  ? `"${activeStep.sourceSnippet}"`
                  : 'Complete this procedural milestone directly on the verified official portal.'}
              </div>
            </div>
          </div>

          <a
            href={activeStep.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.portalBtn}
            id={`tracker-official-portal-btn-${activeStep.id}`}
          >
            <span>Visit Official Portal</span>
            <ExternalLink size={13} />
          </a>
        </section>
      )}

      {isOpen && <CivicAssistance key={`${activeStep.id}-${process.location}`} step={activeStep} location={process.location} />}

      {/* Action Items & Checklist */}
      <section className={styles.checklistCard}>
        <div className={styles.checklistHeader}>
          <div>
            <h2 className={styles.checklistTitle}>Action Items & Checklist</h2>
            <p className={styles.checklistSubtitle}>
              Attach supporting documents, then check each task after completing it. Completing all tasks advances to the next step.
            </p>
          </div>

          <span
            className={`${styles.checklistProgressBadge} ${
              isAllTasksChecked ? styles.checklistProgressBadgeAllDone : ''
            }`}
          >
            {checkedCount} of {activeStepTasks.length} Done
          </span>
        </div>

        {/* Auto-advance notification banner */}
        {advancingStepId === activeStep.id && nextStep && (
          <div className={styles.autoAdvanceBanner} role="status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} />
              <span>
                All tasks complete! Step {activeStep.stepOrder} finished. Moving to Step {nextStep.stepOrder}:{' '}
                <strong>{nextStep.shortTitle || nextStep.title}</strong>...
              </span>
            </div>
            <div className={styles.autoAdvanceSpinner} aria-hidden="true" />
          </div>
        )}

        {/* Task Checkboxes List */}
        <div className={styles.taskList} role="group" aria-label="Step checklist items">
          {activeStepTasks.map((task) => {
            const isChecked = !!checkedTasks[task.id];
            const attachedDoc = requirementDocumentsMap?.get(task.id);

            return (
              <div
                key={task.id}
                className={`${styles.taskItem} ${isChecked ? styles.taskItemChecked : ''}`}
                onClick={() => handleTaskClick(task.id)}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleTaskClick(task.id);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleTaskClick(task.id)}
                  className={styles.customCheckbox}
                  onClick={(e) => e.stopPropagation()}
                  id={`task-checkbox-${task.id}`}
                  aria-label={task.title}
                />

                <div className={styles.taskInfo}>
                  <div className={styles.taskTitleRow}>
                    <span className={`${styles.taskTitle} ${isChecked ? styles.taskTitleDone : ''}`}>
                      {task.title}
                    </span>
                    <span
                      className={`${styles.taskTag} ${
                        task.isMandatory ? styles.taskTagMandatory : styles.taskTagOptional
                      }`}
                    >
                      {task.isMandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </div>

                  {task.isDoc && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {attachedDoc ? (
                        <div className={styles.attachedDocInfo}>
                          <Check size={11} strokeWidth={2.5} />
                          <span>
                            {attachedDoc.fileName} ({formatFileSize(attachedDoc.fileSize)})
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.attachDocBtn}
                          onClick={() => handleTriggerUpload(task.id)}
                        >
                          <Upload size={11} />
                          <span>Attach Document</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Navigation */}
      <footer className={styles.footerActionCard}>
        <button
          type="button"
          className={`${styles.stepCompleteBtn} ${isCompleted ? styles.stepCompleteBtnActive : ''}`}
          onClick={() => onSetStepCompleted(activeStep.id, !isCompleted)}
        >
          {isCompleted ? (
            <>
              <Check size={15} strokeWidth={2.5} />
              <span>Step Completed</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              <span>Mark Step Complete</span>
            </>
          )}
        </button>

        {nextStep && (
          <button
            type="button"
            className={styles.nextStepBtn}
            onClick={onSelectNextStep}
          >
            <span>Next: Step {nextStep.stepOrder}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </footer>
    </aside>
  );
}
