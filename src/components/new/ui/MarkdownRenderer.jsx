import PropTypes from "prop-types";
import CollapsibleCode from "./CollapsibleCode";
import styles from "./MarkdownRenderer.module.css";

/**
 * MarkdownRenderer - Renders markdown content with collapsible code blocks
 * Used in cards and detail pages for displaying rich content
 */
const MarkdownRenderer = ({
  content,
  className = "",
  collapsibleCode = true,
}) => {
  if (!content) return null;

  // Parse content into segments (text and code blocks)
  const parseContent = (text) => {
    const segments = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        segments.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }

      // Add code block
      segments.push({
        type: "code",
        language: match[1] || "plaintext",
        code: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: "text",
        content: text.substring(lastIndex),
      });
    }

    return segments.length > 0 ? segments : [{ type: "text", content: text }];
  };

  // Enhanced markdown to HTML renderer (without code blocks)
  const renderMarkdown = (text) => {
    let html = text
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="inlineCode">$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="link">$1</a>',
      )
      // Images
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="image" loading="lazy" />',
      )
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="heading3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="heading2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="heading1">$1</h1>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="divider" />')
      // Blockquotes
      .replace(/^> (.*)$/gm, '<blockquote class="blockquote">$1</blockquote>')
      // Unordered lists
      .replace(/^\* (.*)$/gm, "<li>$1</li>")
      .replace(/^- (.*)$/gm, "<li>$1</li>")
      // Ordered lists
      .replace(/^\d+\. (.*)$/gm, "<li>$1</li>");

    // Wrap consecutive list items in ul/ol
    html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
      return `<ul class="list">${match}</ul>`;
    });

    // Wrap paragraphs
    html = html
      .split("\n\n")
      .map((para) => {
        // Don't wrap if already a block element
        if (para.match(/^<(h[1-6]|pre|ul|ol|blockquote|hr)/)) {
          return para;
        }
        return `<p class="paragraph">${para}</p>`;
      })
      .join("\n");

    return html;
  };

  const segments = parseContent(content);

  return (
    <div className={`${styles.markdown} ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === "code" && collapsibleCode) {
          return (
            <CollapsibleCode
              key={index}
              code={segment.code}
              language={segment.language}
              defaultCollapsed={segment.code.split("\n").length > 10}
            />
          );
        } else if (segment.type === "code") {
          // Fallback to simple code block
          return (
            <pre key={index} className={styles.codeBlock}>
              <code className={`language-${segment.language}`}>
                {segment.code}
              </code>
            </pre>
          );
        } else {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(segment.content),
              }}
            />
          );
        }
      })}
    </div>
  );
};

MarkdownRenderer.propTypes = {
  content: PropTypes.string.isRequired,
  className: PropTypes.string,
  collapsibleCode: PropTypes.bool,
};

export default MarkdownRenderer;
