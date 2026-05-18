import Brand from "@/components/brand";
import Button from "@/components/button";
import Input from "@/components/input";
import { useState, useEffect } from "react";
import Image from "next/image";
import { signIn, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import ContentLoader from "@/components/loader";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [savedLogins, setSavedLogins] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("logins") || "[]");
    setSavedLogins(stored);
  }, []);

  useEffect(() => {
    if (!session?.expiresAt) return;

    const now = Date.now();
    const expiresAt = session.expiresAt;
    const timeout = expiresAt - now;

    if (timeout <= 0) {
      signOut({ callbackUrl: "/" });
    } else {
      const timer = setTimeout(() => {
        signOut({ callbackUrl: "/" });
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [session]);

  // Loginlarni saqlash
  const saveLogin = (username, password) => {
    let updated = [...savedLogins];
    const existingIndex = updated.findIndex((u) => u.username === username);
    if (existingIndex > -1) {
      updated[existingIndex].password = password;
    } else {
      updated.push({ username, password });
    }
    setSavedLogins(updated);
    localStorage.setItem("logins", JSON.stringify(updated));
  };

  const removeLogin = (username) => {
    const updated = savedLogins.filter((u) => u.username !== username);
    setSavedLogins(updated);
    localStorage.setItem("logins", JSON.stringify(updated));
  };

  const handleSelectLogin = (login) => {
    setUsername(login.username);
    setPassword(login.password);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    console.log("Attempting login...");
    setIsLoading(true);
    try {
      const response = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: "/secure-section/",
      });

      console.log("=== SignIn Response ===");
      console.log("Full response:", response);
      console.log("Response ok:", response?.ok);
      console.log("Response status:", response?.status);
      console.log("Response error:", response?.error);
      console.log("Response url:", response?.url);

      // Check if login was successful
      // response.ok is true when credentials are valid, even without error
      if (response?.ok === true || (response && !response?.error && response?.url)) {
        console.log("✓ Login successful, redirecting...");
        toast.success("Добро пожаловать");
        saveLogin(username, password);
        
        // Use the returned URL or default to secure-section
        const redirectUrl = response?.url || "/secure-section/";
        console.log("Redirecting to:", redirectUrl);
        
        // Push redirect immediately
        await router.push(redirectUrl);
      } else {
        console.error("✗ Login failed");
        const errorMsg = response?.error || "Неверные данные";
        toast.error("Ошибка входа: " + errorMsg);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login exception:", err);
      toast.error("Произошла ошибка при входе в систему");
      setIsLoading(false);
    }
  };
  const handleExit = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      toast.success("Вы успешно вышли из системы");
    } catch (error) {
      toast.error("Ошибка при выходе");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnter = () => {
    setIsLoading(true);
    router.push("/secure-section");
  };

  return (
    <div suppressHydrationWarning>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@500;600;700&display=swap');
        
        @keyframes gridPulse {
          0%, 100% { opacity: 0.15; }
          50%      { opacity: 0.4; }
        }
        @keyframes scanline {
          0%   { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes borderPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        @keyframes cyberGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(14, 165, 233, 0.3), 0 0 40px rgba(14, 165, 233, 0.1); }
          50%      { box-shadow: 0 0 30px rgba(14, 165, 233, 0.5), 0 0 60px rgba(14, 165, 233, 0.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-20px); }
        }
        
        .cyber-grid {
          background-image: 
            linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridPulse 4s ease-in-out infinite;
        }
        
        .cyber-scanline::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.6), transparent);
          animation: scanline 8s linear infinite;
          pointer-events: none;
        }
        
        .corner-accent {
          position: absolute;
          width: 20px;
          height: 20px;
          border-color: rgba(14, 165, 233, 0.6);
        }
        .corner-tl { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; }
        .corner-tr { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; }
        .corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; }
        .corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; }
        
        .pulse-border { animation: borderPulse 2s ease-in-out infinite; }
        .cyber-glow { animation: cyberGlow 3s ease-in-out infinite; }
        .float-anim { animation: float 6s ease-in-out infinite; }
        
        .font-mono-cyber { font-family: 'Share Tech Mono', monospace; }
        .font-display-cyber { font-family: 'Rajdhani', sans-serif; }
      `}</style>

      <div className="dark">
        <motion.div
          className="login relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Animated background grid */}
          <div className="absolute inset-0 cyber-grid opacity-40 dark:opacity-20" />

          {/* Scanline effect */}
          <div className="absolute inset-0 cyber-scanline pointer-events-none" />

          {/* Ambient light orbs */}
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-3xl" />

          {isLoading && (
            <div className="fixed inset-0 z-[9999] bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
              <ContentLoader />
            </div>
          )}

          <div className="relative z-10 container mx-auto px-4 min-h-screen flex items-center justify-center py-8">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left side: Login form */}
              <motion.div
                className="w-full order-2 lg:order-1"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden p-8 sm:p-10 lg:p-12 bg-slate-900/90 border border-slate-700/50">
                  {/* Corner accents */}
                  <div className="corner-accent corner-tl pulse-border" />
                  <div className="corner-accent corner-tr pulse-border" />
                  <div className="corner-accent corner-bl pulse-border" />
                  <div className="corner-accent corner-br pulse-border" />

                  {/* Content */}
                  <div className="relative z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <Brand />
                    </motion.div>

                    <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent my-6" />

                    <motion.div
                      className="mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl mb-3 font-bold font-display-cyber bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
                        СИСТЕМА ДОСТУПА
                      </h1>
                      {status !== "authenticated" && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-mono-cyber">
                          » Введите учетные данные для авторизации
                        </p>
                      )}
                    </motion.div>

                    {/* if logged in */}
                    {status === "authenticated" ? (
                      <motion.div
                        className="flex flex-col sm:flex-row gap-2 w-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full"
                        >
                          <Button
                            type="button"
                            fullWidth
                            className="min-h-[52px]"
                            onClick={handleEnter}
                            disabled={isLoading}
                            icon={
                              !isLoading ? (
                                <LoginRoundedIcon fontSize="inherit" />
                              ) : null
                            }
                          >
                            {isLoading ? "Загрузка..." : "Войти в систему"}
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full"
                        >
                          <Button
                            type="button"
                            fullWidth
                            className="min-h-[52px]"
                            onClick={handleExit}
                            disabled={isLoading}
                            icon={
                              !isLoading ? (
                                <LogoutRoundedIcon fontSize="inherit" />
                              ) : null
                            }
                          >
                            {isLoading ? "Загрузка..." : "Выйти"}
                          </Button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      // Login form
                      <motion.form
                        onSubmit={onSubmit}
                        className="space-y-5 w-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                      >
                        {/* Saved logins */}
                        {savedLogins.length > 0 && (
                          <motion.div
                            className="mb-6 p-4 rounded-xl border bg-slate-800/50 border-slate-700/50"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.4 }}
                          >
                            <p className="text-xs font-mono-cyber mb-3 flex items-center gap-2 text-slate-400">
                              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              СОХРАНЕННЫЕ АККАУНТЫ
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {savedLogins.map((login, i) => (
                                <motion.div
                                  key={i}
                                  onClick={() => handleSelectLogin(login)}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="group relative flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 transition-all bg-slate-900 border-slate-700 hover:border-blue-500"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.05 }}
                                >
                                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-bold shadow-lg">
                                    {login.username.charAt(0).toUpperCase()}
                                  </span>
                                  <span className="text-sm font-mono-cyber transition-colors text-slate-300 group-hover:text-blue-400">
                                    {login.username}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeLogin(login.username);
                                    }}
                                    className="ml-2 w-5 h-5 flex items-center justify-center rounded-full text-red-500 hover:text-red-700 transition-all bg-red-900/30 hover:bg-red-900/50"
                                  >
                                    ✕
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        <div className="space-y-4">
                          <Input
                            label="Имя пользователя"
                            type="text"
                            value={username}
                            labelClass="!text-slate-300"
                            inputClass="!h-[52px] rounded-xl text-base font-mono-cyber !bg-slate-950 !text-slate-100 !border-slate-700 !placeholder:text-slate-500"
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="user@system"
                            disabled={isLoading}
                          />
                          <Input
                            label="Пароль"
                            type="password"
                            value={password}
                            labelClass="!text-slate-300"
                            inputClass="!h-[52px] rounded-xl text-base font-mono-cyber !bg-slate-950 !text-slate-100 !border-slate-700 !placeholder:text-slate-500"
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                          />
                        </div>

                        <motion.div
                          className="pt-2"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full h-[56px] bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-500 dark:via-blue-600 dark:to-cyan-600 rounded-xl font-display-cyber font-bold text-lg text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-600/40 hover:shadow-xl hover:shadow-blue-500/50 dark:hover:shadow-blue-600/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 overflow-hidden"
                          >
                            {/* Animated shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />

                            {/* Corner brackets */}
                            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white/40" />
                            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white/40" />
                            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-white/40" />
                            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white/40" />

                            <span className="relative z-10 flex items-center justify-center gap-2">
                              {isLoading ? (
                                <>
                                  <svg
                                    className="w-5 h-5 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                  <span className="tracking-wider">
                                    ПРОВЕРКА...
                                  </span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                  </svg>
                                  <span className="tracking-wider">
                                    АВТОРИЗАЦИЯ
                                  </span>
                                </>
                              )}
                            </span>
                          </button>
                        </motion.div>
                      </motion.form>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Right side: Illustration */}
              <motion.div
                className="w-full order-1 lg:order-2 relative"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="relative w-full flex items-center justify-center">
                  {/* Glow effect behind image */}
                  <div className="absolute inset-0 blur-3xl rounded-full transform scale-75 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-slate-900/20" />

                  <div className="absolute inset-[12%] rounded-[28px] border transition-colors bg-slate-900/30 border-slate-700/40" />

                  {/* Animated geometric shapes */}
                  <motion.div
                    className="absolute top-10 left-10 w-16 h-16 border-2 border-blue-500/30 rounded-lg"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <motion.div
                    className="absolute bottom-10 right-10 w-20 h-20 border-2 border-cyan-500/30"
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 25,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  {/* Main illustration */}
                  <motion.div
                    className="relative z-10 float-anim"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Image
                      src="/icons/security-animate.svg"
                      alt="Security System"
                      width={600}
                      height={600}
                      className="w-full max-w-[500px] lg:max-w-[600px] h-auto drop-shadow-2xl"
                      priority
                    />
                  </motion.div>

                  {/* Info cards */}
                  <motion.div
                    className="absolute -bottom-4 -left-4 backdrop-blur-xl rounded-xl p-4 shadow-xl border hidden lg:block bg-slate-900/90 border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-mono-cyber text-slate-400">
                          СТАТУС
                        </p>
                        <p className="text-sm font-bold font-display-cyber text-green-400">
                          ЗАЩИЩЕНО
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute -top-4 -right-4 backdrop-blur-xl rounded-xl p-4 shadow-xl border hidden lg:block bg-slate-900/90 border-slate-700/50"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-mono-cyber text-slate-400">
                          ДОСТУП
                        </p>
                        <p className="text-sm font-bold font-display-cyber text-blue-400">
                          КОНТРОЛЬ
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
