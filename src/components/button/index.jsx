"use client";

/**
 * CyberButton — reusable button component matching the project design system.
 *
 * Props:
 *  - variant   : "primary" | "danger" | "success" | "ghost" | "violet"   (default: "primary")
 *  - size      : "sm" | "md" | "lg"                                       (default: "md")
 *  - icon      : ReactNode — optional leading icon
 *  - iconRight : ReactNode — optional trailing icon
 *  - loading   : boolean   — shows a spinner and disables the button
 *  - disabled  : boolean
 *  - fullWidth : boolean   — stretches to full container width
 *  - onClick   : function
 *  - type      : "button" | "submit" | "reset"                            (default: "button")
 *  - className : string   — extra Tailwind classes for overrides
 *  - children  : ReactNode
 *
 * Usage examples:
 *  <CyberButton>Сохранить</CyberButton>
 *  <CyberButton variant="danger" icon={<LogoutIcon />}>Выход</CyberButton>
 *  <CyberButton variant="success" size="lg" loading>Загрузка...</CyberButton>
 *  <CyberButton variant="ghost" size="sm">Отмена</CyberButton>
 *  <CyberButton fullWidth variant="primary" type="submit">Войти</CyberButton>
 */

// ─── Variant config ───────────────────────────────────────────────────────────
const VARIANTS = {
  primary: {
    base: "text-sky-300 border-sky-500/40 bg-slate-900",
    hover:
      "hover:border-sky-400/70 hover:bg-sky-500/10 hover:[box-shadow:0_0_20px_rgba(56,189,248,0.25)]",
    glow: "bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.08)_0%,transparent_60%)]",
    ring: "[box-shadow:0_0_0_1px_rgba(56,189,248,0.1)]",
    dot: "bg-sky-400 [box-shadow:0_0_6px_#38bdf8]",
  },
  danger: {
    base: "text-red-400 border-red-500/40 bg-slate-900",
    hover:
      "hover:border-red-400/70 hover:bg-red-500/10 hover:[box-shadow:0_0_20px_rgba(255,51,85,0.3)]",
    glow: "bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,51,85,0.08)_0%,transparent_60%)]",
    ring: "[box-shadow:0_0_0_1px_rgba(255,51,85,0.1)]",
    dot: "bg-red-500 [box-shadow:0_0_6px_#ff3355]",
  },
  success: {
    base: "text-green-400 border-green-400/40 bg-slate-900",
    hover:
      "hover:border-green-400/70 hover:bg-green-400/10 hover:[box-shadow:0_0_20px_rgba(0,255,136,0.25)]",
    glow: "bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,255,136,0.07)_0%,transparent_60%)]",
    ring: "[box-shadow:0_0_0_1px_rgba(0,255,136,0.08)]",
    dot: "bg-green-400 [box-shadow:0_0_6px_#00ff88]",
  },
  violet: {
    base: "text-violet-400 border-violet-500/40 bg-slate-900",
    hover:
      "hover:border-violet-400/70 hover:bg-violet-500/10 hover:[box-shadow:0_0_20px_rgba(167,139,250,0.25)]",
    glow: "bg-[radial-gradient(ellipse_at_50%_0%,rgba(167,139,250,0.07)_0%,transparent_60%)]",
    ring: "[box-shadow:0_0_0_1px_rgba(167,139,250,0.08)]",
    dot: "bg-violet-400 [box-shadow:0_0_6px_#a78bfa]",
  },
  ghost: {
    base: "text-slate-400 border-white/[0.08] bg-transparent",
    hover:
      "hover:border-white/[0.16] hover:text-slate-200 hover:bg-white/[0.04]",
    glow: "bg-transparent",
    ring: "",
    dot: "bg-slate-500",
  },
};

// ─── Size config ──────────────────────────────────────────────────────────────
const SIZES = {
  sm: { wrap: "px-3 py-1.5 text-[10px] gap-1.5 rounded-lg", iconSize: 13 },
  md: { wrap: "px-4 py-2   text-xs     gap-2   rounded-xl", iconSize: 15 },
  lg: { wrap: "px-6 py-3   text-sm     gap-2.5 rounded-xl", iconSize: 18 },
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size }) => (
  <svg
    className="cyber-spinner flex-shrink-0"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeOpacity="0.2"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
const CyberButton = ({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = "button",
  className = "",
  children,
}) => {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;

  const isDisabled = disabled || loading;

  return (
    <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={[
          // base layout
          "relative overflow-hidden inline-flex items-center justify-center",
          "font-mono-cyber font-bold tracking-widest uppercase",
          "border transition-all duration-200",
          // size
          s.wrap,
          // variant colors
          v.base,
          v.ring,
          // hover (only when not disabled)
          !isDisabled && v.hover,
          !isDisabled && "hover:scale-[1.02] active:scale-[0.98]",
          // disabled state
          isDisabled && "opacity-40 cursor-not-allowed",
          // full width
          fullWidth && "w-full",
          // consumer overrides
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Ambient glow overlay */}
        <div className={`absolute inset-0 pointer-events-none ${v.glow}`} />

        {/* Content */}
        <span className="relative flex items-center justify-center gap-[inherit]">
          {loading ? (
            <Spinner size={s.iconSize} />
          ) : icon ? (
            <span
              className="flex-shrink-0 flex items-center"
              style={{ fontSize: s.iconSize }}
            >
              {icon}
            </span>
          ) : null}

          {children && <span>{children}</span>}

          {!loading && iconRight && (
            <span
              className="flex-shrink-0 flex items-center"
              style={{ fontSize: s.iconSize }}
            >
              {iconRight}
            </span>
          )}
        </span>
      </button>
  );
};

export default CyberButton;
