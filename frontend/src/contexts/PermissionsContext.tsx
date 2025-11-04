import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';

interface PermissionsContextType {
  permissions: string[];
  roles: string[];
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger les permissions de l'utilisateur connecté
    async function loadPermissions() {
      try {
        if (authService.isAuthenticated()) {
          const data = await authService.getPermissions();
          setPermissions(data.permissions);
          setRoles(data.roles);
        }
      } catch (error) {
        console.error('Erreur chargement permissions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, []);

  const can = (permission: string): boolean => {
    return permissions.some(p => {
      if (p === permission) return true;
      if (p.endsWith('.*')) {
        const prefix = p.slice(0, -2);
        return permission.startsWith(prefix + '.');
      }
      return false;
    });
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, roles, can, hasRole, isLoading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions doit être utilisé dans PermissionsProvider');
  }
  return context;
}
