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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Erreur livraison commande:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la validation');
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
    } catch (error: any) {
      console.error('Erreur suppression commande:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const getStatutBadge = (statut: StatutCommande) => {
    const variants = {
      en_attente: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      livree: { label: 'Livrée', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      annulee: { label: 'Annulée', className: 'bg-gray-100 text-gray-800', icon: XCircle }
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
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commandes en attente</p>
              <p className="text-2xl font-bold text-yellow-600">{commandesEnAttente.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commandes livrées</p>
              <p className="text-2xl font-bold text-green-600">{commandesLivrees.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Montant total en attente</p>
              <p className="text-2xl font-bold text-blue-600">
                {commandesEnAttente.reduce((sum, c) => sum + c.montant_total, 0).toFixed(2)}€
              </p>
            </div>
            <Truck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Toutes les commandes
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : commandes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune commande fournisseur</p>
            <p className="text-sm mt-2">Créez votre première commande</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date commande
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Livraison prévue
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commandes.map((commande) => (
                  <tr key={commande.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{commande.fournisseur_nom}</div>
                        {commande.fournisseur_contact && (
                          <div className="text-xs text-gray-500">{commande.fournisseur_contact}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(commande.date_achat)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(commande.date_livraison_prevue)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
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
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSupprimer(commande)}
                              className="text-red-600 hover:text-red-700"
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
                  <p className="text-sm text-gray-600">Fournisseur</p>
                  <p className="font-medium">{selectedCommande.fournisseur_nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-medium">{selectedCommande.fournisseur_contact || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de commande</p>
                  <p className="font-medium">{formatDate(selectedCommande.date_achat)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Livraison prévue</p>
                  <p className="font-medium">{formatDate(selectedCommande.date_livraison_prevue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  {getStatutBadge(selectedCommande.statut)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Créée par</p>
                  <p className="font-medium">{selectedCommande.user_nom}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Produits commandés</p>
                <div className="border rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantité</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Prix unitaire</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedCommande.lignes.map((ligne, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{ligne.produit_nom}</td>
                          <td className="px-4 py-2 text-sm text-right">{ligne.quantite}</td>
                          <td className="px-4 py-2 text-sm text-right">{ligne.prix_unitaire.toFixed(2)} €</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">
                            {(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={3} className="px-4 py-2 text-sm text-right">Total</td>
                        <td className="px-4 py-2 text-sm text-right">
                          {selectedCommande.montant_total.toFixed(2)} €
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedCommande.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm">{selectedCommande.notes}</p>
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
            <p className="text-gray-700">
              Confirmez-vous que la commande de <strong>{selectedCommande?.fournisseur_nom}</strong> a été livrée ?
            </p>
            <p className="text-sm text-yellow-600 mt-2">
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
              className="bg-green-600 hover:bg-green-700"
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
