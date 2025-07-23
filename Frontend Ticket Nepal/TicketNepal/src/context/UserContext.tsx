'use client';

import React, { createContext, useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface UserContextType {
  currentUser: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export const UserContext = createContext<UserContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // On mount: Try to fetch current user with saved token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const fetchUser = async () => {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL;
          const response = await fetch(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const user = await response.json();
            setCurrentUser(user);
          } else {
            logout();
          }
        } catch {
          setCurrentUser(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    } else {
      setIsLoading(false);
    }
  // Cleanup function to reset state on unmount
  }, []);

  // On login: Save both user and token
  const login = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('authToken', token);
  };

  // On logout: Clear state, token, and redirect to login page
  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    router.push('/auth/login');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const value = { currentUser, login, logout, isLoading };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
