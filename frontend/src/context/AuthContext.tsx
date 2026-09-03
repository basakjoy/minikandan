'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AuthResponse, User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('kanban_token');
        const storedUser = localStorage.getItem('kanban_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify with /auth/me in background
          try {
            const { data } = await api.get<User>('/auth/me');
            setUser(data);
            localStorage.setItem('kanban_user', JSON.stringify(data));
          } catch {
            localStorage.removeItem('kanban_token');
            localStorage.removeItem('kanban_user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error('Error initializing auth:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('kanban_token', data.accessToken);
    localStorage.setItem('kanban_user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
    router.push('/boards');
  };

  const register = async (email: string, name: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, name, password });
    localStorage.setItem('kanban_token', data.accessToken);
    localStorage.setItem('kanban_user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
    router.push('/boards');
  };

  const logout = () => {
    localStorage.removeItem('kanban_token');
    localStorage.removeItem('kanban_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
