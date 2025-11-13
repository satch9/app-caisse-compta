import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface PermissionsContextType {
  permissions: string[];
  roles: string[];
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
}

export const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger les permissions de l'utilisateur connecté
    async function loadPermissions() {
      // Attendre que AuthContext ait fini de charger
      if (authLoading) {
        console.log('⏳ En attente du chargement de l\'utilisateur...');
        return;
      }

      try {
        if (isAuthenticated && user) {
          console.log('🔄 Chargement des permissions pour:', user.email);
          const data = await authService.getPermissions();
          console.log('✅ Permissions reçues:', data);
          setPermissions(data.permissions || []);
          setRoles(data.roles || []);
        } else {
          console.log('⚠️ Non authentifié, permissions vides');
          setPermissions([]);
          setRoles([]);
        }
      } catch (error) {
        console.error('❌ Erreur chargement permissions:', error);
        // En cas d'erreur, vider les permissions
        setPermissions([]);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, [authLoading, isAuthenticated, user]);

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
