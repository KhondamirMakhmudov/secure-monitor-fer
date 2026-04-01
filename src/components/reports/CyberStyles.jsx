import dynamic from "next/dynamic";

export const CyberStyles = dynamic(
  async () => {
    return {
      default: () => (
        <div suppressHydrationWarning>
          <style suppressHydrationWarning>{`
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
          .font-mono-cyber { font-family: 'Share Tech Mono', monospace; }
          .font-display    { font-family: 'Rajdhani', sans-serif; }
          @keyframes borderPulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
          }
          @keyframes shimmer {
            0%   { background-position: -400px 0; }
            100% { background-position:  400px 0; }
          }
          .pulse-dot { animation: borderPulse 1.5s ease-in-out infinite; }
          .shimmer {
            background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
            background-size: 400px 100%;
            animation: shimmer 1.4s ease-in-out infinite;
          }
          .table-row-hover { transition: background 0.15s ease, box-shadow 0.15s ease; }
          .table-row-hover:hover {
            background: rgba(56,189,248,0.04);
            box-shadow: inset 3px 0 0 rgba(56,189,248,0.5);
          }
        `}</style>
        </div>
      ),
    };
  },
  { ssr: false }
);
