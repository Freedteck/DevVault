"use client";

import Link from "next/link";
import { useState } from "react";

export default function PostUpdatePage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");

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
            placeholder="e.g. Announcing DevVault's integration with HCS-11"
            className="w-full px-4 py-2.5 bg-bg-panel border border-border-main rounded-md text-sm text-text-main outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>

        {/* Body Editor placeholder */}
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
              {["B", "I", "<>", "Link", "List"].map((tool) => (
                <button
                  key={tool}
                  className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-medium text-text-secondary transition-colors"
                >
                  {tool}
                </button>
              ))}
            </div>
            <textarea
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
        <div className="flex items-center justify-between pt-4 border-t border-border-main">
          <p className="text-[11px] text-text-muted max-w-[280px]">
            Your update will be immutable on HCS and content stored on IPFS.
          </p>
          <div className="flex gap-3">
            <Link
              href="/updates"
              className="px-5 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-main transition-colors"
            >
              Cancel
            </Link>
            <button className="px-6 py-2 rounded-md text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-lg shadow-primary-600/10 active:scale-[0.98]">
              Share with Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
