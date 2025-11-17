import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks';
import { usePermissions } from '@/hooks';
import { Link } from 'react-router-dom';
import { Home, Users, Shield, FileText, Settings } from 'lucide-react';

export function AdminPage() {
  const { user } = useAuth();
  const { roles } = usePermissions();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b-2 border-red-500">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition">
              <Home className="w-6 h-6 text-red-600" />
              <span className="font-bold text-lg">Retour</span>
            </Link>
            <div className="h-8 w-px bg-border"></div>
            <h1 className="text-2xl font-bold text-red-600">ADMINISTRATION</h1>
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

      {/* Contenu principal */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Panneau d'administration</h2>
          <p className="text-gray-600 mb-6">Gestion du système et des utilisateurs</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {/* Gestion des utilisateurs */}
            <Link to="/admin/users">
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    Utilisateurs
                  </CardTitle>
                  <CardDescription>
                    Gestion et attribution des rôles
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Rôles et permissions */}
            <Link to="/admin/roles">
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-purple-600" />
                    Permissions
                  </CardTitle>
                  <CardDescription>
                    Configuration des rôles
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Logs système */}
            <Link to="/admin/logs">
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-orange-600" />
                    Logs
                  </CardTitle>
                  <CardDescription>
                    Consultation des logs
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Configuration */}
            <Link to="/admin/config">
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-gray-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-gray-600" />
                    Configuration
                  </CardTitle>
                  <CardDescription>
                    Paramètres de l'application
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
