import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { usePermissions } from '@/hooks';
import { Link } from 'react-router-dom';
import { Home, Shield, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { adminService } from '../services/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [rolesResult, permsResult, matrixResult] = await Promise.all([
        adminService.getAllRoles(),
        adminService.getAllPermissions(),
        adminService.getRolePermissionsMatrix()
      ]);
      setRolesData(rolesResult.roles || []);
      setPermissions(permsResult.permissions || []);
      setMatrix(matrixResult.matrix || {});
    } catch (err) {
      console.error('Erreur chargement données:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const permissionsParCategorie = permissions.reduce((acc, perm) => {
    if (!acc[perm.categorie]) {
      acc[perm.categorie] = [];
    }
    acc[perm.categorie].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const hasPermission = (roleCode: string, permissionCode: string): boolean => {
    return matrix[roleCode]?.[permissionCode] === true;
  };

  const countRolePermissions = (roleCode: string): number => {
    return Object.keys(matrix[roleCode] || {}).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

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
            <div className="h-8 w-px bg-border"></div>
            <h1 className="text-2xl font-bold text-purple-600">RÔLES & PERMISSIONS</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-semibold">{user?.prenom} {user?.nom}</div>
              <div className="text-sm text-muted-foreground">{roles.join(', ')}</div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="matrice" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
              <TabsTrigger value="matrice">Matrice</TabsTrigger>
              <TabsTrigger value="roles">Rôles</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            {/* Onglet Matrice */}
            <TabsContent value="matrice">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-purple-600" />
                    Matrice des permissions par rôle
                  </CardTitle>
                  <CardDescription>
                    Visualisation des permissions attribuées à chaque rôle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(permissionsParCategorie).map(([categorie, perms]) => (
                      <div key={categorie} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4 capitalize text-purple-700">
                          {categorie} ({perms.length} permissions)
                        </h3>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                                  Permission
                                </th>
                                {rolesData.map((role) => (
                                  <th key={role.code} className="p-2 text-center font-medium text-gray-700 min-w-[100px]">
                                    <div className="flex flex-col items-center gap-1">
                                      <span>{role.code}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {countRolePermissions(role.code)}
                                      </Badge>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {perms.map((perm) => (
                                <tr key={perm.code} className="border-b hover:bg-muted/50">
                                  <td className="p-2 sticky left-0 bg-card z-10">
                                    <div>
                                      <div className="font-medium text-foreground">{perm.nom}</div>
                                      <div className="text-xs text-muted-foreground">
                                        <code className="bg-muted px-1 rounded">{perm.code}</code>
                                      </div>
                                    </div>
                                  </td>
                                  {rolesData.map((role) => (
                                    <td key={`${perm.code}-${role.code}`} className="p-2 text-center">
                                      {hasPermission(role.code, perm.code) ? (
                                        <div className="flex justify-center">
                                          <div className="bg-green-100 text-green-700 rounded-full p-1">
                                            <Check className="w-4 h-4" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex justify-center">
                                          <div className="bg-gray-100 text-gray-400 rounded-full p-1">
                                            <X className="w-4 h-4" />
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Rôles */}
            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-purple-600" />
                    Rôles définis ({rolesData.length})
                  </CardTitle>
                  <CardDescription>
                    Liste de tous les rôles disponibles dans le système
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rolesData.map((role) => (
                      <div key={role.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg">{role.nom}</h3>
                          <Badge variant="secondary">{countRolePermissions(role.code)}</Badge>
                        </div>
                        <Badge className="mb-2">{role.code}</Badge>
                        <p className="text-sm text-gray-600 mt-2">{role.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Permissions */}
            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Permissions disponibles ({permissions.length})
                  </CardTitle>
                  <CardDescription>
                    Liste de toutes les permissions granulaires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(permissionsParCategorie).map(([categorie, perms]) => (
                      <div key={categorie}>
                        <h3 className="font-semibold text-lg mb-3 capitalize border-b pb-2 text-purple-700">
                          {categorie} ({perms.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {perms.map((perm) => (
                            <div key={perm.id} className="border rounded p-3 text-sm hover:bg-gray-50 transition">
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
