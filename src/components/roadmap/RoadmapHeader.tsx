'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  GitFork,
  MapPin,
  Clock,
  IndianRupee,
  Share2,
  Check,
  RotateCcw,
  Sun,
  Moon,
  ChevronDown,
  Network,
  ListOrdered,
  Search,
  Globe,
} from 'lucide-react';
import { CivicProcess } from '@/types/roadmap';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageCode } from '@/lib/translations';
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
  const { lang, setLang, t, languages } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const currentLangObj = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `UntangleAI — ${currentProcess.title}`,
          text: `Interactive roadmap for ${currentProcess.title} (${currentProcess.location})`,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled share
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleSelectLang = (code: LanguageCode) => {
    setLang(code);
    setIsLangOpen(false);
  };

  return (
    <header className={styles.headerContainer} role="banner">
      <div className={styles.topRow}>
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.logoBadge} title={t.roadmap.backToSearch}>
            <div className={styles.logoIcon}>
              <GitFork size={18} strokeWidth={2.5} />
            </div>
            <span className={styles.logoText}>
              Untangle<span className={styles.logoTag}>AI</span>
            </span>
          </Link>

          <Link href="/" className={styles.toggleButton} title={t.roadmap.backToSearch} id="nav-search-btn">
            <Search size={14} />
            <span>{t.roadmap.search}</span>
          </Link>

          <div className={styles.processSelectorWrapper}>
            <select
              className={styles.processSelect}
              value={currentProcess.id}
              onChange={(e) => onSelectProcess(e.target.value)}
              aria-label={t.roadmap.selectRoadmap}
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
          {/* Language selector in Roadmap Header */}
          <div className={styles.langWrapper} ref={langMenuRef}>
            <button
              type="button"
              className={styles.langBtn}
              onClick={() => setIsLangOpen((prev) => !prev)}
              aria-label={t.nav.selectLanguage}
              aria-expanded={isLangOpen}
              id="roadmap-lang-btn"
            >
              <Globe size={14} />
              <span>{currentLangObj.native}</span>
              <ChevronDown size={12} className={`${styles.caret} ${isLangOpen ? styles.caretOpen : ''}`} />
            </button>

            {isLangOpen && (
              <div className={styles.langDropdown} role="menu">
                <div className={styles.dropdownHeader}>{t.nav.selectLanguage}</div>
                {languages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    role="menuitem"
                    className={`${styles.langOption} ${lang === item.code ? styles.langOptionActive : ''}`}
                    onClick={() => handleSelectLang(item.code)}
                  >
                    <span className={styles.langNative}>{item.native}</span>
                    <span className={styles.langEnglish}>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.viewToggleGroup} role="group" aria-label="View format toggle">
            <button
              type="button"
              className={`${styles.toggleButton} ${viewMode === 'graph' ? styles.toggleActive : ''}`}
              onClick={() => onToggleViewMode('graph')}
              id="view-toggle-graph"
              title={t.roadmap.canvas}
            >
              <Network size={14} />
              <span>{t.roadmap.canvas}</span>
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${viewMode === 'list' ? styles.toggleActive : ''}`}
              onClick={() => onToggleViewMode('list')}
              id="view-toggle-list"
              title={t.roadmap.list}
            >
              <ListOrdered size={14} />
              <span>{t.roadmap.list}</span>
            </button>
          </div>

          <div className={styles.shareWrapper}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleShare}
              title={isCopied ? t.roadmap.shareSuccess : t.roadmap.shareRoadmap}
              id="share-roadmap-btn"
              aria-label={t.roadmap.shareRoadmap}
            >
              {isCopied ? <Check size={16} style={{ color: 'var(--color-success-600)' }} /> : <Share2 size={16} />}
            </button>
            {isCopied && (
              <div className={styles.copyToast} role="status">
                {t.roadmap.shareSuccess}
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onResetProgress}
            title={t.roadmap.resetProgress}
            id="reset-progress-btn"
            aria-label={t.roadmap.resetProgress}
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onToggleTheme}
            title={t.roadmap.toggleTheme}
            id="theme-toggle-btn"
            aria-label={t.roadmap.toggleTheme}
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
            <span>{currentProcess.estimatedTotalTime}</span>
          </span>
          <span className={styles.pill}>
            <IndianRupee size={12} style={{ color: 'var(--color-success-500)' }} />
            <span>{currentProcess.estimatedTotalCost}</span>
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
            {completedCount}/{totalSteps} {t.roadmap.stepsProgress} ({progressPercent}%)
          </span>
        </div>
      </div>
    </header>
  );
}
