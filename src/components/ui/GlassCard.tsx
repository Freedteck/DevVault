import styles from "./GlassCard.module.css";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: "default" | "paged" | "featured";
  onClick?: (e?: any) => void;
  style?: React.CSSProperties;
}

const GlassCard = ({
  children,
  className = "",
  hoverEffect = false,
  variant = "default",
  onClick,
  style,
}: GlassCardProps) => {
  const rootClass = [
    styles.card,
    hoverEffect ? styles.hoverable : "",
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={style}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: any) => (e.key === "Enter" || e.key === " ") && onClick(e)
          : undefined
      }
    >
      {children}
    </div>
  );
};

export default GlassCard;
