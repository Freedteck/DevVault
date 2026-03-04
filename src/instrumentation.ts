/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically executed by Next.js when the server starts.
 * We use it to launch our background services (AI Agent + Swap Listener)
 * so they run autonomously without needing separate terminals.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // We import dynamically to ensure they're only loaded in the Node.js runtime
    const { startAIAgent } = await import("./lib/agent-service");
    const { startSwapService } = await import("./lib/swap-service");

    console.log("🚀  Initializing DevVault Background Services...");

    // Launch services without awaiting so they don't block server startup
    startAIAgent().catch((err) =>
      console.error("❌  AI Agent failed to start:", err),
    );
    startSwapService().catch((err) =>
      console.error("❌  Swap Service failed to start:", err),
    );
  }
}
