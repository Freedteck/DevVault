import { formatDistanceToNow } from "@/lib/utils";

interface AuthorBadgeProps {
  accountId: string;
  displayName: string;
  dvtEarned?: number;
  size?: "sm" | "md";
}

export function AuthorBadge({
  accountId,
  displayName,
  dvtEarned,
  size = "sm",
}: AuthorBadgeProps) {
  const initial = displayName.charAt(0).toUpperCase();
  const avatarSize = size === "sm" ? "w-6 h-6 text-[11px]" : "w-8 h-8 text-sm";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${avatarSize} rounded-md flex items-center justify-center font-bold shrink-0`}
        style={{
          backgroundColor: "var(--color-primary-700)",
          color: "var(--color-primary-200)",
        }}
      >
        {initial}
      </span>
      <div className="min-w-0">
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
      </div>
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
  return (
    <time
      dateTime={iso}
      className="text-[12px]"
      style={{ color: "var(--text-muted)" }}
    >
      {formatDistanceToNow(new Date(iso))} ago
    </time>
  );
}

interface StatPillProps {
  value: number | string;
  label: string;
  variant?: "default" | "primary" | "accent";
}

export function StatPill({ value, label, variant = "default" }: StatPillProps) {
  const colors = {
    default: { color: "var(--text-secondary)", bg: "transparent" },
    primary: { color: "var(--color-primary-500)", bg: "transparent" },
    accent: { color: "var(--color-accent-500)", bg: "transparent" },
  };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-sm font-medium font-mono"
        style={{ color: colors[variant].color }}
      >
        {value}
      </span>
      <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}
