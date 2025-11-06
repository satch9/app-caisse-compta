import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { Link } from 'react-router-dom';
import { Home, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { adminService } from '../services/api';
import { toast } from 'sonner';

interface Role {
  id: number;
  code: string;
  nom: string;
  description: string;
}

interface Permission {
  id: number;
  code: string;
  nom: string;
  description: string;
  categorie: string;
}

export function AdminRolesPage() {
  const { user } = useAuth();
  const { roles } = usePermissions();

  const [rolesData, setRolesData] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      const [rolesResult, permsResult] = await Promise.all([
        adminService.getAllRoles(),
        adminService.getAllPermissions()
      ]);
      setRolesData(rolesResult.roles || []);
      setPermissions(permsResult.permissions || []);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const permissionsParCategorie = permissions.reduce((acc, perm) => {
    if (!acc[perm.categorie]) {
      acc[perm.categorie] = [];
    }
    acc[perm.categorie].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b-2 border-purple-500">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 hover:opacity-70 transition">
              <Home className="w-6 h-6 text-purple-600" />
              <span className="font-bold text-lg">Retour</span>
            </Link>
            <div className="h-8 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-purple-600">RÔLES & PERMISSIONS</h1>
          </div>

          <div className="text-right">
            <div className="font-semibold">{user?.prenom} {user?.nom}</div>
            <div className="text-sm text-gray-600">{roles.join(', ')}</div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Rôles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              Rôles définis ({rolesData.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rolesData.map((role) => (
                <div key={role.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-bold text-lg mb-1">{role.nom}</h3>
                  <Badge variant="secondary" className="mb-2">{role.code}</Badge>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions par catégorie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              Permissions disponibles ({permissions.length})
            </h2>
            <div className="space-y-6">
              {Object.entries(permissionsParCategorie).map(([categorie, perms]) => (
                <div key={categorie}>
                  <h3 className="font-semibold text-lg mb-3 capitalize border-b pb-2">
                    {categorie} ({perms.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {perms.map((perm) => (
                      <div key={perm.id} className="border rounded p-3 text-sm">
                        <div className="font-semibold text-gray-900">{perm.nom}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded">{perm.code}</code>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{perm.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
