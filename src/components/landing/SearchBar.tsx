'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown, ArrowRight, Clock } from 'lucide-react';
import { SearchResult } from '@/app/api/v1/search/route';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  initialQuery?: string;
  initialLocation?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  initialQuery = '',
  initialLocation = 'all',
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch instant matches as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`
        );
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, location]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectResult = (resultId: string) => {
    setIsOpen(false);
    router.push(`/roadmap/${resultId}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      const selected = activeIndex >= 0 ? results[activeIndex] : results[0];
      handleSelectResult(selected.id);
    } else if (query.trim()) {
      // Default to the first available roadmap if query is typed
      router.push(`/roadmap/pvt-ltd-delhi?query=${encodeURIComponent(query)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelectResult(results[activeIndex].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.searchWrapper} ref={wrapperRef}>
      <form className={styles.searchCard} onSubmit={handleSubmit} role="search">
        <div className={styles.inputGroup}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.textInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim() && results.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Register a private company, get driving license, food permit..."
            autoFocus={autoFocus}
            id="civic-query-input"
            aria-label="Civic task search input"
            aria-autocomplete="list"
            aria-controls="search-results-list"
          />
        </div>

        <div className={styles.divider} />

        <div className={styles.locationGroup}>
          <MapPin size={16} className={styles.locationIcon} />
          <select
            className={styles.locationSelect}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            id="location-filter-select"
            aria-label="Filter by State or Territory"
          >
            <option value="all">All India / Central</option>
            <option value="delhi">Delhi NCR</option>
            <option value="maharashtra">Maharashtra</option>
            <option value="karnataka">Karnataka</option>
            <option value="tamil nadu">Tamil Nadu</option>
          </select>
          <ChevronDown size={14} className={styles.locationCaret} />
        </div>

        <button type="submit" className={styles.submitButton} id="submit-search-btn">
          <span>Untangle</span>
          <ArrowRight size={16} />
        </button>
      </form>

      {isOpen && (
        <div className={styles.dropdown} id="search-results-list" role="listbox">
          <div className={styles.dropdownHeader}>
            <span>Verified Civic Roadmaps ({results.length})</span>
          </div>

          {results.length > 0 ? (
            results.map((item, idx) => (
              <div
                key={item.id}
                className={`${styles.dropdownItem} ${idx === activeIndex ? styles.active : ''}`}
                onClick={() => handleSelectResult(item.id)}
                role="option"
                aria-selected={idx === activeIndex}
                id={`search-option-${item.id}`}
              >
                <div className={styles.itemMain}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemDesc}>{item.description}</span>
                </div>

                <div className={styles.itemMeta}>
                  <span className={styles.itemBadge}>
                    <MapPin size={10} style={{ display: 'inline', marginRight: 2 }} />
                    {item.location}
                  </span>
                  <span className={styles.itemBadge}>
                    <Clock size={10} style={{ display: 'inline', marginRight: 2 }} />
                    {item.stepCount} steps
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Sparkles size={16} style={{ color: 'var(--color-brand-500)' }} />
                <strong>Synthesizing Custom Roadmap</strong>
              </div>
              <span>No pre-cached template for "{query}". Press Enter to generate a tailored roadmap.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
