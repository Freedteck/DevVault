/**
 * Acceptance Cooldown Manager
 * Manages the 10 acceptances per 24 hours limit
 */

const COOLDOWN_KEY = "acceptanceCooldown";
const MAX_ACCEPTANCES_PER_DAY = 10;
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get acceptance history from localStorage
 * @returns {number[]} Array of acceptance timestamps
 */
export function getAcceptanceHistory(): number[] {
  try {
    if (typeof window === "undefined") return [];
    const history = localStorage.getItem(COOLDOWN_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Failed to read acceptance history:", error);
    return [];
  }
}

/**
 * Clean up old acceptances (older than 24 hours)
 * @param {number[]} history - Array of acceptance timestamps
 * @returns {number[]} Filtered array with only recent acceptances
 */
export function cleanupOldAcceptances(history: number[]): number[] {
  const now = Date.now();
  return history.filter((timestamp) => now - timestamp < COOLDOWN_PERIOD);
}

interface AcceptanceLimit {
  canAccept: boolean;
  remaining: number;
  resetTime: number | null;
  totalAcceptances: number;
}

/**
 * Check if user can accept more answers
 * @returns {AcceptanceLimit} { canAccept, remaining, resetTime }
 */
export function checkAcceptanceLimit(): AcceptanceLimit {
  const history = getAcceptanceHistory();
  const recentAcceptances = cleanupOldAcceptances(history);

  const canAccept = recentAcceptances.length < MAX_ACCEPTANCES_PER_DAY;
  const remaining = Math.max(
    0,
    MAX_ACCEPTANCES_PER_DAY - recentAcceptances.length,
  );

  // Calculate reset time (when oldest acceptance expires)
  let resetTime: number | null = null;
  if (recentAcceptances.length > 0) {
    const oldestAcceptance = Math.min(...recentAcceptances);
    resetTime = oldestAcceptance + COOLDOWN_PERIOD;
  }

  return {
    canAccept,
    remaining,
    resetTime,
    totalAcceptances: recentAcceptances.length,
  };
}

/**
 * Record a new acceptance
 * @returns {boolean} Success status
 */
export function recordAcceptance(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const history = getAcceptanceHistory();
    const cleanedHistory = cleanupOldAcceptances(history);

    if (cleanedHistory.length >= MAX_ACCEPTANCES_PER_DAY) {
      return false; // Limit exceeded
    }

    const newHistory = [...cleanedHistory, Date.now()];
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(newHistory));

    return true;
  } catch (error) {
    console.error("Failed to record acceptance:", error);
    return false;
  }
}

/**
 * Get formatted time remaining until cooldown reset
 * @param {number | null} resetTime - Unix timestamp
 * @returns {string} Formatted time string (e.g., "5h 30m")
 */
export function getTimeUntilReset(resetTime: number | null): string {
  if (!resetTime) return "N/A";

  const now = Date.now();
  const diff = resetTime - now;

  if (diff <= 0) return "Now";

  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Clear acceptance history (for testing purposes)
 */
export function clearAcceptanceHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COOLDOWN_KEY);
}
