import { useState, useEffect } from 'react';
import { useAuth, usePermissions } from '@/hooks';
import { Link } from 'react-router-dom';
import { Home, FileText, Filter, Download, RefreshCw, User, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logsService } from '../services/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SystemLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
  user_email?: string;
  user_nom?: string;
  user_prenom?: string;
}

export function AdminLogsPage() {
  const { user } = useAuth();
  const { roles } = usePermissions();

  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  // Filtres
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [dateDebutFilter, setDateDebutFilter] = useState<string>('');
  const [dateFinFilter, setDateFinFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [limit] = useState(50);

  useEffect(() => {
    chargerDonnees();
    chargerFiltres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chargerLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, entityTypeFilter, dateDebutFilter, dateFinFilter, page]);

  const chargerDonnees = async () => {
    await Promise.all([chargerLogs(), chargerFiltres()]);
  };

  const chargerLogs = async () => {
    try {
      setLoading(true);
      const filters: any = {
        limit,
        offset: page * limit,
      };

      if (actionFilter && actionFilter !== 'all') filters.action = actionFilter;
      if (entityTypeFilter && entityTypeFilter !== 'all') filters.entity_type = entityTypeFilter;
      if (dateDebutFilter) filters.date_debut = dateDebutFilter;
      if (dateFinFilter) filters.date_fin = dateFinFilter;

      const result = await logsService.getLogs(filters);
      setLogs(result.logs || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('Erreur chargement logs:', err);
      toast.error('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const chargerFiltres = async () => {
    try {
      const [actionsResult, entityTypesResult] = await Promise.all([
        logsService.getUniqueActions(),
        logsService.getUniqueEntityTypes(),
      ]);
      setActions(actionsResult.actions || []);
      setEntityTypes(entityTypesResult.entityTypes || []);
    } catch (err) {
      console.error('Erreur chargement filtres:', err);
    }
  };

  const resetFiltres = () => {
    setActionFilter('all');
    setEntityTypeFilter('all');
    setDateDebutFilter('');
    setDateFinFilter('');
    setPage(0);
  };

  const exporterLogs = () => {
    // Créer un CSV
    const headers = ['Date', 'Utilisateur', 'Action', 'Type', 'ID', 'Détails', 'IP'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString('fr-FR'),
      log.user_email || 'Système',
      log.action,
      log.entity_type || '',
      log.entity_id || '',
      log.details || '',
      log.ip_address || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getActionBadgeColor = (action: string): string => {
    if (action.includes('create') || action.includes('créer')) return 'bg-green-100 text-green-700';
    if (action.includes('update') || action.includes('modifier')) return 'bg-blue-100 text-blue-700';
    if (action.includes('delete') || action.includes('supprimer')) return 'bg-red-100 text-red-700';
    if (action.includes('login') || action.includes('connexion')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const totalPages = Math.ceil(total / limit);

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
            <div className="h-8 w-px bg-border"></div>
            <h1 className="text-2xl font-bold text-orange-600">LOGS SYSTÈME</h1>
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
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtres
              </CardTitle>
              <CardDescription>
                Affinez votre recherche dans les logs système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Action</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      {actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Type d'entité</Label>
                  <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {entityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date début</Label>
                  <Input
                    type="date"
                    value={dateDebutFilter}
                    onChange={(e) => setDateDebutFilter(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Date fin</Label>
                  <Input
                    type="date"
                    value={dateFinFilter}
                    onChange={(e) => setDateFinFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={resetFiltres} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button onClick={exporterLogs} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total des logs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground">
                  {logs.length} affichés sur cette page
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions différentes</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{actions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Types d'actions enregistrés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entités suivies</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{entityTypes.length}</div>
                <p className="text-xs text-muted-foreground">
                  Types d'entités différents
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table des logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historique des actions</CardTitle>
                  <CardDescription>
                    {total} entrées au total
                  </CardDescription>
                </div>
                <Button onClick={chargerLogs} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Chargement des logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-2">Aucun log trouvé</p>
                  <p className="text-sm text-muted-foreground">
                    Essayez de modifier les filtres ou attendez que des actions soient enregistrées
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Date/Heure</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Utilisateur</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Action</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Entité</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Détails</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 whitespace-nowrap text-foreground">
                              {new Date(log.created_at).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  {log.user_email ? (
                                    <>
                                      <div className="font-medium text-foreground">
                                        {log.user_prenom} {log.user_nom}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{log.user_email}</div>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground italic">Système</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getActionBadgeColor(log.action)}>
                                {log.action}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {log.entity_type ? (
                                <div className="text-foreground">
                                  <div className="font-medium">{log.entity_type}</div>
                                  {log.entity_id && (
                                    <div className="text-xs text-muted-foreground">ID: {log.entity_id}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              {log.details ? (
                                <div className="text-muted-foreground text-xs truncate" title={log.details}>
                                  {log.details}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                              {log.ip_address || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Page {page + 1} sur {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setPage(Math.max(0, page - 1))}
                          disabled={page === 0}
                          variant="outline"
                          size="sm"
                        >
                          Précédent
                        </Button>
                        <Button
                          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                          disabled={page >= totalPages - 1}
                          variant="outline"
                          size="sm"
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
