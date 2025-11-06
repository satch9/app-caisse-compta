import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { Link } from 'react-router-dom';
import { Home, FileText, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AdminLogsPage() {
  const { user } = useAuth();
  const { roles } = usePermissions();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b-2 border-orange-500">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 hover:opacity-70 transition">
              <Home className="w-6 h-6 text-orange-600" />
              <span className="font-bold text-lg">Retour</span>
            </Link>
            <div className="h-8 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-orange-600">LOGS SYSTÈME</h1>
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
              Cette section permettra de consulter les logs d'activité du système:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Connexions/Déconnexions utilisateurs</li>
                <li>Modifications de données importantes (transactions, utilisateurs, etc.)</li>
                <li>Erreurs système</li>
                <li>Actions administratives</li>
                <li>Filtres par date, type, utilisateur</li>
                <li>Export des logs</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-orange-600" />
              <h2 className="text-xl font-bold">Consultation des logs</h2>
            </div>

            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">Système de logs à implémenter</p>
              <p className="text-sm">
                Un système de logging centralisé sera configuré pour tracer toutes les actions importantes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
