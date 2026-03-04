"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/ui/ToastContext";
import { userPostUpdate } from "@/lib/hedera-client-tx";

export default function PostUpdatePage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (
    before: string,
    after: string = "",
    placeholder: string = "text",
  ) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end) || placeholder;
    const newValue =
      el.value.slice(0, start) +
      before +
      selected +
      after +
      el.value.slice(end);
    setBody(newValue);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const { accountId, isConnected, connector, profile } = useWallet();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!isConnected || !accountId || !connector) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (!title.trim()) {
      showToast("Update title is required.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await userPostUpdate(connector, {
        title: title.trim(),
        shortDescription:
          body.trim().slice(0, 160) || title.trim().slice(0, 160),
        body: body.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        author: { accountId, displayName: profile?.displayName ?? accountId },
      });

      showToast(
        `Update published on Hedera! TX: ${result.transactionId.slice(0, 24)}…`,
        "success",
      );

      // Trigger manual revalidation so the new update appears immediately despite the 1h cache
      try {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "/updates",
            secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
          }),
        });
      } catch (revalErr) {
        console.warn("Manual revalidation failed:", revalErr);
      }

      router.refresh();
      router.push("/updates");
    } catch (err) {
      showToast(`Failed: ${String(err)}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-main mb-1">
          Post an Update
        </h1>
        <p className="text-sm text-text-secondary">
          Share technical insights, ecosystem news, or project milestones with
          the Hedera community.
        </p>
      </div>

      <div className="space-y-6">
        {/* Title Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Update Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Announcing Vurso's integration with HCS-11"
            className="w-full px-4 py-2.5 bg-bg-panel border border-border-main rounded-md text-sm text-text-main outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>

        {/* Body Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
              Content (Markdown)
            </label>
            <div className="flex gap-2 text-[11px] text-text-muted">
              <span>Markdown Enabled</span>
            </div>
          </div>
          <div className="rounded-md border border-border-main overflow-hidden bg-bg-panel">
            <div className="flex items-center gap-1 px-2 py-1.5 bg-bg-subtle border-b border-border-main">
              <button
                onClick={() => insertMarkdown("**", "**", "bold")}
                type="button"
                title="Bold"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-bold text-text-secondary transition-colors"
              >
                B
              </button>
              <button
                onClick={() => insertMarkdown("_", "_", "italic")}
                type="button"
                title="Italic"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] italic text-text-secondary transition-colors"
              >
                I
              </button>
              <button
                onClick={() => insertMarkdown("`", "`", "code")}
                type="button"
                title="Inline code"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-mono text-text-secondary transition-colors"
              >
                &lt;&gt;
              </button>
              <button
                onClick={() => insertMarkdown("```\n", "\n```", "code here")}
                type="button"
                title="Code block"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-mono text-text-secondary transition-colors"
              >
                {}
              </button>
              <button
                onClick={() => insertMarkdown("[", "](url)", "link text")}
                type="button"
                title="Link"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] text-text-secondary transition-colors"
              >
                Link
              </button>
              <button
                onClick={() => insertMarkdown("- ", "", "item")}
                type="button"
                title="List item"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] text-text-secondary transition-colors"
              >
                List
              </button>
            </div>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Provide a detailed writeup of your update..."
              className="w-full h-80 p-4 bg-transparent outline-none text-[14px] text-text-secondary font-sans resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Tags (up to 5)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. hcs, release, announcement"
            className="w-full px-4 py-2 bg-bg-panel border border-border-main rounded-md text-sm text-text-main outline-none focus:border-primary-500 transition-all font-mono"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border-main gap-3">
          <p className="text-[11px] text-text-muted">
            {accountId
              ? "Your update will be immutable on HCS and content stored on IPFS."
              : "Connect your wallet to publish."}
          </p>
          <div className="flex gap-3">
            <Link
              href="/updates"
              className="px-5 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-main transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md text-sm font-bold text-white transition-all shadow-lg shadow-primary-600/10 active:scale-[0.98] ${
                isSubmitting
                  ? "bg-primary-800 cursor-wait opacity-70"
                  : "bg-primary-600 hover:bg-primary-700"
              }`}
            >
              {isSubmitting ? "Publishing…" : "Share with Community"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
