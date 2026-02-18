import PropTypes from 'prop-types';
import styles from './GlassCard.module.css';

/**
 * GlassCard Component
 * 
 * Why: This is the core container for the "Apex" aesthetic. 
 * It replaces the standard solid-background cards to give a modern, layered feel.
 * 
 * Features:
 * - Backdrop blur
 * - Semi-transparent background
 * - Subtle border highlight
 * - Optional hover effects (lift + glow)
 */
const GlassCard = ({ 
  children, 
  className = "", 
  hoverEffect = false,
  variant = "default", // default, paged, featured
  onClick 
}) => {
  const rootClass = [
    styles.card,
    hoverEffect ? styles.hoverable : '',
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  // Always use div to prevent <button> inside <button> nesting issues
  // The consumer handles internal button propagation stopping if needed.
  return (
    <div 
      className={rootClass} 
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick(e) : undefined}
    >
      {/* Decorative gradient blob for "featured" variant could go here */}
      {children}
    </div>
  );
};

GlassCard.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  hoverEffect: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'paged', 'featured']),
  onClick: PropTypes.func
};

export default GlassCard;
