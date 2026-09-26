'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Check, Lock, Clock, FileText, Briefcase, KeyRound } from 'lucide-react';
import { ProcessStep, StepStatus } from '@/types/roadmap';
import styles from './StepNode.module.css';

export interface StepNodeData {
  step: ProcessStep;
  status: StepStatus;
  isCompleted: boolean;
  unmetCount: number;
}

function StepNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as StepNodeData;
  const { step, status, isCompleted, unmetCount } = nodeData;

  const nodeTypeIcon = () => {
    switch (step.nodeType) {
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

  const getAccentClass = () => {
    if (isCompleted) return styles.accentComplete;
    if (step.nodeType === 'action') return styles.accentAction;
    if (step.nodeType === 'document') return styles.accentDocument;
    return styles.accentPrerequisite;
  };

  const getBadgeClass = () => {
    if (step.nodeType === 'action') return styles.badgeAction;
    if (step.nodeType === 'document') return styles.badgeDocument;
    return styles.badgePrerequisite;
  };

  return (
    <div
      className={`${styles.nodeContainer} ${selected ? styles.selected : ''} ${
        isCompleted ? styles.completed : ''
      } ${status === 'locked' ? styles.locked : ''}`}
      id={`step-node-${step.id}`}
      tabIndex={0}
      role="button"
      aria-label={`${step.title} (${step.nodeType}, ${status})`}
    >
      <div className={`${styles.accentBar} ${getAccentClass()}`} />

      {/* React Flow Left Handle (Incoming Dependency) */}
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
        isConnectable={false}
      />

      <div className={styles.header}>
        <div className={styles.badgeGroup}>
          <span className={`${styles.typeBadge} ${getBadgeClass()}`}>
            {nodeTypeIcon()} {step.nodeType}
          </span>
        </div>

        <div className={styles.statusIndicator} title={status}>
          {isCompleted ? (
            <Check size={12} strokeWidth={3} />
          ) : status === 'locked' ? (
            <Lock size={11} strokeWidth={2.5} />
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700 }}>{step.stepOrder}</span>
          )}
        </div>
      </div>

      <h4 className={styles.title}>{step.shortTitle || step.title}</h4>

      <div className={styles.footer}>
        {step.timeEstimate && (
          <span className={styles.metaItem} title="Estimated Processing Time">
            <Clock size={11} />
            <span>{step.timeEstimate.split(' ')[0]} {step.timeEstimate.split(' ')[1] || ''}</span>
          </span>
        )}

        {status === 'locked' && unmetCount > 0 ? (
          <span className={styles.lockNotice} title={`${unmetCount} prior step(s) required`}>
            <Lock size={10} /> {unmetCount} prior req.
          </span>
        ) : (
          <span className={styles.metaItem}>
            {step.fees ? step.fees.split(' ')[0] : 'Free'}
          </span>
        )}
      </div>

      {/* React Flow Right Handle (Outgoing Dependency) */}
      <Handle
        type="source"
        position={Position.Right}
        className={styles.handle}
        isConnectable={false}
      />
    </div>
  );
}

export const StepNode = memo(StepNodeComponent);
