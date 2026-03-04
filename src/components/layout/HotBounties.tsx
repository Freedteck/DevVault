"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Bounty {
  id: string;
  title: string;
  amount: string;
}

export function HotBounties() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBounties() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setBounties(data.hotBounties || []);
      } catch (err) {
        console.error("Failed to fetch hot bounties:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBounties();
  }, []);

  if (!loading && bounties.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-main bg-bg-panel p-4 space-y-3">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
        Hot Bounties
      </h3>
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-3/4 bg-bg-subtle animate-pulse rounded" />
                <div className="h-2 w-1/4 bg-bg-subtle animate-pulse rounded" />
              </div>
            ))
          : bounties.map((b) => (
              <Link
                key={b.id}
                href={`/questions/${b.id}`}
                className="group block cursor-pointer"
              >
                <p className="text-xs font-medium text-text-secondary group-hover:text-primary-400 transition-colors truncate">
                  {b.title}
                </p>
                <p className="text-[10px] font-mono text-primary-600">
                  {b.amount}
                </p>
              </Link>
            ))}
      </div>
    </div>
  );
}
