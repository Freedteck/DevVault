"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownExcerptProps {
  content: string;
  className?: string;
}

/**
 * A lighter version of MarkdownBody for card snippets.
 * Ensures the excerpt fits in a multi-line capped layout (line-clamp).
 */
export function MarkdownExcerpt({
  content,
  className = "",
}: MarkdownExcerptProps) {
  return (
    <div
      className={`text-sm leading-relaxed text-text-secondary line-clamp-2 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Render the root as a simple span/div to not break line-clamp
          p: ({ children }) => <span className="inline-block">{children}</span>,
          // Inline formatting
          strong: ({ children }) => (
            <strong className="font-semibold text-text-main">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-text-secondary">{children}</em>
          ),
          code({ className: cls, children, ...props }) {
            const isBlock = cls?.includes("language-");
            if (isBlock) {
              // Excerpts shouldn't have blocks, but if they do, render inline fallback
              return (
                <code className="bg-bg-subtle border border-border-main rounded px-1.5 py-0.5 text-xs font-mono text-primary-400">
                  {children}
                </code>
              );
            }
            return (
              <code
                className="bg-bg-subtle border border-border-main rounded px-1.5 py-0.5 text-xs font-mono text-primary-400"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Drop everything else to keep it as a 'snippet'
          h1: ({ children }) => (
            <strong className="text-text-main">{children}</strong>
          ),
          h2: ({ children }) => (
            <strong className="text-text-main">{children}</strong>
          ),
          h3: ({ children }) => (
            <strong className="text-text-main">{children}</strong>
          ),
          ul: ({ children }) => (
            <span className="inline-block">{children}</span>
          ),
          ol: ({ children }) => (
            <span className="inline-block">{children}</span>
          ),
          li: ({ children }) => (
            <span className="inline-block ml-1 before:content-['•'] before:mr-1">
              {children}
            </span>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
