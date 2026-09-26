'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Car, Utensils, FileBadge2, Landmark } from 'lucide-react';
import styles from './PopularTasks.module.css';

export function PopularTasks() {
  const popular = [
    {
      id: 'pvt-ltd-delhi',
      title: 'Company Registration',
      subtitle: 'MCA SPICe+',
      icon: <Building2 size={13} />,
      enabled: true,
    },
    {
      id: 'driving-license-delhi',
      title: 'Driving License',
      subtitle: 'Sarathi Parivahan',
      icon: <Car size={13} />,
      enabled: true,
    },
    {
      id: 'fssai-food-license',
      title: 'Food Business Permit',
      subtitle: 'FSSAI FoSCoS',
      icon: <Utensils size={13} />,
      enabled: true,
    },
    {
      id: 'passport-seva',
      title: 'Passport Renewal',
      subtitle: 'Passport Seva',
      icon: <FileBadge2 size={13} />,
      enabled: false,
      comingSoon: true,
    },
    {
      id: 'gst-reg',
      title: 'GST Registration',
      subtitle: 'GST Portal',
      icon: <Landmark size={13} />,
      enabled: false,
      comingSoon: true,
    },
  ];

  return (
    <div className={styles.container}>
      <span className={styles.label}>Popular Civic Roadmaps</span>
      <div className={styles.pillsList}>
        {popular.map((item) =>
          item.enabled ? (
            <Link
              key={item.id}
              href={`/roadmap/${item.id}`}
              className={styles.pill}
              id={`popular-task-${item.id}`}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          ) : (
            <span
              key={item.id}
              className={`${styles.pill} ${styles.pillDisabled}`}
              title="Template arriving in next update"
            >
              {item.icon}
              <span>{item.title}</span>
              <span className={styles.badgeComingSoon}>Soon</span>
            </span>
          )
        )}
      </div>
    </div>
  );
}
