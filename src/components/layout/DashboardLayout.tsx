"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/ToastContext";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { OnboardingBanner } from "@/components/ui/OnboardingBanner";
import { CommunityStats } from "@/components/layout/CommunityStats";
import { HotBounties } from "@/components/layout/HotBounties";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <WalletProvider>
      <ToastProvider>
        <div
          className="flex h-screen overflow-hidden bg-bg-base"
          suppressHydrationWarning
        >
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
              <div className="max-w-375 mx-auto w-full px-4 sm:px-6 py-6 lg:flex lg:gap-8">
                {/* Main Thread Content */}
                <div className="flex-1 min-w-0">
                  <OnboardingBanner />
                  {children}
                </div>

                {/* Right Column: Trending / Stats (Visible on large screens) */}
                <aside className="hidden xl:block w-72 shrink-0 space-y-6">
                  <CommunityStats />
                  <HotBounties />
                  <div id="thread-summary-portal" />

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
