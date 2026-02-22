"use client";

import { useState, useEffect } from "react";

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/leaderboard");
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }
      const data = await response.json();
      setLeaderboard(data);
    } catch (err: any) {
      console.error("Error loading leaderboard:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return { leaderboard, isLoading, error, refresh: fetchLeaderboard };
}
