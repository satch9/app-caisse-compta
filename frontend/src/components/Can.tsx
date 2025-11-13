import { usePermissions } from '@/hooks';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasPermission = can(permission);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
