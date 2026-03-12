"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Debugger's Den",
    href: "/questions",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    label: "Updates",
    href: "/updates",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1" />
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: "Dataset",
    href: "/dataset",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
      </svg>
    ),
  },
  {
    label: "Why Vurso?",
    href: "/why",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { accountId } = useWallet();
  const [balance, setBalance] = useState({ hbar: 0, vrs: 0 });
  const displayBalance = accountId ? balance : { hbar: 0, vrs: 0 };

  useEffect(() => {
    if (!accountId) return;

    const fetchBalance = async () => {
      try {
        const tokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;
        if (!tokenId) return;
        const mirrorNodeBase =
          process.env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
            ? "https://mainnet-public.mirrornode.hedera.com/api/v1"
            : "https://testnet.mirrornode.hedera.com/api/v1";

        const [accountRes, tokenRes] = await Promise.all([
          fetch(`${mirrorNodeBase}/accounts/${accountId}`),
          fetch(
            `${mirrorNodeBase}/accounts/${accountId}/tokens?token.id=${tokenId}`,
          ),
        ]);

        let hbar = 0;
        let vrs = 0;

        if (accountRes.ok) {
          const req = await accountRes.json();
          hbar = Number(req.balance?.balance ?? 0) / 100_000_000;
        }

        if (tokenRes.ok) {
          const body = await tokenRes.json();
          const token = body.tokens?.[0];
          if (token) {
            vrs = Number(token.balance) / 100; // 2 decimals for VRS
          }
        }

        setBalance({ hbar, vrs });
      } catch (err) {
        console.error("Failed to fetch balance", err);
      }
    };

    fetchBalance();

    // Refresh balance every 15 seconds
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [accountId]);

  return (
    <>
      <aside
        suppressHydrationWarning
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 border-r bg-bg-panel border-border-main transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-14 border-b shrink-0 border-border-main">
          <div className="flex items-center">
            <span className="font-bold tracking-tight text-lg text-text-main">
              Vur<span className="text-primary-500">so</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-bg-subtle text-text-muted"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? "bg-bg-subtle text-primary-500"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-main"
                    }`}
                  >
                    <span className={isActive ? "text-primary-500" : "inherit"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="my-4 border-t border-border-main" />

          {/* VRS Balance */}
          {accountId && (
            <div className="mx-1 px-3 py-3 rounded-md bg-bg-subtle">
              <p className="text-[11px] uppercase tracking-widest font-medium mb-2 text-text-muted">
                Your Balance
              </p>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-lg font-bold text-primary-500">
                  {displayBalance.vrs.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xs font-medium text-text-secondary">
                  VRS
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-sm text-text-secondary">
                  {displayBalance.hbar.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
                </span>
                <span className="text-xs text-text-muted">HBAR</span>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t text-[11px] shrink-0 border-border-main text-text-muted">
          <p>Vurso · Hedera Testnet</p>
          <p className="mt-0.5">Apex 2026</p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
