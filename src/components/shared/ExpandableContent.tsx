import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableContentProps {
  children: React.ReactNode;
  maxHeight?: number; // in pixels
  expandLabel?: string;
  collapseLabel?: string;
  initiallyExpanded?: boolean;
  className?: string;
}

export function ExpandableContent({
  children,
  maxHeight = 200,
  expandLabel = "Show more",
  collapseLabel = "Show less",
  initiallyExpanded = false,
  className = "",
}: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [shouldShowButton, setShouldShowButton] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content overflows max height
  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setShouldShowButton(contentHeight > maxHeight);
    }
  }, [children, maxHeight]);

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className="relative overflow-hidden transition-all duration-300"
        style={{ maxHeight: isExpanded ? "none" : `${maxHeight}px` }}
      >
        {children}
        {!isExpanded && shouldShowButton && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>

      {shouldShowButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              {collapseLabel}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              {expandLabel}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
