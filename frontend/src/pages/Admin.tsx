import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { Link } from 'react-router-dom';
import { Home, Users, Shield, FileText, Settings } from 'lucide-react';

export function AdminPage() {
  const { user } = useAuth();
  const { roles } = usePermissions();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b-2 border-red-500">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition">
              <Home className="w-6 h-6 text-red-600" />
              <span className="font-bold text-lg">Retour</span>
            </Link>
            <div className="h-8 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-red-600">ADMINISTRATION</h1>
          </div>

          <div className="text-right">
            <div className="font-semibold">{user?.prenom} {user?.nom}</div>
            <div className="text-sm text-gray-600">{roles.join(', ')}</div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  Gestion des utilisateurs
                </CardTitle>
                <CardDescription>
                  Interface de gestion des utilisateurs et attribution des rôles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-purple-600" />
                  Rôles et permissions
                </CardTitle>
                <CardDescription>
                  Configuration des rôles et permissions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-orange-600" />
                  Logs système
                </CardTitle>
                <CardDescription>
                  Consultation des logs d'activité
                </CardDescription>
              </CardHeader>
            </Card>

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
          </div>
        </div>
      </div>
    </div>
  );
}
