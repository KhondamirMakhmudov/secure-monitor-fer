import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import ConnectionStatus from "@/components/security-monitor/connection-status";
import Image from "next/image";
import NewUnifiedPanel from "@/components/security-monitor/new-unified-model";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import Turnstile from "@/components/security-monitor/turnstile";
import { useSession } from "next-auth/react";
import { config } from "@/config";

// Dynamic component to avoid SSR hydration issues with styles
const PageStyles = dynamic(
  async () => {
    return {
      default: () => (
        <style suppressHydrationWarning>{`
    .font-mono-cyber { font-family: 'Share Tech Mono', monospace; }
    .font-display    { font-family: 'Rajdhani', sans-serif; }
    @keyframes borderPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
    .pulse-dot { animation: borderPulse 1.5s ease-in-out infinite; }
  `}</style>
      ),
    };
  },
  { ssr: false },
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ children, dotColor = "bg-blue-400" }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border-white/[0.06]">
    <div
      className={`w-2 h-2 rounded-full pulse-dot ${dotColor} [box-shadow:0_0_6px_currentColor]`}
    />
    <p className="font-display text-base font-semibold tracking-wide text-slate-300 sm:text-lg">
      {children}
    </p>
  </div>
);

// ─── Checkpoint status pill ───────────────────────────────────────────────────
const CheckpointPill = ({ name, index }) => (
  <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] [box-shadow:0_2px_12px_rgba(0,0,0,0.3)]">
    <div
      className={`w-2 h-2 rounded-full pulse-dot ${index === 0 ? "bg-green-400 [box-shadow:0_0_8px_#00ff88]" : "bg-sky-400 [box-shadow:0_0_8px_#38bdf8]"}`}
    />
    <span className="font-mono-cyber text-xs text-slate-400 tracking-widest uppercase">
      {name}
    </span>
  </div>
);

// ─── Turnstile wrapper card ───────────────────────────────────────────────────
const TurnstileCard = ({ checkPointName, entryIp, exitIp }) => (
  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 mt-4 [box-shadow:0_4px_24px_rgba(0,0,0,0.3)]">
    {/* Card header */}
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
      <DoorFrontIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
      <span className="font-display text-sm font-bold tracking-widest uppercase text-slate-500">
        Управление турникетами
      </span>
    </div>

    {/* Checkpoint label */}
    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-sky-500/[0.06] border border-sky-500/20">
      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 pulse-dot [box-shadow:0_0_6px_#38bdf8]" />
      <p className="font-mono-cyber text-xs text-sky-400 tracking-widest break-words">
        Главный вход ({checkPointName})
      </p>
    </div>

    <Turnstile ipEntry={entryIp} ipExit={exitIp} />
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 text-center sm:min-h-[500px]">
    <Image
      src="/icons/id-card-animate.svg"
      alt="id-card"
      width={500}
      height={400}
      className="h-auto w-full max-w-[300px] sm:max-w-[440px] opacity-60"
    />
    <div className="space-y-2">
      <p className="font-display text-lg font-semibold text-slate-400 sm:text-xl">
        Ожидание событий...
      </p>
      <p className="font-mono-cyber text-xs text-slate-500 tracking-widest max-w-sm">
        Подключите систему и дождитесь первого события через турникет
      </p>
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const Index = () => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [statusText, setStatusText] = useState("Не подключен");
  const [devices, setDevices] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Fetch devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(
          `${config.GENERAL_AUTH_URL}acs/api/cameras`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );
        const data = await response.json();
        setDevices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };
    if (session?.accessToken) fetchDevices();
  }, [session?.accessToken]);

  // Checkpoints derived from devices
  const checkpoints = useMemo(() => {
    if (!devices.length) return [];
    const filtered = devices.filter((d) =>
      [
        "КТ-1 (Основной КПП ФерТЭС)",
        "КТ-2 (Основной КПП ФерТЭС)",
        "КТ-3 (Основной КПП ФерТЭС)",
      ].includes(d.checkPointName),
    );
    return filtered.filter(
      (item, index, self) =>
        index ===
        self.findIndex((t) => t.checkPointName === item.checkPointName),
    );
  }, [devices]);

  // ── WebSocket — DO NOT TOUCH ──────────────────────────────────────────────
  useEffect(() => {
    // Only initialize once
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10;
    const INITIAL_RECONNECT_DELAY = 2000; // 2 seconds

    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(config.WEBSOCKET_URL);

        wsRef.current.onopen = () => {
          console.log("✅ WebSocket соединение установлено");
          setIsConnected(true);
          setStatusText("Подключено и контролируется");
          reconnectAttempts = 0; // Reset attempts on successful connection
        };

        wsRef.current.onmessage = (event) => {
          try {
            const json = JSON.parse(event.data);
            setMessages((prev) => [json, ...prev.slice(0, 200)]);
          } catch (e) {
            console.error("Error parsing WebSocket message:", e);
          }
        };

        wsRef.current.onclose = () => {
          console.log("❌ WebSocket соединение закрыто");
          setIsConnected(false);
          setStatusText("Не подключен");
          attemptReconnect();
        };

        wsRef.current.onerror = (error) => {
          console.error("💥 Ошибка WebSocket:", error);
          setStatusText("Ошибка соединения");
        };
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        attemptReconnect();
      }
    };

    const attemptReconnect = () => {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
        console.log(
          `Попытка переподключения ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} через ${delay}ms`,
        );
        reconnectAttempts++;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      } else {
        console.error("❌ Не удалось подключиться после максимума попыток");
        setStatusText("Ошибка соединения (макс. попыток)");
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  // ── End WebSocket ─────────────────────────────────────────────────────────

  // Latest message per checkpoint
  const latestForCheckpoint = (name) => {
    const filtered = messages.filter((msg) => msg.check_point_name === name);
    if (!filtered.length) return null;
    return [...filtered].sort(
      (a, b) => new Date(b.real_utc) - new Date(a.real_utc),
    )[0];
  };

  const latestMessages = checkpoints
    .map((cp) => latestForCheckpoint(cp.checkPointName))
    .filter(Boolean);
  const archiveMessages = messages.filter(
    (msg) => !latestMessages.includes(msg),
  );

  return (
    <>
      <PageStyles />
      <div className="my-6 sm:my-10 lg:my-14 space-y-6 sm:space-y-8">
        {/* ── Page header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-wide text-slate-100 sm:text-3xl lg:text-4xl">
              Система контроля доступа
            </h1>
            <p className="font-mono-cyber text-xs text-slate-500 tracking-widest sm:text-sm">
              Активность сотрудников в реальном времени
            </p>
          </div>
          <ConnectionStatus isConnected={isConnected} statusText={statusText} />
        </div>

        {/* ── Checkpoint status pills ── */}
        {checkpoints.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {checkpoints.map((cp, i) => (
              <CheckpointPill
                key={cp.checkPointId}
                name={cp.checkPointName}
                index={i}
              />
            ))}
          </div>
        )}

        {/* ── Main content ── */}
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {/* Live panels grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-8">
              {checkpoints.map((cp) => {
                const devicesForCP = devices.filter(
                  (d) =>
                    d.checkPointName?.trim().toLowerCase() ===
                    cp.checkPointName?.trim().toLowerCase(),
                );
                const entryDevice = devicesForCP.find(
                  (d) => d.doorType?.trim().toLowerCase() === "вход",
                );
                const exitDevice = devicesForCP.find(
                  (d) => d.doorType?.trim().toLowerCase() === "выход",
                );
                const latestData = latestForCheckpoint(cp.checkPointName);

                return (
                  <div key={cp.checkPointId} className="flex flex-col gap-0">
                    <NewUnifiedPanel
                      key={latestData?.id || `empty-${cp.checkPointId}`}
                      data={latestData}
                      variant="main"
                    />
                    {/* <TurnstileCard
                      checkPointName={cp.checkPointName}
                      entryIp={entryDevice?.ipAddress}
                      exitIp={exitDevice?.ipAddress}
                    /> */}
                  </div>
                );
              })}
            </div>

            {/* Archive section */}
            <div className="space-y-4">
              <SectionHeader dotColor="bg-blue-400">
                Архив проходов
              </SectionHeader>
              <div className="space-y-3 overflow-y-auto pr-1 sm:pr-2 lg:max-h-[750px]">
                {archiveMessages.length > 0 ? (
                  archiveMessages.map((msg, idx) => (
                    <NewUnifiedPanel
                      key={idx}
                      data={msg}
                      variant="small"
                      panelNumber={idx + 1}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center py-10">
                    <p className="font-mono-cyber text-xs text-slate-500 tracking-widest uppercase">
                      Архив пуст
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Index;

export async function getStaticProps() {
  return {
    props: {
      bgColor: "bg-gray-100",
      headerBg: "bg-white",
    },
  };
}
