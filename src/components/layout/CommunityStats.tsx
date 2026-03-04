"use client";

import { useEffect, useState } from "react";

interface Stats {
  circulation: number;
  experts: number;
}

export function CommunityStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats({
          circulation: data.circulation || 0,
          experts: data.experts || 0,
        });
      } catch (err) {
        console.error("Failed to fetch community stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="rounded-lg border border-border-main bg-bg-panel p-4 space-y-4">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
        Den Vitality
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          {loading ? (
            <div className="h-4 w-12 bg-bg-subtle animate-pulse rounded" />
          ) : (
            <p className="text-sm font-bold text-primary-500">
              {(stats?.circulation ?? 0).toLocaleString(undefined, {
                notation: "compact",
                maximumFractionDigits: 1,
              })}
            </p>
          )}
          <p className="text-[10px] text-text-muted uppercase">VRS Circ</p>
        </div>
        <div>
          {loading ? (
            <div className="h-4 w-8 bg-bg-subtle animate-pulse rounded" />
          ) : (
            <p className="text-sm font-bold text-text-main">
              {stats?.experts ?? 0}
            </p>
          )}
          <p className="text-[10px] text-text-muted uppercase">Experts</p>
        </div>
      </div>
    </div>
  );
}
