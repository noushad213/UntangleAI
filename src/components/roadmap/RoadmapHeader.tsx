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
  User,
  Zap,
  SlidersHorizontal,
  Info,
  FolderCheck,
} from 'lucide-react';
import { CivicProcess } from '@/types/roadmap';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageCode } from '@/lib/translations';
import {
  RoadmapFilters,
  INDIAN_LOCATIONS,
  APPLICANT_PROFILES,
  SERVICE_MODES,
} from '@/lib/roadmap-adapters';
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
  filters?: RoadmapFilters;
  onUpdateFilters?: (updates: Partial<RoadmapFilters>) => void;
  appliedContexts?: string[];
  isAdapting?: boolean;
  isTrackingActive?: boolean;
  onStartTracking?: () => void;
  documentsCount?: number;
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
  filters,
  onUpdateFilters,
  appliedContexts,
  isAdapting,
  isTrackingActive,
  onStartTracking,
  documentsCount,
}: RoadmapHeaderProps) {
  const { lang, setLang, t, languages } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'location' | 'profile' | 'mode' | 'contexts' | null>(null);
  const [locationSearch, setLocationSearch] = useState('');

  const langMenuRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  const currentLangObj = languages.find((l) => l.code === lang) || languages[0];

  const activeFilters: RoadmapFilters = filters || {
    location: 'delhi',
    applicantProfile: 'individual',
    serviceMode: 'online',
  };

  const selectedLocation =
    INDIAN_LOCATIONS.find((l) => l.id === activeFilters.location) ||
    INDIAN_LOCATIONS.find((l) => l.name.toLowerCase() === currentProcess.location.toLowerCase()) ||
    INDIAN_LOCATIONS[0];

  const selectedProfile =
    APPLICANT_PROFILES.find((p) => p.id === activeFilters.applicantProfile) ||
    APPLICANT_PROFILES[0];

  const selectedMode =
    SERVICE_MODES.find((m) => m.id === activeFilters.serviceMode) ||
    SERVICE_MODES[0];

  const filteredLocations = INDIAN_LOCATIONS.filter(
    (l) =>
      l.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      l.stateCode.toLowerCase().includes(locationSearch.toLowerCase()) ||
      (l.rtoCode && l.rtoCode.toLowerCase().includes(locationSearch.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setActiveFilter(null);
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
              {allProcesses.map((p) => {
                const isCurrent = p.id === currentProcess.id;
                const cleanBaseTitle = p.title.replace(/\s*\([^)]*\)\s*$/, '');
                const displayTitle = isCurrent
                  ? currentProcess.title
                  : p.location
                  ? `${cleanBaseTitle} (${p.location})`
                  : p.title;
                return (
                  <option key={p.id} value={p.id}>
                    {displayTitle}
                  </option>
                );
              })}
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

          {onStartTracking && (
            <button
              type="button"
              className={`${styles.trackProgressBtn} ${isTrackingActive ? styles.trackProgressBtnActive : ''}`}
              onClick={onStartTracking}
              id="track-progress-btn"
              title="Track progress, upload documents, and manage application vault"
            >
              <FolderCheck size={14} />
              <span>{isTrackingActive ? `Vault (${documentsCount || 0} Docs)` : 'Track Your Progress'}</span>
            </button>
          )}

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
        <div className={styles.metaPills} ref={filterContainerRef}>
          {/* Location Filter */}
          <div className={styles.filterWrapper}>
            <button
              type="button"
              className={`${styles.filterPillBtn} ${activeFilter === 'location' ? styles.filterPillBtnActive : ''}`}
              onClick={() => {
                setActiveFilter((prev) => (prev === 'location' ? null : 'location'));
                setLocationSearch('');
              }}
              id="filter-location-btn"
              aria-label="Filter by state or city"
              aria-expanded={activeFilter === 'location'}
            >
              <MapPin size={12} className={styles.filterIcon} style={{ color: 'var(--color-brand-500)' }} />
              <span>{selectedLocation.name}</span>
              <ChevronDown size={11} className={`${styles.filterChevron} ${activeFilter === 'location' ? styles.filterChevronOpen : ''}`} />
            </button>

            {activeFilter === 'location' && (
              <div className={styles.filterDropdown} role="menu">
                <div className={styles.filterDropdownHeader}>Select State / Jurisdiction</div>
                <input
                  type="text"
                  className={styles.filterSearchInput}
                  placeholder="Search state, city, or RTO..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  autoFocus
                />
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    className={`${styles.filterOptionItem} ${activeFilters.location === loc.id ? styles.filterOptionItemActive : ''}`}
                    onClick={() => {
                      onUpdateFilters?.({ location: loc.id });
                      setActiveFilter(null);
                    }}
                  >
                    <div className={styles.filterOptionContent}>
                      <span className={styles.filterOptionTitle}>{loc.name}</span>
                      {loc.rtoCode && <span className={styles.filterOptionSub}>RTO: {loc.rtoCode}</span>}
                    </div>
                    {activeFilters.location === loc.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Applicant Profile Filter */}
          <div className={styles.filterWrapper}>
            <button
              type="button"
              className={`${styles.filterPillBtn} ${activeFilter === 'profile' ? styles.filterPillBtnActive : ''}`}
              onClick={() => setActiveFilter((prev) => (prev === 'profile' ? null : 'profile'))}
              id="filter-profile-btn"
              aria-label="Filter by applicant profile"
              aria-expanded={activeFilter === 'profile'}
            >
              <User size={12} className={styles.filterIcon} style={{ color: 'var(--color-brand-600)' }} />
              <span>{selectedProfile.name}</span>
              <ChevronDown size={11} className={`${styles.filterChevron} ${activeFilter === 'profile' ? styles.filterChevronOpen : ''}`} />
            </button>

            {activeFilter === 'profile' && (
              <div className={styles.filterDropdown} role="menu">
                <div className={styles.filterDropdownHeader}>Applicant Profile</div>
                {APPLICANT_PROFILES.map((prof) => (
                  <button
                    key={prof.id}
                    type="button"
                    className={`${styles.filterOptionItem} ${activeFilters.applicantProfile === prof.id ? styles.filterOptionItemActive : ''}`}
                    onClick={() => {
                      onUpdateFilters?.({ applicantProfile: prof.id });
                      setActiveFilter(null);
                    }}
                  >
                    <div className={styles.filterOptionContent}>
                      <span className={styles.filterOptionTitle}>{prof.name}</span>
                      <span className={styles.filterOptionSub}>{prof.description}</span>
                    </div>
                    {activeFilters.applicantProfile === prof.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service Delivery Mode Filter */}
          <div className={styles.filterWrapper}>
            <button
              type="button"
              className={`${styles.filterPillBtn} ${activeFilter === 'mode' ? styles.filterPillBtnActive : ''}`}
              onClick={() => setActiveFilter((prev) => (prev === 'mode' ? null : 'mode'))}
              id="filter-mode-btn"
              aria-label="Filter by service mode"
              aria-expanded={activeFilter === 'mode'}
            >
              <Zap size={12} className={styles.filterIcon} style={{ color: 'var(--color-warning-500)' }} />
              <span>
                {selectedMode.name.includes('Online')
                  ? 'Online Faceless'
                  : selectedMode.name.includes('Assisted')
                  ? 'Assisted (CSC)'
                  : 'In-Person'}
              </span>
              <ChevronDown size={11} className={`${styles.filterChevron} ${activeFilter === 'mode' ? styles.filterChevronOpen : ''}`} />
            </button>

            {activeFilter === 'mode' && (
              <div className={styles.filterDropdown} role="menu">
                <div className={styles.filterDropdownHeader}>Service Delivery Mode</div>
                {SERVICE_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`${styles.filterOptionItem} ${activeFilters.serviceMode === mode.id ? styles.filterOptionItemActive : ''}`}
                    onClick={() => {
                      onUpdateFilters?.({ serviceMode: mode.id });
                      setActiveFilter(null);
                    }}
                  >
                    <div className={styles.filterOptionContent}>
                      <span className={styles.filterOptionTitle}>{mode.name}</span>
                      <span className={styles.filterOptionSub}>{mode.description}</span>
                    </div>
                    {activeFilters.serviceMode === mode.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contextual Adaptations Pill & Popover */}
          {appliedContexts && appliedContexts.length > 0 && (
            <div className={styles.filterWrapper}>
              <button
                type="button"
                className={styles.contextBadge}
                onClick={() => setActiveFilter((prev) => (prev === 'contexts' ? null : 'contexts'))}
                title="Click to inspect state rules and AI adaptations"
                id="context-rules-badge"
              >
                <SlidersHorizontal size={11} />
                <span>{appliedContexts.length} Rules Active</span>
              </button>

              {activeFilter === 'contexts' && (
                <div className={styles.contextPopover} role="dialog" aria-label="Applied Adaptations">
                  <div className={styles.contextPopoverTitle}>
                    <Info size={13} style={{ color: 'var(--color-brand-500)' }} />
                    <span>Applied Context Rules</span>
                  </div>
                  <ul className={styles.contextList}>
                    {appliedContexts.map((ctx, idx) => (
                      <li key={idx}>{ctx}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Dynamic estimated time & cost */}
          <span className={styles.pill}>
            <Clock size={12} style={{ color: 'var(--color-info-500)' }} />
            <span>{currentProcess.estimatedTotalTime}</span>
          </span>
          <span className={styles.pill}>
            <IndianRupee size={12} style={{ color: 'var(--color-success-500)' }} />
            <span>{currentProcess.estimatedTotalCost}</span>
          </span>
        </div>

        <div
          className={styles.progressSection}
          onClick={onStartTracking}
          title="Click to track progress and manage document vault"
          style={{ cursor: onStartTracking ? 'pointer' : 'default' }}
          role={onStartTracking ? 'button' : undefined}
          tabIndex={onStartTracking ? 0 : undefined}
        >
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
