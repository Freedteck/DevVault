import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import PropTypes from "prop-types";
import MarkdownRenderer from "./MarkdownRenderer";
import styles from "./ExpandableContent.module.css";

/**
 * ExpandableContent - Shows truncated content with expand/collapse
 * Improves DX by keeping UI clean while allowing full content access
 */
const ExpandableContent = ({ content, maxLength = 500, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  // Check if content needs truncation
  const needsTruncation = content.length > maxLength;

  if (!needsTruncation) {
    return <MarkdownRenderer content={content} className={className} />;
  }

  // Find a good breaking point (end of sentence or paragraph)
  const findBreakPoint = (text, max) => {
    if (text.length <= max) return text.length;

    // Try to break at paragraph
    let breakPoint = text.lastIndexOf("\n\n", max);
    if (breakPoint > max * 0.6) return breakPoint;

    // Try to break at sentence
    breakPoint = text.lastIndexOf(". ", max);
    if (breakPoint > max * 0.6) return breakPoint + 1;

    // Break at word
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

ExpandableContent.propTypes = {
  content: PropTypes.string.isRequired,
  maxLength: PropTypes.number,
  className: PropTypes.string,
};

export default ExpandableContent;
