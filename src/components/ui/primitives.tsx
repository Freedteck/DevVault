"use client";

import { formatDistanceToNow } from "@/lib/utils";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";

interface AuthorBadgeProps {
  accountId: string;
  displayName: string;
  dvtEarned?: number;
  size?: "sm" | "md";
}

interface AvatarProps {
  accountId: string;
  displayName?: string;
  size?: number;
  className?: string;
  hideText?: boolean;
}

export function Avatar({
  accountId,
  displayName,
  size = 24,
  hideText = false,
}: AvatarProps) {
  return (
    <div className="flex items-center gap-2">
      <Jazzicon diameter={size} seed={jsNumberForAddress(accountId)} />
      {!hideText && (
        <p className="text-xs font-medium flex flex-col text-text-muted">
          <span className="truncate font-medium">{displayName}</span>
          <span className="text-[11px] font-mono">{accountId}</span>
        </p>
      )}
    </div>
  );
}

export function AuthorBadge({
  accountId,
  displayName,
  dvtEarned,
  size = "sm",
}: AuthorBadgeProps) {
  const px = size === "sm" ? 24 : 32;

  return (
    <div className="flex items-center gap-2">
      <Avatar accountId={accountId} displayName={displayName} size={px} />
      {/* <div className="min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {displayName}
        </p>
        {dvtEarned !== undefined && (
          <p
            className="text-[11px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {dvtEarned.toLocaleString()} DVT earned
          </p>
        )}
      </div> */}
    </div>
  );
}

interface TagProps {
  label: string;
}

export function Tag({ label }: TagProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono"
      style={{
        backgroundColor: "var(--bg-subtle)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      {label}
    </span>
  );
}

interface TimestampProps {
  iso: string;
}

export function Timestamp({ iso }: TimestampProps) {
  // Mirror Node returns timestamps as "seconds.nanoseconds" (e.g. "1772494810.036073975")
  // new Date() can't parse that — convert to milliseconds first.
  let date: Date;
  if (iso && /^\d+\.\d+$/.test(iso)) {
    date = new Date(parseFloat(iso) * 1000);
  } else {
    date = new Date(iso);
  }
  const isValid = !isNaN(date.getTime());

  return (
    <div
      className="flex items-center gap-1.5"
      style={{ color: "var(--text-muted)" }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <time dateTime={iso} className="text-[12px]">
        {isValid ? `${formatDistanceToNow(date)} ago` : iso}
      </time>
    </div>
  );
}

interface StatPillProps {
  value: number | string;
  label: string;
  variant?: "default" | "primary" | "accent";
}

export function StatPill({ value, label, variant = "default" }: StatPillProps) {
  const colors = {
    default: {
      text: "text-primary-500",
      bg: "bg-bg-subtle",
      border: "border-border-main/50",
    },
    primary: {
      text: "text-primary-400",
      bg: "bg-primary-600/10",
      border: "border-primary-600/20",
    },
    accent: {
      text: "text-accent-500",
      bg: "bg-accent-500/10",
      border: "border-accent-500/20",
    },
  };

  const style = colors[variant];

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm ${style.bg} ${style.border}`}
    >
      <span className={`text-sm font-bold font-mono ${style.text}`}>
        {value}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </span>
    </div>
  );
}
