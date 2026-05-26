"use client";

import Brand from "../brand";
import { signOut } from "next-auth/react";
import ExitModal from "../modal/exit-modal";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

const navLinks = [
  { href: "/secure-section", label: "Система контроля доступа" },
  // { href: "/reports", label: "Отчёты" },
];

const Header = () => {
  const router = useRouter();
  const [openExitModal, setOpenExitModal] = useState(false);
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({ redirect: true, callbackUrl: "http://10.20.6.30:3000" });
  };

  return (
    <div suppressHydrationWarning>
      <div className="w-full">
        {/* ── Main header bar ── */}
        <header className="relative w-full overflow-hidden rounded-2xl px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/[0.07] text-slate-100 [box-shadow:0_4px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)]">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sky-500/60 [box-shadow:0_0_6px_rgba(56,189,248,0.4)]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-sky-500/60 [box-shadow:0_0_6px_rgba(56,189,248,0.4)]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-sky-500/60 [box-shadow:0_0_6px_rgba(56,189,248,0.4)]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sky-500/60 [box-shadow:0_0_6px_rgba(56,189,248,0.4)]" />

          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.04)_0%,transparent_60%)]" />

          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Brand */}
            <Brand />

            {/* Nav */}
            <nav className="w-full lg:w-auto">
              <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
                {navLinks.map(({ href, label }) => {
                  const isActive = router.pathname === href;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-cyber text-xs tracking-widest uppercase transition-all duration-200 ${
                          isActive
                            ? "bg-sky-500/10 border border-sky-500/40 text-sky-300 [box-shadow:0_0_12px_rgba(56,189,248,0.15)]"
                            : "border border-transparent text-slate-400 hover:text-sky-300 hover:border-sky-500/25 hover:bg-sky-500/[0.06]"
                        }`}
                      >
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 pulse-dot [box-shadow:0_0_6px_#38bdf8]" />
                        )}
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              {/* Logout button */}
              <button
                onClick={() => setOpenExitModal(true)}
                className="relative overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-cyber text-xs tracking-widest uppercase border border-red-500/30 transition-all duration-200 hover:border-red-400/60 hover:bg-red-500/10 hover:[box-shadow:0_0_16px_rgba(255,51,85,0.2)] hover:scale-[1.02] active:scale-[0.98] [box-shadow:0_0_0_1px_rgba(255,51,85,0.08)] sm:px-4 text-red-400 bg-slate-900"
              >
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,51,85,0.07)_0%,transparent_60%)]" />
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="relative">Выход</span>
              </button>
            </div>
          </div>

          <ExitModal
            open={openExitModal}
            onClose={() => setOpenExitModal(false)}
            handleLogout={handleLogout}
          />
        </header>

        {/* ── Marquee strip ── */}
        <div className="relative mt-2 w-full overflow-hidden rounded-lg border border-yellow-500/20 bg-yellow-500/[0.06] py-1.5 [box-shadow:0_0_12px_rgba(234,179,8,0.08)]">
          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

          <div className="flex items-center gap-3 px-4">
            <span className="flex-shrink-0 font-mono-cyber text-[9px] font-bold tracking-[0.2em] uppercase text-yellow-500/70 border border-yellow-500/30 px-2 py-0.5 rounded">
              ИНФО
            </span>
            <div className="overflow-hidden flex-1">
              <p className="cyber-marquee font-mono-cyber text-[11px] text-yellow-400/70 tracking-widest">
                ⚠ &nbsp; Сайт работает в тестовом режиме &nbsp; · &nbsp; Сайт
                работает в тестовом режиме &nbsp; · &nbsp; Сайт работает в
                тестовом режиме
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
