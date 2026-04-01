"use client";

import Image from "next/image";

/**
 * ExcelButton — simple download button, always shows icon + label.
 *
 * Props:
 *  - onClick  : function
 *  - disabled : boolean (shows loading state)
 */
export default function ExcelButton({ onClick, disabled = false }) {
  return (
    <button
        onClick={!disabled ? onClick : undefined}
        disabled={disabled}
        className={[
          "relative overflow-hidden inline-flex items-center gap-2",
          "px-3 py-2 rounded-xl border transition-all duration-200",
          disabled
            ? "bg-slate-900 border-white/[0.06] cursor-not-allowed opacity-50"
            : "bg-slate-900 border-green-500/40 cursor-pointer [box-shadow:0_0_0_1px_rgba(0,255,136,0.06)] hover:border-green-400/70 hover:bg-green-500/[0.07] hover:[box-shadow:0_0_16px_rgba(0,255,136,0.2)] active:scale-[0.98]",
        ].join(" ")}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,255,136,0.07)_0%,transparent_60%)]" />

        {/* Icon or spinner */}
        <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {disabled ? (
            <svg
              className="excel-spinner"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="rgba(0,255,136,0.2)"
                strokeWidth="3"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="#00ff88"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <Image
              src="/icons/excel.svg"
              alt="excel"
              width={20}
              height={20}
              className="min-w-[20px] min-h-[20px]"
            />
          )}
        </div>

        {/* Label — always visible */}
        <span className="relative font-mono-cyber text-[11px] tracking-widest uppercase text-green-400 whitespace-nowrap">
          {disabled ? "Загрузка..." : "Скачать Excel"}
        </span>

        {/* Pulsing dot */}
        {!disabled && (
          <div className="relative flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-400 excel-pulse [box-shadow:0_0_6px_#00ff88]" />
        )}
      </button>
  );
}
