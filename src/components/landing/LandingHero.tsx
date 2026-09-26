'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { PopularTasks } from './PopularTasks';
import styles from './LandingHero.module.css';

export function LandingHero() {
  return (
    <section className={styles.heroSection} aria-label="Hero search section">
      <div className={styles.trustPill}>
        <ShieldCheck size={14} style={{ color: 'var(--color-success-500)' }} />
        <span>Grounded in Official Indian Portals (.gov.in & .nic.in)</span>
      </div>

      <h1 className={styles.headline}>
        Turn confusing government processes into{' '}
        <span className={styles.headlineGradient}>clear, interactive roadmaps.</span>
      </h1>

      <p className={styles.subheadline}>
        Untangle prerequisites, mandatory documents, official fees, and timelines.
        Navigate bureaucratic procedures step-by-step with zero guesswork.
      </p>

      <div className={styles.searchContainer}>
        <SearchBar autoFocus={true} />
        <PopularTasks />
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricItem}>
          <span className={styles.metricNumber}>100%</span>
          <span className={styles.metricLabel}>Direct Portal Citations</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricNumber}>Zero</span>
          <span className={styles.metricLabel}>Intermediary Fees</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricNumber}>Instant</span>
          <span className={styles.metricLabel}>Dependency DAG Graph</span>
        </div>
      </div>
    </section>
  );
}
