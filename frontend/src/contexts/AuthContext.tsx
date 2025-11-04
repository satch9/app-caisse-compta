import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        console.log('🔄 AuthContext: Chargement initial de l\'utilisateur');
        if (authService.isAuthenticated()) {
          console.log('✅ Token trouvé, chargement du profil utilisateur');
          const data = await authService.getMe();
          console.log('✅ Utilisateur chargé:', data.user);
          setUser(data.user);
        } else {
          console.log('⚠️ Pas de token trouvé');
        }
      } catch (error) {
        console.error('❌ Erreur chargement utilisateur:', error);
        console.log('🚪 Déconnexion suite à l\'erreur');
        authService.logout();
      } finally {
        setIsLoading(false);
        console.log('✅ Chargement initial terminé');
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthContext: Tentative de connexion pour', email);
    const data = await authService.login(email, password);
    console.log('✅ AuthContext: Connexion réussie, données reçues:', data);
    setUser(data.user);
    console.log('✅ AuthContext: User state mis à jour');
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
}
