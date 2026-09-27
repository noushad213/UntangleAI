import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <Compass size={24} aria-hidden="true" />
        </div>
        <h1 className={styles.title}>Roadmap not found</h1>
        <p className={styles.description}>
          We could not find the civic roadmap or page you requested. It may have moved or may not exist.
        </p>
        <div className={styles.actions}>
          <Link href="/roadmap/pvt-ltd-delhi" className={styles.primaryButton}>
            View sample roadmap
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
