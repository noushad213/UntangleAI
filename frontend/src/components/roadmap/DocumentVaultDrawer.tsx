'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  FolderCheck,
  Upload,
  Download,
  Trash2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { CivicProcess } from '@/types/roadmap';
import { TrackedDocument, formatFileSize } from '@/lib/document-vault';
import styles from './DocumentVaultDrawer.module.css';

interface DocumentVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  process: CivicProcess;
  completedStepIds: string[];
  documents: TrackedDocument[];
  onUploadDocument: (file: File, stepId: string, requirementId?: string) => Promise<any>;
  onRemoveDocument: (docId: string) => void;
  onDownloadDocument: (docId: string) => void;
  onExportDossier: () => void;
  requirementDocumentsMap: Map<string, TrackedDocument>;
  onToggleStep: (stepId: string) => void;
}

export function DocumentVaultDrawer({
  isOpen,
  onClose,
  process,
  completedStepIds,
  documents,
  onUploadDocument,
  onRemoveDocument,
  onDownloadDocument,
  onExportDossier,
  requirementDocumentsMap,
  onToggleStep,
}: DocumentVaultDrawerProps) {
  const [activeUploadTarget, setActiveUploadTarget] = useState<{
    stepId: string;
    requirementId?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract all requirements from process steps
  const allRequirements = React.useMemo(() => {
    const list: Array<{
      stepId: string;
      stepTitle: string;
      stepOrder: number;
      requirementId: string;
      title: string;
      isMandatory: boolean;
      document?: TrackedDocument;
    }> = [];

    process.steps.forEach((step) => {
      if (step.requirements && step.requirements.length > 0) {
        step.requirements.forEach((req) => {
          list.push({
            stepId: step.id,
            stepTitle: step.shortTitle || step.title,
            stepOrder: step.stepOrder,
            requirementId: req.id,
            title: req.title,
            isMandatory: req.isMandatory,
            document: requirementDocumentsMap.get(req.id),
          });
        });
      }
    });

    return list;
  }, [process.steps, requirementDocumentsMap]);

  const totalMandatoryDocs = allRequirements.filter((r) => r.isMandatory).length;
  const uploadedMandatoryDocs = allRequirements.filter((r) => r.isMandatory && !!r.document).length;
  const isAllReady = totalMandatoryDocs > 0 && uploadedMandatoryDocs >= totalMandatoryDocs;

  const handleTriggerUpload = (stepId: string, requirementId?: string) => {
    setActiveUploadTarget({ stepId, requirementId });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTarget) return;

    try {
      setIsUploading(true);
      await onUploadDocument(file, activeUploadTarget.stepId, activeUploadTarget.requirementId);
    } catch (err) {
      console.error('Document upload error:', err);
    } finally {
      setIsUploading(false);
      setActiveUploadTarget(null);
    }
  };

  return (
    <>
      <div
        className={`${styles.drawerOverlay} ${isOpen ? styles.open : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.drawerContainer} ${isOpen ? styles.open : ''}`}
        aria-labelledby="vault-drawer-title"
        role="dialog"
        aria-modal="true"
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          style={{ display: 'none' }}
          id="vault-file-picker"
        />

        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h2 id="vault-drawer-title" className={styles.drawerTitle}>
              <FolderCheck size={18} style={{ color: 'var(--color-brand-600)' }} />
              Application Tracker & Document Vault
            </h2>
            <span className={styles.drawerSubtitle}>
              {process.title} • {process.location}
            </span>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close document vault"
            id="close-vault-drawer-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.scrollArea}>
          {/* Application Readiness Card */}
          <div className={styles.readinessCard}>
            <div className={styles.readinessHeader}>
              <span className={styles.readinessLabel}>Application Readiness</span>
              <span
                className={`${styles.readinessBadge} ${
                  isAllReady ? styles.badgeReady : styles.badgePending
                }`}
              >
                {isAllReady ? 'Ready for Submission' : 'In Progress (Documents Pending)'}
              </span>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <span className={styles.statVal}>
                  {completedStepIds.length} / {process.steps.length}
                </span>
                <span className={styles.statDesc}>Milestone Steps Done</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statVal}>
                  {uploadedMandatoryDocs} / {totalMandatoryDocs || allRequirements.length}
                </span>
                <span className={styles.statDesc}>Mandatory Documents Attached</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <FileCheck size={16} style={{ color: 'var(--color-brand-500)' }} />
              Required Document Checklist
            </span>
            <div className={styles.actionBtnRow}>
              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={onExportDossier}
                title="Export application dossier summary in JSON"
                id="export-dossier-btn"
              >
                <Download size={13} />
                <span>Export Dossier</span>
              </button>
            </div>
          </div>

          {/* Document list */}
          <div className={styles.docList}>
            {allRequirements.map((req) => (
              <div key={req.requirementId} className={styles.docCard}>
                <div className={styles.docCardHeader}>
                  <div className={styles.docInfo}>
                    <span className={styles.docTitle}>{req.title}</span>
                    <span className={styles.docStepBadge}>
                      Step {req.stepOrder}: {req.stepTitle}
                    </span>
                  </div>
                  <span
                    className={`${styles.docStatusTag} ${
                      req.isMandatory ? styles.tagMandatory : styles.tagOptional
                    }`}
                  >
                    {req.isMandatory ? 'Mandatory' : 'Optional'}
                  </span>
                </div>

                {req.document ? (
                  <div className={styles.uploadedFileRow}>
                    <div className={styles.fileNameMeta} title={req.document.fileName}>
                      <CheckCircle2 size={13} style={{ color: 'var(--color-success-600)', flexShrink: 0 }} />
                      <span>{req.document.fileName}</span>
                      <span>({formatFileSize(req.document.fileSize)})</span>
                    </div>

                    <div className={styles.fileActions}>
                      <button
                        type="button"
                        className={styles.fileActionIconBtn}
                        onClick={() => onDownloadDocument(req.document!.id)}
                        title="Download / view saved document"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        type="button"
                        className={styles.fileActionIconBtn}
                        onClick={() => handleTriggerUpload(req.stepId, req.requirementId)}
                        title="Replace document"
                      >
                        <Upload size={12} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.fileActionIconBtn} ${styles.fileActionIconBtnDanger}`}
                        onClick={() => onRemoveDocument(req.document!.id)}
                        title="Remove document"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.uploadTriggerBtn}
                    onClick={() => handleTriggerUpload(req.stepId, req.requirementId)}
                    disabled={isUploading}
                    id={`upload-btn-${req.requirementId}`}
                  >
                    <Upload size={12} />
                    <span>Upload Document (PDF / Image)</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Privacy & Sandbox Security Guarantee */}
          <div className={styles.privacyBanner}>
            <ShieldCheck size={16} style={{ color: 'var(--color-brand-600)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Zero-Cloud Local Storage:</strong> All uploaded documents and progress tracking
              data are preserved strictly in your browser&apos;s sandboxed local storage. No documents
              are uploaded to remote servers without explicit citizen authorization.
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerNote}>
            {documents.length} document{documents.length === 1 ? '' : 's'} secured locally
          </span>
          <button
            type="button"
            className={styles.primaryActionBtn}
            onClick={onClose}
            id="close-vault-done-btn"
          >
            Done
          </button>
        </div>
      </aside>
    </>
  );
}
