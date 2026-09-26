'use client';

import React from 'react';
import Link from 'next/link';
import {
  GitFork,
  MapPin,
  Clock,
  IndianRupee,
  Share2,
  RotateCcw,
  Sun,
  Moon,
  ChevronDown,
  Network,
  ListOrdered,
  Search,
} from 'lucide-react';
import { CivicProcess } from '@/types/roadmap';
import styles from './RoadmapHeader.module.css';

interface RoadmapHeaderProps {
  currentProcess: CivicProcess;
  allProcesses: CivicProcess[];
  onSelectProcess: (processId: string) => void;
  viewMode: 'graph' | 'list';
  onToggleViewMode: (mode: 'graph' | 'list') => void;
  progressPercent: number;
  completedCount: number;
  totalSteps: number;
  onResetProgress: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function RoadmapHeader({
  currentProcess,
  allProcesses,
  onSelectProcess,
  viewMode,
  onToggleViewMode,
  progressPercent,
  completedCount,
  totalSteps,
  onResetProgress,
  theme,
  onToggleTheme,
}: RoadmapHeaderProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `UntangleAI — ${currentProcess.title}`,
          text: `Interactive roadmap for ${currentProcess.title} (${currentProcess.location})`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Roadmap link copied to clipboard!');
    }
  };

  return (
    <header className={styles.headerContainer} role="banner">
      <div className={styles.topRow}>
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.logoBadge} title="Back to UntangleAI Search">
            <div className={styles.logoIcon}>
              <GitFork size={18} strokeWidth={2.5} />
            </div>
            <span className={styles.logoText}>
              Untangle<span className={styles.logoTag}>AI</span>
            </span>
          </Link>

          <Link href="/" className={styles.toggleButton} title="New Civic Search" id="nav-search-btn">
            <Search size={14} />
            <span>Search</span>
          </Link>

          <div className={styles.processSelectorWrapper}>
            <select
              className={styles.processSelect}
              value={currentProcess.id}
              onChange={(e) => onSelectProcess(e.target.value)}
              aria-label="Select Civic Process Roadmap"
              id="roadmap-process-select"
            >
              {allProcesses.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.location})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className={styles.selectCaret} />
          </div>
        </div>

        <div className={styles.actionsGroup}>
          <div className={styles.viewToggleGroup} role="group" aria-label="View format toggle">
            <button
              type="button"
              className={`${styles.toggleButton} ${viewMode === 'graph' ? styles.toggleActive : ''}`}
              onClick={() => onToggleViewMode('graph')}
              id="view-toggle-graph"
              title="Interactive Graph View"
            >
              <Network size={14} />
              <span>Canvas</span>
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${viewMode === 'list' ? styles.toggleActive : ''}`}
              onClick={() => onToggleViewMode('list')}
              id="view-toggle-list"
              title="Sequential Step List View"
            >
              <ListOrdered size={14} />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            className={styles.iconButton}
            onClick={handleShare}
            title="Share this roadmap"
            id="share-roadmap-btn"
            aria-label="Share this roadmap"
          >
            <Share2 size={16} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onResetProgress}
            title="Reset completed checklist"
            id="reset-progress-btn"
            aria-label="Reset completed checklist"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            id="theme-toggle-btn"
            aria-label="Toggle dark/light theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.metaPills}>
          <span className={styles.pill}>
            <MapPin size={12} style={{ color: 'var(--color-brand-500)' }} />
            {currentProcess.location}
          </span>
          <span className={styles.pill}>
            <Clock size={12} style={{ color: 'var(--color-info-500)' }} />
            {currentProcess.estimatedTotalTime}
          </span>
          <span className={styles.pill}>
            <IndianRupee size={12} style={{ color: 'var(--color-success-500)' }} />
            {currentProcess.estimatedTotalCost}
          </span>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {completedCount}/{totalSteps} steps ({progressPercent}%)
          </span>
        </div>
      </div>
    </header>
  );
}
