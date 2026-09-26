'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import { CivicProcess, ProcessStep, StepStatus } from '@/types/roadmap';
import { StepNode, StepNodeData } from './nodes/StepNode';
import { CustomEdge } from './edges/CustomEdge';
import styles from './RoadmapCanvas.module.css';

interface RoadmapCanvasProps {
  process: CivicProcess;
  stepStatusMap: Map<string, StepStatus>;
  completedStepIds: string[];
  unmetDependenciesMap: Map<string, string[]>;
  selectedStepId: string | null;
  onSelectStep: (step: ProcessStep) => void;
  theme: 'light' | 'dark';
}

const nodeTypes = {
  stepNode: StepNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

export function RoadmapCanvas({
  process,
  stepStatusMap,
  completedStepIds,
  unmetDependenciesMap,
  selectedStepId,
  onSelectStep,
  theme,
}: RoadmapCanvasProps) {
  const completedSet = useMemo(() => new Set(completedStepIds), [completedStepIds]);

  // Transform process steps into React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return process.steps.map((step, idx) => {
      const status = stepStatusMap.get(step.id) || 'pending';
      const isCompleted = completedSet.has(step.id);
      const unmet = unmetDependenciesMap.get(step.id) || [];

      return {
        id: step.id,
        type: 'stepNode',
        position: step.position || { x: idx * 300 + 60, y: 140 },
        selected: selectedStepId === step.id,
        data: {
          step,
          status,
          isCompleted,
          unmetCount: unmet.length,
        } as unknown as Record<string, unknown>,
      };
    });
  }, [process.steps, stepStatusMap, completedSet, unmetDependenciesMap, selectedStepId]);

  // Transform dependencies into React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return process.dependencies.map((dep) => {
      const isSourceCompleted = completedSet.has(dep.dependsOnStepId);
      const isRequired = dep.dependencyType === 'required';

      return {
        id: dep.id,
        source: dep.dependsOnStepId,
        target: dep.stepId,
        type: 'customEdge',
        animated: isSourceCompleted && !completedSet.has(dep.stepId),
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSourceCompleted ? '#16A34A' : '#94A3B8',
          width: 14,
          height: 14,
        },
        data: {
          dependencyType: dep.dependencyType,
          isSourceCompleted,
        },
      };
    });
  }, [process.dependencies, completedSet]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when dependencies / completed changes
  const currentNodes = useMemo(() => initialNodes, [initialNodes]);
  const currentEdges = useMemo(() => initialEdges, [initialEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeData = node.data as unknown as StepNodeData;
      if (nodeData && nodeData.step) {
        onSelectStep(nodeData.step);
      }
    },
    [onSelectStep]
  );

  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.tipBanner}>
        <span className={styles.tipBadge}>Interactive</span>
        <span>Click any step to inspect documents, fees, and official links</span>
      </div>

      <ReactFlow
        nodes={currentNodes}
        edges={currentEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.6}
        defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color={theme === 'dark' ? '#334155' : '#cbd5e1'}
        />

        <Controls
          showInteractive={false}
          position="top-right"
          style={{ margin: 16 }}
        />

        <MiniMap
          nodeColor={(n) => {
            const data = n.data as unknown as StepNodeData;
            if (data?.isCompleted) return '#16A34A';
            if (data?.step?.nodeType === 'action') return '#2563EB';
            if (data?.step?.nodeType === 'document') return '#D97706';
            return '#7C3AED';
          }}
          maskColor={theme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(241, 245, 249, 0.7)'}
          style={{
            bottom: 20,
            right: 20,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-elevated)',
          }}
        />
      </ReactFlow>

      {/* Legend Panel */}
      <div className={styles.legendPanel}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotAction}`} />
          <span>Action Step</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotDocument}`} />
          <span>Document / Form</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotPrerequisite}`} />
          <span>Prerequisite</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotComplete}`} />
          <span>Completed</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotLocked}`} />
          <span>Prereqs Pending</span>
        </div>
      </div>
    </div>
  );
}
