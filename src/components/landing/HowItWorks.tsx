'use client';

import React from 'react';
import Link from 'next/link';
import { GitFork, ShieldCheck, CheckSquare, ArrowRight } from 'lucide-react';
import styles from './HowItWorks.module.css';

export function HowItWorks() {
  const steps = [
    {
      icon: <GitFork size={22} style={{ color: 'var(--color-brand-600)' }} />,
      iconBg: 'var(--color-brand-50)',
      tag: '01. Interactive Graph',
      title: 'Dependency-Aware Roadmaps',
      description:
        'Government portals never tell you what order to do things in. Our visual DAG graph clearly maps prerequisites and unlocks downstream steps as you complete them.',
      linkText: 'Explore Company Setup Roadmap',
      href: '/roadmap/pvt-ltd-delhi',
    },
    {
      icon: <ShieldCheck size={22} style={{ color: 'var(--color-success-600)' }} />,
      iconBg: 'var(--color-success-50)',
      tag: '02. Official Citations',
      title: 'Grounded in Official Portals',
      description:
        'No hallucinations, outdated forum advice, or broker rumors. Every step includes direct citations and clickable links to official departments (.gov.in / .nic.in).',
      linkText: 'Inspect Verified Sources',
      href: '/roadmap/driving-license-delhi',
    },
    {
      icon: <CheckSquare size={22} style={{ color: '#7c3aed' }} />,
      iconBg: '#f5f3ff',
      tag: '03. Local Tracking',
      title: 'Document & Step Checklists',
      description:
        'Track paperwork readiness with interactive document checklists. Save your progress locally without creating an account or giving up personal information.',
      linkText: 'Try Checklist Tracker',
      href: '/roadmap/fssai-food-license',
    },
  ];

  return (
    <section className={styles.section} aria-labelledby="how-it-works-title">
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTag}>Why UntangleAI</span>
        <h2 id="how-it-works-title" className={styles.sectionTitle}>
          Navigating bureaucracy should not require a middleman
        </h2>
        <p className={styles.sectionDesc}>
          Most citizens get stuck because of hidden prerequisites, ambiguous fees, and missing documents.
          UntangleAI solves each point with visual clarity.
        </p>
      </div>

      <div className={styles.grid}>
        {steps.map((s, idx) => (
          <div key={idx} className={styles.featureCard}>
            <div className={styles.iconBox} style={{ backgroundColor: s.iconBg }}>
              {s.icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
              {s.tag}
            </span>
            <h3 className={styles.cardTitle}>{s.title}</h3>
            <p className={styles.cardText}>{s.description}</p>
            <Link href={s.href} className={styles.cardFooter}>
              <span>{s.linkText}</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
