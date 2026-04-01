"use client";

import { useEffect, useRef, useState } from "react";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import usePostPythonQuery from "@/hooks/python/usePostQuery";
import { URLS } from "@/constants/url";
import { config } from "@/config";

const CyberStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@600;700&display=swap');

    @keyframes scanline {
      0%   { top: -2px; }
      100% { top: 100%; }
    }
    @keyframes borderPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }
    @keyframes cyberPing {
      0%   { transform: scale(1);   opacity: 0.7; }
      100% { transform: scale(2.4); opacity: 0;   }
    }
    @keyframes flicker {
      0%, 91%, 100% { opacity: 1;    }
      93%           { opacity: 0.82; }
      96%           { opacity: 1;    }
      98%           { opacity: 0.88; }
    }
    @keyframes countdownShrink {
      from { width: 100%; }
      to   { width: 0%;   }
    }

    .font-mono-cyber  { font-family: 'Share Tech Mono', monospace; }
    .font-display     { font-family: 'Rajdhani', sans-serif; }
    .cyber-flicker    { animation: flicker 8s ease-in-out infinite; }
    .pulse-dot        { animation: borderPulse 1.4s ease-in-out infinite; }
    .ping-ring        { animation: cyberPing 1.8s ease-out infinite; }
    .ping-ring-2      { animation: cyberPing 1.8s ease-out infinite; animation-delay: 0.7s; }

    .cyber-scanline { position: relative; overflow: hidden; }
    .cyber-scanline::after {
      content: '';
      position: absolute; left: 0; right: 0; height: 1px;
      pointer-events: none;
      animation: scanline 3s linear infinite;
    }
    .scanline-green::after { background: linear-gradient(90deg, transparent, rgba(0,255,136,0.5), transparent); }
    .scanline-red::after   { background: linear-gradient(90deg, transparent, rgba(255,51,85,0.5),  transparent); }

    .countdown-bar {
      animation: countdownShrink linear forwards;
    }
  `}</style>
);

const Corner = ({ pos, open }) => {
  const c = open
    ? "border-green-400 [box-shadow:0_0_8px_rgba(0,255,136,0.7)]"
    : "border-red-500 [box-shadow:0_0_8px_rgba(255,51,85,0.7)]";
  const p = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  }[pos];
  return (
    <div
      className={`absolute w-4 h-4 ${p} ${c} transition-colors duration-700`}
    />
  );
};

const Turnstile = ({ ipEntry, ipExit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef(null);

  const { mutate: openTurnstile } = usePostPythonQuery({
    listKeyId: "open-door",
  });

  const handleAccess = (ip) => {
    if (!ip) {
      console.warn("❌ IP manzil yo'q");
      return;
    }
    openTurnstile({
      url: `${config.PYTHON_API_URL_REPORT}${URLS.openDoor}`,
      attributes: { ipAddress: String(ip) },
    });
    if (isOpen) return;
    setIsOpen(true);
    setCountdown(5);
  };

  useEffect(() => {
    if (!isOpen) return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsOpen(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isOpen]);

  return (
    <>
      <CyberStyles />
      <div className="cyber-flicker space-y-4">
        {/* ── Gate UI ── */}
        <div
          className={`cyber-scanline relative rounded-2xl overflow-hidden border transition-all duration-700 ${
            isOpen
              ? "scanline-green border-green-400/40 [box-shadow:0_0_0_1px_rgba(0,255,136,0.08),0_0_40px_rgba(0,255,136,0.25),0_8px_32px_rgba(0,0,0,0.6)]"
              : "scanline-red border-red-500/40 [box-shadow:0_0_0_1px_rgba(255,51,85,0.08),0_0_40px_rgba(255,51,85,0.25),0_8px_32px_rgba(0,0,0,0.6)]"
          }`}
        >
          <Corner pos="tl" open={isOpen} />
          <Corner pos="tr" open={isOpen} />
          <Corner pos="bl" open={isOpen} />
          <Corner pos="br" open={isOpen} />

          {/* Gate background */}
          <div
            className={`relative h-36 w-full transition-colors duration-700 ${
              isOpen
                ? "bg-[linear-gradient(135deg,#001a0d,#002211)]"
                : "bg-[linear-gradient(135deg,#1a0008,#220011)]"
            }`}
          >
            {/* Ambient glow */}
            <div
              className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
                isOpen
                  ? "bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,255,136,0.08)_0%,transparent_70%)]"
                  : "bg-[radial-gradient(ellipse_at_50%_50%,rgba(255,51,85,0.08)_0%,transparent_70%)]"
              }`}
            />

            {/* Grid lines overlay */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Left panel */}
            <div
              className={`absolute left-0 top-0 h-full flex items-center justify-center transition-all duration-700 ease-in-out ${
                isOpen ? "w-0 opacity-0" : "w-[46%] opacity-100"
              } ${
                isOpen
                  ? "bg-[linear-gradient(90deg,rgba(0,255,136,0.2),rgba(0,255,136,0.05))]"
                  : "bg-[linear-gradient(90deg,rgba(255,51,85,0.35),rgba(255,51,85,0.15))]"
              } border-r ${isOpen ? "border-green-400/20" : "border-red-500/30"}`}
            >
              <span
                className={`font-mono-cyber text-[11px] font-bold tracking-[0.25em] rotate-90 transition-colors duration-700 ${
                  isOpen ? "text-green-400" : "text-red-400"
                }`}
              >
                {isOpen ? "PASS" : "STOP"}
              </span>
            </div>

            {/* Right panel */}
            <div
              className={`absolute right-0 top-0 h-full flex items-center justify-center transition-all duration-700 ease-in-out ${
                isOpen ? "w-0 opacity-0" : "w-[46%] opacity-100"
              } ${
                isOpen
                  ? "bg-[linear-gradient(270deg,rgba(0,255,136,0.2),rgba(0,255,136,0.05))]"
                  : "bg-[linear-gradient(270deg,rgba(255,51,85,0.35),rgba(255,51,85,0.15))]"
              } border-l ${isOpen ? "border-green-400/20" : "border-red-500/30"}`}
            >
              <span
                className={`font-mono-cyber text-[11px] font-bold tracking-[0.25em] -rotate-90 transition-colors duration-700 ${
                  isOpen ? "text-green-400" : "text-red-400"
                }`}
              >
                {isOpen ? "PASS" : "STOP"}
              </span>
            </div>

            {/* Center lock icon with pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center w-16 h-16">
                <div
                  className={`ping-ring absolute inset-0 rounded-full ${
                    isOpen
                      ? "bg-[radial-gradient(circle,rgba(0,255,136,0.3)_0%,transparent_70%)]"
                      : "bg-[radial-gradient(circle,rgba(255,51,85,0.3)_0%,transparent_70%)]"
                  }`}
                />
                <div
                  className={`ping-ring-2 absolute inset-0 rounded-full ${
                    isOpen
                      ? "bg-[radial-gradient(circle,rgba(0,255,136,0.15)_0%,transparent_70%)]"
                      : "bg-[radial-gradient(circle,rgba(255,51,85,0.15)_0%,transparent_70%)]"
                  }`}
                />
                <div
                  className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${
                    isOpen
                      ? "border-green-400/60 bg-[radial-gradient(circle_at_35%_35%,rgba(0,255,136,0.3),rgba(0,255,136,0.08))] [box-shadow:0_0_24px_rgba(0,255,136,0.5),inset_0_0_12px_rgba(0,255,136,0.15)]"
                      : "border-red-500/60 bg-[radial-gradient(circle_at_35%_35%,rgba(255,51,85,0.3),rgba(255,51,85,0.08))] [box-shadow:0_0_24px_rgba(255,51,85,0.5),inset_0_0_12px_rgba(255,51,85,0.15)]"
                  }`}
                >
                  {isOpen ? (
                    <LockOpenIcon sx={{ fontSize: 28, color: "#00ff88" }} />
                  ) : (
                    <LockIcon sx={{ fontSize: 28, color: "#ff3355" }} />
                  )}
                </div>
              </div>
            </div>

            {/* Status label bottom */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full pulse-dot ${
                    isOpen
                      ? "bg-green-400 [box-shadow:0_0_6px_#00ff88]"
                      : "bg-red-500 [box-shadow:0_0_6px_#ff3355]"
                  }`}
                />
                <span
                  className={`font-mono-cyber text-[9px] font-bold tracking-[0.2em] uppercase ${
                    isOpen ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isOpen ? "ДОСТУП ОТКРЫТ" : "ДОСТУП ЗАКРЫТ"}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown bar */}
          {isOpen && (
            <div className="h-1 relative overflow-hidden bg-slate-900">
              <div
                key={countdown}
                className="countdown-bar h-full bg-gradient-to-r from-green-500 to-green-300 [box-shadow:0_0_8px_rgba(0,255,136,0.8)]"
                style={{ animationDuration: "1s" }}
              />
            </div>
          )}
          {!isOpen && <div className="h-1 bg-red-500/20" />}
        </div>

        {/* ── Buttons ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Entry button */}
          <button
            disabled={isOpen}
            onClick={() => handleAccess(ipEntry)}
            className={`relative overflow-hidden rounded-xl px-6 py-4 font-display text-base font-bold tracking-widest uppercase transition-all duration-300 border ${
              isOpen
                ? "bg-green-500/10 border-green-400/30 text-green-400/50 cursor-not-allowed"
                : "bg-slate-900 border-sky-500/40 text-sky-300 hover:border-sky-400/70 hover:bg-sky-500/10 hover:[box-shadow:0_0_20px_rgba(56,189,248,0.25)] hover:scale-[1.02] active:scale-[0.98] [box-shadow:0_0_0_1px_rgba(56,189,248,0.1)]"
            }`}
          >
            {/* Button inner glow */}
            {!isOpen && (
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.08)_0%,transparent_60%)]" />
            )}
            <div className="relative flex items-center justify-center gap-2">
              <LoginArrow />
              <span>
                {isOpen ? (
                  <span className="font-mono-cyber text-sm">
                    ОТКРЫТО <span className="text-green-300">{countdown}с</span>
                  </span>
                ) : (
                  "Вход"
                )}
              </span>
            </div>
          </button>

          {/* Exit button */}
          <button
            disabled={isOpen}
            onClick={() => handleAccess(ipExit)}
            className={`relative overflow-hidden rounded-xl px-6 py-4 font-display text-base font-bold tracking-widest uppercase transition-all duration-300 border ${
              isOpen
                ? "bg-green-500/10 border-green-400/30 text-green-400/50 cursor-not-allowed"
                : "bg-slate-900 border-violet-500/40 text-violet-300 hover:border-violet-400/70 hover:bg-violet-500/10 hover:[box-shadow:0_0_20px_rgba(167,139,250,0.25)] hover:scale-[1.02] active:scale-[0.98] [box-shadow:0_0_0_1px_rgba(167,139,250,0.1)]"
            }`}
          >
            {!isOpen && (
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(167,139,250,0.08)_0%,transparent_60%)]" />
            )}
            <div className="relative flex items-center justify-center gap-2">
              <ExitArrow />
              <span>
                {isOpen ? (
                  <span className="font-mono-cyber text-sm">
                    ОТКРЫТО <span className="text-green-300">{countdown}с</span>
                  </span>
                ) : (
                  "Выход"
                )}
              </span>
            </div>
          </button>
        </div>

        {/* ── Footer status strip ── */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className="font-mono-cyber text-[9px] tracking-widest uppercase text-slate-600">
              ТУРНИКЕТ
            </span>
            <span className="font-mono-cyber text-[9px] text-slate-700">·</span>
            <span className="font-mono-cyber text-[9px] tracking-widest text-slate-600">
              SYS-T01
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1 h-1 rounded-full ${isOpen ? "bg-green-400" : "bg-red-500"} pulse-dot`}
            />
            <span
              className={`font-mono-cyber text-[9px] tracking-widest uppercase ${isOpen ? "text-green-400/60" : "text-red-400/60"}`}
            >
              {isOpen ? "ONLINE · OPEN" : "ONLINE · LOCKED"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

// Tiny SVG icons to avoid extra deps
const LoginArrow = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);
const ExitArrow = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default Turnstile;
