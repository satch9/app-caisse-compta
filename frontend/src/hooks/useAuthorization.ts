import { usePermissions } from '@/hooks';

export function useAuthorization() {
  const { can, hasRole } = usePermissions();

  return { can, hasRole };
}
