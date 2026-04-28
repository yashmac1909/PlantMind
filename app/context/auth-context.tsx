'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Safe JSON parse
  const safeParse = (data: string | null) => {
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const usersJson = localStorage.getItem('plantMonitorUsers');
    const users = safeParse(usersJson) || [];

    // ✅ Create demo user if none exists
    if (users.length === 0) {
      const demoUsers = [
        {
          id: '1',
          name: 'Demo User',
          email: 'demo@plantmind.com',
          password: 'demo123',
        },
      ];
      localStorage.setItem('plantMonitorUsers', JSON.stringify(demoUsers));
    }

    // ✅ Load logged-in user
    const storedUser = safeParse(localStorage.getItem('plantMonitorUser'));
    if (storedUser) {
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const users = safeParse(localStorage.getItem('plantMonitorUsers')) || [];

      const foundUser = users.find(
        (u: any) => u.email === email && u.password === password
      );

      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
      };

      setUser(userData);
      localStorage.setItem('plantMonitorUser', JSON.stringify(userData));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      let users = safeParse(localStorage.getItem('plantMonitorUsers')) || [];

      if (users.some((u: any) => u.email === email)) {
        throw new Error('Email already registered');
      }

      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
      };

      users.push(newUser);
      localStorage.setItem('plantMonitorUsers', JSON.stringify(users));

      const userData: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      };

      setUser(userData);
      localStorage.setItem('plantMonitorUser', JSON.stringify(userData));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('plantMonitorUser');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}