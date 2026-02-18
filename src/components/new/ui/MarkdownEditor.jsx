import { useState } from "react";
import {
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  Image,
  Eye,
  Edit3,
} from "lucide-react";
import styles from "./MarkdownEditor.module.css";
import PropTypes from "prop-types";

/**
 * MarkdownEditor - Rich markdown editor with preview
 * Provides toolbar and live preview for better DX
 */
const MarkdownEditor = ({ value, onChange, placeholder, minRows = 6 }) => {
  const [showPreview, setShowPreview] = useState(false);

  const insertMarkdown = (prefix, suffix = "", placeholder = "") => {
    const textarea = document.querySelector(`.${styles.textarea}`);
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    const newText =
      value.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      value.substring(end);

    onChange(newText);

    // Reset cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length,
      );
    }, 0);
  };

  const toolbarActions = [
    {
      icon: Bold,
      label: "Bold",
      action: () => insertMarkdown("**", "**", "bold text"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertMarkdown("*", "*", "italic text"),
    },
    {
      icon: Code,
      label: "Inline Code",
      action: () => insertMarkdown("`", "`", "code"),
    },
    {
      icon: Link,
      label: "Link",
      action: () => insertMarkdown("[", "](url)", "link text"),
    },
    {
      icon: List,
      label: "Bullet List",
      action: () => insertMarkdown("\n- ", "", "list item"),
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => insertMarkdown("\n1. ", "", "list item"),
    },
    {
      icon: Image,
      label: "Image",
      action: () => insertMarkdown("![", "](url)", "alt text"),
    },
  ];

  // Simple markdown to HTML renderer (basic support)
  const renderMarkdown = (text) => {
    let html = text
      // Code blocks
      .replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        '<pre><code class="language-$1">$2</code></pre>',
      )
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      )
      // Images
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 0.5rem;" />',
      )
      // Headers
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      // Line breaks
      .replace(/\n\n/g, "</p><p>")
      // Lists
      .replace(/^- (.*)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      .replace(/^\d+\. (.*)$/gm, "<li>$1</li>");

    return `<p>${html}</p>`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          {toolbarActions.map((action, index) => (
            <button
              key={index}
              type="button"
              className={styles.toolbarBtn}
              onClick={action.action}
              title={action.label}
            >
              <action.icon size={16} />
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`${styles.toolbarBtn} ${showPreview ? styles.active : ""}`}
          onClick={() => setShowPreview(!showPreview)}
          title={showPreview ? "Edit" : "Preview"}
        >
          {showPreview ? <Edit3 size={16} /> : <Eye size={16} />}
          <span className={styles.btnLabel}>
            {showPreview ? "Edit" : "Preview"}
          </span>
        </button>
      </div>

      {showPreview ? (
        <div
          className={styles.preview}
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(value || "*Nothing to preview*"),
          }}
        />
      ) : (
        <textarea
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
        />
      )}

      <div className={styles.footer}>
        <span className={styles.hint}>
          💡 Markdown supported: **bold** *italic* `code` [link](url)
          ![image](url)
        </span>
      </div>
    </div>
  );
};

MarkdownEditor.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  minRows: PropTypes.number,
};

export default MarkdownEditor;
