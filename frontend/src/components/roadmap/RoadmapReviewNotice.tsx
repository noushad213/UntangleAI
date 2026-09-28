import { CivicProcess } from '@/types/roadmap';
import styles from './RoadmapReviewNotice.module.css';

interface Props {
  review: NonNullable<CivicProcess['review']>;
}

export function RoadmapReviewNotice({ review }: Props) {
  const hasIssues = review.missingInformation.length > 0 || review.conflicts.length > 0;
  return (
    <section className={styles.notice} aria-label="Roadmap source status">
      <div className={styles.heading}>
        <strong>{review.status === 'verified' ? 'Reviewed civic guidance'
          : review.status === 'outdated' ? 'This roadmap needs an update' : 'Roadmap from official sources'}</strong>
        {review.status === 'needs_review' && <span className={styles.reviewStatus}>Human review pending</span>}
      </div>
      <p>{review.status === 'verified' ? `Reviewed by ${review.verifiedBy || 'an authorized reviewer'}.`
        : review.status === 'outdated' ? 'The saved guidance is out of date and needs a fresh source check.'
          : hasIssues ? 'The sources leave some questions unanswered. The specific gaps are listed below.'
            : 'Official source links are included with each step.'}</p>
      {hasIssues && (
        <div className={styles.issues}>
          {review.missingInformation.length > 0 && (
            <details>
              <summary>Details still unconfirmed ({review.missingInformation.length})</summary>
              <ul>{review.missingInformation.map((detail, index) => <li key={`${index}-${detail}`}>{detail}</li>)}</ul>
            </details>
          )}
          {review.conflicts.length > 0 && (
            <details>
              <summary>Differences between official sources ({review.conflicts.length})</summary>
              <ul>{review.conflicts.map((conflict, index) => <li key={`${index}-${conflict}`}>{conflict}</li>)}</ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
