import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExpandableContent } from "./ExpandableContent";

interface CodeSnippetProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  maxVisibleLines?: number;
  className?: string;
}

export function CodeSnippet({
  code,
  language = "",
  showLineNumbers = true,
  maxVisibleLines = 10,
  className = "",
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  // Calculate approx height based on number of visible lines (20px per line + padding)
  const maxHeight = maxVisibleLines * 24 + 16;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative rounded-md overflow-hidden", className)}>
      <div className="bg-muted/80 px-4 py-2 flex justify-between items-center text-sm">
        {language && <span className="font-mono">{language}</span>}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>

      <ExpandableContent
        maxHeight={maxHeight}
        expandLabel="Show all code"
        collapseLabel="Show less code"
      >
        <pre
          className={cn(
            "p-4 m-0 overflow-auto",
            showLineNumbers && "pl-12 relative"
          )}
        >
          {showLineNumbers && (
            <div className="absolute left-0 top-0 p-4 text-right select-none text-muted-foreground w-8 border-r border-muted">
              {code.split("\n").map((_, i) => (
                <div key={i} className="text-xs">
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          <code className={language ? `language-${language}` : ""}>{code}</code>
        </pre>
      </ExpandableContent>
    </div>
  );
}
