import dynamic from "next/dynamic";
import Header from "../header";
import useAuthError from "@/hooks/useAuthError";
import { useEffect, useState } from "react";

const Unauthorized = dynamic(() => import("@/components/auth/Unauthorized"), {
  ssr: false,
});
const Forbidden = dynamic(() => import("@/components/auth/Forbidden"), {
  ssr: false,
});

const Layout = ({ children, bgColor = "", headerBg }) => {
  const { authError } = useAuthError();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen dark">
        <div className="container mx-auto py-6 px-4">
          <Header bgColor={headerBg} />
          {children}
        </div>
      </div>
    );
  }

  if (authError === 401) {
    return <Unauthorized />;
  }

  if (authError === 403) {
    return <Forbidden />;
  }

  return (
    <div className="min-h-screen dark">
      <div className="container mx-auto py-6 px-4">
        <Header bgColor={headerBg} />
        {children}
      </div>
    </div>
  );
};

export default Layout;
