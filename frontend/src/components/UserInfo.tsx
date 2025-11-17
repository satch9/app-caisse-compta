import { useAuth, usePermissions } from '@/hooks';

export function UserInfo() {
  const { user } = useAuth();
  const { roles } = usePermissions();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right hidden md:block">
        <div className="text-sm font-medium text-foreground">
          {user.prenom} {user.nom}
        </div>
        <div className="text-xs text-muted-foreground">
          {roles.join(', ')}
        </div>
      </div>
    </div>
  );
}
