import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { Link } from 'react-router-dom';
import { DollarSign, Package, FileText, Users, Settings, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { roles, can, permissions } = usePermissions();

  // Vérifier si l'utilisateur a au moins une permission dans une catégorie
  const hasAnyCaissePermission = permissions.some(p => p.startsWith('caisse.') && !['caisse.donner_fond_initial', 'caisse.valider_fermeture'].includes(p));
  const hasTresoreriePermission = can('caisse.donner_fond_initial') || can('caisse.valider_fermeture');
  const hasAnyStockPermission = permissions.some(p => p.startsWith('stock.'));
  const hasAnyComptaPermission = permissions.some(p => p.startsWith('compta.'));
  const hasAnyMembresPermission = permissions.some(p => p.startsWith('membres.') && p !== 'membres.consulter_compte_soi');
  const hasAnyAdminPermission = permissions.some(p => p.startsWith('admin.'));
  const canViewOwnAccount = can('membres.consulter_compte_soi');

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Gestion de Caisse</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.prenom} {user?.nom}
              </span>
              <span className="text-xs text-gray-500">
                ({roles.join(', ')})
              </span>
              <Button
                onClick={logout}
                variant="destructive"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-2">Tableau de bord</h2>
          <p className="text-gray-600 mb-6">Bienvenue, {user?.prenom} !</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {/* Caisse */}
            {hasAnyCaissePermission && (
              <Link to="/caisse">
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      Caisse
                    </CardTitle>
                    <CardDescription>
                      Encaissements et ventes
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {/* Trésorerie */}
            {hasTresoreriePermission && (
              <Link to="/tresorerie">
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-indigo-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Wallet className="w-6 h-6 text-indigo-600" />
                      Trésorerie
                    </CardTitle>
                    <CardDescription>
                      Gestion des fonds de caisse
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {/* Stock */}
            {hasAnyStockPermission && (
              <Link to="/stock">
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-blue-600" />
                      Stock
                    </CardTitle>
                    <CardDescription>
                      Gestion des produits et inventaire
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {/* Comptabilité */}
            {hasAnyComptaPermission && (
              <Link to="/comptabilite">
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-purple-600" />
                      Comptabilité
                    </CardTitle>
                    <CardDescription>
                      Documents comptables et rapports
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {/* Membres */}
            {hasAnyMembresPermission && (
              <Link to="/membres">
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-orange-600" />
                      Membres
                    </CardTitle>
                    <CardDescription>
                      Gestion des comptes membres
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {/* Administration */}
            {hasAnyAdminPermission && (
              <Link to="/admin">
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Settings className="w-6 h-6 text-red-600" />
                      Administration
                    </CardTitle>
                    <CardDescription>
                      Gestion des utilisateurs et rôles
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {/* Mon Compte */}
            {canViewOwnAccount && (
              <Link to="/mon-compte">
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-gray-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <User className="w-6 h-6 text-gray-600" />
                      Mon Compte
                    </CardTitle>
                    <CardDescription>
                      Consulter mon compte personnel
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
          </div>

          {/* Debug info (à retirer en prod) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-sm">Debug - Permissions chargées</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto text-xs">{JSON.stringify(permissions, null, 2)}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
