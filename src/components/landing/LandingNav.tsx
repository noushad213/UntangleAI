'use client';

import React from 'react';
import Link from 'next/link';
import { GitFork, Network, Moon, Sun } from 'lucide-react';
import styles from './LandingNav.module.css';

interface LandingNavProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function LandingNav({ theme, onToggleTheme }: LandingNavProps) {
  return (
    <nav className={styles.navContainer} role="navigation" aria-label="Main Navigation">
      <Link href="/" className={styles.brandGroup}>
        <div className={styles.logoIcon}>
          <GitFork size={18} strokeWidth={2.5} />
        </div>
        <span className={styles.logoText}>
          Untangle<span className={styles.logoTag}>AI</span>
        </span>
      </Link>

      <div className={styles.navLinks}>
        <Link href="/roadmap/pvt-ltd-delhi" className={styles.navLink}>
          Featured Roadmap
        </Link>
        <Link href="#how-it-works-title" className={styles.navLink}>
          How It Works
        </Link>
        <a
          href="https://www.india.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
        >
          National Portal of India ↗
        </a>
      </div>

      <div className={styles.rightGroup}>
        <button
          type="button"
          className={styles.themeBtn}
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          id="landing-theme-toggle-btn"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <Link href="/roadmap/pvt-ltd-delhi" className={styles.ctaBtn} id="landing-open-canvas-btn">
          <Network size={14} />
          <span>Open Canvas</span>
        </Link>
      </div>
    </nav>
  );
}
