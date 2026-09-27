'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
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
import { useLanguage } from '@/context/LanguageContext';
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
  const { t } = useLanguage();
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
          onSelect: onSelectStep,
        } as unknown as Record<string, unknown>,
      };
    });
  }, [process.steps, stepStatusMap, completedSet, unmetDependenciesMap, selectedStepId, onSelectStep]);

  // Transform dependencies into React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return process.dependencies.map((dep) => {
      const isSourceCompleted = completedSet.has(dep.dependsOnStepId);

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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state whenever process, completion or selection changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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
        <span className={styles.tipBadge}>{t.roadmap.interactive}</span>
        <span>{t.roadmap.canvasTip}</span>
      </div>

      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
      </ReactFlowProvider>

      {/* Legend Panel */}
      <div className={styles.legendPanel}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotAction}`} />
          <span>{t.roadmap.legendAction}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotDocument}`} />
          <span>{t.roadmap.legendDoc}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotPrerequisite}`} />
          <span>{t.roadmap.legendPrereq}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotComplete}`} />
          <span>{t.roadmap.legendCompleted}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotLocked}`} />
          <span>{t.roadmap.legendLocked}</span>
        </div>
      </div>
    </div>
  );
}
