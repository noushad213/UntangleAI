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
  const names: Record<string, string> = {
    aadhaar: 'Aadhaar card',
    pan: 'PAN card',
    passport: 'passport',
    driving_license: 'driving licence',
    voter_id: 'Voter ID',
    domicile_certificate: 'domicile certificate',
    birth_certificate: 'birth certificate',
    income_certificate: 'income certificate',
  };
  return names[type] || type.replace(/_/g, ' ');
}

export function DocumentVerificationBadge({
  document,
  onVerify,
  compact = false,
}: DocumentVerificationBadgeProps) {
  const { verificationStatus, detectedType, expectedType, verificationMessage, verificationLevel } = document;
  const mismatchMessage = verificationMessage || (detectedType && expectedType
    ? `This looks like a ${formatDocTypeName(detectedType)}. Upload the required ${formatDocTypeName(expectedType)} instead.`
    : 'This document does not match the required type. Upload the correct document.');

  if (verificationStatus === 'checking') {
    return (
      <span className={`${styles.badgeContainer} ${styles.checking}`} title="Checking the local demo rule">
        <RefreshCw size={11} className={styles.spin} />
        <span>Checking document...</span>
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
            ? `${verificationLevel === 'local_demo' ? 'Demo match' : 'Verified'}: ${formatDocTypeName(detectedType)}`
            : `${verificationLevel === 'local_demo' ? 'Demo match' : 'Type Verified'}: ${formatDocTypeName(detectedType)}`}
        </span>
      </span>
    );
  }

  if (verificationStatus === 'mismatch') {
    return (
      <span
        className={`${styles.badgeContainer} ${styles.mismatch} ${styles.mismatchMessage}`}
        title={mismatchMessage}
      >
        <AlertTriangle size={11} />
        <span>{mismatchMessage}</span>
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
        <span>{verificationMessage || 'We couldn’t confirm the document type. Upload a clear image or PDF, then verify again.'}</span>
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
