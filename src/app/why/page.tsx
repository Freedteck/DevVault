import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why Vurso? | Vurso",
  description:
    "Why developers should use Vurso instead of LLMs like Copilot or Claude. Economic accountability produces better answers.",
};

const advantages = [
  {
    title: "LLMs will never pay you",
    llm: "Copilot and Claude were trained on your GitHub code and Stack Overflow answers. You contributed nothing, earned nothing. They charge $20/month for access to your own knowledge.",
    vurso:
      "Every accepted answer earns you HBAR or VRS. Every tip earns you directly. You can earn for asking a good question — not just answering one.",
  },
  {
    title: "Economic accountability produces better answers",
    llm: "When an LLM gives you wrong code that breaks production, it loses nothing. It gives the same wrong answer to the next 10,000 developers.",
    vurso:
      "Answerers pay a deposit before posting. If their answer is accepted, they get it back plus the bounty. If not — they lose the deposit. Skin in the game drives correctness.",
  },
  {
    title: "LLMs give the average. Vurso selects the best.",
    llm: "LLMs are trained on everything — good and bad code. They output a weighted average of all developer knowledge on the internet, including incorrect answers.",
    vurso:
      "Multiple developers compete for the bounty. The asker accepts the best answer. The mechanism selects for excellence, not average. Accepted answers are economically verified.",
  },
  {
    title: "Real-time knowledge — no training cutoff",
    llm: "LLMs have a training cutoff. A new Hedera SDK bug released last week? A new framework quirk? The LLM confidently gives you months-old information.",
    vurso:
      "When a new SDK drops or a breaking change ships, experts who have used it can answer immediately. The community's knowledge is always current.",
  },
  {
    title: "Knowledge compounds here — on LLMs it resets",
    llm: "When 5,000 devs ask Copilot the same question, each gets a private answer. The solution never accumulates anywhere. Developer 5,001 starts from zero again.",
    vurso:
      "The first dev who asks gets an answer on-chain. Every dev after finds it immediately. Collective knowledge compounds permanently. LLMs structurally cannot do this.",
  },
  {
    title: "Portable on-chain reputation",
    llm: "Your Stack Overflow reputation lives in their database. They can change the rules, ban accounts, or shut down. Your standing disappears.",
    vurso:
      "Your reputation is your Hedera account ID. Accepted answers, VRS earned, and bounties won are all on HCS — publicly queryable, ownable, and permanent.",
  },
  {
    title: "You own your data and earn from it",
    llm: "Stack Overflow sold their data to OpenAI for millions. The developers who wrote those answers received zero. Their knowledge, someone else's payday.",
    vurso:
      "Every contribution is attributed to your Hedera account on-chain. When the LLM Training Dataset is licensed, contributors earn proportionally — automatically.",
  },
];

const tipEconomy = [
  {
    action: "Ask a question",
    detail:
      "If your question saves 500 other devs hours each, they can tip you. You get paid for articulating a problem clearly.",
  },
  {
    action: "Answer a question",
    detail:
      "Earn the bounty, earn tips from anyone who found your answer helpful. Two revenue streams from one contribution.",
  },
  {
    action: "Post an update",
    detail:
      "Share a framework discovery, a breaking change, a security find. Devs who benefit can tip you directly.",
  },
];

export default function WhyVursoPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="space-y-2 pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-main">
          Why Vurso?
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
          LLMs are fast. But there is a category of problems they structurally
          cannot solve — where you need economically verified expertise,
          knowledge that compounds, and the ability to earn from what you know.
          That is where Vurso wins.
        </p>
      </div>

      {/* Headline comparison */}
      <div className="rounded-lg border border-border-main bg-bg-panel px-5 py-4 space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          The difference
        </p>
        <p className="text-sm text-text-secondary">
          Copilot gives you an answer.{" "}
          <span className="text-text-main font-medium">
            Vurso gives you an answer from someone who got paid to be right.
          </span>
        </p>
      </div>

      {/* 7 permanent advantages */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          7 reasons LLMs cannot replicate this
        </p>
        <p className="text-xs text-text-muted">
          These are not temporary weaknesses. They are structural limitations.
        </p>
        <div className="space-y-px rounded-lg overflow-hidden border border-border-main">
          {advantages.map((adv, i) => (
            <div
              key={adv.title}
              className={`bg-bg-panel ${i > 0 ? "border-t border-border-main" : ""}`}
            >
              <div className="px-5 py-3 border-b border-border-main/50">
                <p className="text-sm font-semibold text-text-main">
                  {adv.title}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border-main/50">
                <div className="px-5 py-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1.5">
                    LLMs
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {adv.llm}
                  </p>
                </div>
                <div className="px-5 py-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500 mb-1.5">
                    Vurso
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {adv.vurso}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip economy */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          Earn for everything — not just answers
        </p>
        <p className="text-sm text-text-secondary max-w-2xl">
          On every other platform, you contribute knowledge and the platform
          profits. On Vurso, every contribution earns — whether you asked,
          answered, or shared.
        </p>
        <div className="rounded-lg border border-border-main bg-bg-panel divide-y divide-border-main">
          {tipEconomy.map(({ action, detail }) => (
            <div key={action} className="px-5 py-4 space-y-1">
              <p className="text-sm font-semibold text-text-main">{action}</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dataset note */}
      <div className="rounded-lg border border-border-main bg-bg-panel px-5 py-4 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          We are not competing with LLMs — we are training the next generation
          of them
        </p>
        <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
          Every verified Q&amp;A pair on Vurso is economically staked,
          attributed on-chain, and permanently recorded on Hedera. LLMs
          hallucinate because they were trained on unverified scraped data.
          Vurso{"'"}s dataset is different — and when AI companies license it,
          the developers who created that knowledge get paid.
        </p>
        <Link
          href="/dataset"
          className="inline-block text-sm font-medium text-primary-500 hover:text-primary-400 transition-colors"
        >
          View the Dataset Marketplace
        </Link>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          Start earning from your knowledge today
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/questions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          >
            Browse Questions
          </Link>
          <Link
            href="/questions/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border-main hover:bg-bg-subtle text-text-secondary hover:text-text-main transition-colors"
          >
            Ask a Question
          </Link>
        </div>
      </div>
    </div>
  );
}
