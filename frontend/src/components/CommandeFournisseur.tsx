import { useState, useEffect } from 'react';
import { produitsService, approvisionnementService } from '../services/api';
import { Truck, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface Produit {
  id: number;
  nom: string;
  prix_achat: number;
}

interface LigneCommande {
  produit_id: number;
  produit_nom?: string;
  quantite: number;
  prix_unitaire: number;
}

interface CommandeFournisseurProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CommandeFournisseur({ open, onClose, onSuccess }: CommandeFournisseurProps) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [lignes, setLignes] = useState<LigneCommande[]>([]);
  const [fournisseurNom, setFournisseurNom] = useState('');
  const [fournisseurContact, setFournisseurContact] = useState('');
  const [dateLivraisonPrevue, setDateLivraisonPrevue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProduits, setLoadingProduits] = useState(false);

  useEffect(() => {
    if (open) {
      loadProduits();
      resetForm();

      // Date de livraison par défaut : dans 7 jours
      const dateDans7Jours = new Date();
      dateDans7Jours.setDate(dateDans7Jours.getDate() + 7);
      setDateLivraisonPrevue(dateDans7Jours.toISOString().split('T')[0]);
    }
  }, [open]);

  const loadProduits = async () => {
    try {
      setLoadingProduits(true);
      const data = await produitsService.getAll();
      setProduits(data.produits || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoadingProduits(false);
    }
  };

  const resetForm = () => {
    setLignes([{ produit_id: 0, quantite: 1, prix_unitaire: 0 }]);
    setFournisseurNom('');
    setFournisseurContact('');
    setNotes('');
  };

  const ajouterLigne = () => {
    setLignes([...lignes, { produit_id: 0, quantite: 1, prix_unitaire: 0 }]);
  };

  const supprimerLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const modifierLigne = (index: number, field: keyof LigneCommande, value: any) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };

    // Si on change le produit, mettre à jour le prix d'achat par défaut
    if (field === 'produit_id') {
      const produit = produits.find(p => p.id === parseInt(value));
      if (produit) {
        newLignes[index].prix_unitaire = produit.prix_achat;
        newLignes[index].produit_nom = produit.nom;
      }
    }

    setLignes(newLignes);
  };

  const calculerMontantTotal = (): number => {
    return lignes.reduce((total, ligne) => {
      return total + (ligne.quantite * ligne.prix_unitaire);
    }, 0);
  };

  const handleSubmit = async () => {
    // Validation
    if (!fournisseurNom.trim()) {
      toast.error('Le nom du fournisseur est requis');
      return;
    }

    const lignesValides = lignes.filter(l => l.produit_id > 0 && l.quantite > 0 && l.prix_unitaire >= 0);

    if (lignesValides.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    const montantTotal = calculerMontantTotal();
    if (montantTotal <= 0) {
      toast.error('Le montant total doit être supérieur à 0');
      return;
    }

    if (!dateLivraisonPrevue) {
      toast.error('La date de livraison prévue est requise');
      return;
    }

    try {
      setLoading(true);
      await approvisionnementService.create({
        type: 'commande_fournisseur',
        montant_total: montantTotal,
        date_achat: new Date().toISOString(),
        fournisseur_nom: fournisseurNom.trim(),
        fournisseur_contact: fournisseurContact.trim() || undefined,
        date_livraison_prevue: dateLivraisonPrevue,
        notes: notes || undefined,
        lignes: lignesValides.map(l => ({
          produit_id: l.produit_id,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire
        }))
      });

      toast.success(`Commande créée : ${lignesValides.length} produit(s), ${montantTotal.toFixed(2)}€`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur création commande:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const montantTotal = calculerMontantTotal();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Créer une commande fournisseur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informations fournisseur */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-400">Fournisseur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fournisseur-nom">Nom du fournisseur *</Label>
                <Input
                  id="fournisseur-nom"
                  value={fournisseurNom}
                  onChange={(e) => setFournisseurNom(e.target.value)}
                  placeholder="Ex: Brasserie du Sud-Ouest"
                />
              </div>
              <div>
                <Label htmlFor="fournisseur-contact">Contact (email ou tél.)</Label>
                <Input
                  id="fournisseur-contact"
                  value={fournisseurContact}
                  onChange={(e) => setFournisseurContact(e.target.value)}
                  placeholder="contact@brasserie.fr ou 05 61 XX XX XX"
                />
              </div>
            </div>
          </div>

          {/* Date et montant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date-livraison">Date de livraison prévue *</Label>
              <Input
                id="date-livraison"
                type="date"
                value={dateLivraisonPrevue}
                onChange={(e) => setDateLivraisonPrevue(e.target.value)}
              />
            </div>
            <div>
              <Label>Montant total estimé</Label>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {montantTotal.toFixed(2)} €
              </div>
            </div>
          </div>

          {/* Produits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Produits à commander</Label>
              <Button
                type="button"
                onClick={ajouterLigne}
                size="sm"
                variant="outline"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un produit
              </Button>
            </div>

            {loadingProduits ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-2">
                {lignes.map((ligne, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Produit</Label>
                      <Select
                        value={ligne.produit_id.toString()}
                        onValueChange={(value) => modifierLigne(index, 'produit_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          {produits.map(produit => (
                            <SelectItem key={produit.id} value={produit.id.toString()}>
                              {produit.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-24">
                      <Label className="text-xs">Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={ligne.quantite}
                        onChange={(e) => modifierLigne(index, 'quantite', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="w-28">
                      <Label className="text-xs">Prix unitaire</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ligne.prix_unitaire}
                        onChange={(e) => modifierLigne(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="w-24">
                      <Label className="text-xs">Total</Label>
                      <div className="h-10 flex items-center font-medium">
                        {(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => supprimerLigne(index)}
                      disabled={lignes.length === 1}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-white dark:bg-slate-800 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              rows={2}
              placeholder="Remarques sur la commande..."
            />
          </div>

          {/* Info */}
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note :</strong> La commande sera créée avec le statut "En attente".
            Les stocks seront mis à jour uniquement lorsque vous marquerez la commande comme "Livrée".
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !fournisseurNom.trim() || lignes.filter(l => l.produit_id > 0).length === 0}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? <Spinner size="sm" className="mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
            Créer la commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
