import { useContext } from 'react';
import { PermissionsContext } from '../contexts/PermissionsContext';

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions doit être utilisé dans PermissionsProvider');
  }
  return context;
}
