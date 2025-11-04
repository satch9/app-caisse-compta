import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { Can } from '../components/Can';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { roles } = usePermissions();

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
          <h2 className="text-2xl font-bold mb-6">Tableau de bord</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Caisse */}
            <Can permission="caisse.encaisser_especes">
              <Link
                to="/caisse"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">Caisse</h3>
                <p className="text-gray-600 text-sm">
                  Encaissements et ventes
                </p>
              </Link>
            </Can>

            {/* Stock */}
            <Can permission="stock.consulter">
              <Link
                to="/stock"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">Stock</h3>
                <p className="text-gray-600 text-sm">
                  Gestion des produits et inventaire
                </p>
              </Link>
            </Can>

            {/* Comptabilité */}
            <Can permission="compta.consulter_tout">
              <Link
                to="/comptabilite"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">Comptabilité</h3>
                <p className="text-gray-600 text-sm">
                  Documents comptables et rapports
                </p>
              </Link>
            </Can>

            {/* Membres */}
            <Can permission="membres.voir_liste">
              <Link
                to="/membres"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">Membres</h3>
                <p className="text-gray-600 text-sm">
                  Gestion des comptes membres
                </p>
              </Link>
            </Can>

            {/* Administration */}
            <Can permission="admin.gerer_utilisateurs">
              <Link
                to="/admin"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">Administration</h3>
                <p className="text-gray-600 text-sm">
                  Gestion des utilisateurs et rôles
                </p>
              </Link>
            </Can>

            {/* Mon Compte */}
            <Can permission="membres.consulter_compte_soi">
              <Link
                to="/mon-compte"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">Mon Compte</h3>
                <p className="text-gray-600 text-sm">
                  Consulter mon compte personnel
                </p>
              </Link>
            </Can>
          </div>
        </div>
      </main>
    </div>
  );
}
