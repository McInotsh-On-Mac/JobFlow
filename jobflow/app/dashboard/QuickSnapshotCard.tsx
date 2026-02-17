"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

export type SnapshotMonthOption = {
  key: string;
  label: string;
  applications: number;
};

type QuickSnapshotCardProps = {
  totalApplications: number;
  offers: number;
  monthOptions: SnapshotMonthOption[];
};

export default function QuickSnapshotCard({ totalApplications, offers, monthOptions }: QuickSnapshotCardProps) {
  const defaultMonth = monthOptions[0]?.key ?? "";
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const selectedMonthData = useMemo(() => {
    return monthOptions.find((option) => option.key === selectedMonth) ?? monthOptions[0] ?? null;
  }, [monthOptions, selectedMonth]);

  return (
    <section className={`${styles.card} ${styles.metricsCard}`}>
      <div className={styles.metricsHeader}>
        <div>
          <h2>Quick Snapshot</h2>
          <p>Simple, real numbers from your current account activity.</p>
        </div>

        <div className={styles.metricsControl}>
          <label htmlFor="snapshot-month" className={styles.monthLabel}>
            Month
          </label>
          <select
            id="snapshot-month"
            className={styles.monthSelect}
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            {monthOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <article className={`${styles.statCard} ${styles.statCardApplied}`}>
          <p className={styles.statLabel}>Applied</p>
          <p className={styles.statValue}>{totalApplications}</p>
          <p className={styles.statSubtext}>Total jobs tracked</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardOffers}`}>
          <p className={styles.statLabel}>Offers</p>
          <p className={styles.statValue}>{offers}</p>
          <p className={styles.statSubtext}>Offer-stage or accepted</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardMonthly}`}>
          <p className={styles.statLabel}>Selected Month</p>
          <p className={styles.statValue}>{selectedMonthData?.applications ?? 0}</p>
          <p className={styles.statSubtext}>{selectedMonthData ? `Applications in ${selectedMonthData.label}` : "No data"}</p>
        </article>
      </div>
    </section>
  );
}
