import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, api } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (usernameOrEmail: string | { username_or_email: string; password: string }, password?: string) => Promise<void>;
  signup: (usernameOrData: string | { username: string; email: string; password: string }, email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data);
    } catch (_) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (usernameOrEmail: string | { username_or_email: string; password: string }, password?: string) => {
    const payload = typeof usernameOrEmail === 'string'
      ? { username_or_email: usernameOrEmail, password: password || '' }
      : usernameOrEmail;
    const profile = await api.login(payload);
    setUser(profile);
  };

  const signup = async (usernameOrData: string | { username: string; email: string; password: string }, email?: string, password?: string) => {
    const payload = typeof usernameOrData === 'string'
      ? { username: usernameOrData, email: email || '', password: password || '' }
      : usernameOrData;
    const profile = await api.signup(payload);
    setUser(profile);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
