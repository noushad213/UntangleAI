import { Metadata } from 'next';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import RoadmapClient from './RoadmapClient';

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return MOCK_ROADMAPS.map((p) => ({
    id: p.id,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const process = MOCK_ROADMAPS.find((p) => p.id === params.id) || MOCK_ROADMAPS[0];
  return {
    title: `${process.title} (${process.location}) — UntangleAI`,
    description: process.description,
  };
}

export default function RoadmapPage({ params }: Props) {
  const currentProcess =
    MOCK_ROADMAPS.find((p) => p.id === params.id) || MOCK_ROADMAPS[0];

  return <RoadmapClient initialProcess={currentProcess} />;
}
