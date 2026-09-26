'use client';

import React from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import styles from './LandingFooter.module.css';

export function LandingFooter() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.content}>
        <div className={styles.topRow}>
          <div className={styles.brandCol}>
            <span className={styles.brandTitle}>UntangleAI</span>
            <p className={styles.brandDesc}>
              A civic technology navigator dedicated to demystifying public administrative procedures.
              We provide independent, transparent roadmaps so citizens and entrepreneurs can transact
              with confidence.
            </p>
          </div>

          <div className={styles.sourcesCol}>
            <span className={styles.colTitle}>Primary Source Portals</span>
            <ul className={styles.sourceList}>
              <li>
                <a
                  href="https://www.mca.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  Ministry of Corporate Affairs (mca.gov.in) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://parivahan.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  Sarathi Parivahan (parivahan.gov.in) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://foscos.fssai.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  Food Safety Compliance System (foscos.fssai.gov.in) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://digitallocker.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  DigiLocker National Cloud (digitallocker.gov.in) ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.disclaimerBanner}>
          <ShieldAlert size={16} style={{ color: 'var(--color-warning-500)', flexShrink: 0 }} />
          <span>
            <strong>Statutory Notice:</strong> UntangleAI is an independent civic information guide.
            We are not affiliated with, authorized by, or endorsed by any government entity.
            Information is provided for educational and procedural guidance only. Official fees,
            rules, and forms are subject to change by respective ministries.
          </span>
        </div>

        <div className={styles.bottomRow}>
          <span>UntangleAI — Civic Process Roadmaps</span>
          <span>Open Knowledge • No Ads • No Trackers</span>
        </div>
      </div>
    </footer>
  );
}
