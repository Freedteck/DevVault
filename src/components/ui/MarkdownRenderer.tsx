import CollapsibleCode from "./CollapsibleCode";
import styles from "./MarkdownRenderer.module.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  collapsibleCode?: boolean;
  style?: React.CSSProperties;
}

const MarkdownRenderer = ({
  content,
  className = "",
  collapsibleCode = true,
  style,
}: MarkdownRendererProps) => {
  if (!content) return null;

  const parseContent = (text: string) => {
    const segments: any = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: any;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }

      segments.push({
        type: "code",
        language: match[1] || "plaintext",
        code: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({ type: "text", content: text.substring(lastIndex) });
    }

    return segments.length > 0 ? segments : [{ type: "text", content: text }];
  };

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/`([^`]+)`/g, '<code class="inlineCode">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="link">$1</a>',
      )
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="image" loading="lazy" />',
      )
      .replace(/^### (.*$)/gm, '<h3 class="heading3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="heading2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="heading1">$1</h1>')
      .replace(/^---$/gm, '<hr class="divider" />')
      .replace(/^> (.*)$/gm, '<blockquote class="blockquote">$1</blockquote>')
      .replace(/^\* (.*)$/gm, "<li>$1</li>")
      .replace(/^- (.*)$/gm, "<li>$1</li>")
      .replace(/^\d+\. (.*)$/gm, "<li>$1</li>");

    html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
      return `<ul class="list">${match}</ul>`;
    });

    html = html
      .split("\n\n")
      .map((para) => {
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
    <div className={`${styles.markdown} ${className}`} style={style}>
      {segments.map((segment: any, index: number) => {
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

export default MarkdownRenderer;
