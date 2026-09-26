export type NodeType = 'action' | 'document' | 'prerequisite' | 'info';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'locked';

export type DependencyType = 'required' | 'recommended';

export interface StepRequirement {
  id: string;
  stepId: string;
  title: string;
  description?: string;
  documentType?: 'id_proof' | 'address_proof' | 'financial' | 'form' | 'certificate' | 'other';
  downloadUrl?: string;
  isMandatory: boolean;
}

export interface StepDependency {
  id: string;
  stepId: string;
  dependsOnStepId: string;
  dependencyType: DependencyType;
}

export interface ProcessStep {
  id: string;
  processId: string;
  title: string;
  shortTitle?: string;
  description: string;
  nodeType: NodeType;
  stepOrder: number;
  office?: string;
  officeLocation?: string;
  fees?: string;
  timeEstimate?: string;
  sourceUrl: string;
  sourceSnippet?: string;
  confidence: 'high' | 'medium' | 'low';
  requirements: StepRequirement[];
  // Graph layout position coordinates
  position?: { x: number; y: number };
}

export interface CivicProcess {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  officialPortal: string;
  estimatedTotalTime: string;
  estimatedTotalCost: string;
  lastUpdated: string;
  steps: ProcessStep[];
  dependencies: StepDependency[];
}
