import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { Link } from 'react-router-dom';
import { Home, Settings, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AdminConfigPage() {
  const { user } = useAuth();
  const { roles } = usePermissions();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b-2 border-gray-500">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 hover:opacity-70 transition">
              <Home className="w-6 h-6 text-gray-600" />
              <span className="font-bold text-lg">Retour</span>
            </Link>
            <div className="h-8 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-600">CONFIGURATION</h1>
          </div>

          <div className="text-right">
            <div className="font-semibold">{user?.prenom} {user?.nom}</div>
            <div className="text-sm text-gray-600">{roles.join(', ')}</div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Fonctionnalité en cours de développement</strong>
              <br />
              Cette section permettra de configurer les paramètres de l'application:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Paramètres généraux de l'application</li>
                <li>Configuration des catégories de produits</li>
                <li>Gestion des types de paiement acceptés</li>
                <li>Seuils d'alerte stock</li>
                <li>Paramètres d'export comptable</li>
                <li>Configuration email/notifications</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-8 h-8 text-gray-600" />
              <h2 className="text-xl font-bold">Paramètres de l'application</h2>
            </div>

            <div className="text-center py-12 text-gray-500">
              <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">Interface de configuration à implémenter</p>
              <p className="text-sm">
                Les paramètres configurables seront accessibles ici pour personnaliser le fonctionnement de l'application.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
