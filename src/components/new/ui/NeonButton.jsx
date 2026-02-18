import React from 'react';
import PropTypes from 'prop-types';
import styles from './NeonButton.module.css';

/**
 * NeonButton Component
 * 
 * Why: Standard buttons are boring. To win a hackathon, interactions need energy.
 * This button uses colored shadows and gradients to feel "electric" and "alive".
 * 
 * Variants:
 * - primary: Electric Violet (Main actions)
 * - cyan: Data/Info actions
 * - pink: Urgent/Live actions
 * - ghost: Subtle actions
 */
const NeonButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon = null,
  onClick,
  disabled = false,
  className = "",
  type = "button"
}) => {
  const rootClass = [
    styles.button,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={rootClass} 
      onClick={onClick} 
      disabled={disabled}
      type={type}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.content}>{children}</span>
      {/* Glow element for animation */}
      <span className={styles.glow} />
    </button>
  );
};

NeonButton.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'cyan', 'pink', 'ghost', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.node,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string
};

export default NeonButton;
