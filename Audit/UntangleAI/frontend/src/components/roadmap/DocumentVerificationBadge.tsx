'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  ScanLine,
} from 'lucide-react';
import { TrackedDocument } from '@/lib/document-vault';
import styles from './DocumentVerificationBadge.module.css';

interface DocumentVerificationBadgeProps {
  document: TrackedDocument;
  onVerify?: (docId: string) => void;
  compact?: boolean;
}

function formatDocTypeName(type?: string | null): string {
  if (!type) return '';
  return type.replace(/_/g, ' ').toUpperCase();
}

export function DocumentVerificationBadge({
  document,
  onVerify,
  compact = false,
}: DocumentVerificationBadgeProps) {
  const { verificationStatus, detectedType, expectedType, verificationMessage } = document;

  if (verificationStatus === 'checking') {
    return (
      <span className={`${styles.badgeContainer} ${styles.checking}`} title="Verifying document type via OCR...">
        <RefreshCw size={11} className={styles.spin} />
        <span>Verifying document...</span>
      </span>
    );
  }

  if (verificationStatus === 'verified') {
    return (
      <span
        className={`${styles.badgeContainer} ${styles.verified}`}
        title={verificationMessage || `Verified as ${formatDocTypeName(detectedType)}`}
      >
        <CheckCircle2 size={11} />
        <span>
          {compact
            ? `Verified: ${formatDocTypeName(detectedType)}`
            : `Type Verified: ${formatDocTypeName(detectedType)}`}
        </span>
      </span>
    );
  }

  if (verificationStatus === 'mismatch') {
    return (
      <span
        className={`${styles.badgeContainer} ${styles.mismatch}`}
        title={
          verificationMessage ||
          `Detected ${formatDocTypeName(detectedType)}, but expected ${formatDocTypeName(expectedType)}.`
        }
      >
        <AlertTriangle size={11} />
        <span>
          {compact
            ? `Mismatch: Detected ${formatDocTypeName(detectedType)}`
            : `Mismatch: Upload appears to be ${formatDocTypeName(detectedType)} (expected ${formatDocTypeName(expectedType)})`}
        </span>
      </span>
    );
  }

  if (verificationStatus === 'unverified' || verificationStatus === 'failed') {
    return (
      <span
        className={`${styles.badgeContainer} ${styles.unverified}`}
        title={verificationMessage || 'Could not confidently identify document type from scan.'}
      >
        <HelpCircle size={11} />
        <span>Unclear Document</span>
      </span>
    );
  }

  // Not verified yet: render a verification trigger button if onVerify provided
  if (onVerify) {
    return (
      <button
        type="button"
        className={styles.verifyBtn}
        onClick={(e) => {
          e.stopPropagation();
          onVerify(document.id);
        }}
        title="Verify this upload matches the expected civic document type"
      >
        <ScanLine size={11} />
        <span>Verify Type</span>
      </button>
    );
  }

  return null;
}
