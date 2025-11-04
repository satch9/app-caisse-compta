import { usePermissions } from '../contexts/PermissionsContext';

export function useAuthorization() {
  const { can, hasRole } = usePermissions();

  return { can, hasRole };
}
