import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { ExpandableContent } from "./ExpandableContent";
import DOMPurify from "dompurify";

interface RichTextContentProps {
  content: string;
  className?: string;
  maxCommentHeight?: number;
}

export function RichTextContent({
  content,
  className = "",
  maxCommentHeight = 300,
}: RichTextContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [debug, setDebug] = useState(false);

  // Apply syntax highlighting directly to code blocks after render
  useEffect(() => {
    if (contentRef.current) {
      const codeBlocks = contentRef.current.querySelectorAll("pre code");

      codeBlocks.forEach((block) => {
        // Check if it has a language class
        const element = block as HTMLElement;

        try {
          // Add copy button to each code block
          const preElement = element.parentElement;
          if (preElement && !preElement.querySelector(".code-copy-button")) {
            // Create header with language info and copy button
            const headerDiv = document.createElement("div");
            headerDiv.className =
              "bg-muted/80 px-4 py-2 flex justify-between items-center text-sm code-block-header";

            // Get language from className if available
            let language = "";
            const languageMatch = element.className.match(/language-(\w+)/);
            if (languageMatch) {
              language = languageMatch[1];
              const langSpan = document.createElement("span");
              langSpan.className = "font-mono";
              langSpan.textContent = language;
              headerDiv.appendChild(langSpan);
            } else {
              const langSpan = document.createElement("span");
              langSpan.className = "font-mono text-muted-foreground";
              langSpan.textContent = "Code";
              headerDiv.appendChild(langSpan);
            }

            // Add copy button
            const copyBtn = document.createElement("button");
            copyBtn.className =
              "code-copy-button inline-flex h-8 px-2 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground";
            copyBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span class="ml-2">Copy</span>';

            const codeContent = element.textContent || "";
            copyBtn.addEventListener("click", async () => {
              await navigator.clipboard.writeText(codeContent);
              copyBtn.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M20 6 9 17l-5-5"/></svg><span class="ml-2">Copied</span>';
              setTimeout(() => {
                copyBtn.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span class="ml-2">Copy</span>';
              }, 2000);
            });

            headerDiv.appendChild(copyBtn);

            // Wrap the pre element with a container
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className =
              "code-block-wrapper relative rounded-md overflow-hidden border mt-4 mb-4";

            // Clone pre element to avoid DOM manipulation issues
            const preClone = preElement.cloneNode(true) as HTMLElement;
            preClone.className = "p-4 m-0 overflow-auto"; // Reset margins

            // Insert the wrapper before the pre element
            preElement.parentNode?.insertBefore(wrapperDiv, preElement);

            // Add the header and pre clone to the wrapper
            wrapperDiv.appendChild(headerDiv);
            wrapperDiv.appendChild(preClone);

            // Remove the original pre element
            preElement.parentNode?.removeChild(preElement);
          }

          // Apply syntax highlighting
          hljs.highlightElement(element);
        } catch (error) {
          console.error("Error applying code formatting:", error);
        }
      });
    }
  }, [content]);

  return (
    <>
      <ExpandableContent maxHeight={maxCommentHeight} className={className}>
        <div
          ref={contentRef}
          className={`prose max-w-none dark:prose-invert`}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      </ExpandableContent>
      <button
        className="text-xs text-muted-foreground hover:underline mt-1"
        onClick={() => setDebug(!debug)}
      >
        {debug ? "Hide Debug" : "Show Debug"}
      </button>
    </>
  );
}
