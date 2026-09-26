'use client';

import React, { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeProps } from '@xyflow/react';

export interface CustomEdgeData {
  dependencyType?: 'required' | 'recommended';
  isSourceCompleted?: boolean;
}

function CustomEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as CustomEdgeData | undefined;
  const isRequired = edgeData?.dependencyType !== 'recommended';
  const isSourceCompleted = edgeData?.isSourceCompleted ?? false;

  // Custom stroke colors following design tokens
  let strokeColor = '#94A3B8'; // default secondary/tertiary
  if (isSourceCompleted) {
    strokeColor = '#16A34A'; // green completed flow
  }

  const strokeDasharray = isRequired ? undefined : '5,5';

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        strokeWidth: isSourceCompleted ? 2.5 : 2,
        stroke: strokeColor,
        strokeDasharray,
        transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
      }}
    />
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
