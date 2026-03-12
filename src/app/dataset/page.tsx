import type { Metadata } from "next";
import Link from "next/link";
import { getTopicMessages } from "@/lib/hedera-mirror";
import type { HCSQuestionPayload } from "@/lib/hcs-types";

export const metadata: Metadata = {
  title: "Dataset Marketplace | Vurso",
  description:
    "Human-verified developer Q&A pairs from Vurso. Every accepted answer is economically staked on Hedera HCS — verified, attributed, and immutable.",
};

export const revalidate = 3600;

async function getDatasetStats() {
  try {
    const QUESTIONS_TOPIC = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
    const messages = await getTopicMessages<HCSQuestionPayload>(
      QUESTIONS_TOPIC,
      500,
    );
    const questions = messages.filter((m) => m.data?.type === "QUESTION");

    const tags = new Set<string>();
    const contributors = new Set<string>();
    let bountyCount = 0;

    for (const q of questions) {
      (q.data?.tags || []).forEach((t: string) => tags.add(t));
      if (q.data?.author?.accountId) contributors.add(q.data.author.accountId);
      if (q.data?.bountyAmount && q.data.bountyAmount > 0) bountyCount++;
    }

    return {
      totalQuestions: questions.length,
      tagCount: tags.size,
      contributorCount: contributors.size,
      bountyCount,
    };
  } catch {
    return {
      totalQuestions: 0,
      tagCount: 0,
      contributorCount: 0,
      bountyCount: 0,
    };
  }
}

async function getSamplePairs() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/export/dataset?limit=6`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.pairs ?? [];
  } catch {
    return [];
  }
}

export default async function DatasetPage() {
  const [stats, samplePairs] = await Promise.all([
    getDatasetStats(),
    getSamplePairs(),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="space-y-2 pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-main">
          Developer Knowledge Dataset
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl">
          Every Q&amp;A pair on Vurso is human-verified, economically staked,
          and permanently recorded on Hedera HCS. Stack Overflow sold their data
          to OpenAI — developers got nothing. On Vurso, when the dataset is
          licensed, contributors earn.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="/api/export/dataset?limit=50"
            download="vurso-dataset-sample.json"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Sample (50 pairs)
          </a>
          <Link
            href="/questions/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border-main hover:bg-bg-subtle text-text-secondary hover:text-text-main transition-colors"
          >
            Start Contributing
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Questions", value: stats.totalQuestions.toLocaleString() },
          {
            label: "Contributors",
            value: stats.contributorCount.toLocaleString(),
          },
          { label: "Domains", value: stats.tagCount.toLocaleString() },
          {
            label: "Bounty Questions",
            value: stats.bountyCount.toLocaleString(),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-border-main bg-bg-panel px-4 py-3 space-y-1"
          >
            <p className="font-mono text-xl font-bold text-text-main">
              {value}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Why this data is different */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          Why Vurso data is different from scraped datasets
        </p>
        <div className="rounded-lg border border-border-main bg-bg-panel divide-y divide-border-main">
          {[
            {
              title: "Human-Verified",
              desc: "Every pair has an on-chain ACCEPT signal. Someone tested the answer before accepting it. Not scraped, not averaged.",
            },
            {
              title: "Immutable on Hedera",
              desc: "All data is stored on Hedera HCS — an append-only ledger. It cannot be retroactively modified, deleted, or manipulated.",
            },
            {
              title: "Attributed Ownership",
              desc: "Every answer has an author Hedera account ID. Contributors own their data. When it is licensed, they earn proportionally.",
            },
          ].map(({ title, desc }) => (
            <div key={title} className="px-5 py-4 space-y-1">
              <p className="text-sm font-semibold text-text-main">{title}</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample preview */}
      {samplePairs.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Sample Verified Pairs
          </p>
          <div className="space-y-2">
            {samplePairs.map(
              (pair: {
                question_id: number;
                question: string;
                tags: string[];
                accepted_answer: string;
                answer_author: string;
                bounty_amount: number;
                bounty_currency: string;
              }) => (
                <div
                  key={pair.question_id}
                  className="rounded-lg border border-border-main bg-bg-panel p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-sm font-medium text-text-main leading-snug">
                        {pair.question}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {pair.tags.map((t: string) => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-bg-subtle text-text-muted border border-border-main"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    {pair.bounty_amount > 0 && (
                      <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-500 border border-accent-500/30">
                        {pair.bounty_amount} {pair.bounty_currency}
                      </span>
                    )}
                  </div>
                  <div className="rounded bg-bg-subtle border border-border-main p-3">
                    <p className="text-xs text-text-secondary font-mono leading-relaxed line-clamp-3">
                      {pair.accepted_answer.slice(0, 280)}
                      {pair.accepted_answer.length > 280 ? "..." : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Accepted answer
                    </span>
                    <span>·</span>
                    <span>Author: {pair.answer_author}</span>
                    <span>·</span>
                    <span className="text-primary-500 font-medium">
                      verified on Hedera HCS
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border-main bg-bg-panel p-8 text-center space-y-2">
          <p className="text-sm font-medium text-text-secondary">
            No verified pairs yet
          </p>
          <p className="text-xs text-text-muted">
            Pairs appear once a question has an accepted answer recorded
            on-chain. Post a question with a bounty to get started.
          </p>
          <Link
            href="/questions/new"
            className="inline-block mt-2 px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          >
            Post a bounty question
          </Link>
        </div>
      )}

      {/* Licensing */}
      <div className="space-y-3" id="license">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          Dataset Licensing
        </p>
        <p className="text-sm text-text-secondary max-w-2xl">
          Licensing revenue is distributed proportionally to contributors based
          on accepted answer count. When AI companies license this dataset, the
          developers who created the knowledge get paid.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              tier: "Free Sample",
              price: "$0",
              sub: "",
              features: [
                "50 verified Q&A pairs",
                "JSON format",
                "CC-BY-4.0 license",
                "Full question + accepted answer",
              ],
              cta: "Download Now",
              href: "/api/export/dataset?limit=50",
              download: "vurso-dataset-sample.json",
              primary: false,
            },
            {
              tier: "Standard License",
              price: "10 HBAR",
              sub: "per dataset snapshot",
              features: [
                "Full verified dataset",
                "All domains + tags",
                "Commercial AI training use",
                "Revenue shared with contributors",
              ],
              cta: "Get Access",
              href: "mailto:vurso@hedera.io?subject=Standard Dataset License",
              download: "",
              primary: true,
            },
            {
              tier: "Enterprise",
              price: "Custom",
              sub: "volume + SLA",
              features: [
                "Ongoing dataset updates",
                "Domain-specific filtering",
                "Attribution API",
                "Contributor royalty integration",
              ],
              cta: "Contact Us",
              href: "mailto:vurso@hedera.io?subject=Enterprise Dataset License",
              download: "",
              primary: false,
            },
          ].map(
            ({ tier, price, sub, features, cta, href, download, primary }) => (
              <div
                key={tier}
                className={`rounded-lg border p-5 space-y-4 flex flex-col ${
                  primary
                    ? "border-primary-600/50 bg-primary-600/5"
                    : "border-border-main bg-bg-panel"
                }`}
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-1">
                    {tier}
                  </p>
                  <p className="text-2xl font-bold text-text-main">{price}</p>
                  {sub && <p className="text-xs text-text-muted">{sub}</p>}
                </div>
                <ul className="space-y-1.5 flex-1">
                  {features.map((f) => (
                    <li
                      key={f}
                      className="flex gap-2 text-xs text-text-secondary"
                    >
                      <span className="text-green-400 shrink-0">+</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={href}
                  {...(download ? { download } : {})}
                  className={`block w-full text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    primary
                      ? "bg-primary-600 hover:bg-primary-700 text-white"
                      : "border border-border-main hover:bg-bg-subtle text-text-secondary hover:text-text-main"
                  }`}
                >
                  {cta}
                </a>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Revenue sharing note */}
      <div className="rounded-lg border border-border-main bg-bg-panel px-5 py-4 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          Revenue Sharing
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          When a license is purchased, revenue is distributed proportionally to
          contributors based on accepted answers. If you have 10 accepted
          answers out of 100 total, you earn 10% of every license fee — in HBAR
          or VRS, on-chain, transparent, verifiable.
        </p>
        <p className="text-xs text-text-muted">
          Stack Overflow sold your data. You got nothing.{" "}
          <span className="text-text-secondary">
            On Vurso, you own it and earn from it.
          </span>
        </p>
      </div>

      {/* API reference */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          Export API
        </p>
        <div className="rounded-lg border border-border-main bg-bg-panel p-4 font-mono text-xs space-y-3">
          <p className="text-text-muted">GET /api/export/dataset</p>
          <div className="space-y-1 pl-4 border-l border-border-main text-text-secondary">
            <p>?limit=50 — pairs per page (max 200)</p>
            <p>?page=1 — pagination</p>
            <p>?tag=solidity — filter by tag</p>
          </div>
        </div>
      </div>
    </div>
  );
}
