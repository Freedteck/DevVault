"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownBodyProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown content with GFM support (tables, strikethrough, task lists, code blocks).
 * Used for question bodies, answer bodies, and update bodies.
 */
export function MarkdownBody({ content, className = "" }: MarkdownBodyProps) {
  return (
    <div className={`prose-devvault ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ className: cls, children, ...props }) {
            const isBlock = cls?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-bg-subtle border border-border-main rounded-md px-4 py-3 overflow-x-auto text-xs font-mono my-3">
                  <code className={cls} {...props}>
                    {children}
                  </code>
                </pre>
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
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold text-text-main mt-6 mb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-text-main mt-5 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-text-main mt-4 mb-2">
              {children}
            </h3>
          ),
          // Paragraph
          p: ({ children }) => (
            <p className="text-[15px] leading-relaxed text-text-secondary my-3">
              {children}
            </p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-[15px] text-text-secondary my-3 space-y-1 pl-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-[15px] text-text-secondary my-3 space-y-1 pl-2">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary-600 pl-4 my-3 text-text-muted italic">
              {children}
            </blockquote>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          // Horizontal rule
          hr: () => <hr className="border-border-main my-6" />,
          // Strong / em
          strong: ({ children }) => (
            <strong className="font-semibold text-text-main">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-text-secondary">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
