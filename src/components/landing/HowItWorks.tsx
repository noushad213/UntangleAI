'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Compass, FileCheck, ArrowRight } from 'lucide-react';
import styles from './HowItWorks.module.css';

export function HowItWorks() {
  const [applicantType, setApplicantType] = useState<'team' | 'solo'>('team');

  return (
    <section id="about-section" className={styles.sectionContainer} aria-label="About UntangleAI">
      <div className={styles.contentWrapper}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>About Us</h2>
          <p className={styles.sectionSubtitle}>
            Transforming complex public administration into transparent, actionable roadmaps.
          </p>
        </div>

        <div className={styles.cardsStack}>
          {/* Row 1: Slate Lavender Card on Left, Elevated Action Companion on Right */}
          <div className={styles.rowOne}>
            <div className={styles.cardPeriwinkle}>
              <div className={styles.cardImageWrapper}>
                <img
                  src="/images/village_lodge.jpg"
                  alt="Scenic snow village street with warm ambient lights"
                  className={styles.cardImage}
                  loading="lazy"
                />
              </div>

              <div className={styles.cardTextContent}>
                <h3 className={styles.cardHeading}>
                  Direct Grounding in Official Portals
                </h3>
                <p className={styles.cardBody}>
                  Clear, verified procedural guidance synthesized directly from ministry portals
                  (.gov.in and .nic.in). No broker commissions, no confusing jargon, zero guesswork.
                </p>
                <span className={styles.cardTagline}>
                  Central & State Jurisdictions
                </span>
              </div>
            </div>

            <div className={styles.sideBlock}>
              <div className={styles.sideBlockBadge}>
                <Compass size={18} />
              </div>
              <h4 className={styles.sideBlockHeading}>Verified Requirements</h4>
              <p className={styles.sideBlockText}>
                View verified prerequisites, authorized forms, and statutory fee schedules on every roadmap.
              </p>
              <Link href="/roadmap/pvt-ltd-delhi" className={styles.sidePillBtn}>
                <span>View roadmaps</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Row 2: In DOM order: Primary Card first, Companion Action second (CSS row-reverse for desktop) */}
          <div className={styles.rowTwo}>
            <div className={styles.cardEspresso}>
              <div className={styles.cardTextContent}>
                <h3 className={styles.cardHeading}>
                  Personalized for Solo Applicants & Enterprises
                </h3>
                <p className={styles.cardBody}>
                  {applicantType === 'team'
                    ? 'Incorporate companies, assign multiple directors, obtain commercial food safety permits, and manage tax registrations with full compliance.'
                    : 'Streamline personal driving license renewals, citizen certificates, and individual permits without redundant documentation.'}
                </p>

                <div className={styles.segmentedControl} role="tablist" aria-label="Applicant Mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={applicantType === 'team'}
                    className={`${styles.segmentBtn} ${applicantType === 'team' ? styles.segmentBtnActive : ''}`}
                    onClick={() => setApplicantType('team')}
                  >
                    With team
                  </button>
                  <span className={styles.segmentDivider}>&lt; Scope &gt;</span>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={applicantType === 'solo'}
                    className={`${styles.segmentBtn} ${applicantType === 'solo' ? styles.segmentBtnActive : ''}`}
                    onClick={() => setApplicantType('solo')}
                  >
                    Solo applicant
                  </button>
                </div>
              </div>

              <div className={styles.cardImageWrapper}>
                <img
                  src="/images/ridge_climber.jpg"
                  alt="Mountaineer walking on snow ridge into sunset clouds"
                  className={styles.cardImage}
                  loading="lazy"
                />
              </div>
            </div>

            <div className={styles.sideBlock}>
              <div className={styles.sideBlockBadge}>
                <FileCheck size={18} />
              </div>
              <h4 className={styles.sideBlockHeading}>Offline Checklists</h4>
              <p className={styles.sideBlockText}>
                Track your documentation offline or export interactive checklists directly before visiting authorities.
              </p>
              <Link href="/roadmap/fssai-food-license" className={styles.sidePillBtn}>
                <span>View checklists</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
