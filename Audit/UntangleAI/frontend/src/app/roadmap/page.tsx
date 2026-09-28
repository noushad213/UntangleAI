import { Suspense } from 'react';
import { Metadata } from 'next';
import RoadmapDirectoryClient from './RoadmapDirectoryClient';

export const metadata: Metadata = {
  title: 'Browse Guided Roadmaps — UntangleAI',
  description: 'Explore step-by-step civic roadmaps verified against official Indian central and state government portals.',
};

export default function RoadmapIndexPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--color-surface-primary)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-family-sans)',
            fontSize: '0.9rem',
          }}
        >
          <span>Loading roadmaps...</span>
        </div>
      }
    >
      <RoadmapDirectoryClient />
    </Suspense>
  );
}
