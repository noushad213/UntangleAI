import { CivicProcess, ProcessStep, StepDependency } from '@/types/roadmap';

interface BackendNode {
  id: string;
  label: string;
  data: {
    description?: string;
    fee?: string | null;
    deadline?: string | null;
    documentsRequired?: string[];
    eligibility?: string | null;
    office?: string | null;
    officialUrl?: string | null;
    isUncertain?: boolean;
    uncertaintyNote?: string | null;
    evidence?: Array<{ quote?: string | null }>;
  };
}

interface BackendWorkflow {
  id: string;
  title: string;
  municipalityId: string;
  issueKey: string;
  status: 'needs_review' | 'verified' | 'outdated';
  nodes: BackendNode[];
  edges: Array<{ from: string; to: string }>;
  conflicts?: Array<{ description?: string }>;
  missingInformation?: string[];
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  lastRecheckedAt?: string | null;
  updatedAt?: string | null;
}

interface BackendWorkflowResponse {
  workflow: BackendWorkflow;
}

function backendUrl(path: string): string {
  const baseUrl =
    process.env.CIVICPATH_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:5000';
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

function mapWorkflow(workflow: BackendWorkflow): CivicProcess {
  const steps: ProcessStep[] = workflow.nodes.map((node, index) => ({
    id: node.id,
    processId: workflow.id,
    title: node.label,
    shortTitle: node.label,
    description: node.data.description || 'Follow the instructions on the official service page.',
    nodeType: 'action',
    stepOrder: index + 1,
    office: node.data.office || undefined,
    fees: node.data.fee || undefined,
    timeEstimate: node.data.deadline || undefined,
    sourceUrl: node.data.officialUrl || '',
    sourceSnippet: node.data.evidence?.find((item) => item.quote)?.quote || undefined,
    confidence: node.data.isUncertain ? 'low' : 'high',
    requirements: (node.data.documentsRequired || []).map((title, requirementIndex) => ({
      id: `${node.id}-requirement-${requirementIndex + 1}`,
      stepId: node.id,
      title,
      documentType: 'other',
      isMandatory: true,
    })),
    position: {
      x: (index % 3) * 320 + 60,
      y: Math.floor(index / 3) * 220 + 80,
    },
  }));

  const dependencies: StepDependency[] = workflow.edges.map((edge, index) => ({
    id: `dependency-${index + 1}`,
    stepId: edge.to,
    dependsOnStepId: edge.from,
    dependencyType: 'required',
  }));

  const officialPortal = steps.find((step) => step.sourceUrl)?.sourceUrl || 'https://www.india.gov.in';

  return {
    id: workflow.id,
    title: workflow.title,
    description: 'Generated from official government sources. Review the status and citations before acting.',
    category: workflow.issueKey.replace(/[-_]/g, ' '),
    location: 'Municipal service area',
    officialPortal,
    estimatedTotalTime: 'See each step',
    estimatedTotalCost: 'See each step',
    lastUpdated: workflow.lastRecheckedAt || workflow.updatedAt || new Date().toISOString(),
    steps,
    dependencies,
    review: {
      status: workflow.status,
      conflicts: (workflow.conflicts || [])
        .map((conflict) => conflict.description)
        .filter((description): description is string => Boolean(description)),
      missingInformation: workflow.missingInformation || [],
      verifiedBy: workflow.verifiedBy || undefined,
      verifiedAt: workflow.verifiedAt || undefined,
      lastCheckedAt: workflow.lastRecheckedAt || workflow.updatedAt || undefined,
    },
  };
}

export async function getGeneratedRoadmap(id: string): Promise<CivicProcess | null> {
  const response = await fetch(backendUrl(`/api/workflows/${encodeURIComponent(id)}`), {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error('The civic workflow service is unavailable.');

  const payload = (await response.json()) as BackendWorkflowResponse;
  return mapWorkflow(payload.workflow);
}
