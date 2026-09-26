'use client';

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, X, ChevronRight } from 'lucide-react';
import { SearchResult } from '@/app/api/v1/search/route';
import styles from './HeroQueryInput.module.css';

export interface QueryExample {
  text: string;
  query: string;
  lang: string;
  targetRoadmap: string;
  isRtl?: boolean;
}

export const ALL_QUERY_EXAMPLES: QueryExample[] = [
  {
    text: 'i want to open a restaurant',
    query: 'i want to open a restaurant',
    lang: 'en',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'mujhe restaurant kholna hai',
    query: 'mujhe restaurant kholna hai',
    lang: 'hinglish',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'मुझे रेस्टोरेंट खोलना है',
    query: 'मुझे रेस्टोरेंट खोलना है',
    lang: 'hi',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'مجھے ریسٹورنٹ کھولنا ہے',
    query: 'مجھے ریسٹورنٹ کھولنا ہے',
    lang: 'ur',
    targetRoadmap: 'fssai-food-license',
    isRtl: true,
  },
  {
    text: 'புது உணவகம் தொடங்க வேண்டும்',
    query: 'புது உணவகம் தொடங்க வேண்டும்',
    lang: 'ta',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'আমি একটি নতুন রেস্তোরাঁ খুলতে চাই',
    query: 'আমি একটি নতুন রেস্তোরাঁ খুলতে চাই',
    lang: 'bn',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'driving license renew kaise karein',
    query: 'driving license renew kaise karein',
    lang: 'hinglish',
    targetRoadmap: 'driving-license-delhi',
  },
  {
    text: 'नया ड्राइविंग लाइसेंस कैसे बनवाएं',
    query: 'नया ड्राइविंग लाइसेंस कैसे बनवाएं',
    lang: 'hi',
    targetRoadmap: 'driving-license-delhi',
  },
  {
    text: 'نیا ڈرائیونگ لائسنس کیسے حاصل کریں',
    query: 'نیا ڈرائیونگ لائسنس کیسے حاصل کریں',
    lang: 'ur',
    targetRoadmap: 'driving-license-delhi',
    isRtl: true,
  },
  {
    text: 'pvt ltd company register karni hai',
    query: 'pvt ltd company register karni hai',
    lang: 'hinglish',
    targetRoadmap: 'pvt-ltd-delhi',
  },
  {
    text: 'प्राइवेट लिमिटेड कंपनी कैसे रजिस्टर करें',
    query: 'प्राइवेट लिमिटेड कंपनी कैसे रजिस्टर करें',
    lang: 'hi',
    targetRoadmap: 'pvt-ltd-delhi',
  },
  {
    text: 'پرائیویٹ لمیٹڈ کمپنی کیسے رجسٹر کریں',
    query: 'پرائیویٹ لمیٹڈ کمپنی کیسے رجسٹر کریں',
    lang: 'ur',
    targetRoadmap: 'pvt-ltd-delhi',
    isRtl: true,
  },
];

interface HeroQueryInputProps {
  selectedLang?: string;
}

export function HeroQueryInput({ selectedLang = 'auto' }: HeroQueryInputProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter examples according to selected language
  const examples = useMemo(() => {
    if (!selectedLang || selectedLang === 'auto') return ALL_QUERY_EXAMPLES;
    const filtered = ALL_QUERY_EXAMPLES.filter((ex) => ex.lang === selectedLang);
    return filtered.length > 0 ? filtered : ALL_QUERY_EXAMPLES;
  }, [selectedLang]);

  const currentExample = examples[exampleIndex % examples.length];

  // Reset index when language selection changes
  useEffect(() => {
    setExampleIndex(0);
    setDisplayText('');
    setIsDeleting(false);
    setIsPaused(false);
  }, [selectedLang]);

  // Typewriter animation loop for the cycling placeholder
  useEffect(() => {
    // If paused by user click or if user has typed, stop animation
    if (isPaused || query.length > 0) return;

    const targetText = currentExample.text;
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayText.length < targetText.length) {
        timer = setTimeout(() => {
          setDisplayText(targetText.slice(0, displayText.length + 1));
        }, 40);
      } else {
        // Full phrase displayed, pause so user can read
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2400);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(targetText.slice(0, displayText.length - 1));
        }, 20);
      } else {
        // Fully erased, move to next example
        setIsDeleting(false);
        setExampleIndex((prev) => (prev + 1) % examples.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, exampleIndex, isPaused, query, currentExample.text, examples.length]);

  // Live search query autocomplete
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      }
    }, 130);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // When user clicks/focuses the input field:
  // Stop cycling animation immediately to let user type whatever they want
  const handleFocus = () => {
    setIsFocused(true);
    setIsPaused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!query.trim()) {
      setIsPaused(false);
    }
  };

  const handleSelectResult = (resultId: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.push(`/roadmap/${resultId}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isOpen && results.length > 0) {
      const selected = activeIndex >= 0 ? results[activeIndex] : results[0];
      handleSelectResult(selected.id);
      return;
    }

    // If input is empty, route to currently demonstrated example roadmap
    if (!query.trim()) {
      setIsOpen(false);
      startTransition(() => {
        router.push(`/roadmap/${currentExample.targetRoadmap}`);
      });
      return;
    }

    // Direct routing heuristics
    const qLower = query.toLowerCase();
    setIsOpen(false);
    startTransition(() => {
      if (
        qLower.includes('restaurant') ||
        qLower.includes('resturant') ||
        qLower.includes('food') ||
        qLower.includes('kholna') ||
        qLower.includes('रेस्टोरेंट') ||
        qLower.includes('ریسٹورنٹ')
      ) {
        router.push('/roadmap/fssai-food-license');
      } else if (
        qLower.includes('driving') ||
        qLower.includes('license') ||
        qLower.includes('licence') ||
        qLower.includes('sarathi') ||
        qLower.includes('ड्राइविंग') ||
        qLower.includes('ڈرائیونگ')
      ) {
        router.push('/roadmap/driving-license-delhi');
      } else if (
        qLower.includes('company') ||
        qLower.includes('pvt') ||
        qLower.includes('mca') ||
        qLower.includes('startup') ||
        qLower.includes('कंपनी') ||
        qLower.includes('کمپنی')
      ) {
        router.push('/roadmap/pvt-ltd-delhi');
      } else {
        router.push(`/roadmap/pvt-ltd-delhi?query=${encodeURIComponent(query)}`);
      }
    });
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

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setIsPaused(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Determine text direction for Urdu
  const isCurrentRtl =
    Boolean(currentExample.isRtl) ||
    /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(query);

  return (
    <div className={styles.searchWrapper} ref={wrapperRef}>
      <form className={styles.searchBar} onSubmit={handleSubmit} role="search">
        <Search size={22} className={styles.searchIcon} />

        <input
          ref={inputRef}
          id="hero-civic-search-input"
          type="text"
          className={`${styles.inputField} ${isCurrentRtl ? styles.rtlField : ''}`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsPaused(true);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={isFocused ? '' : (displayText || currentExample.text)}
          autoComplete="off"
          dir={isCurrentRtl ? 'rtl' : 'ltr'}
          aria-label="Civic task search input"
        />

        <div className={styles.actionsGroup}>
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label="Clear query text"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            id="hero-query-submit-btn"
            aria-label="Untangle roadmap"
          >
            <span className={styles.submitBtnText}>Untangle</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className={styles.dropdown} role="listbox" id="hero-query-dropdown">
          <div className={styles.dropdownHeader}>
            <span>Official Civic Roadmaps ({results.length})</span>
            <span>Press Enter to select</span>
          </div>

          {results.length > 0 ? (
            results.map((item, idx) => (
              <div
                key={item.id}
                className={`${styles.dropdownItem} ${idx === activeIndex ? styles.dropdownItemActive : ''}`}
                onClick={() => handleSelectResult(item.id)}
                role="option"
                aria-selected={idx === activeIndex}
              >
                <div className={styles.itemMain}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemDesc}>{item.description}</span>
                </div>

                <div className={styles.itemMeta}>
                  <span className={styles.itemPill}>{item.location}</span>
                  <span className={styles.itemPill}>{item.stepCount} steps</span>
                  <ChevronRight size={14} style={{ opacity: 0.6 }} />
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <Search size={20} style={{ opacity: 0.6 }} />
              <span>No direct match for "{query}". Press Enter to view related roadmaps.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
