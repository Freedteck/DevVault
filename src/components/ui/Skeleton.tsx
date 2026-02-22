import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  borderRadius = "0.5rem",
  animate = true,
}) => {
  const style: React.CSSProperties = {
    width: width || "100%",
    height: height || "1rem",
    borderRadius: borderRadius,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    position: "relative",
  };

  return (
    <div className={`skeleton ${className}`} style={style}>
      {animate && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .shimmer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.03),
              transparent
            );
            animation: shimmer 2s infinite;
          }
        `,
          }}
        />
      )}
      {animate && <div className="shimmer" />}
    </div>
  );
};

export default Skeleton;
