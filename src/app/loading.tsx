import { Code } from "lucide-react";

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1.5rem",
        color: "var(--apex-primary-400)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "64px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Spinning Outer Ring */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            border: "2px solid rgba(0, 243, 255, 0.1)",
            borderTopColor: "var(--apex-primary-500)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />

        <Code size={32} />
      </div>

      <p
        style={{
          fontSize: "1.1rem",
          fontWeight: 500,
          letterSpacing: "0.05em",
          background: "linear-gradient(to right, #00f3ff, #ff00ea)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "pulse 2s ease-in-out infinite",
        }}
      >
        DECODING VAULT...
      </p>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `,
        }}
      />
    </div>
  );
}
