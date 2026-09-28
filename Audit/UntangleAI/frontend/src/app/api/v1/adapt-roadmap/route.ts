import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import { adaptRoadmapForContext, RoadmapFilters } from '@/lib/roadmap-adapters';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processId, location, applicantProfile, serviceMode } = body;

    if (typeof processId !== 'string' || !processId.trim()) {
      return NextResponse.json(
        { success: false, error: 'processId is required' },
        { status: 400 }
      );
    }

    const baseProcess = MOCK_ROADMAPS.find((p) => p.id === processId);

    if (!baseProcess) {
      return NextResponse.json(
        { success: false, error: 'Roadmap not found' },
        { status: 404 }
      );
    }

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to adapt roadmap';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
