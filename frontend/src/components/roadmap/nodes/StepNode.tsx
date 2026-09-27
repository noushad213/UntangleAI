'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Check, Lock, Clock, FileText, Briefcase, KeyRound } from 'lucide-react';
import { ProcessStep, StepStatus } from '@/types/roadmap';
import { useLanguage } from '@/context/LanguageContext';
import styles from './StepNode.module.css';

export interface StepNodeData {
  step: ProcessStep;
  status: StepStatus;
  isCompleted: boolean;
  unmetCount: number;
  onSelect?: (step: ProcessStep) => void;
}

function StepNodeComponent({ data, selected }: NodeProps) {
  const { t } = useLanguage();
  const nodeData = data as unknown as StepNodeData;
  const { step, status, isCompleted, unmetCount } = nodeData;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      nodeData.onSelect?.(step);
    }
  };

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

  const getNodeTypeName = () => {
    switch (step.nodeType) {
      case 'action':
        return t.roadmap.action;
      case 'document':
        return t.roadmap.document;
      case 'prerequisite':
        return t.roadmap.prerequisite;
      default:
        return step.nodeType;
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
      onClick={() => nodeData.onSelect?.(step)}
      onKeyDown={handleKeyDown}
    >
      <div className={`${styles.accentBar} ${getAccentClass()}`} />

      {/* React Flow Left Handle (Incoming Dependency) */}
      <Handle
        id="target-left"
        type="target"
        position={Position.Left}
        className={styles.handle}
        isConnectable={false}
      />

      {/* React Flow Top Handle (Incoming Dependency in Vertical Mode) */}
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        className={styles.handle}
        isConnectable={false}
      />

      <div className={styles.header}>
        <div className={styles.badgeGroup}>
          <span className={`${styles.typeBadge} ${getBadgeClass()}`}>
            {nodeTypeIcon()}
            <span>{getNodeTypeName()}</span>
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
          <span className={styles.metaItem} title={t.roadmap.estimatedTimeline}>
            <Clock size={11} />
            <span>{step.timeEstimate.split(' ')[0]} {step.timeEstimate.split(' ')[1] || ''}</span>
          </span>
        )}

        {status === 'locked' && unmetCount > 0 ? (
          <span className={styles.lockNotice} title={`${unmetCount} prior step(s) required`}>
            <Lock size={10} />
            <span>{unmetCount} {t.roadmap.prerequisitesRequired}</span>
          </span>
        ) : (
          <span className={styles.metaItem}>
            <span>{step.fees ? step.fees.split(' ')[0] : '—'}</span>
          </span>
        )}
      </div>

      {/* React Flow Right Handle (Outgoing Dependency) */}
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        className={styles.handle}
        isConnectable={false}
      />

      {/* React Flow Bottom Handle (Outgoing Dependency in Vertical Mode) */}
      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        className={styles.handle}
        isConnectable={false}
      />
    </div>
  );
}

export const StepNode = memo(StepNodeComponent);
