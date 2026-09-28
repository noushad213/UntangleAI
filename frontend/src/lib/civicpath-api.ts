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

export function inferNodeType(
  node: BackendNode,
  index: number,
  totalNodes: number
): NodeType {
  if (node.data.nodeType) return node.data.nodeType;
  if (node.data.stepType) return node.data.stepType;

  const text = `${node.label} ${node.data.description || ''} ${(node.data.documentsRequired || []).join(' ')}`.toLowerCase();

  const isPrereqKeyword =
    text.includes('gather') ||
    text.includes('collect') ||
    text.includes('prerequisite') ||
    text.includes('eligibility') ||
    text.includes('proof') ||
    text.includes('prior to') ||
    text.includes('before applying') ||
    text.includes('obtain non-availability') ||
    text.includes('obtain crematorium') ||
    text.includes('obtain dsc') ||
    text.includes('residence proof') ||
    text.includes('income proof') ||
    text.includes('age proof') ||
    text.includes('threshold') ||
    text.includes('ration card copy') ||
    text.includes('aadhaar card');

  const isDocKeyword =
    text.includes('form') ||
    text.includes('document') ||
    text.includes('affidavit') ||
    text.includes('declaration') ||
    text.includes('upload') ||
    text.includes('apply online') ||
    text.includes('submit online') ||
    text.includes('online application') ||
    text.includes('memorandum') ||
    text.includes('portal registration') ||
    text.includes('kyc');

  const isActionKeyword =
    text.includes('issuance') ||
    text.includes('issue') ||
    text.includes('download certificate') ||
    text.includes('e-epic download') ||
    text.includes('approval') ||
    text.includes('appearance') ||
    text.includes('verification by') ||
    text.includes('scrutiny by') ||
    text.includes('inquiry by') ||
    text.includes('visit') ||
    text.includes('slot booking') ||
    text.includes('appointment') ||
    text.includes('payment') ||
    text.includes('pay fee');

  // Step 1: Typically prerequisite (gathering required documents / proofs / checking eligibility)
  if (index === 0) {
    if (isPrereqKeyword || (node.data.documentsRequired && node.data.documentsRequired.length > 0)) {
      return 'prerequisite';
    }
    if (isDocKeyword) {
      return 'document';
    }
  }

  // Final step: Typically action (authority review, certificate issuance, or digital download)
  if (index === totalNodes - 1 && totalNodes > 1) {
    if (isActionKeyword || text.includes('certificate') || text.includes('issuance') || text.includes('download')) {
      return 'action';
    }
  }

  if (isDocKeyword) {
    return 'document';
  }

  if (isPrereqKeyword) {
    return 'prerequisite';
  }

  if (isActionKeyword) {
    return 'action';
  }

  return 'action';
}

function mapWorkflow(workflow: BackendWorkflow, municipalityName: string): CivicProcess {
  const totalNodes = workflow.nodes.length;
  const steps: ProcessStep[] = workflow.nodes.map((node, index) => ({
    id: node.id,
    processId: workflow.id,
    title: node.label,
    shortTitle: node.label,
    description: node.data.description || 'Follow the instructions on the official service page.',
    nodeType: inferNodeType(node, index, totalNodes),
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

  // Ensure edges are present: use workflow.edges if non-empty, otherwise chain sequential steps
  const rawEdges =
    workflow.edges && workflow.edges.length > 0
      ? workflow.edges
      : steps.slice(0, -1).map((s, idx) => ({
          from: s.id,
          to: steps[idx + 1].id,
        }));

  const dependencies: StepDependency[] = rawEdges.map((edge, index) => {
    const targetStep = steps.find((s) => s.id === edge.to);
    const targetText = `${targetStep?.title || ''} ${targetStep?.description || ''}`.toLowerCase();
    const isRecommended =
      targetText.includes('optional') ||
      targetText.includes('recommended') ||
      targetText.includes('if applicable') ||
      targetText.includes('voluntary');

    return {
      id: `dependency-${index + 1}`,
      stepId: edge.to,
      dependsOnStepId: edge.from,
      dependencyType: isRecommended ? 'recommended' : 'required',
    };
  });

  const officialPortal = steps.find((step) => step.sourceUrl)?.sourceUrl || 'https://www.india.gov.in';

  return {
    id: workflow.id,
    title: workflow.title,
    description: 'Generated from official government sources. Review the status and citations before acting.',
    category: workflow.issueKey.replace(/[-_]/g, ' '),
    location: municipalityName,
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
  let municipalityName = 'Municipal service area';
  try {
    const municipalities = await fetch(backendUrl('/api/municipalities'), {
      cache: 'no-store', signal: AbortSignal.timeout(5_000),
    });
    if (municipalities.ok) {
      const directory = await municipalities.json();
      municipalityName = directory.municipalities?.find(
        (city: { _id: string; name: string }) => city._id === payload.workflow.municipalityId
      )?.name || municipalityName;
    }
  } catch {
    // The sourced workflow remains usable while the city directory is offline.
  }
  return mapWorkflow(payload.workflow, municipalityName);
}
