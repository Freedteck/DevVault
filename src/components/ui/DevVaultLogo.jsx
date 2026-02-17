import PropTypes from 'prop-types';
import styles from './DevVaultLogo.module.css';

const DevVaultLogo = ({ size = 'medium', showText = true, className = '' }) => {
  const sizeClass = styles[size];

  return (
    <div className={`${styles.logoContainer} ${sizeClass} ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className={styles.logoSvg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Shield base */}
        <path
          d="M60 10 L95 25 L95 55 Q95 85 60 105 Q25 85 25 55 L25 25 Z"
          fill="url(#logoGradient)"
          stroke="#1e40af"
          strokeWidth="2"
        />

        {/* Inner shield highlight */}
        <path
          d="M60 15 L88 28 L88 52 Q88 78 60 95 Q32 78 32 52 L32 28 Z"
          fill="none"
          stroke="url(#accentGradient)"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Code brackets */}
        <g fill="white" fontFamily="monospace" fontSize="14" fontWeight="bold">
          {/* Left bracket */}
          <text x="35" y="59" textAnchor="middle">{"{"}</text>
          {/* Right bracket */}
          <text x="85" y="59" textAnchor="middle">{"}"}</text>
        </g>

        {/* Central element - stylized 'D' and 'V' */}
        <g fill="white" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">
          <text x="60" y="60" textAnchor="middle" letterSpacing="1px">DV</text>
        </g>

        {/* Circuit-like decorative elements */}
        <g stroke="url(#accentGradient)" strokeWidth="1.5" fill="none" opacity="0.8">
          {/* Top circuit */}
          <path d="M45 20 Q60 15 75 20" />
          {/* Bottom circuit */}
          <path d="M45 80 Q60 85 75 80" />
          {/* Side connections */}
          <line x1="35" y1="35" x2="40" y2="35" />
          <line x1="80" y1="35" x2="85" y2="35" />
          <line x1="35" y1="55" x2="40" y2="55" />
          <line x1="80" y1="55" x2="85" y2="55" />
        </g>

        {/* Small accent dots */}
        <circle cx="50" cy="30" r="1.5" fill="url(#accentGradient)" opacity="0.7" />
        <circle cx="70" cy="30" r="1.5" fill="url(#accentGradient)" opacity="0.7" />
        <circle cx="50" cy="70" r="1.5" fill="url(#accentGradient)" opacity="0.7" />
        <circle cx="70" cy="70" r="1.5" fill="url(#accentGradient)" opacity="0.7" />
      </svg>

      {showText && (
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>DevVault</span>
          <span className={styles.logoSubtitle}>Developer Platform</span>
        </div>
      )}
    </div>
  );
};

DevVaultLogo.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showText: PropTypes.bool,
  className: PropTypes.string,
};

export default DevVaultLogo;
