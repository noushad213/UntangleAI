import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  stepCount: number;
  estimatedTotalTime: string;
  estimatedTotalCost: string;
  matchScore: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const location = (searchParams.get('location') || '').trim().toLowerCase();

  if (!query && !location) {
    // Return all available roadmaps as default recommendations
    const results: SearchResult[] = MOCK_ROADMAPS.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      location: p.location,
      stepCount: p.steps.length,
      estimatedTotalTime: p.estimatedTotalTime,
      estimatedTotalCost: p.estimatedTotalCost,
      matchScore: 1,
    }));
    return NextResponse.json({ results });
  }

  const queryTerms = query.split(/\s+/).filter(Boolean);

  const matched = MOCK_ROADMAPS.map((p) => {
    let score = 0;
    const titleLower = p.title.toLowerCase();
    const descLower = p.description.toLowerCase();
    const catLower = p.category.toLowerCase();
    const locLower = p.location.toLowerCase();

    // Check query terms
    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 5;
      if (catLower.includes(term)) score += 3;
      if (descLower.includes(term)) score += 2;
      // Also match step titles/keywords
      p.steps.forEach((s) => {
        if (s.title.toLowerCase().includes(term) || (s.shortTitle && s.shortTitle.toLowerCase().includes(term))) {
          score += 1.5;
        }
      });
    }

    // Check location filter
    if (location && location !== 'all') {
      if (locLower.includes(location) || locLower.includes('all india')) {
        score += 4;
      } else {
        // Penalty for mismatched specific location
        score = Math.max(0, score - 2);
      }
    }

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      location: p.location,
      stepCount: p.steps.length,
      estimatedTotalTime: p.estimatedTotalTime,
      estimatedTotalCost: p.estimatedTotalCost,
      matchScore: score,
    };
  })
    .filter((r) => (query ? r.matchScore > 0 : true))
    .sort((a, b) => b.matchScore - a.matchScore);

  return NextResponse.json({ results: matched });
}
