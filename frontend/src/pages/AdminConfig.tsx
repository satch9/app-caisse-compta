import { useState } from 'react';
import { useAuth, usePermissions } from '@/hooks';
import { Link } from 'react-router-dom';
import { Home, Settings, Trash2, Database, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logsService } from '../services/api';
import { toast } from 'sonner';

export function AdminConfigPage() {
  const { user } = useAuth();
  const { roles } = usePermissions();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteDays, setDeleteDays] = useState('90');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteOldLogs = async () => {
    try {
      setIsDeleting(true);
      const days = parseInt(deleteDays);

      if (isNaN(days) || days <= 0) {
        toast.error('Veuillez entrer un nombre de jours valide');
        return;
      }

      // Étape 1: Exporter les logs avant suppression
      toast.info('Export des logs en cours...');
      const exportData = await logsService.exportLogsToDelete(days);

      if (exportData.total > 0) {
        // Créer le fichier JSON
        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs_archive_${new Date().toISOString().split('T')[0]}_${exportData.total}_logs.json`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(`${exportData.total} logs exportés en JSON`);
      } else {
        toast.info('Aucun log à supprimer');
        setShowDeleteDialog(false);
        return;
      }

      // Étape 2: Supprimer les logs
      const result = await logsService.deleteOldLogs(days);

      if (result.archivePath) {
        toast.success(`${result.deleted} logs supprimés et archivés sur le serveur`);
        console.log(`📦 Archive serveur: ${result.archivePath}`);
      } else {
        toast.success(`${result.deleted} logs supprimés avec succès`);
      }

      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Erreur suppression logs:', error);
      toast.error('Erreur lors de la suppression des logs');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b-2 border-gray-500">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 hover:opacity-70 transition">
              <Home className="w-6 h-6 text-muted-foreground" />
              <span className="font-bold text-lg">Retour</span>
            </Link>
            <div className="h-8 w-px bg-border"></div>
            <h1 className="text-2xl font-bold text-foreground">CONFIGURATION</h1>
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
          {/* Section Système */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Gestion du système
              </CardTitle>
              <CardDescription>
                Maintenance et nettoyage de la base de données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nettoyage des logs */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-destructive" />
                      Nettoyage des logs système
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supprimez les anciens logs pour libérer de l'espace en base de données.
                      Les logs seront automatiquement exportés en JSON avant suppression (double sécurité).
                    </p>
                    <div className="bg-info/10 dark:bg-info/20 border border-info/30 rounded p-3 flex items-start gap-2">
                      <Database className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-info/90 dark:text-info/80">
                        <strong>Double sauvegarde :</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>Archive sauvegardée sur le serveur dans <code className="text-xs bg-info/20 dark:bg-info/30 px-1 rounded">archives/logs/</code></li>
                          <li>Fichier téléchargé dans votre navigateur</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6">
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="destructive"
                      className="whitespace-nowrap"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Nettoyer les logs
                    </Button>
                  </div>
                </div>
              </div>

              {/* Autres paramètres système */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  Autres paramètres
                </h3>
                <p className="text-sm text-muted-foreground">
                  Fonctionnalités à venir :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Configuration des catégories de produits</li>
                  <li>Gestion des types de paiement acceptés</li>
                  <li>Seuils d'alerte stock personnalisables</li>
                  <li>Paramètres d'export comptable</li>
                  <li>Configuration email/notifications</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section Informations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Informations sur l'application
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Version:</span> 1.0.0
                </div>
                <div>
                  <span className="font-semibold">Environnement:</span> Production
                </div>
                <div>
                  <span className="font-semibold">Base de données:</span> MySQL
                </div>
                <div>
                  <span className="font-semibold">Frontend:</span> React + Vite
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Supprimer les anciens logs
            </DialogTitle>
            <DialogDescription>
              Les logs antérieurs à la période spécifiée seront d'abord exportés en JSON, puis supprimés définitivement de la base de données.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="deleteDays">Supprimer les logs de plus de (jours) :</Label>
            <Input
              id="deleteDays"
              type="number"
              min="30"
              value={deleteDays}
              onChange={(e) => setDeleteDays(e.target.value)}
              placeholder="90"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Par exemple, entrer "90" supprimera tous les logs de plus de 90 jours (minimum 30 jours).
            </p>
          </div>

          <div className="bg-info/10 dark:bg-info/20 border border-info/30 rounded p-3 flex items-start gap-2 mb-3">
            <Database className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
            <div className="text-sm text-info/90 dark:text-info/80">
              <strong>Processus de sauvegarde :</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Export automatique des logs en fichier JSON</li>
                <li>Sauvegarde sur le serveur (<code className="text-xs bg-info/20 dark:bg-info/30 px-1 rounded">archives/logs/</code>)</li>
                <li>Téléchargement du fichier dans votre navigateur</li>
                <li>Suppression des logs de la base de données</li>
              </ol>
            </div>
          </div>

          <div className="bg-warning/10 dark:bg-warning/20 border border-warning/30 rounded p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-sm text-warning/90 dark:text-warning/80">
              <strong>Important :</strong> Conservez le fichier JSON exporté pour vos archives et audits futurs.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOldLogs}
              disabled={isDeleting}
            >
              {isDeleting ? 'Export et suppression...' : 'Exporter et supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
