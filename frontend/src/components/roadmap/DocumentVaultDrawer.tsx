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
  FileCheck,
  CalendarClock,
  ScanLine,
} from 'lucide-react';
import { CivicProcess } from '@/types/roadmap';
import { TrackedDocument, formatFileSize } from '@/lib/document-vault';
import { DocumentVerificationBadge } from './DocumentVerificationBadge';
import styles from './DocumentVaultDrawer.module.css';

interface DocumentVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  process: CivicProcess;
  completedStepIds: string[];
  documents: TrackedDocument[];
  onUploadDocument: (file: File, stepId: string, requirementId?: string) => Promise<TrackedDocument>;
  onVerifyDocument?: (docId: string) => void;
  onRemoveDocument: (docId: string) => void;
  onDownloadDocument: (docId: string) => void;
  onExportDossier: () => void;
  requirementDocumentsMap: Map<string, TrackedDocument>;
}

export function DocumentVaultDrawer({
  isOpen,
  onClose,
  process,
  completedStepIds,
  documents,
  onUploadDocument,
  onVerifyDocument,
  onRemoveDocument,
  onDownloadDocument,
  onExportDossier,
  requirementDocumentsMap,
}: DocumentVaultDrawerProps) {
  const [activeUploadTarget, setActiveUploadTarget] = useState<{
    stepId: string;
    requirementId?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scanningFileName, setScanningFileName] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'checklist' | 'documents'>('checklist');
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

  const documentsByStep = React.useMemo(() => {
    return process.steps
      .map((step) => ({
        step,
        documents: documents
          .filter((document) => document.stepId === step.id)
          .sort(
            (left, right) =>
              new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime()
          ),
      }))
      .filter((group) => group.documents.length > 0);
  }, [documents, process.steps]);

  const requirementTitleById = React.useMemo(
    () => new Map(allRequirements.map((requirement) => [requirement.requirementId, requirement.title])),
    [allRequirements]
  );

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
      setScanningFileName(file.name);
      await onUploadDocument(file, activeUploadTarget.stepId, activeUploadTarget.requirementId);
    } finally {
      setIsUploading(false);
      setScanningFileName(null);
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

      {scanningFileName && (
        <div className={styles.scanOverlay} role="status" aria-live="polite">
          <div className={styles.scanDialog}>
            <div className={styles.scanPreview} aria-hidden="true">
              <FileText size={48} strokeWidth={1.4} />
              <span className={styles.scanLine} />
            </div>
            <strong>Scanning your document</strong>
            <span>Checking {scanningFileName} with OCR…</span>
          </div>
        </div>
      )}

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
              Documents
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

          <div className={styles.viewTabs} role="tablist" aria-label="Document views">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'checklist'}
              className={`${styles.viewTab} ${activeView === 'checklist' ? styles.viewTabActive : ''}`}
              onClick={() => setActiveView('checklist')}
            >
              <FileCheck size={14} />
              Checklist
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'documents'}
              className={`${styles.viewTab} ${activeView === 'documents' ? styles.viewTabActive : ''}`}
              onClick={() => setActiveView('documents')}
            >
              <FileText size={14} />
              My documents
              <span className={styles.tabCount}>{documents.length}</span>
            </button>
          </div>

          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              {activeView === 'checklist' ? 'Verify your required documents' : 'Documents added by step'}
            </span>
            <button
              type="button"
              className={styles.secondaryActionBtn}
              onClick={onExportDossier}
              title="Export application dossier summary in JSON"
              id="export-dossier-btn"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>

          {activeView === 'checklist' ? (
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                      <div className={styles.fileNameMeta} title={req.document.fileName}>
                        <CheckCircle2 size={13} style={{ color: 'var(--color-success-600)', flexShrink: 0 }} />
                        <span>{req.document.fileName}</span>
                        <span>({formatFileSize(req.document.fileSize)})</span>
                      </div>
                      <div>
                        <DocumentVerificationBadge
                          document={req.document}
                          onVerify={onVerifyDocument}
                          compact
                        />
                      </div>
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
                    <span>Add Local Copy (PDF / Image)</span>
                  </button>
                )}
              </div>
              ))}
            </div>
          ) : documentsByStep.length === 0 ? (
            <div className={styles.emptyDocuments}>
              <FolderCheck size={24} />
              <strong>No documents added yet</strong>
              <span>Add a file from the checklist or from a roadmap step.</span>
              <button type="button" onClick={() => setActiveView('checklist')}>
                Open checklist
              </button>
            </div>
          ) : (
            <div className={styles.stepGroups}>
              {documentsByStep.map(({ step, documents: stepDocuments }) => (
                <section key={step.id} className={styles.stepGroup}>
                  <div className={styles.stepGroupHeader}>
                    <span className={styles.stepNumber}>Step {step.stepOrder}</span>
                    <h3>{step.shortTitle || step.title}</h3>
                    <span>{stepDocuments.length}</span>
                  </div>
                  <div className={styles.uploadedDocumentsList}>
                    {stepDocuments.map((document) => (
                      <article key={document.id} className={styles.uploadedDocumentCard}>
                        <FileText size={18} className={styles.documentTypeIcon} />
                        <div className={styles.uploadedDocumentInfo}>
                          <strong title={document.fileName}>{document.fileName}</strong>
                          <span>
                            {document.requirementId
                              ? requirementTitleById.get(document.requirementId) || 'Step document'
                              : 'Supporting document'}
                          </span>
                          <small>
                            <CalendarClock size={11} />
                            {new Date(document.uploadedAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                            {' · '}
                            {formatFileSize(document.fileSize)}
                          </small>
                          <div style={{ marginTop: 4 }}>
                            <DocumentVerificationBadge
                              document={document}
                              onVerify={onVerifyDocument}
                              compact
                            />
                          </div>
                        </div>
                        <div className={styles.fileActions}>
                          <button
                            type="button"
                            className={styles.fileActionIconBtn}
                            onClick={() => onDownloadDocument(document.id)}
                            aria-label={`Download ${document.fileName}`}
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.fileActionIconBtn} ${styles.fileActionIconBtnDanger}`}
                            onClick={() => onRemoveDocument(document.id)}
                            aria-label={`Remove ${document.fileName}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Privacy & Sandbox Security Guarantee */}
          <div className={styles.privacyBanner}>
            <ShieldCheck size={16} style={{ color: 'var(--color-brand-600)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Stored on this device:</strong> Files remain in this browser and are not sent to
              our servers. Browser storage is not encrypted, so do not add identity documents on a
              shared or public device.
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerNote}>
            {documents.length} local document cop{documents.length === 1 ? 'y' : 'ies'}
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
