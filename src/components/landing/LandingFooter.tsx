'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { SearchResult } from '@/app/api/v1/search/route';
import styles from './LandingFooter.module.css';

export function LandingFooter() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Live search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&location=all`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (id: string) => {
    setIsOpen(false);
    router.push(`/roadmap/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (results.length > 0) {
        handleSelect(results[0].id);
      } else {
        router.push(`/roadmap/pvt-ltd-delhi`);
      }
    }
  };

  return (
    <footer id="search-showcase" className={styles.footerWrapper} role="contentinfo">
      {/* Panoramic Scenic Section */}
      <div className={styles.panoramicSection}>
        <div className={styles.panoramicBgWrapper}>
          <img
            src="/images/footer_valley.jpg"
            alt="Scenic evening panoramic mountain valley with village lights"
            className={styles.panoramicImage}
            loading="lazy"
          />
          <div className={styles.panoramicOverlay} />
        </div>

        <div className={styles.panoramicContent}>
          {/* Frosted Glass Search Pill */}
          <div className={styles.searchPillWrapper} ref={searchRef}>
            <div className={styles.searchPill}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query.trim() && setIsOpen(true)}
                placeholder="Search up process, license, permit..."
                className={styles.searchInput}
                aria-label="Search civic roadmaps"
              />
            </div>

            {/* Results Dropdown */}
            {isOpen && (
              <div className={styles.searchDropdown} role="listbox">
                {results.length > 0 ? (
                  results.map((item) => (
                    <div
                      key={item.id}
                      className={styles.dropdownItem}
                      onClick={() => handleSelect(item.id)}
                      role="option"
                      aria-selected={false}
                    >
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemDesc}>
                        {item.location} • {item.stepCount} steps • {item.description}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={styles.dropdownItem} onClick={() => handleSelect('pvt-ltd-delhi')}>
                    <span className={styles.itemTitle}>Generate custom roadmap</span>
                    <span className={styles.itemDesc}>
                      Press Enter to open template matching &quot;{query}&quot;
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Grand Brand Typography */}
          <div className={styles.brandShowcase}>
            <span className={styles.footerBrandName}>UNTANGLE</span>
            <span className={styles.footerBrandTagline}>Civic Navigator</span>
          </div>
        </div>
      </div>

      {/* Statutory Disclaimers & Official Portals */}
      <div className={styles.bottomLegalSection}>
        <div className={styles.legalContent}>
          <div className={styles.portalLinksRow}>
            <span className={styles.portalTitle}>Official Primary Portals</span>
            <ul className={styles.portalLinksList}>
              <li>
                <a
                  href="https://www.mca.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.portalLink}
                >
                  MCA SPICe+ (mca.gov.in) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://parivahan.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.portalLink}
                >
                  Sarathi Parivahan (parivahan.gov.in) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://foscos.fssai.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.portalLink}
                >
                  Food Safety Compliance (foscos.fssai.gov.in) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://digitallocker.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.portalLink}
                >
                  DigiLocker National Cloud ↗
                </a>
              </li>
            </ul>
          </div>

          <div className={styles.disclaimerRow}>
            <span>
              <strong>Statutory Notice:</strong> UntangleAI is an independent procedural guide.
              Not affiliated with or endorsed by any government ministry. Information is
              synthesized from public portals.
            </span>
            <span>UntangleAI • Open Civic Knowledge</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
