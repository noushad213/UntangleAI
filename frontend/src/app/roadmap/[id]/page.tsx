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

  if (!currentProcess) {
    try {
      currentProcess = (await getGeneratedRoadmap(params.id)) || undefined;
    } catch {
      throw new Error('The roadmap service is temporarily unavailable. Refresh this page to try again.');
    }
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
