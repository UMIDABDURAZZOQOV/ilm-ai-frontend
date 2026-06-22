"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { clearSession, getSession, saveSession, type SessionData } from "@/lib/api";
import { setUserContext, trackUserAction, addBreadcrumb } from "@/lib/sentry";

interface User {
  id: number;
  name: string;
  email: string;
  access_token: string;
  refresh_token: string;
  profile_picture?: string;
  oauth_provider?: string;
  oauth_provider_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(session: SessionData): User {
  return {
    id: Number(session.id),
    name: session.name,
    email: session.email,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    profile_picture: session.profile_picture,
    oauth_provider: session.oauth_provider,
    oauth_provider_id: session.oauth_provider_id,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = getSession();
    if (saved?.access_token) {
      setUser(toUser(saved));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    const session: SessionData = {
      id: Number(userData.id),
      name: userData.name,
      email: userData.email,
      access_token: userData.access_token,
      refresh_token: userData.refresh_token,
      profile_picture: userData.profile_picture,
      oauth_provider: userData.oauth_provider,
      oauth_provider_id: userData.oauth_provider_id,
    };
    saveSession(session);
    setUser(toUser(session));
    
    // Track login event with Sentry
    setUserContext({ id: userData.id, email: userData.email, name: userData.name });
    trackUserAction("user_login", {
      method: userData.oauth_provider || "email",
      user_id: userData.id,
    });
    addBreadcrumb("auth", "User logged in successfully", "info");
  };

  const logout = () => {
    if (user) {
      trackUserAction("user_logout", {
        user_id: user.id,
      });
      addBreadcrumb("auth", "User logged out", "info");
    }
    setUser(null);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
