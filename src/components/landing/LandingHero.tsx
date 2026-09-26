'use client';

import React from 'react';
import Link from 'next/link';
import { MoreHorizontal, ArrowRight, Phone, Building2, Car, Utensils, ArrowDown } from 'lucide-react';
import { HeroQueryInput } from './HeroQueryInput';
import styles from './LandingHero.module.css';

interface LandingHeroProps {
  selectedLang?: string;
}

export function LandingHero({ selectedLang = 'auto' }: LandingHeroProps) {
  return (
    <section className={styles.heroContainer} aria-label="Hero showcase">
      {/* Background panoramic landscape image that scales fluidly */}
      <div className={styles.heroBgWrapper}>
        <img
          src="/images/hero_alps.jpg"
          alt="Majestic twilight snow mountain landscape"
          className={styles.heroBgImage}
          loading="eager"
        />
        <div className={styles.heroBgOverlay} />
      </div>

      {/* Floating Glassmorphic Frame */}
      <div className={styles.glassFrame}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Quick options"
            title="Roadmap quick directory"
          >
            <MoreHorizontal size={18} />
          </button>

          <div className={styles.brandGroup}>
            <span className={styles.brandTitle}>UNTANGLE</span>
            <span className={styles.brandSubtitle}>Civic Process Navigator</span>
          </div>

          <Link href="#about-section" className={styles.pillActionBtn}>
            <span>Find guidance</span>
            <ArrowRight size={13} />
          </Link>
        </header>

        {/* Center Title and Action */}
        <div className={styles.centerContent}>
          <h1 className={styles.heroTitle}>
            Demystify Public Bureaucracy
          </h1>

          <h2 className={styles.queryHeading}>
            Ask your queries
          </h2>

          <HeroQueryInput selectedLang={selectedLang} />

          <Link href="#about-section" className={styles.heroCtaPill}>
            <span>view roadmap selection</span>
            <ArrowDown size={14} />
          </Link>
        </div>

        {/* Bottom Dock Bar */}
        <footer className={styles.bottomBar}>
          <a
            href="tel:1800112026"
            className={styles.bottomPill}
            title="National Government Services Portal helpline"
          >
            <Phone size={13} />
            <span>1800 11 2026</span>
          </a>

          <div className={styles.centerPills}>
            <Link href="/roadmap/pvt-ltd-delhi" className={styles.bottomPill}>
              <Building2 size={13} />
              <span>MCA SPICe+</span>
            </Link>
            <Link href="/roadmap/driving-license-delhi" className={styles.bottomPill}>
              <Car size={13} />
              <span>Sarathi Parivahan</span>
            </Link>
            <Link href="/roadmap/fssai-food-license" className={styles.bottomPill}>
              <Utensils size={13} />
              <span>FSSAI FoSCoS</span>
            </Link>
          </div>

          <Link href="#about-section" className={styles.bottomPill}>
            <span>view more about roadmaps</span>
            <span className={styles.toggleDot} />
          </Link>
        </footer>
      </div>
    </section>
  );
}
