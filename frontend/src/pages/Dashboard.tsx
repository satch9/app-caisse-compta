import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { Link } from 'react-router-dom';
import { DollarSign, Package, FileText, Users, Settings, User } from 'lucide-react';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { roles, can, permissions } = usePermissions();

  // Vérifier si l'utilisateur a au moins une permission dans une catégorie
  const hasAnyCaissePermission = permissions.some(p => p.startsWith('caisse.'));
  const hasAnyStockPermission = permissions.some(p => p.startsWith('stock.'));
  const hasAnyComptaPermission = permissions.some(p => p.startsWith('compta.'));
  const hasAnyMembresPermission = permissions.some(p => p.startsWith('membres.') && p !== 'membres.consulter_compte_soi');
  const hasAnyAdminPermission = permissions.some(p => p.startsWith('admin.'));
  const canViewOwnAccount = can('membres.consulter_compte_soi');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
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
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-2">Tableau de bord</h2>
          <p className="text-gray-600 mb-6">Bienvenue, {user?.prenom} !</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Caisse */}
            {hasAnyCaissePermission && (
              <Link
                to="/caisse"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-green-500"
              >
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold">Caisse</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Encaissements et ventes
                </p>
              </Link>
            )}

            {/* Stock */}
            {hasAnyStockPermission && (
              <Link
                to="/stock"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-blue-500"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold">Stock</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Gestion des produits et inventaire
                </p>
              </Link>
            )}

            {/* Comptabilité */}
            {hasAnyComptaPermission && (
              <Link
                to="/comptabilite"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-purple-500"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold">Comptabilité</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Documents comptables et rapports
                </p>
              </Link>
            )}

            {/* Membres */}
            {hasAnyMembresPermission && (
              <Link
                to="/membres"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-orange-500"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold">Membres</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Gestion des comptes membres
                </p>
              </Link>
            )}

            {/* Administration */}
            {hasAnyAdminPermission && (
              <Link
                to="/admin"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-red-500"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold">Administration</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Gestion des utilisateurs et rôles
                </p>
              </Link>
            )}

            {/* Mon Compte */}
            {canViewOwnAccount && (
              <Link
                to="/mon-compte"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-gray-500"
              >
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-6 h-6 text-gray-600" />
                  <h3 className="text-lg font-semibold">Mon Compte</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Consulter mon compte personnel
                </p>
              </Link>
            )}
          </div>

          {/* Debug info (à retirer en prod) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-800 text-white rounded-lg text-xs">
              <p className="font-semibold mb-2">Debug - Permissions chargées:</p>
              <pre className="overflow-x-auto">{JSON.stringify(permissions, null, 2)}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
