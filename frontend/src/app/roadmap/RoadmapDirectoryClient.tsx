'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LucideIcon,
  BookOpen,
  Search,
  X,
  Layers,
  Clock,
  CreditCard,
  MapPin,
  ExternalLink,
  ArrowRight,
  Compass,
  Briefcase,
  Home,
  FileText,
  Users,
  Landmark,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import { CivicProcess } from '@/types/roadmap';
import { useLanguage } from '@/context/LanguageContext';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { getRecentRoadmapSessions, SavedRoadmapSession } from '@/lib/storage';
import styles from './RoadmapDirectory.module.css';

interface CategoryOption {
  key: string;
  label: string;
  categoryMatch?: string;
  icon: LucideIcon;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'all', label: 'All Roadmaps', icon: BookOpen },
  { key: 'business', label: 'Business & Commercial', categoryMatch: 'Business & Commercial', icon: Briefcase },
  { key: 'transport', label: 'Transport & Licenses', categoryMatch: 'Transport & Licenses', icon: FileText },
  { key: 'licenses', label: 'Licenses & Regulatory', categoryMatch: 'Licenses & Regulatory', icon: ShieldCheck },
  { key: 'property', label: 'Property & Land', categoryMatch: 'Property & Land', icon: Home },
  { key: 'welfare', label: 'Social Welfare', categoryMatch: 'Social Welfare & Benefits', icon: Users },
  { key: 'tax', label: 'Tax & Finance', categoryMatch: 'Tax & Finance', icon: Landmark },
  { key: 'education', label: 'Education', categoryMatch: 'Education & Scholarships', icon: GraduationCap },
];

export default function RoadmapDirectoryClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang, setLang, t, getLocalizedRoadmap } = useLanguage();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const catParam = searchParams?.get('category')?.toLowerCase();
    if (catParam) {
      const match = CATEGORIES.find(
        (c) => c.key === catParam || c.label.toLowerCase().includes(catParam)
      );
      if (match) return match.key;
    }
    return 'all';
  });
  const [recentSessions, setRecentSessions] = useState<Record<string, SavedRoadmapSession>>({});

  // Synchronize theme with local storage & document attribute
  useEffect(() => {
    const savedTheme = localStorage.getItem('untangle_theme') as 'light' | 'dark' | null;
    const initialTheme =
      savedTheme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('untangle_theme', next);
      } catch {
        // Storage unavailable
      }
      return next;
    });
  }, []);

  // Load progress tracking info for each roadmap
  useEffect(() => {
    try {
      const recents = getRecentRoadmapSessions();
      const map: Record<string, SavedRoadmapSession> = {};
      recents.forEach((s) => {
        map[s.id] = s;
      });
      setRecentSessions(map);
    } catch {
      // Storage unavailable
    }
  }, []);

  // Sync category param if URL changes
  useEffect(() => {
    const catParam = searchParams?.get('category')?.toLowerCase();
    if (catParam) {
      const match = CATEGORIES.find(
        (c) => c.key === catParam || c.label.toLowerCase().includes(catParam)
      );
      if (match) {
        setSelectedCategory(match.key);
      }
    }
  }, [searchParams]);

  // Localized roadmaps list
  const localizedRoadmaps = useMemo(() => {
    return MOCK_ROADMAPS.map((r) => getLocalizedRoadmap(r));
  }, [getLocalizedRoadmap]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: localizedRoadmaps.length };
    CATEGORIES.forEach((cat) => {
      if (cat.key === 'all') return;
      counts[cat.key] = localizedRoadmaps.filter(
        (r) => r.category.toLowerCase() === cat.categoryMatch?.toLowerCase()
      ).length;
    });
    return counts;
  }, [localizedRoadmaps]);

  // Filtered roadmaps
  const filteredRoadmaps = useMemo(() => {
    let result = localizedRoadmaps;

    // Filter by category
    if (selectedCategory !== 'all') {
      const categoryObj = CATEGORIES.find((c) => c.key === selectedCategory);
      if (categoryObj && categoryObj.categoryMatch) {
        result = result.filter(
          (r) => r.category.toLowerCase() === categoryObj.categoryMatch?.toLowerCase()
        );
      }
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => {
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.steps.some((step) => step.title.toLowerCase().includes(q) || step.shortTitle?.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [localizedRoadmaps, selectedCategory, searchQuery]);

  const handleSelectCategory = (catKey: string) => {
    setSelectedCategory(catKey);
    const newParams = new URLSearchParams(window.location.search);
    if (catKey === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catKey);
    }
    const queryStr = newParams.toString();
    router.replace(queryStr ? `/roadmap?${queryStr}` : '/roadmap', { scroll: false });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    handleSelectCategory('all');
  };

  const getPortalDomain = (url: string) => {
    try {
      const host = new URL(url).hostname;
      return host.replace(/^www\./, '');
    } catch {
      return 'Official portal';
    }
  };

  return (
    <div className={styles.pageContainer}>
      <LandingNav
        theme={theme}
        onToggleTheme={toggleTheme}
        selectedLang={lang}
        onSelectLang={setLang}
      />

      <main className={styles.mainContent} id="main-content">
        {/* Header Hero Section */}
        <section className={styles.heroSection} aria-label="Roadmap directory banner">
          <div className={styles.heroInner}>
            <div className={styles.badgePill}>
              <BookOpen size={14} aria-hidden="true" />
              <span>Verified Government Procedures</span>
            </div>

            <h1 className={styles.pageTitle}>
              {t.heroStats?.exploreTitle || 'Browse Guided Roadmaps'}
            </h1>

            {/* Search Bar */}
            <div className={styles.searchContainer}>
              <Search size={18} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by keyword, procedure name, authority, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search guided roadmaps"
                id="roadmap-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className={styles.filterPillsContainer} role="tablist" aria-label="Process categories">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.key;
                const count = categoryCounts[cat.key] ?? 0;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ''}`}
                    onClick={() => handleSelectCategory(cat.key)}
                    id={`cat-filter-${cat.key}`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span>{cat.label}</span>
                    <span className={styles.categoryCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Catalog Body */}
        <section className={styles.catalogSection} aria-label="Available roadmaps catalog">
          <div className={styles.catalogToolbar}>
            <span className={styles.resultsCount}>
              Showing {filteredRoadmaps.length} of {localizedRoadmaps.length} guided roadmaps
            </span>
          </div>

          {filteredRoadmaps.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Compass size={28} aria-hidden="true" />
              </div>
              <h2 className={styles.emptyTitle}>No matching roadmaps found</h2>
              <p className={styles.emptyDescription}>
                We could not find any roadmaps matching &ldquo;{searchQuery}&rdquo;. Try another keyword
                or view roadmaps across all categories.
              </p>
              <button
                type="button"
                className={styles.resetButton}
                onClick={handleResetFilters}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className={styles.roadmapsGrid}>
              {filteredRoadmaps.map((process) => {
                const savedSession = recentSessions[process.id];
                const hasProgress = savedSession && savedSession.completedCount > 0;

                return (
                  <Link
                    key={process.id}
                    href={`/roadmap/${process.id}`}
                    className={styles.roadmapCard}
                    id={`roadmap-card-${process.id}`}
                  >
                    <div className={styles.cardMetaRow}>
                      <span className={styles.cardCategory}>
                        {process.category}
                      </span>
                      <span className={styles.cardLocation}>
                        <MapPin size={12} aria-hidden="true" />
                        <span>{process.location}</span>
                      </span>
                    </div>

                    <h2 className={styles.cardTitle}>{process.title}</h2>
                    <p className={styles.cardDescription}>{process.description}</p>

                    {hasProgress && (
                      <div className={styles.progressIndicator}>
                        <CheckCircle2 size={13} aria-hidden="true" />
                        <span>
                          {savedSession.completedCount}/{process.steps.length} steps completed
                        </span>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={styles.progressBarFill}
                            style={{
                              width: `${Math.round(
                                (savedSession.completedCount / process.steps.length) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className={styles.cardMetrics}>
                      <div className={styles.metricChip} title="Number of sequential action steps">
                        <Layers size={12} aria-hidden="true" />
                        <span>{process.steps.length} Steps</span>
                      </div>
                      {process.estimatedTotalTime && (
                        <div className={styles.metricChip} title="Estimated total processing time">
                          <Clock size={12} aria-hidden="true" />
                          <span>{process.estimatedTotalTime}</span>
                        </div>
                      )}
                      {process.estimatedTotalCost && (
                        <div className={styles.metricChip} title="Estimated statutory government fee">
                          <CreditCard size={12} aria-hidden="true" />
                          <span>{process.estimatedTotalCost}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardPortal} title={`Official website: ${process.officialPortal}`}>
                        <ExternalLink size={12} aria-hidden="true" />
                        <span>{getPortalDomain(process.officialPortal)}</span>
                      </span>

                      <span className={styles.cardAction}>
                        <span>{hasProgress ? 'Resume Roadmap' : 'Open Roadmap'}</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
