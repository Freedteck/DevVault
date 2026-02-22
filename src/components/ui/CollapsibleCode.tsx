import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import styles from "./CollapsibleCode.module.css";

interface CollapsibleCodeProps {
  code: string;
  language?: string;
  defaultCollapsed?: boolean;
}

const CollapsibleCode = ({
  code,
  language = "plaintext",
  defaultCollapsed = false,
}: CollapsibleCodeProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const lines = code.split("\n");
  const shouldBeCollapsible = lines.length > 10;
  const previewLines = lines.slice(0, 3).join("\n");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {shouldBeCollapsible && (
          <button
            className={styles.toggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        )}
        <span className={styles.language}>{language}</span>
        <div className={styles.spacer} />
        <button
          className={styles.copyBtn}
          onClick={handleCopy}
          title={isCopied ? "Copied!" : "Copy code"}
        >
          {isCopied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre
        className={`${styles.codeBlock} ${isCollapsed ? styles.collapsed : ""}`}
      >
        <code className={`language-${language}`}>
          {isCollapsed ? previewLines + "\n..." : code}
        </code>
      </pre>
      {shouldBeCollapsible && isCollapsed && (
        <button
          className={styles.expandBtn}
          onClick={() => setIsCollapsed(false)}
        >
          Show {lines.length - 3} more lines
        </button>
      )}
    </div>
  );
};

export default CollapsibleCode;
