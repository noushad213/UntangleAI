'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  HardDrive,
  Bookmark,
  Files,
  MoreHorizontal,
} from 'lucide-react';
import { CivicProcess } from '@/types/roadmap';
import { useLanguage } from '@/context/LanguageContext';
import { usePersistentSession } from '@/hooks/usePersistentSession';
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
  onStartTracking?: () => void;
  onOpenDocuments: () => void;
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
  onStartTracking,
  onOpenDocuments,
}: RoadmapHeaderProps) {
  const { lang, setLang, t, languages } = useLanguage();
  const { recentRoadmaps } = usePersistentSession();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'location' | 'profile' | 'mode' | 'contexts' | null>(null);
  const [locationSearch, setLocationSearch] = useState('');

  const langMenuRef = useRef<HTMLDivElement>(null);
  const recentMenuRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const [recentAlign, setRecentAlign] = useState<'left' | 'right'>('left');
  const [filterAlign, setFilterAlign] = useState<'left' | 'right'>('left');

  const currentLangObj = languages.find((l) => l.code === lang) || languages[0];

  const recentMap = useMemo(() => {
    const map = new Map<string, number>();
    recentRoadmaps.forEach((r) => {
      map.set(r.id, r.progressPercent);
    });
    return map;
  }, [recentRoadmaps]);

  const inProgressList = useMemo(() => {
    return recentRoadmaps.filter((r) => r.completedCount > 0 || r.id === currentProcess.id);
  }, [recentRoadmaps, currentProcess.id]);

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
      if (recentMenuRef.current && !recentMenuRef.current.contains(e.target as Node)) {
        setIsRecentOpen(false);
      }
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setActiveFilter(null);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleLang = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsLangOpen((prev) => !prev);
  };

  const handleToggleRecent = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (window.innerWidth - rect.left < 310) {
      setRecentAlign('right');
    } else {
      setRecentAlign('left');
    }
    setIsRecentOpen((prev) => !prev);
  };

  const handleToggleFilter = (
    filterKey: 'location' | 'profile' | 'mode' | 'contexts',
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (activeFilter === filterKey) {
      setActiveFilter(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (window.innerWidth - rect.left < 290) {
      setFilterAlign('right');
    } else {
      setFilterAlign('left');
    }
    setActiveFilter(filterKey);
    if (filterKey === 'location') setLocationSearch('');
  };

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
            <span className={styles.navSearchText}>{t.roadmap.search}</span>
          </Link>

          <div className={styles.processSelectorWrapper} title={currentProcess.title}>
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
                const baseTitle = isCurrent
                  ? currentProcess.title
                  : p.location
                  ? `${cleanBaseTitle} (${p.location})`
                  : p.title;

                const savedPercent = isCurrent ? progressPercent : (recentMap.get(p.id) || 0);
                const progressBadge = savedPercent > 0 ? ` • [${savedPercent}%]` : '';
                const displayTitle = `${baseTitle}${progressBadge}`;

                return (
                  <option key={p.id} value={p.id}>
                    {displayTitle}
                  </option>
                );
              })}
            </select>
            <ChevronDown size={14} className={styles.selectCaret} />
          </div>

          {inProgressList.length > 1 && (
            <div className={styles.recentDropdownWrapper} ref={recentMenuRef}>
              <button
                type="button"
                className={styles.recentRoadmapsBtn}
                onClick={handleToggleRecent}
                title="View all saved roadmaps you are tracking"
                aria-expanded={isRecentOpen}
                id="header-in-progress-schemes-btn"
              >
                <Bookmark size={13} />
                <span className={styles.recentBtnText}>Tracking</span>
                <span className={styles.recentBadgeCount}>{inProgressList.length}</span>
              </button>

              {isRecentOpen && (
                <div
                  className={`${styles.recentDropdown} ${recentAlign === 'right' ? styles.dropdownAlignRight : styles.dropdownAlignLeft}`}
                  role="menu"
                >
                  <div className={styles.recentDropdownHeader}>Schemes In Progress</div>
                  {inProgressList.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.recentItem} ${item.id === currentProcess.id ? styles.recentItemActive : ''}`}
                      onClick={() => {
                        onSelectProcess(item.id);
                        setIsRecentOpen(false);
                      }}
                    >
                      <div className={styles.recentItemInfo}>
                        <span className={styles.recentItemTitle}>{item.title}</span>
                        <span className={styles.recentItemSubtitle}>
                          {item.location} • Step: {item.lastActiveStepTitle || 'Started'}
                        </span>
                      </div>
                      <span className={styles.recentItemProgress}>{item.progressPercent}%</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.actionsGroup}>
          <div className={styles.viewToggleGroup} role="group" aria-label="View format toggle">
            <button
              type="button"
              className={`${styles.toggleButton} ${viewMode === 'graph' ? styles.toggleActive : ''}`}
              onClick={() => onToggleViewMode('graph')}
              id="view-toggle-graph"
              title={t.roadmap.canvas}
            >
              <Network size={14} />
              <span className={styles.viewToggleText}>{t.roadmap.canvas}</span>
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${viewMode === 'list' ? styles.toggleActive : ''}`}
              onClick={() => onToggleViewMode('list')}
              id="view-toggle-list"
              title={t.roadmap.list}
            >
              <ListOrdered size={14} />
              <span className={styles.viewToggleText}>{t.roadmap.list}</span>
            </button>
          </div>

          <button
            type="button"
            className={styles.documentsButton}
            onClick={onOpenDocuments}
            id="roadmap-documents-btn"
            aria-label="Open documents"
          >
            <Files size={15} />
            <span>Documents</span>
          </button>

          <div className={styles.moreWrapper} ref={moreMenuRef}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setIsMoreOpen((open) => !open)}
              id="roadmap-more-actions-btn"
              aria-label="More roadmap actions"
              aria-expanded={isMoreOpen}
            >
              <MoreHorizontal size={17} />
            </button>

            {isMoreOpen && (
              <div className={styles.utilityMenu} role="menu">
                <div className={styles.utilityStatus}>
                  <HardDrive size={13} />
                  <span>Progress and documents are saved on this device</span>
                </div>

                <div className={styles.utilityLanguage} ref={langMenuRef}>
                  <button
                    type="button"
                    className={styles.utilityMenuItem}
                    onClick={handleToggleLang}
                    aria-expanded={isLangOpen}
                    id="roadmap-lang-btn"
                  >
                    <Globe size={15} />
                    <span>Language</span>
                    <strong>{currentLangObj.native}</strong>
                  </button>
                  {isLangOpen && (
                    <div className={styles.utilityLanguageOptions} role="menu">
                      {languages.map((item) => (
                        <button
                          key={item.code}
                          type="button"
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

                <button
                  type="button"
                  className={styles.utilityMenuItem}
                  onClick={handleShare}
                  id="share-roadmap-btn"
                >
                  {isCopied ? <Check size={15} /> : <Share2 size={15} />}
                  <span>{isCopied ? t.roadmap.shareSuccess : t.roadmap.shareRoadmap}</span>
                </button>
                <button
                  type="button"
                  className={styles.utilityMenuItem}
                  onClick={onToggleTheme}
                  id="theme-toggle-btn"
                >
                  {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                  <span>{t.roadmap.toggleTheme}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.utilityMenuItem} ${styles.utilityMenuItemDanger}`}
                  onClick={() => {
                    onResetProgress();
                    setIsMoreOpen(false);
                  }}
                  id="reset-progress-btn"
                >
                  <RotateCcw size={15} />
                  <span>{t.roadmap.resetProgress}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.metaPills} ref={filterContainerRef}>
          {/* Location Filter */}
          <div className={styles.filterWrapper}>
            <button
              type="button"
              className={`${styles.filterPillBtn} ${activeFilter === 'location' ? styles.filterPillBtnActive : ''}`}
              onClick={(e) => handleToggleFilter('location', e)}
              id="filter-location-btn"
              aria-label="Filter by state or city"
              aria-expanded={activeFilter === 'location'}
            >
              <MapPin size={12} className={styles.filterIcon} style={{ color: 'var(--color-brand-500)' }} />
              <span>{selectedLocation.name}</span>
              <ChevronDown size={11} className={`${styles.filterChevron} ${activeFilter === 'location' ? styles.filterChevronOpen : ''}`} />
            </button>

            {activeFilter === 'location' && (
              <div
                className={`${styles.filterDropdown} ${filterAlign === 'right' ? styles.dropdownAlignRight : styles.dropdownAlignLeft}`}
                role="menu"
              >
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
              onClick={(e) => handleToggleFilter('profile', e)}
              id="filter-profile-btn"
              aria-label="Filter by applicant profile"
              aria-expanded={activeFilter === 'profile'}
            >
              <User size={12} className={styles.filterIcon} style={{ color: 'var(--color-brand-600)' }} />
              <span>{selectedProfile.name}</span>
              <ChevronDown size={11} className={`${styles.filterChevron} ${activeFilter === 'profile' ? styles.filterChevronOpen : ''}`} />
            </button>

            {activeFilter === 'profile' && (
              <div
                className={`${styles.filterDropdown} ${filterAlign === 'right' ? styles.dropdownAlignRight : styles.dropdownAlignLeft}`}
                role="menu"
              >
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
              onClick={(e) => handleToggleFilter('mode', e)}
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
              <div
                className={`${styles.filterDropdown} ${filterAlign === 'right' ? styles.dropdownAlignRight : styles.dropdownAlignLeft}`}
                role="menu"
              >
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
                onClick={(e) => handleToggleFilter('contexts', e)}
                title="Click to inspect state rules and AI adaptations"
                id="context-rules-badge"
              >
                <SlidersHorizontal size={11} />
                <span>{appliedContexts.length} Rules Active</span>
              </button>

              {activeFilter === 'contexts' && (
                <div
                  className={`${styles.contextPopover} ${filterAlign === 'right' ? styles.dropdownAlignRight : styles.dropdownAlignLeft}`}
                  role="dialog"
                  aria-label="Applied Adaptations"
                >
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

          {currentProcess.estimatedTotalTime !== 'See each step' && (
            <span className={styles.pill}>
              <Clock size={12} style={{ color: 'var(--color-info-500)' }} />
              <span>{currentProcess.estimatedTotalTime}</span>
            </span>
          )}
          {currentProcess.estimatedTotalCost !== 'See each step' && (
            <span className={styles.pill}>
              <IndianRupee size={12} style={{ color: 'var(--color-success-500)' }} />
              <span>{currentProcess.estimatedTotalCost}</span>
            </span>
          )}
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
