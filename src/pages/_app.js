import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { Hydrate, QueryClientProvider } from "@tanstack/react-query";
import ClientOnlyToaster from "@/components/toast";
import { SessionProvider } from "next-auth/react";
import reactQueryClient from "@/config/react-query";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import "@/styles/globals.css";
import "@/styles/loader.css";

import Layout from "@/components/layout";

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const isHomePage = router.pathname === "/";
  const { theme } = useTheme();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <>
      {isHomePage ? (
        <Component {...pageProps} />
      ) : (
        <Layout bgColor={pageProps.bgColor} headerBg={pageProps.headerBg}>
          <Component {...pageProps} />
        </Layout>
      )}
      <ClientOnlyToaster />
    </>
  );
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [queryClient] = useState(() => reactQueryClient);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps?.dehydratedState}>
          <NextThemesProvider
            attribute="class"
            defaultTheme="dark"
            value={{ light: "light", dark: "dark" }}
          >
            <CssBaseline />
            <AppContent Component={Component} pageProps={pageProps} />
          </NextThemesProvider>
        </Hydrate>
      </QueryClientProvider>
    </SessionProvider>
  );
}
          </NextThemesProvider>
        </Hydrate>
      </QueryClientProvider>
    </SessionProvider>
  );
}
