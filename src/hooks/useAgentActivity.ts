"use client";

import { useState, useEffect, useCallback } from "react";

const MIRROR = "https://testnet.mirrornode.hedera.com";

export interface Activity {
  type: "connection" | "answer" | "hol_reply" | "other";
  label: string;
  ts: Date;
  seq: number;
  raw: any;
  meta?: {
    questionId?: string;
    answerId?: string;
    confidence?: number;
  };
}

// ---------------------------------------------------------------------------
// Browser-safe base64 → UTF-8 decode
// ---------------------------------------------------------------------------
function decodeBase64Utf8(str: string): string | null {
  try {
    const bytes = Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function decodeMessage(raw: string): any | null {
  try {
    const decoded = decodeBase64Utf8(raw);
    return decoded ? JSON.parse(decoded.trim()) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Parse a single outbound-topic message into a typed activity object
// ---------------------------------------------------------------------------
function parseActivity(msg: any): Activity | null {
  const content = decodeMessage(msg.message);
  if (!content || content.p !== "hcs-10") return null;

  // consensus_timestamp from Mirror Node is a decimal string like "1709123456.789000000"
  const ts = new Date(Math.floor(parseFloat(msg.consensus_timestamp) * 1000));
  const seq = msg.sequence_number;

  const { op, data } = content;

  // ── Connection accepted ──────────────────────────────────────────────────
  if (op === "connection_created") {
    const peer = content.connected_account || "unknown peer";
    return {
      type: "connection",
      label: `Accepted connection from ${peer}`,
      ts,
      seq,
      raw: content,
    };
  }

  // ── Message (answer published or HOL reply) ──────────────────────────────
  if (op === "message") {
    let parsed = data;
    if (typeof data === "string") {
      try {
        parsed = JSON.parse(data);
      } catch {
        /* plain string */
      }
    }

    // DevVault AI-agent activity log
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.event === "answer_published"
    ) {
      return {
        type: "answer",
        label: `Answered question with ${parsed.confidence ?? "?"}% confidence`,
        meta: {
          questionId: parsed.questionId,
          answerId: parsed.answerId,
          confidence: parsed.confidence,
        },
        ts,
        seq,
        raw: content,
      };
    }

    // HOL peer reply
    return {
      type: "hol_reply",
      label: "Replied to HOL peer query",
      ts,
      seq,
      raw: content,
    };
  }

  // ── Fallback ─────────────────────────────────────────────────────────────
  return {
    type: "other",
    label: content.m || `op: ${op}`,
    ts,
    seq,
    raw: content,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAgentActivity(limit = 25) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const outboundTopicId = process.env.NEXT_PUBLIC_AGENT_OUTBOUND_TOPIC_ID;

  const load = useCallback(async () => {
    if (!outboundTopicId) {
      setError("NEXT_PUBLIC_AGENT_OUTBOUND_TOPIC_ID is not set");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(
        `${MIRROR}/api/v1/topics/${outboundTopicId}/messages?order=desc&limit=${limit}`,
      );
      if (!res.ok) throw new Error(`Mirror Node returned ${res.status}`);
      const data = await res.json();

      const parsed = (data.messages || [])
        .map(parseActivity)
        .filter((a: Activity | null): a is Activity => a !== null);
      setActivities(parsed);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [outboundTopicId, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { activities, isLoading, error, refresh: load };
}
