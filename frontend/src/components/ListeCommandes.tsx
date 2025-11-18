import { useState, useEffect } from 'react';
import { approvisionnementService } from '../services/api';
import type { StatutCommande } from '../services/api';
import { Truck, Package, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Ligne {
  produit_nom: string;
  quantite: number;
  prix_unitaire: number;
}

interface Commande {
  id: number;
  montant_total: number;
  date_achat: string;
  fournisseur_nom: string;
  fournisseur_contact: string | null;
  date_livraison_prevue: string;
  date_livraison_reelle: string | null;
  statut: StatutCommande;
  user_nom: string;
  notes: string | null;
  lignes: Ligne[];
}

export function ListeCommandes() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    try {
      setLoading(true);
      const data = await approvisionnementService.getAll({
        type: 'commande_fournisseur',
        limit: 100
      });
      setCommandes(data.approvisionnements || []);
    } catch (error: unknown) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleMarquerLivree = async () => {
    if (!selectedCommande) return;

    try {
      setActionLoading(true);
      await approvisionnementService.marquerCommeLivree(selectedCommande.id);
      toast.success('Commande marquée comme livrée, stocks mis à jour');
      setShowConfirmDialog(false);
      setSelectedCommande(null);
      await loadCommandes();
    } catch (error: unknown) {
      console.error('Erreur livraison commande:', error);
      toast.error((error as any).response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSupprimer = async (commande: Commande) => {
    if (!confirm(`Supprimer la commande "${commande.fournisseur_nom}" ?`)) {
      return;
    }

    try {
      await approvisionnementService.delete(commande.id);
      toast.success('Commande supprimée');
      await loadCommandes();
    } catch (error: unknown) {
      console.error('Erreur suppression commande:', error);
      toast.error((error as any).response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const getStatutBadge = (statut: StatutCommande) => {
    const variants = {
      en_attente: { label: 'En attente', className: 'bg-warning/20 dark:bg-warning/30 text-warning dark:text-warning', icon: Clock },
      livree: { label: 'Livrée', className: 'bg-success/20 dark:bg-success/30 text-success dark:text-success', icon: CheckCircle },
      annulee: { label: 'Annulée', className: 'bg-muted text-muted-foreground', icon: XCircle }
    };

    const config = variants[statut];
    const Icon = config.icon;

    return (
      <Badge className={config.className} variant="outline">
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const commandesEnAttente = commandes.filter(c => c.statut === 'en_attente');
  const commandesLivrees = commandes.filter(c => c.statut === 'livree');

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg shadow p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Commandes en attente</p>
              <p className="text-2xl font-bold text-warning">{commandesEnAttente.length}</p>
            </div>
            <Clock className="w-8 h-8 text-warning" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Commandes livrées</p>
              <p className="text-2xl font-bold text-success">{commandesLivrees.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Montant total en attente</p>
              <p className="text-2xl font-bold text-info">
                {commandesEnAttente.reduce((sum, c) => sum + c.montant_total, 0).toFixed(2)}€
              </p>
            </div>
            <Truck className="w-8 h-8 text-info" />
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-card rounded-lg shadow border border-border">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <Truck className="w-5 h-5 text-primary" />
            Toutes les commandes
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : commandes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 text-info/50" />
            <p>Aucune commande fournisseur</p>
            <p className="text-sm mt-2">Créez votre première commande</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date commande
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Livraison prévue
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {commandes.map((commande) => (
                  <tr key={commande.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-foreground">{commande.fournisseur_nom}</div>
                        {commande.fournisseur_contact && (
                          <div className="text-xs text-muted-foreground">{commande.fournisseur_contact}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {formatDate(commande.date_achat)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {formatDate(commande.date_livraison_prevue)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-foreground">
                      {commande.montant_total.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatutBadge(commande.statut)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCommande(commande);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Package className="w-4 h-4" />
                        </Button>

                        {commande.statut === 'en_attente' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCommande(commande);
                                setShowConfirmDialog(true);
                              }}
                              className="text-success hover:text-success/80 hover:border-success/50"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSupprimer(commande)}
                              className="text-destructive hover:text-destructive/80 hover:border-destructive/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog Détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          {selectedCommande && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseur</p>
                  <p className="font-medium text-foreground">{selectedCommande.fournisseur_nom}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium text-foreground">{selectedCommande.fournisseur_contact || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de commande</p>
                  <p className="font-medium text-foreground">{formatDate(selectedCommande.date_achat)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Livraison prévue</p>
                  <p className="font-medium text-foreground">{formatDate(selectedCommande.date_livraison_prevue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  {getStatutBadge(selectedCommande.statut)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créée par</p>
                  <p className="font-medium text-foreground">{selectedCommande.user_nom}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Produits commandés</p>
                <div className="border rounded border-border">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Produit</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Quantité</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Prix unitaire</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedCommande.lignes.map((ligne, idx) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          <td className="px-4 py-2 text-sm text-foreground">{ligne.produit_nom}</td>
                          <td className="px-4 py-2 text-sm text-right text-foreground">{ligne.quantite}</td>
                          <td className="px-4 py-2 text-sm text-right text-foreground">{ligne.prix_unitaire.toFixed(2)} €</td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-foreground">
                            {(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 font-bold">
                        <td colSpan={3} className="px-4 py-2 text-sm text-right text-foreground">Total</td>
                        <td className="px-4 py-2 text-sm text-right text-foreground">
                          {selectedCommande.montant_total.toFixed(2)} €
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedCommande.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground">{selectedCommande.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation Livraison */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la livraison</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">
              Confirmez-vous que la commande de <strong>{selectedCommande?.fournisseur_nom}</strong> a été livrée ?
            </p>
            <p className="text-sm text-warning mt-2">
              Les stocks seront automatiquement mis à jour pour tous les produits de cette commande.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={actionLoading}>
              Annuler
            </Button>
            <Button
              onClick={handleMarquerLivree}
              disabled={actionLoading}
              className="bg-success hover:bg-success/90"
            >
              {actionLoading ? <Spinner size="sm" className="mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Confirmer la livraison
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
