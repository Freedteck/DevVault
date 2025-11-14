import PropTypes from "prop-types";

const BadgeSVG = ({ tier, color, earned }) => {
  const badges = {
    Helper: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="40"
          cy="40"
          r="38"
          fill={earned ? color : "#e5e7eb"}
          stroke={earned ? "#fff" : "#d1d5db"}
          strokeWidth="2"
        />
        <path
          d="M40 15L43.09 28.18L55 25L47.55 35.82L60 40L47.55 44.18L55 55L43.09 51.82L40 65L36.91 51.82L25 55L32.45 44.18L20 40L32.45 35.82L25 25L36.91 28.18L40 15Z"
          fill={earned ? "#fff" : "#9ca3af"}
        />
      </svg>
    ),
    Contributor: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="40"
          cy="40"
          r="38"
          fill={earned ? color : "#e5e7eb"}
          stroke={earned ? "#fff" : "#d1d5db"}
          strokeWidth="2"
        />
        <path
          d="M40 12L45.45 29.55L63 35L45.45 40.45L40 58L34.55 40.45L17 35L34.55 29.55L40 12Z"
          fill={earned ? "#fff" : "#9ca3af"}
        />
        <circle
          cx="40"
          cy="40"
          r="12"
          fill={earned ? color : "#e5e7eb"}
          stroke={earned ? "#fff" : "#9ca3af"}
          strokeWidth="2"
        />
      </svg>
    ),
    Expert: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="40"
          cy="40"
          r="38"
          fill={earned ? color : "#e5e7eb"}
          stroke={earned ? "#fff" : "#d1d5db"}
          strokeWidth="3"
        />
        <path
          d="M40 10L46.18 26.18L63 32.36L46.18 38.54L40 54.72L33.82 38.54L17 32.36L33.82 26.18L40 10Z"
          fill={earned ? "#fff" : "#9ca3af"}
        />
        <path
          d="M40 25L42.5 32.5L50 35L42.5 37.5L40 45L37.5 37.5L30 35L37.5 32.5L40 25Z"
          fill={earned ? color : "#e5e7eb"}
        />
        <circle cx="40" cy="58" r="8" fill={earned ? "#fff" : "#9ca3af"} />
      </svg>
    ),
    Legend: (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={`gradient-${earned}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={earned ? color : "#e5e7eb"} />
            <stop offset="100%" stopColor={earned ? "#fff" : "#d1d5db"} />
          </linearGradient>
        </defs>
        <circle
          cx="40"
          cy="40"
          r="38"
          fill={`url(#gradient-${earned})`}
          stroke={earned ? "#fff" : "#d1d5db"}
          strokeWidth="3"
        />
        <path
          d="M40 8L47.55 23.82L65 26.91L52.5 39.09L55.28 56.45L40 48.45L24.72 56.45L27.5 39.09L15 26.91L32.45 23.82L40 8Z"
          fill={earned ? "#fff" : "#9ca3af"}
        />
        <circle
          cx="40"
          cy="40"
          r="15"
          fill={earned ? color : "#e5e7eb"}
          stroke={earned ? "#fff" : "#9ca3af"}
          strokeWidth="2"
        />
        <path
          d="M40 30L42 36L48 38L42 40L40 46L38 40L32 38L38 36L40 30Z"
          fill={earned ? "#fff" : "#9ca3af"}
        />
      </svg>
    ),
  };

  return badges[tier] || null;
};

BadgeSVG.propTypes = {
  tier: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  earned: PropTypes.bool.isRequired,
};

export default BadgeSVG;
