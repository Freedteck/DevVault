"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/ToastContext";
import { WalletProvider } from "@/components/wallet/WalletProvider";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <WalletProvider>
      <ToastProvider>
        <div className="flex h-screen overflow-hidden bg-bg-base">
          {/* Fixed Left Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Fluid Content Area */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

            <main className="flex-1 overflow-y-auto">
              {/* The Centered Container that brings things together */}
              <div className="max-w-[1500px] mx-auto w-full px-4 sm:px-6 py-6 lg:flex lg:gap-8">
                {/* Main Thread Content */}
                <div className="flex-1 min-w-0">{children}</div>

                {/* Right Column: Trending / Stats (Visible on large screens) */}
                <aside className="hidden xl:block w-72 shrink-0 space-y-6">
                  {/* Community Stats Card */}
                  <div className="rounded-lg border border-border-main bg-bg-panel p-4 space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                      Den Vitality
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-bold text-primary-500">
                          184.2k
                        </p>
                        <p className="text-[10px] text-text-muted uppercase">
                          DVT Circ
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">94</p>
                        <p className="text-[10px] text-text-muted uppercase">
                          Experts
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hot Bounties Card */}
                  <div className="rounded-lg border border-border-main bg-bg-panel p-4 space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                      Hot Bounties
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          title: "Hedera SDK Node.js Issue",
                          amount: "500 DVT",
                        },
                        { title: "Smart Contract Audit", amount: "50 HBAR" },
                        { title: "HCS-10 Agent Fix", amount: "120 DVT" },
                      ].map((b, i) => (
                        <div key={i} className="group cursor-pointer">
                          <p className="text-xs font-medium text-text-secondary group-hover:text-primary-400 transition-colors truncate">
                            {b.title}
                          </p>
                          <p className="text-[10px] font-mono text-primary-600">
                            {b.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Network Status */}
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-text-muted uppercase tracking-tighter">
                      Hedera Testnet Operational
                    </span>
                  </div>
                </aside>
              </div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </WalletProvider>
  );
}
