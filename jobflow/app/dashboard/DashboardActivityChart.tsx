"use client";

import { useMemo, useState } from "react";
import styles from "./DashboardActivityChart.module.css";

export type ChartPoint = {
  label: string;
  value: number;
};

type DashboardActivityChartProps = {
  dayData: ChartPoint[];
  monthData: ChartPoint[];
  yearData: ChartPoint[];
};

type ViewMode = "day" | "month" | "year";

const viewOptions: Array<{ key: ViewMode; label: string }> = [
  { key: "day", label: "Day" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

export default function DashboardActivityChart({ dayData, monthData, yearData }: DashboardActivityChartProps) {
  const [view, setView] = useState<ViewMode>("month");

  const activeData = useMemo(() => {
    if (view === "day") {
      return dayData;
    }

    if (view === "year") {
      return yearData;
    }

    return monthData;
  }, [dayData, monthData, yearData, view]);

  const maxValue = useMemo(() => {
    const max = Math.max(...activeData.map((point) => point.value), 0);
    return max === 0 ? 1 : max;
  }, [activeData]);

  return (
    <div className={styles.chart}>
      <div className={styles.tabs} role="tablist" aria-label="Activity timeframe">
        {viewOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={view === option.key}
            className={view === option.key ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => setView(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {activeData.map((point) => {
          const percent = Math.round((point.value / maxValue) * 100);

          return (
            <article className={styles.item} key={`${view}-${point.label}`}>
              <p className={styles.value}>{point.value}</p>
              <div className={styles.track}>
                <span className={styles.fill} style={{ height: `${percent}%` }} />
              </div>
              <p className={styles.label}>{point.label}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
