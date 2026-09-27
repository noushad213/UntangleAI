import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import { adaptRoadmapForContext, RoadmapFilters } from '@/lib/roadmap-adapters';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processId, location, applicantProfile, serviceMode } = body;

    const baseProcess =
      MOCK_ROADMAPS.find((p) => p.id === processId) || MOCK_ROADMAPS[0];

    const filters: RoadmapFilters = {
      location: location || 'delhi',
      applicantProfile: applicantProfile || 'individual',
      serviceMode: serviceMode || 'online',
    };

    const adaptation = adaptRoadmapForContext(baseProcess, filters);

    return NextResponse.json({
      success: true,
      processId: baseProcess.id,
      filters,
      adaptedProcess: adaptation.adaptedProcess,
      appliedContexts: adaptation.appliedContexts,
      timestamp: new Date().toISOString(),
      provider: 'UntangleAI Context & AI Adaptation Engine',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to adapt roadmap' },
      { status: 500 }
    );
  }
}
