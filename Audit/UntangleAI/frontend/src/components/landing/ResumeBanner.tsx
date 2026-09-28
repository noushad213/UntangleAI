'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, ArrowRight, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { usePersistentSession } from '@/hooks/usePersistentSession';
import { buildResumeUrl } from '@/lib/storage';
import styles from './ResumeBanner.module.css';

function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'Recently';
  try {
    const past = new Date(isoString).getTime();
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - past) / 1000));
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export function ResumeBanner() {
  const { lastSession, recentRoadmaps, isLoaded, removeSession } = usePersistentSession();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showOtherRoadmaps, setShowOtherRoadmaps] = useState(false);

  if (!isLoaded || !lastSession || isDismissed) {
    return null;
  }

  const otherRoadmaps = recentRoadmaps.filter((r) => r.id !== lastSession.id);
  const resumeUrl = buildResumeUrl(lastSession);

  return (
    <div className={styles.bannerContainer} role="region" aria-label="Resume your progress">
      <div className={styles.bannerCard}>
        <div className={styles.leftCol}>
          <div className={styles.iconWrap} aria-hidden="true">
            <Bookmark size={18} />
          </div>

          <div className={styles.infoContent}>
            <div className={styles.headerLine}>
              <span className={styles.badge}>Continue Where You Left Off</span>
              <span className={styles.timeText}>• {formatTimeAgo(lastSession.lastVisitedAt)}</span>
            </div>

            <div className={styles.titleLine}>
              <span className={styles.schemeTitle} title={lastSession.title}>
                {lastSession.title}
              </span>
              {lastSession.location && (
                <span className={styles.locationTag}>{lastSession.location}</span>
              )}
            </div>

            <div className={styles.progressLine}>
              <div
                className={styles.progressBarTrack}
                role="progressbar"
                aria-valuenow={lastSession.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                title={`${lastSession.progressPercent}% completed`}
              >
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${Math.max(4, lastSession.progressPercent)}%` }}
                />
              </div>

              <span className={styles.progressDetail}>
                {lastSession.completedCount}/{lastSession.totalSteps} steps completed ({lastSession.progressPercent}%)
              </span>

              {lastSession.lastActiveStepTitle && (
                <span className={styles.stepDetail} title={`Current step: ${lastSession.lastActiveStepTitle}`}>
                  • Step: {lastSession.lastActiveStepTitle}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          <Link href={resumeUrl} className={styles.resumeBtn} id="hero-resume-roadmap-btn">
            <span>Resume Roadmap</span>
            <ArrowRight size={14} />
          </Link>

          <button
            type="button"
            className={styles.dismissBtn}
            onClick={() => setIsDismissed(true)}
            title="Dismiss reminder"
            aria-label="Dismiss reminder"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {otherRoadmaps.length > 0 && (
        <>
          <button
            type="button"
            className={styles.otherRoadmapsToggle}
            onClick={() => setShowOtherRoadmaps((prev) => !prev)}
            aria-expanded={showOtherRoadmaps}
          >
            <span>
              {showOtherRoadmaps ? 'Hide' : 'View'} other saved schemes ({otherRoadmaps.length})
            </span>
            {showOtherRoadmaps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showOtherRoadmaps && (
            <div className={styles.otherRoadmapsList}>
              {otherRoadmaps.map((item) => (
                <div key={item.id} className={styles.otherRoadmapItem}>
                  <Link
                    href={buildResumeUrl(item)}
                    style={{ flex: 1, textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
                  >
                    <div className={styles.otherInfo}>
                      <span className={styles.otherTitle}>{item.title}</span>
                      <span className={styles.otherMeta}>
                        {item.location} • {item.completedCount}/{item.totalSteps} steps • {formatTimeAgo(item.lastVisitedAt)}
                      </span>
                    </div>
                  </Link>

                  <div className={styles.otherAction}>
                    <span className={styles.otherPercent}>{item.progressPercent}%</span>
                    <button
                      type="button"
                      className={styles.otherDeleteBtn}
                      onClick={() => removeSession(item.id)}
                      title="Remove from saved history"
                      aria-label={`Remove ${item.title} from history`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
