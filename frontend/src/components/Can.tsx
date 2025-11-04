import { usePermissions } from '../contexts/PermissionsContext';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return null; // ou un loader
  }

  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
