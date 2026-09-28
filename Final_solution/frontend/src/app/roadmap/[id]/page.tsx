import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import { getGeneratedRoadmap } from '@/lib/civicpath-api';
import RoadmapClient from './RoadmapClient';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return MOCK_ROADMAPS.map((p) => ({
    id: p.id,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const process = MOCK_ROADMAPS.find((p) => p.id === params.id);

  if (!process) {
    return {
      title: 'Generated civic roadmap — UntangleAI',
      description: 'A step-by-step civic process built from official government sources.',
    };
  }

  return {
    title: `${process.title} (${process.location}) — UntangleAI`,
    description: process.description,
  };
}

export default async function RoadmapPage({ params }: Props) {
  const sampleProcess = MOCK_ROADMAPS.find((p) => p.id === params.id);
  let currentProcess = sampleProcess;
  let loadFailed = false;

  if (!currentProcess) {
    try {
      currentProcess = (await getGeneratedRoadmap(params.id)) || undefined;
    } catch {
      loadFailed = true;
    }
  }

  if (loadFailed) {
    return (
      <main role="alert" style={{ maxWidth: 720, margin: '4rem auto', padding: '2rem' }}>
        <h1>Could not load this roadmap</h1>
        <p>The civic workflow service may be temporarily unavailable. Please try again.</p>
        <a href={`/roadmap/${encodeURIComponent(params.id)}`}>Try again</a>
      </main>
    );
  }

  if (!currentProcess) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <RoadmapClient key={currentProcess.id} initialProcess={currentProcess} />
    </Suspense>
  );
}
