
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'admin' | 'friend' | null;

interface AuthContextType {
  currentUser: UserRole;
  login: (usernameInput: string, passwordInput: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials (NOT FOR PRODUCTION)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "hehe";
const FRIEND_USERNAME = "masti";
const FRIEND_PASSWORD = "kamyaabi";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for persisted login
    const storedUser = localStorage.getItem('currentUserRole') as UserRole;
    if (storedUser) {
      setCurrentUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = (usernameInput: string, passwordInput: string): boolean => {
    let role: UserRole = null;
    if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
      role = 'admin';
    } else if (usernameInput === FRIEND_USERNAME && passwordInput === FRIEND_PASSWORD) {
      role = 'friend';
    }

    if (role) {
      setCurrentUser(role);
      localStorage.setItem('currentUserRole', role);
      router.push('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserRole');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
