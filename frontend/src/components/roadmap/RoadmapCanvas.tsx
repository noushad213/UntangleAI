'use client';

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
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
  useReactFlow,
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
  isTrackingMode?: boolean;
  onMorphComplete?: () => void;
  theme: 'light' | 'dark';
}

const nodeTypes = {
  stepNode: StepNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

const FIT_VIEW_OPTIONS = { padding: 0.2 };
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 0.9 };
const DEFAULT_VIEWPORT_VERTICAL = { x: 20, y: 15, zoom: 0.88 };

function CanvasInner({
  process,
  stepStatusMap,
  completedStepIds,
  unmetDependenciesMap,
  selectedStepId,
  onSelectStep,
  isTrackingMode = false,
  onMorphComplete,
  theme,
}: RoadmapCanvasProps) {
  const { t } = useLanguage();
  const { setViewport, fitView } = useReactFlow();
  const completedSet = useMemo(() => new Set(completedStepIds), [completedStepIds]);

  // Target position function for each step based on current layout mode
  const getStepPosition = useCallback(
    (idx: number, isVertical: boolean) => {
      if (isVertical) {
        return { x: 65, y: idx * 165 + 40 };
      }
      return process.steps[idx]?.position || { x: idx * 300 + 60, y: 160 };
    },
    [process.steps]
  );

  // Generate initial nodes
  const initialNodes: Node[] = useMemo(() => {
    return process.steps.map((step, idx) => {
      const status = stepStatusMap.get(step.id) || 'pending';
      const isCompleted = completedSet.has(step.id);
      const unmet = unmetDependenciesMap.get(step.id) || [];

      return {
        id: step.id,
        type: 'stepNode',
        position: getStepPosition(idx, isTrackingMode),
        selected: selectedStepId === step.id,
        data: {
          step,
          status,
          isCompleted,
          unmetCount: unmet.length,
          isVertical: isTrackingMode,
          onSelect: onSelectStep,
        } as unknown as Record<string, unknown>,
      };
    });
  }, [
    process.steps,
    stepStatusMap,
    completedSet,
    unmetDependenciesMap,
    selectedStepId,
    isTrackingMode,
    getStepPosition,
    onSelectStep,
  ]);

  // Transform dependencies into React Flow edges with handles matching layout mode
  const initialEdges: Edge[] = useMemo(() => {
    return process.dependencies.map((dep) => {
      const isSourceCompleted = completedSet.has(dep.dependsOnStepId);

      return {
        id: dep.id,
        source: dep.dependsOnStepId,
        target: dep.stepId,
        sourceHandle: isTrackingMode ? 'source-bottom' : 'source-right',
        targetHandle: isTrackingMode ? 'target-top' : 'target-left',
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
  }, [process.dependencies, completedSet, isTrackingMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update edges whenever tracking mode or completion changes
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Keep node status, position, and selection in sync without redundant object recreation
  useEffect(() => {
    setNodes((prevNodes) => {
      let hasChanges = false;
      const nextNodes = process.steps.map((step, idx) => {
        const targetPos = getStepPosition(idx, isTrackingMode);
        const status = stepStatusMap.get(step.id) || 'pending';
        const isCompleted = completedSet.has(step.id);
        const unmet = unmetDependenciesMap.get(step.id) || [];
        const isSelected = selectedStepId === step.id;

        const existingNode = prevNodes.find((n) => n.id === step.id) || prevNodes[idx];
        if (existingNode) {
          const prevData = existingNode.data as unknown as StepNodeData | undefined;
          const posChanged =
            existingNode.position.x !== targetPos.x ||
            existingNode.position.y !== targetPos.y;
          const selectChanged = existingNode.selected !== isSelected;
          const dataChanged =
            !prevData ||
            prevData.status !== status ||
            prevData.isCompleted !== isCompleted ||
            prevData.unmetCount !== unmet.length;

          if (!posChanged && !selectChanged && !dataChanged) {
            return existingNode;
          }
        }

        hasChanges = true;
        return {
          id: step.id,
          type: 'stepNode',
          position: targetPos,
          selected: isSelected,
          data: {
            step,
            status,
            isCompleted,
            unmetCount: unmet.length,
            isVertical: isTrackingMode,
            onSelect: onSelectStep,
          } as unknown as Record<string, unknown>,
        };
      });

      if (!hasChanges && prevNodes.length === nextNodes.length) {
        return prevNodes;
      }
      return nextNodes;
    });
  }, [
    process.steps,
    stepStatusMap,
    completedSet,
    unmetDependenciesMap,
    selectedStepId,
    isTrackingMode,
    getStepPosition,
    onSelectStep,
    setNodes,
  ]);

  const initialTrackingMode = useRef(isTrackingMode).current;

  // Apply the starting camera once; the next effect handles later mode changes.
  useEffect(() => {
    if (initialTrackingMode) {
      setViewport({ x: 20, y: 15, zoom: 0.88 });
    }
  }, [initialTrackingMode, setViewport]);

  // Smooth layout morph transition via camera viewport & CSS transitions
  const prevTrackingModeRef = useRef<boolean>(isTrackingMode);

  useEffect(() => {
    if (prevTrackingModeRef.current === isTrackingMode) return;
    prevTrackingModeRef.current = isTrackingMode;

    if (isTrackingMode) {
      setViewport({ x: 20, y: 15, zoom: 0.88 }, { duration: 550 });
    } else {
      fitView({ padding: 0.2, duration: 550 });
    }

    const timer = setTimeout(() => {
      onMorphComplete?.();
    }, 550);

    return () => clearTimeout(timer);
  }, [isTrackingMode, setViewport, fitView, onMorphComplete]);

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
    <div
      className={`${styles.canvasWrapper} ${
        isTrackingMode ? styles.canvasTrackingMode : styles.canvasHorizontalMode
      }`}
    >
      <div className={styles.tipBanner}>
        <span className={styles.tipBadge}>{t.roadmap.interactive}</span>
        <span>{t.roadmap.canvasTip}</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        nodesDraggable={!isTrackingMode}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView={!isTrackingMode}
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={0.3}
        maxZoom={1.6}
        defaultViewport={isTrackingMode ? DEFAULT_VIEWPORT_VERTICAL : DEFAULT_VIEWPORT}
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

export function RoadmapCanvas(props: RoadmapCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
