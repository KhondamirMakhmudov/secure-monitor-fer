"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Avatar from "../avatar";
import ReportIcon from "@mui/icons-material/Report";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { config } from "@/config";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import LoginIcon from "@mui/icons-material/Login";
import dayjs from "dayjs";

// Constants
const TIME_SECTION_NAMES = {
  0: "КПП АО ТЭС",
  1: "КПП АО ТЭС",
  2: "КПП АО ТЭС",
  3: "КПП АО ТЭС",
  4: "КПП АО ТЭС",
  5: "КПП АО ТЭС",
  6: "КПП АО ТЭС",
};

const ERROR_MESSAGES = {
  0: "Доступ разрешён",
  16: "Нет доступа",
  32: "Проход запрещён (вне графика)",
};

const ANIMATIONS = {
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3 },
  },
};

// Keyframes injected once — only what Tailwind can't express
const CyberStyles = () => (
  <style>{`
    @keyframes scanline {
      0%   { top: 0%; }
      100% { top: 100%; }
    }
    @keyframes cyberPing {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(2.2); opacity: 0;   }
    }
    @keyframes borderPulse {
      0%, 100% { opacity: 1;   }
      50%       { opacity: 0.5; }
    }
    @keyframes flicker {
      0%, 92%, 100% { opacity: 1;    }
      94%           { opacity: 0.85; }
      96%           { opacity: 1;    }
      98%           { opacity: 0.9;  }
    }

    .cyber-flicker   { animation: flicker 9s ease-in-out infinite; }

    .cyber-scanline::after {
      content: '';
      position: absolute; left: 0; right: 0;
      height: 1px;
      animation: scanline 4s linear infinite;
      pointer-events: none;
    }
    .cyber-scanline-green::after { background: linear-gradient(90deg, transparent, rgba(0,255,136,0.35), transparent); }
    .cyber-scanline-red::after   { background: linear-gradient(90deg, transparent, rgba(255,51,85,0.35),  transparent); }

    .ping-ring   { animation: cyberPing 1.8s ease-out infinite; }
    .ping-ring-2 { animation: cyberPing 1.8s ease-out infinite; animation-delay: 0.6s; }
    .pulse-dot   { animation: borderPulse 1.5s ease-in-out infinite; }
    .status-glow { animation: borderPulse 3s ease-in-out infinite; }
  `}</style>
);

// --- Corner bracket ---
const Corner = ({ pos, isSuccess }) => {
  const colorClass = isSuccess
    ? "border-green-400 [box-shadow:0_0_6px_rgba(0,255,136,0.5)]"
    : "border-red-500 [box-shadow:0_0_6px_rgba(255,51,85,0.5)]";
  const posClass = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  }[pos];
  return <div className={`absolute w-5 h-5 ${posClass} ${colorClass}`} />;
};

const CornerGray = ({ pos }) => {
  const posClass = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  }[pos];
  return <div className={`absolute w-5 h-5 ${posClass} border-slate-700`} />;
};

// --- Info tile ---
const InfoTile = ({ icon, label, value, isSuccess }) => (
  <div className="rounded-xl p-3 space-y-1 bg-white/[0.02] border border-white/[0.06]">
    <div className="flex items-center gap-1.5">
      <span className={isSuccess ? "text-green-400" : "text-red-400"}>
        {icon}
      </span>
      <span className="font-mono-cyber line-clamp-3 text-[9px] font-bold tracking-widest uppercase text-slate-500">
        {label}
      </span>
    </div>
    <p className="text-sm font-semibold leading-snug text-slate-300">{value}</p>
  </div>
);

// --- Divider dots ---
const CyberDivider = ({ isSuccess }) => (
  <div className="flex items-center gap-2.5">
    <div
      className={`flex-1 h-px ${isSuccess ? "bg-gradient-to-r from-transparent to-green-400/30" : "bg-gradient-to-r from-transparent to-red-500/30"}`}
    />
    {[0.2, 0.35, 0.5, 0.65, 0.8].map((op, i) => (
      <div
        key={i}
        className={`w-1 h-1 rounded-full ${isSuccess ? "bg-green-400 [box-shadow:0_0_4px_#00ff88]" : "bg-red-500 [box-shadow:0_0_4px_#ff3355]"}`}
        style={{ opacity: op }}
      />
    ))}
    <div
      className={`flex-1 h-px ${isSuccess ? "bg-gradient-to-l from-transparent to-green-400/30" : "bg-gradient-to-l from-transparent to-red-500/30"}`}
    />
  </div>
);

// ============================================================
// Main Component
// ============================================================
const NewUnifiedPanel = ({ data, variant = "main", panelNumber }) => {
  const { data: session } = useSession();
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isValidUser = data?.employee_id && data.employee_id !== 0;
  const errorCode = data?.error_code;
  const isSuccess = errorCode === "Успешно";
  const errorMessage = ERROR_MESSAGES[errorCode] || `${errorCode}`;

  const timestamp = data?.real_utc
    ? new Date(data.real_utc).toLocaleString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Tashkent",
      })
    : "";

  const formattedDate = data?.real_utc
    ? dayjs(data.real_utc).format("DD.MM.YYYY")
    : "";

  useEffect(() => {
    if (!isValidUser || !session?.accessToken) {
      setEmployeeInfo(null);
      return;
    }
    const fetchEmployeeInfo = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${config.GENERAL_AUTH_URL}staffio/employee/photo/${data?.employee_id}`,
          { headers: { Authorization: `Bearer ${session?.accessToken}` } },
        );
        if (!res.ok) {
          setEmployeeInfo(null);
          return;
        }
        setEmployeeInfo(await res.json());
      } catch (err) {
        console.error("Error fetching employee:", err);
        setEmployeeInfo(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployeeInfo();
  }, [data?.employee_id, session?.accessToken, isValidUser]);

  const sectionId =
    employeeInfo?.timeSectionIdExit ?? employeeInfo?.timeSectionIdEnter ?? 0;
  const graphicName = TIME_SECTION_NAMES[sectionId] || "Неизвестно";

  const fullName = employeeInfo
    ? `${employeeInfo.last_name || ""} ${employeeInfo.first_name || ""} ${employeeInfo.middle_name || ""}`.trim()
    : data?.card_name || "Неизвестно";

  const isEntry = data?.event_type === "Вход";

  // ── EMPTY STATE ──────────────────────────────────────────
  if (!data) {
    return (
      <>
        <CyberStyles />
        <motion.div
          {...ANIMATIONS.fadeIn}
          className={`cyber-flicker relative rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 border border-white/[0.06] ${variant === "main" ? "min-h-[400px] p-12" : "min-h-[150px] p-6"}`}
        >
          <CornerGray pos="tl" />
          <CornerGray pos="tr" />
          <CornerGray pos="bl" />
          <CornerGray pos="br" />
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
              <PersonOutlineOutlinedIcon
                sx={{ fontSize: 28, color: "#334155" }}
              />
            </div>
            <p className="font-mono-cyber text-xs font-bold tracking-widest uppercase text-slate-600">
              {variant === "main"
                ? "Ожидание прохода..."
                : `Сотрудник ${panelNumber}`}
            </p>
          </div>
        </motion.div>
      </>
    );
  }

  // ── SMALL VARIANT (archive) ───────────────────────────────
  if (variant === "small") {
    const EventIcon = isEntry ? LoginIcon : ExitToAppIcon;
    const eventLabel = isEntry ? "ВХОД" : "ВЫХОД";

    return (
      <>
        <CyberStyles />
        <motion.div
          {...ANIMATIONS.fadeIn}
          className={`cyber-flicker relative rounded-2xl overflow-hidden border p-5 transition-shadow hover:shadow-lg bg-gradient-to-br from-slate-900 to-slate-950 ${
            isSuccess
              ? "border-green-400/30 [box-shadow:0_0_24px_rgba(0,255,136,0.15),0_8px_32px_rgba(0,0,0,0.4)]"
              : "border-red-500/30 [box-shadow:0_0_24px_rgba(255,51,85,0.15),0_8px_32px_rgba(0,0,0,0.4)]"
          }`}
        >
          <Corner pos="tl" isSuccess={isSuccess} />
          <Corner pos="tr" isSuccess={isSuccess} />
          <Corner pos="bl" isSuccess={isSuccess} />
          <Corner pos="br" isSuccess={isSuccess} />

          {/* Badges */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest font-mono-cyber ${
                isEntry
                  ? "bg-green-400/10 border border-green-400/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              <EventIcon sx={{ fontSize: 13 }} />
              {eventLabel}
            </span>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono-cyber bg-white/[0.04] border border-white/[0.08] text-slate-500">
              {data.checkPointName}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider font-mono-cyber ${
                isSuccess
                  ? "bg-green-400/10 border border-green-400/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {isSuccess ? "РАЗРЕШЕН" : "ЗАПРЕЩЕН"}
            </span>
          </div>

          {/* Content */}
          <div className="flex items-start gap-4 mt-2">
            <div className="flex-shrink-0">
              <Avatar
                name={data.card_name}
                userId={isValidUser ? data.employee_id : null}
                photoUrl={employeeInfo?.file_url || null}
                userName={employeeInfo?.fullName}
                userJob={employeeInfo?.positionName}
                size="large"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-bold truncate mb-2 text-slate-100">
                {fullName}
              </h3>
              {isValidUser && employeeInfo ? (
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-400/10 border border-sky-400/20 text-sky-400 mb-1.5">
                    {employeeInfo.workplace?.position?.name || "–"}
                  </span>
                  <p className="text-xs text-slate-500">
                    <span className="text-slate-400">Отдел: </span>
                    {employeeInfo.workplace?.organizational_unit?.name || "–"}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Информация о сотруднике недоступна
                </p>
              )}
              <div className="mt-2.5 pt-2.5 flex items-center gap-1.5 border-t border-white/[0.06]">
                <AccessTimeOutlinedIcon
                  sx={{ fontSize: 13, color: "#475569" }}
                />
                <span className="font-mono-cyber text-xs text-slate-500">
                  {formattedDate} · {timestamp}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // ── MAIN VARIANT (live display) ───────────────────────────
  return (
    <>
      <CyberStyles />
      <motion.div
        {...ANIMATIONS.fadeIn}
        className={`cyber-flicker cyber-scanline relative rounded-2xl overflow-hidden border ${"bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"} ${
          isSuccess
            ? "cyber-scanline-green border-green-400/30 [box-shadow:0_0_0_1px_rgba(0,255,136,0.08),0_0_40px_rgba(0,255,136,0.2),0_24px_64px_rgba(0,0,0,0.5)]"
            : "cyber-scanline-red border-red-500/30 [box-shadow:0_0_0_1px_rgba(255,51,85,0.08),0_0_40px_rgba(255,51,85,0.2),0_24px_64px_rgba(0,0,0,0.5)]"
        }`}
      >
        {/* Ambient glow overlay */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isSuccess
              ? "bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,255,136,0.05)_0%,transparent_60%)]"
              : "bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,51,85,0.05)_0%,transparent_60%)]"
          }`}
        />

        <Corner pos="tl" isSuccess={isSuccess} />
        <Corner pos="tr" isSuccess={isSuccess} />
        <Corner pos="bl" isSuccess={isSuccess} />
        <Corner pos="br" isSuccess={isSuccess} />

        {/* ── Header strip ── */}
        <div
          className={`relative flex items-center justify-between px-5 py-2.5 border-b ${
            isSuccess
              ? "border-green-400/10 bg-[linear-gradient(90deg,rgba(0,255,136,0.04),transparent,rgba(0,255,136,0.04))]"
              : "border-red-500/10 bg-[linear-gradient(90deg,rgba(255,51,85,0.04),transparent,rgba(255,51,85,0.04))]"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full pulse-dot ${
                isSuccess
                  ? "bg-green-400 [box-shadow:0_0_8px_#00ff88]"
                  : "bg-red-500 [box-shadow:0_0_8px_#ff3355]"
              }`}
            />
            <span
              className={`font-mono-cyber text-[11px] font-bold tracking-[0.18em] uppercase ${
                isSuccess ? "text-green-400" : "text-red-400"
              }`}
            >
              {graphicName === "VIP" ? (
                <>
                  <StarOutlinedIcon
                    sx={{ fontSize: 13, verticalAlign: "middle" }}
                  />{" "}
                  VIP СОТРУДНИК
                </>
              ) : (
                graphicName
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-cyber text-[11px] tracking-widest text-slate-500">
              {formattedDate}
            </span>
            <span className="font-mono-cyber text-[10px] font-bold px-2 py-0.5 rounded text-sky-400 bg-slate-800 border border-slate-700">
              SYS-02
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-5">
          {/* Employee row */}
          <div className="flex gap-5 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className={`rounded-xl border-2 overflow-hidden ${
                  isSuccess
                    ? "border-green-400/30 [box-shadow:0_0_20px_rgba(0,255,136,0.15)]"
                    : "border-red-500/30 [box-shadow:0_0_20px_rgba(255,51,85,0.15)]"
                }`}
              >
                <Avatar
                  name={data.card_name}
                  userId={isValidUser ? data.employee_id : null}
                  photoUrl={employeeInfo?.file_url || null}
                  userName={employeeInfo?.fullName}
                  userJob={employeeInfo?.positionName}
                  size="large"
                />
              </div>
              {/* ID chip */}
              <div
                className={`absolute -bottom-2 -right-2 font-mono-cyber text-[9px] font-bold px-1.5 py-0.5 rounded border bg-slate-950 ${
                  isSuccess
                    ? "border-green-400/40 text-green-400"
                    : "border-red-500/40 text-red-400"
                }`}
              >
                ID:{data.employee_id || "----"}
              </div>
            </div>

            {/* Name + info grid */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold mb-3 leading-tight text-slate-100">
                {fullName}
              </h1>
              {isValidUser && employeeInfo ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <InfoTile
                    icon={<AccountTreeIcon sx={{ fontSize: 15 }} />}
                    label="Отдел"
                    value={
                      employeeInfo.workplace?.organizational_unit?.name || "–"
                    }
                    isSuccess={isSuccess}
                  />
                  <InfoTile
                    icon={<PersonOutlineOutlinedIcon sx={{ fontSize: 15 }} />}
                    label="Должность"
                    value={employeeInfo.workplace?.position?.name || "–"}
                    isSuccess={isSuccess}
                  />
                  <InfoTile
                    icon={<MeetingRoomIcon sx={{ fontSize: 15 }} />}
                    label="Тип двери"
                    value={data.event_type}
                    isSuccess={isSuccess}
                  />
                  <InfoTile
                    icon={<AccessTimeOutlinedIcon sx={{ fontSize: 15 }} />}
                    label="Время прохода"
                    value={timestamp}
                    isSuccess={isSuccess}
                  />
                </div>
              ) : (
                <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-400 font-semibold text-sm">
                    ⚠️ Нет данных о сотруднике
                  </p>
                </div>
              )}
            </div>
          </div>

          <CyberDivider isSuccess={isSuccess} />
        </div>

        {/* ── Status panel — hero element ── */}
        <div
          className={`status-glow relative flex items-center gap-5 px-6 py-5 border-t ${
            isSuccess
              ? "bg-[linear-gradient(135deg,#001a0d,#002211)] border-green-400/25 [box-shadow:inset_0_0_40px_rgba(0,255,136,0.06)]"
              : "bg-[linear-gradient(135deg,#1a0008,#220011)] border-red-500/25 [box-shadow:inset_0_0_40px_rgba(255,51,85,0.06)]"
          }`}
        >
          {/* Pulsing rings + icon */}
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <div
              className={`ping-ring absolute inset-0 rounded-full ${
                isSuccess
                  ? "bg-[radial-gradient(circle,rgba(0,255,136,0.25)_0%,transparent_70%)]"
                  : "bg-[radial-gradient(circle,rgba(255,51,85,0.25)_0%,transparent_70%)]"
              }`}
            />
            <div
              className={`ping-ring-2 absolute inset-0 rounded-full ${
                isSuccess
                  ? "bg-[radial-gradient(circle,rgba(0,255,136,0.15)_0%,transparent_70%)]"
                  : "bg-[radial-gradient(circle,rgba(255,51,85,0.15)_0%,transparent_70%)]"
              }`}
            />
            <div
              className={`relative z-10 w-[68px] h-[68px] rounded-full flex items-center justify-center border-2 ${
                isSuccess
                  ? "bg-[radial-gradient(circle_at_35%_35%,rgba(0,255,136,0.3),rgba(0,255,136,0.1))] border-green-400/50 [box-shadow:0_0_30px_rgba(0,255,136,0.4),inset_0_0_15px_rgba(0,255,136,0.15)]"
                  : "bg-[radial-gradient(circle_at_35%_35%,rgba(255,51,85,0.3),rgba(255,51,85,0.1))] border-red-500/50 [box-shadow:0_0_30px_rgba(255,51,85,0.4),inset_0_0_15px_rgba(255,51,85,0.15)]"
              }`}
            >
              {isSuccess ? (
                <CheckCircleIcon sx={{ fontSize: 36, color: "#00ff88" }} />
              ) : (
                <ReportIcon sx={{ fontSize: 36, color: "#ff3355" }} />
              )}
            </div>
          </div>

          {/* Status text */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className={`w-1.5 h-1.5 rounded-full pulse-dot ${
                  isSuccess
                    ? "bg-green-400 [box-shadow:0_0_6px_#00ff88]"
                    : "bg-red-500 [box-shadow:0_0_6px_#ff3355]"
                }`}
              />
              <span
                className={`font-mono-cyber text-[9px] font-bold tracking-[0.18em] uppercase opacity-60 ${
                  isSuccess ? "text-green-400" : "text-red-400"
                }`}
              >
                СТАТУС ДОСТУПА
              </span>
            </div>
            <p
              className={`font-display text-3xl font-bold tracking-widest uppercase ${
                isSuccess
                  ? "text-green-400 [text-shadow:0_0_20px_rgba(0,255,136,0.6)]"
                  : "text-red-400 [text-shadow:0_0_20px_rgba(255,51,85,0.6)]"
              }`}
            >
              {isSuccess ? "ПРОХОД РАЗРЕШЕН" : "ПРОХОД ЗАПРЕЩЁН"}
            </p>
            <p
              className={`font-mono-cyber text-xs mt-1 opacity-45 ${isSuccess ? "text-green-400" : "text-red-400"}`}
            >
              ► {errorMessage}
            </p>
          </div>

          {/* Entry/exit badge */}
          <div
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border ${
              isEntry
                ? "bg-green-400/10 border-green-400/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            {isEntry ? (
              <LoginIcon sx={{ fontSize: 28, color: "#4ade80" }} />
            ) : (
              <ExitToAppIcon sx={{ fontSize: 28, color: "#ff3355" }} />
            )}
            <span
              className={` text-[10px] font-bold tracking-widest uppercase ${
                isEntry ? "text-green-400" : "text-red-400"
              }`}
            >
              {isEntry ? "ВХОД" : "ВЫХОД"}
            </span>
          </div>

          {/* Hex error code */}
          <div className="text-right">
            <div
              className={`font-mono-cyber text-[9px] tracking-widest opacity-35 mb-1 ${
                isSuccess ? "text-green-400" : "text-red-400"
              }`}
            >
              ERR_CODE
            </div>
            <div
              className={`font-mono-cyber text-2xl font-bold opacity-50 ${
                isSuccess
                  ? "text-green-400 [text-shadow:0_0_10px_#00ff88]"
                  : "text-red-400 [text-shadow:0_0_10px_#ff3355]"
              }`}
            >
              {isSuccess ? "0x00" : "0x20"}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default NewUnifiedPanel;
