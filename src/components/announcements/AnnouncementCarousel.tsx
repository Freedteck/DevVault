"use client";

import { useEffect, useState, useMemo } from "react";
import { ParsedHCSMessage } from "@/lib/hedera-mirror";
import { HCSAnnouncementPayload } from "@/lib/hcs-types";
import Link from "next/link";
import { MarkdownExcerpt } from "@/components/ui/MarkdownExcerpt";

interface AnnouncementCarouselProps {
  announcements: ParsedHCSMessage<HCSAnnouncementPayload>[];
}

export function AnnouncementCarousel({
  announcements,
}: AnnouncementCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const current = useMemo(
    () => announcements[currentIndex],
    [announcements, currentIndex],
  );

  useEffect(() => {
    if (isHovered || announcements.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000); // cycle every 6 seconds

    return () => clearInterval(timer);
  }, [announcements.length, isHovered]);

  const next = () =>
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  const prev = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + announcements.length) % announcements.length,
    );

  if (!current?.data) return null;

  return (
    <div
      className="relative group rounded-lg border border-primary-600/20 bg-primary-950/20 p-4 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 shrink-0 border border-primary-600/30">
            <span className="text-sm">📢</span>
          </div>
          <div className="min-w-0">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-400 mb-1">
              Platform Announcement #{current.sequenceNumber}
            </h4>
            <MarkdownExcerpt
              content={current.data.shortDescription || current.data.title}
              className="text-primary-100 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* Progress indicators */}
          {announcements.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 border border-white/5">
              {announcements.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "bg-primary-500 w-4"
                      : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link
              href={`/announcements/${current.sequenceNumber}`}
              className="px-4 py-1.5 rounded text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white transition-all uppercase tracking-widest shadow-lg shadow-primary-900/40"
            >
              Details
            </Link>

            {announcements.length > 1 && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={prev}
                  className="p-1 rounded hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="p-1 rounded hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple CSS for line clamping
const styles = `
.truncate-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
`;
