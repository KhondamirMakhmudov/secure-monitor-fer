// /pages/api/auth/[...nextauth].js
import { config } from "@/config";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Helper function to decode JWT token
function decodeJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

// Track ongoing refresh operations to prevent race conditions
const refreshPromises = new Map();

// Helper function to refresh access token with proper error handling
async function refreshAccessToken(token) {
  // Prevent multiple simultaneous refresh attempts for the same token
  const refreshKey = token.refreshToken;
  if (refreshPromises.has(refreshKey)) {
    console.log("Refresh already in progress, waiting...");
    return refreshPromises.get(refreshKey);
  }

  const refreshPromise = (async () => {
    try {
      console.log("=== STARTING TOKEN REFRESH ===");

      if (!token.refreshToken) {
        throw new Error("No refresh token available");
      }

      // TO'G'RILASH: Authorization headerida refresh token jo'natiladi
      const response = await fetch(`${config.GENERAL_AUTH_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.refreshToken}`, // ← Refresh token shu yerda
          "Content-Type": "application/json",
        },
        // Body bo'sh bo'lishi mumkin yoki boshqa ma'lumotlar
      });

      console.log("Refresh response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Refresh token failed:", response.status, errorText);

        // If 401, the refresh token is invalid/expired
        if (response.status === 401) {
          throw new Error("RefreshTokenExpired");
        }

        throw new Error(`Refresh failed: ${response.status}`);
      }

      const refreshedTokens = await response.json();
      console.log("Refresh successful, got new tokens");

      if (!refreshedTokens.access_token) {
        throw new Error("No access token in refresh response");
      }

      // Decode new token to get expiration
      const newDecoded = decodeJWT(refreshedTokens.access_token);

      if (!newDecoded || !newDecoded.exp) {
        throw new Error("Invalid token received - no expiration");
      }

      const accessTokenExpires = newDecoded.exp * 1000;
      const expiresIn = Math.floor((accessTokenExpires - Date.now()) / 1000);
      console.log(`New token expires in ${expiresIn} seconds`);

      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token || token.refreshToken,
        tokenType: refreshedTokens.token_type || token.tokenType || "Bearer",
        accessTokenExpires: accessTokenExpires,
        userData: newDecoded,
        error: undefined, // Clear any previous errors
      };
    } catch (error) {
      console.error("=== TOKEN REFRESH FAILED ===");
      console.error("Error:", error.message);

      // Return token with error flag
      return {
        ...token,
        error:
          error.message === "RefreshTokenExpired"
            ? "RefreshTokenExpired"
            : "RefreshAccessTokenError",
      };
    } finally {
      // Clean up the promise tracking
      refreshPromises.delete(refreshKey);
    }
  })();

  refreshPromises.set(refreshKey, refreshPromise);
  return refreshPromise;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { username, password } = credentials;
          console.log("Attempting login for user:", username);

          const params = new URLSearchParams();
          params.append("username", username);
          params.append("password", password);

          const res = await fetch(`${config.GENERAL_AUTH_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
          });

          console.log("Login response status:", res.status);

          if (!res.ok) {
            const errorText = await res.text();
            console.error("Login failed:", res.status, errorText);
            return null;
          }

          const data = await res.json();

          if (!data.access_token || !data.refresh_token) {
            console.error("Missing tokens in login response");
            return null;
          }

          // Decode token to get user data and expiration
          const decoded = decodeJWT(data.access_token);

          if (!decoded || !decoded.exp) {
            console.error("Invalid token structure");
            return null;
          }

          console.log("Login successful for user:", decoded.username);

          const accessTokenExpires = decoded.exp * 1000;

          return {
            id: decoded.sub || username,
            name: decoded.username || username,
            email:
              decoded.email || `${decoded.username || username}@company.com`,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            tokenType: data.token_type || "Bearer",
            accessTokenExpires: accessTokenExpires,
            userData: decoded,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token.project3"
          : "next-auth.session-token.project3",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // true in prod, false in dev
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        console.log("=== INITIAL JWT CREATION ===");
        console.log("User:", user.name);
        console.log(
          "Token expires:",
          new Date(user.accessTokenExpires).toLocaleString(),
        );

        return {
          ...token,
          ...user,
        };
      }

      // No access token means something is wrong
      if (!token.accessToken) {
        console.error("JWT callback: No access token found");
        return {
          ...token,
          error: "NoAccessToken",
        };
      }

      // If there's already an error, keep it
      if (token.error === "RefreshTokenExpired") {
        console.log(
          "JWT callback: Refresh token expired, user needs to re-login",
        );
        return token;
      }

      // Check token expiration
      const now = Date.now();
      const expiresAt = token.accessTokenExpires;
      const timeUntilExpiry = expiresAt - now;
      const secondsUntilExpiry = Math.floor(timeUntilExpiry / 1000);

      console.log(
        `JWT callback: Token expires in ${secondsUntilExpiry} seconds`,
      );

      // Refresh if token expires in less than 5 minutes (300 seconds)
      // This gives plenty of time for the refresh to complete
      const shouldRefresh = secondsUntilExpiry < 300;

      if (!shouldRefresh) {
        return token;
      }

      // Token needs refresh
      console.log("=== TOKEN REFRESH NEEDED ===");
      const refreshedToken = await refreshAccessToken(token);

      if (refreshedToken.error) {
        console.error(
          "JWT callback: Refresh failed with error:",
          refreshedToken.error,
        );
      } else {
        console.log("JWT callback: Token refreshed successfully");
      }

      return refreshedToken;
    },

    async session({ session, token }) {
      // If refresh token expired, clear session
      if (token.error === "RefreshTokenExpired") {
        console.log("Session callback: Refresh token expired");
        return {
          ...session,
          error: "RefreshTokenExpired",
          user: null,
        };
      }

      // If there's an error but not expired, keep minimal session
      if (token.error) {
        session.error = token.error;
      }

      // Build session with token data
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.tokenType = token.tokenType;
      session.accessTokenExpires = token.accessTokenExpires;

      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        username: token.userData?.username,
        role: token.userData?.role,
        employee_id: token.userData?.employee_id,
        unit_code: token.userData?.unit_code,
      };

      return session;
    },
  },

  events: {
    async signOut({ token }) {
      console.log("User signed out");
      // Optionally call logout endpoint to invalidate tokens on server
      try {
        await fetch(`${config.GENERAL_AUTH_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `${token.tokenType || "Bearer"} ${
              token.accessToken
            }`,
          },
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },

  pages: {
    signIn: "/",
    signOut: "/",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

console.log("NEXTAUTH_SECRET loaded:", !!process.env.NEXTAUTH_SECRET);
console.log("Secret length:", process.env.NEXTAUTH_SECRET?.length);
