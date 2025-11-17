import { useAuth, usePermissions } from '@/hooks';
import { Link } from 'react-router-dom';
import { DollarSign, Package, FileText, Users, Settings, User, Wallet, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatCard } from '@/components/ui/stat-card';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header amélioré */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-card shadow-sm border-b border-border/50 sticky top-0 z-50 backdrop-blur-sm bg-card/95"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-10 bg-primary rounded-full" />
              <div>
                <h1 className="text-xl font-bold">TCX St-André</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">TCX Saint-André</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium">
                  {user?.prenom} {user?.nom}
                </span>
                <span className="text-xs text-muted-foreground">
                  {roles.join(', ')}
                </span>
              </div>
              <ThemeToggle />
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="h-9"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="px-4 sm:px-0"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Tableau de bord</h2>
            <p className="text-muted-foreground">
              Bonjour {user?.prenom}
            </p>
          </div>

          {/* Statistiques rapides */}
          {(hasAnyCaissePermission || hasTresoreriePermission) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Aperçu rapide</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="Sessions actives"
                  value="0"
                  description="Caisses ouvertes aujourd'hui"
                  icon={Clock}
                  iconColor="text-blue-600"
                  delay={0}
                />
                <StatCard
                  title="Ventes du jour"
                  value="0,00 €"
                  description="Total des encaissements"
                  icon={TrendingUp}
                  iconColor="text-green-600"
                  delay={0.1}
                />
                <StatCard
                  title="En attente"
                  value="0"
                  description="Sessions à valider"
                  icon={CheckCircle}
                  iconColor="text-orange-600"
                  delay={0.2}
                />
              </div>
            </div>
          )}

          {/* Informations contextuelles selon le rôle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="mb-8 border-l-4 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Votre profil</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {roles.includes('ADMIN') && 'Vous avez les droits administrateur. Vous pouvez gérer les utilisateurs et les paramètres du système.'}
                      {roles.includes('BE') && !roles.includes('ADMIN') && 'En tant que BE, vous avez accès à la caisse, aux stocks et à la gestion des membres.'}
                      {roles.includes('TRESORIER') && !roles.includes('ADMIN') && 'En tant que trésorier, vous gérez les fonds de caisse et validez les sessions.'}
                      {roles.includes('CAISSIER') && !roles.includes('ADMIN') && !roles.includes('BE') && 'Vous avez accès aux opérations de caisse et aux ventes.'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {roles.map(role => (
                        <span key={role} className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Accès rapides */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Modules disponibles</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Caisse */}
            {hasAnyCaissePermission && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <Link to="/caisse" className="block group">
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-green-500 hover:scale-105">
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
              </motion.div>
            )}

            {/* Trésorerie */}
            {hasTresoreriePermission && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Link to="/tresorerie" className="block group">
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-500 hover:scale-105">
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
              </motion.div>
            )}

            {/* Stock */}
            {hasAnyStockPermission && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <Link to="/stock" className="block group">
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500 hover:scale-105">
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
              </motion.div>
            )}

            {/* Comptabilité */}
            {hasAnyComptaPermission && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Link to="/comptabilite" className="block group">
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-purple-500 hover:scale-105">
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
              </motion.div>
            )}

            {/* Membres */}
            {hasAnyMembresPermission && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
              >
                <Link to="/membres" className="block group">
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-orange-500 hover:scale-105">
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
              </motion.div>
            )}

            {/* Administration */}
            {hasAnyAdminPermission && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Link to="/admin" className="block group">
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-red-500 hover:scale-105">
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
              </motion.div>
            )}

            {/* Mon Compte */}
            {canViewOwnAccount && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
              >
                <Link to="/mon-compte" className="block group">
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-gray-500 hover:scale-105">
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
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
