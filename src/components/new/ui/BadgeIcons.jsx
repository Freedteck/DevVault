import React from 'react';

/**
 * Unique SVG Badges for Apex UI
 * Design: Clean, geometric, vector-based. No emojis.
 */

export const HelperBadge = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
      fill="currentColor" 
      fillOpacity="0.2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

export const ContributorBadge = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 2L2 7L12 12L22 7L12 2Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M2 17L12 22L22 17" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M2 12L12 17L22 12" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

export const ExpertBadge = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path 
      d="M12 6V18" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
    <path 
      d="M6 12H18" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
    <path 
      d="M12 2L14.5 4.5" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
  </svg>
);

export const LegendBadge = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M2 4L12 2L22 4V10C22 16.5 17.5 21.5 12 22C6.5 21.5 2 16.5 2 10V4Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M9 12L11 14L15 10" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

export const getBadgeComponent = (tierName) => {
  switch (tierName?.toLowerCase()) {
    case 'helper': return HelperBadge;
    case 'contributor': return ContributorBadge;
    case 'expert': return ExpertBadge;
    case 'legend': return LegendBadge;
    default: return null;
  }
};
