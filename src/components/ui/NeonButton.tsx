import styles from "./NeonButton.module.css";

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "cyan" | "pink" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

const NeonButton = ({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  fullWidth = false,
}: NeonButtonProps) => {
  const rootClass = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

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

export default NeonButton;
