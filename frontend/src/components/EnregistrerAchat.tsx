import { useState, useEffect } from 'react';
import { produitsService, approvisionnementService } from '../services/api';
import { ShoppingCart, Plus, Trash2, X } from 'lucide-react';
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

interface LigneAchat {
  produit_id: number;
  produit_nom?: string;
  quantite: number;
  prix_unitaire: number;
}

interface EnregistrerAchatProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EnregistrerAchat({ open, onClose, onSuccess }: EnregistrerAchatProps) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [lignes, setLignes] = useState<LigneAchat[]>([]);
  const [magasin, setMagasin] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProduits, setLoadingProduits] = useState(false);

  useEffect(() => {
    if (open) {
      loadProduits();
      resetForm();
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
    setMagasin('');
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

  const modifierLigne = (index: number, field: keyof LigneAchat, value: any) => {
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

    try {
      setLoading(true);
      await approvisionnementService.create({
        type: 'achat_direct',
        montant_total: montantTotal,
        date_achat: new Date().toISOString(),
        magasin: magasin || undefined,
        notes: notes || undefined,
        lignes: lignesValides.map(l => ({
          produit_id: l.produit_id,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire
        }))
      });

      toast.success(`Achat enregistré : ${lignesValides.length} produit(s), ${montantTotal.toFixed(2)}€`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur enregistrement achat:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const montantTotal = calculerMontantTotal();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            Enregistrer un achat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="magasin">Magasin</Label>
              <Input
                id="magasin"
                value={magasin}
                onChange={(e) => setMagasin(e.target.value)}
                placeholder="Ex: Carrefour, Lidl..."
              />
            </div>
            <div>
              <Label>Montant total</Label>
              <div className="text-2xl font-bold text-green-600">
                {montantTotal.toFixed(2)} €
              </div>
            </div>
          </div>

          {/* Produits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Produits achetés</Label>
              <Button
                type="button"
                onClick={ajouterLigne}
                size="sm"
                variant="outline"
                className="text-green-600"
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
                      className="text-red-600"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              placeholder="Remarques sur l'achat..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || lignes.filter(l => l.produit_id > 0).length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? <Spinner size="sm" className="mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
            Enregistrer l'achat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
