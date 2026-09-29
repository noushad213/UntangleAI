'use client';

import { useEffect } from 'react';

interface RoadmapErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RoadmapError({ error, reset }: RoadmapErrorProps) {
  useEffect(() => {
    console.error('Roadmap page failed to load', { digest: error.digest });
  }, [error.digest]);

  return (
    <main role="alert">
      <h1>We couldn’t load this roadmap</h1>
      <p>The roadmap service may be temporarily unavailable. Try again in a moment.</p>
      <button type="button" onClick={reset}>Try again</button>
      <a href="/roadmap">Browse roadmaps</a>
    </main>
  );
}
