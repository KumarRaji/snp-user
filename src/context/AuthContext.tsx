import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

interface AuthContextData {
  isLoading: boolean;
  userToken: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token: string | null = null;
      try {
        token = await AsyncStorage.getItem('token');
      } catch (e) {
        // Restoring token failed
        console.error('Failed to load token from storage', e);
      }
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    login: async (token: string) => {
      setIsLoading(true);
      await AsyncStorage.setItem('token', token);
      setUserToken(token);
      setIsLoading(false);
    },
    logout: async () => {
      setIsLoading(true);
      await AsyncStorage.removeItem('token');
      setUserToken(null);
      setIsLoading(false);
    },
    isLoading,
    userToken,
  };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
