import { useState } from "react";
import { useRouter } from "next/router";
import { Hydrate, QueryClientProvider } from "@tanstack/react-query";
import ClientOnlyToaster from "@/components/toast";
import { SessionProvider } from "next-auth/react";
import reactQueryClient from "@/config/react-query";

import CssBaseline from "@mui/material/CssBaseline";
import "@/styles/globals.css";
import "@/styles/loader.css";

import Layout from "@/components/layout";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [queryClient] = useState(() => reactQueryClient);
  const router = useRouter();

  const isHomePage = router.pathname === "/";

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps?.dehydratedState}>
          <div className="dark">
            <CssBaseline />
            {isHomePage ? (
              <Component {...pageProps} />
            ) : (
              <Layout bgColor={pageProps.bgColor} headerBg={pageProps.headerBg}>
                <Component {...pageProps} />
              </Layout>
            )}

            <ClientOnlyToaster />
          </div>
        </Hydrate>
      </QueryClientProvider>
    </SessionProvider>
  );
}
