"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/ui/ToastContext";
import { Tag, StatPill } from "@/components/ui/primitives";
import { QuestionCard } from "@/components/cards/QuestionCard";
import { userCreateProfile, userUpdateProfile } from "@/lib/hedera-client-tx";
import type { LiveQuestion } from "@/lib/live-types";
import type { HCSQuestionPayload, HCSProfilePayload } from "@/lib/hcs-types";
import Link from "next/link";

const MIRROR =
  process.env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
    ? "https://mainnet.mirrornode.hedera.com/api/v1"
    : "https://testnet.mirrornode.hedera.com/api/v1";

async function fetchAccountInfo(
  accountId: string,
): Promise<{ hbarBalance: number; memo: string }> {
  const res = await fetch(`${MIRROR}/accounts/${accountId}`);
  if (!res.ok) return { hbarBalance: 0, memo: "" };
  const j = await res.json();
  return {
    hbarBalance: Number(j.balance?.balance ?? 0) / 100_000_000,
    memo: String(j.memo ?? ""),
  };
}

async function fetchVRSBalance(accountId: string): Promise<number> {
  const tokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;
  if (!tokenId) return 0;
  const res = await fetch(
    `${MIRROR}/accounts/${accountId}/tokens?token.id=${tokenId}`,
  );
  if (!res.ok) return 0;
  const j = await res.json();
  const token = j.tokens?.[0];
  return token ? Number(token.balance) / 100 : 0;
}

async function fetchProfileFromTopic(
  topicId: string,
): Promise<HCSProfilePayload | null> {
  const res = await fetch(
    `${MIRROR}/topics/${topicId}/messages?order=desc&limit=1`,
  );
  if (!res.ok) return null;
  const j = await res.json();
  const msg = j.messages?.[0];
  if (!msg) return null;
  try {
    const decoded = atob(msg.message);
    const payload = JSON.parse(decoded) as HCSProfilePayload;
    return payload.type === "PROFILE" ? payload : null;
  } catch {
    return null;
  }
}

async function fetchUserQuestions(accountId: string): Promise<LiveQuestion[]> {
  const topicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID;
  if (!topicId) return [];
  const res = await fetch(
    `${MIRROR}/topics/${topicId}/messages?limit=500&order=desc`,
  );
  if (!res.ok) return [];
  const j = await res.json();
  const messages: Array<{
    message: string;
    consensus_timestamp: string;
    sequence_number: number;
  }> = j.messages ?? [];

  const questions = messages
    .map((m) => {
      try {
        const data = JSON.parse(atob(m.message)) as HCSQuestionPayload;
        if (data.type !== "QUESTION") return null;
        if (data.author.accountId !== accountId) return null;
        return {
          sequenceNumber: m.sequence_number,
          consensusTimestamp: m.consensus_timestamp,
          title: data.title,
          shortDescription:
            data.shortDescription || data.body?.slice(0, 160) || "",
          tags: data.tags || [],
          author: data.author,
          bountyAmount: data.bountyAmount || 0,
          bountyCurrency: data.bountyCurrency || "VRS",
          discussionTopicId: data.discussionTopicId,
          answerCount: 0,
          accepted: false,
        } as LiveQuestion;
      } catch {
        return null;
      }
    })
    .filter((q): q is LiveQuestion => q !== null)
    .reverse();

  // Batch-fetch answer counts from discussion topics
  const { getTopicInfo } = await import("@/lib/hedera-mirror");
  const topicInfos = await Promise.allSettled(
    questions.map((q) =>
      q.discussionTopicId
        ? getTopicInfo(q.discussionTopicId)
        : Promise.resolve({ sequenceNumber: 0 }),
    ),
  );

  return questions.map((q, i) => ({
    ...q,
    answerCount:
      topicInfos[i].status === "fulfilled"
        ? topicInfos[i].value.sequenceNumber
        : 0,
  }));
}

function parseProfileTopicFromMemo(memo: string): string | null {
  const match = memo.match(/hcs11:(0\.0\.\d+)/);
  return match ? match[1] : null;
}

interface ProfileData {
  displayName: string;
  bio: string;
  skills: string[];
  profileTopicId: string | null;
  vrsBalance: number;
  hbarBalance: number;
}

export default function ProfilePage() {
  const { accountId, isConnected, connector } = useWallet();
  const { showToast } = useToast();

  const QUESTIONS_PER_PAGE = 10;
  const [visibleQuestions, setVisibleQuestions] = useState(QUESTIONS_PER_PAGE);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [questions, setQuestions] = useState<LiveQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const [accountInfo, vrsBalance, userQuestions] = await Promise.all([
        fetchAccountInfo(accountId),
        fetchVRSBalance(accountId),
        fetchUserQuestions(accountId),
      ]);

      const profileTopicId = parseProfileTopicFromMemo(accountInfo.memo);
      let profilePayload: HCSProfilePayload | null = null;
      if (profileTopicId) {
        profilePayload = await fetchProfileFromTopic(profileTopicId);
      }

      setProfile({
        displayName: profilePayload?.displayName ?? accountId,
        bio: String(profilePayload?.bio ?? ""),
        skills: (profilePayload?.skills as string[]) ?? [],
        profileTopicId,
        vrsBalance,
        hbarBalance: accountInfo.hbarBalance,
      });
      setEditDisplayName(profilePayload?.displayName ?? "");
      setEditBio(String(profilePayload?.bio ?? ""));
      setEditSkills(((profilePayload?.skills as string[]) ?? []).join(", "));
      setQuestions(userQuestions);
    } catch (err) {
      console.error("Failed to load profile", err);
      showToast("Failed to load profile data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [accountId, showToast]);

  useEffect(() => {
    if (isConnected && accountId) {
      loadProfile();
    }
  }, [isConnected, accountId, loadProfile]);

  const handleCreateProfile = async () => {
    if (!connector || !accountId) return;
    if (!editDisplayName.trim()) {
      showToast("Display name is required.", "error");
      return;
    }
    setIsCreating(true);
    try {
      const { profileTopicId } = await userCreateProfile(connector, {
        accountId,
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        skills: editSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      showToast(`Profile created! Topic: ${profileTopicId}`, "success");
      setShowEditForm(false);
      await loadProfile();
    } catch (err) {
      showToast(`Failed: ${String(err)}`, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!connector || !accountId || !profile?.profileTopicId) return;
    setIsCreating(true);
    try {
      await userUpdateProfile(connector, profile.profileTopicId, {
        accountId,
        displayName: editDisplayName.trim() || profile.displayName,
        bio: editBio.trim(),
        skills: editSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      showToast("Profile updated on-chain!", "success");
      setShowEditForm(false);
      await loadProfile();
    } catch (err) {
      showToast(`Failed: ${String(err)}`, "error");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-text-main">
          Your Vault Profile
        </h1>
        <p className="text-sm text-text-secondary">
          Connect your wallet to view and manage your on-chain developer
          profile.
        </p>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-sm text-text-muted animate-pulse">
          Loading profile from Hedera…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-8 rounded-2xl border border-border-main bg-bg-panel shadow-sm">
        <div className="w-24 h-24 rounded-3xl bg-primary-800 text-primary-200 flex items-center justify-center text-4xl font-bold shadow-2xl shadow-primary-900/40 shrink-0">
          {profile.displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main">
              {profile.displayName}
            </h1>
            <p className="text-sm font-mono text-text-muted">{accountId}</p>
            {profile.bio && (
              <p className="text-sm text-text-secondary mt-1">{profile.bio}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <StatPill
              value={profile.vrsBalance.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
              label="VRS Balance"
              variant="primary"
            />
            <span className="hidden sm:block text-border-main">|</span>
            <StatPill
              value={`${profile.hbarBalance.toFixed(4)} ℏ`}
              label="HBAR Balance"
            />
          </div>

          {profile.skills.length > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
              {profile.skills.map((skill) => (
                <Tag key={skill} label={skill} />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowEditForm((v) => !v)}
          className="px-4 py-2 rounded-md text-sm font-medium border border-border-main text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-colors shrink-0"
        >
          {profile.profileTopicId ? "Edit Profile" : "Create Profile"}
        </button>
      </div>

      {/* Create / Edit Profile Form */}
      {showEditForm && (
        <div className="rounded-xl border border-border-main bg-bg-panel p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">
            {profile.profileTopicId
              ? "Update your HCS-11 Profile"
              : "Create your HCS-11 Profile"}
          </h2>
          {!profile.profileTopicId && (
            <p className="text-xs text-text-secondary">
              Creates a dedicated HCS topic (platform pays), posts your info
              on-chain, and sets your account memo to point to it.
            </p>
          )}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Display Name *"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm border border-border-main bg-bg-subtle text-text-main focus:outline-none focus:border-primary-500"
            />
            <textarea
              placeholder="Bio (optional)"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm border border-border-main bg-bg-subtle text-text-main focus:outline-none focus:border-primary-500 resize-none"
            />
            <input
              type="text"
              placeholder="Skills (comma-separated, e.g. Solidity, TypeScript)"
              value={editSkills}
              onChange={(e) => setEditSkills(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm border border-border-main bg-bg-subtle text-text-main focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowEditForm(false)}
              className="px-4 py-2 rounded-md text-sm font-medium border border-border-main text-text-secondary hover:border-primary-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={
                profile.profileTopicId
                  ? handleUpdateProfile
                  : handleCreateProfile
              }
              disabled={isCreating}
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50"
            >
              {isCreating
                ? "Signing…"
                : profile.profileTopicId
                  ? "Update On-Chain"
                  : "Create Profile"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted border-b border-border-main pb-2">
              Vault Wallet
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 rounded-lg bg-bg-subtle border border-border-main">
                <span className="text-xs text-text-secondary">VRS Balance</span>
                <span className="font-mono text-sm font-bold text-primary-400">
                  {profile.vrsBalance.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-bg-subtle border border-border-main">
                <span className="text-xs text-text-secondary">
                  HBAR Available
                </span>
                <span className="font-mono text-sm font-bold text-text-main">
                  {profile.hbarBalance.toFixed(4)} ℏ
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted border-b border-border-main pb-2">
              On-Chain Metadata
            </h3>
            <div className="text-[11px] font-mono text-text-muted space-y-1">
              {profile.profileTopicId ? (
                <>
                  <p>Profile Topic:</p>
                  <p className="text-primary-400">{profile.profileTopicId}</p>
                  <p className="text-primary-500 mt-1">HCS-11 Active ✓</p>
                </>
              ) : (
                <p className="text-amber-500">No HCS-11 profile yet</p>
              )}
            </div>
          </section>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border-main pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
              Your Questions ({questions.length})
            </h2>
          </div>

          <div className="space-y-4">
            {questions.length > 0 ? (
              <>
                {questions.slice(0, visibleQuestions).map((q) => (
                  <QuestionCard key={q.sequenceNumber} question={q} />
                ))}
                {visibleQuestions < questions.length && (
                  <button
                    onClick={() =>
                      setVisibleQuestions((v) => v + QUESTIONS_PER_PAGE)
                    }
                    className="w-full py-3 rounded-lg text-sm font-medium border border-border-main hover:bg-bg-subtle transition-colors text-text-secondary"
                  >
                    Show more ({questions.length - visibleQuestions} remaining)
                  </button>
                )}
              </>
            ) : (
              <div className="py-20 text-center space-y-3 rounded-xl border border-dashed border-border-main">
                <p className="text-sm text-text-muted">
                  You haven&apos;t posted any questions yet.
                </p>
                <Link
                  href="/questions/new"
                  className="inline-block text-xs font-bold text-primary-500 hover:underline"
                >
                  Start sharing knowledge →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
