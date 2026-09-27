'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLastVisitedSession } from '@/lib/storage';

export default function RoadmapIndexPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const lastSession = getLastVisitedSession();
      if (lastSession && lastSession.id) {
        const targetUrl = lastSession.urlPath || `/roadmap/${lastSession.id}`;
        router.replace(targetUrl);
        return;
      }
    } catch {
      // Fallback if storage not available
    }

    router.replace('/roadmap/pvt-ltd-delhi');
  }, [router]);

  return (
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
      <span>Loading your roadmap...</span>
    </div>
  );
}
