import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import styles from "./ExpandableContent.module.css";

interface ExpandableContentProps {
  content: string;
  maxLength?: number;
  className?: string;
}

const ExpandableContent = ({
  content,
  maxLength = 500,
  className = "",
}: ExpandableContentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const needsTruncation = content.length > maxLength;

  if (!needsTruncation) {
    return <MarkdownRenderer content={content} className={className} />;
  }

  const findBreakPoint = (text: string, max: number) => {
    if (text.length <= max) return text.length;

    let breakPoint = text.lastIndexOf("\n\n", max);
    if (breakPoint > max * 0.6) return breakPoint;

    breakPoint = text.lastIndexOf(". ", max);
    if (breakPoint > max * 0.6) return breakPoint + 1;

    breakPoint = text.lastIndexOf(" ", max);
    return breakPoint > 0 ? breakPoint : max;
  };

  const breakPoint = findBreakPoint(content, maxLength);
  const truncatedContent = content.substring(0, breakPoint);
  const displayContent = isExpanded ? content : truncatedContent;

  return (
    <div className={styles.container}>
      <MarkdownRenderer content={displayContent} className={className} />

      {!isExpanded && <div className={styles.fadeOverlay} />}

      <button
        className={styles.toggleBtn}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <>
            <ChevronUp size={16} />
            <span>Show Less</span>
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            <span>Read Full Answer ({content.length} chars)</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ExpandableContent;
