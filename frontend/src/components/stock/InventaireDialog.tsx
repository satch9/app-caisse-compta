import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { produitsService } from '../../services/api';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

interface Produit {
  id: number;
  nom: string;
  stock_actuel: number;
  categorie_nom?: string;
}

interface InventaireItem {
  produit_id: number;
  nom: string;
  stock_systeme: number;
  quantite_physique: number;
  ecart: number;
  categorie_nom?: string;
}

interface InventaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InventaireDialog({ open, onOpenChange, onSuccess }: InventaireDialogProps) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [inventaire, setInventaire] = useState<InventaireItem[]>([]);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recherche, setRecherche] = useState('');

  const chargerProduits = async () => {
    try {
      setLoading(true);
      const response = await produitsService.getAll({ actifs_seulement: true });
      setProduits(response.produits || []);

      // Initialiser l'inventaire avec tous les produits
      const items: InventaireItem[] = (response.produits || []).map((p: Produit) => ({
        produit_id: p.id,
        nom: p.nom,
        stock_systeme: p.stock_actuel,
        quantite_physique: p.stock_actuel, // Pré-rempli avec le stock actuel
        ecart: 0,
        categorie_nom: p.categorie_nom,
      }));
      setInventaire(items);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      chargerProduits();
      setCommentaire('');
      setRecherche('');
    }
  }, [open]);

  const handleQuantiteChange = (produitId: number, quantite: string) => {
    const quantiteNumerique = parseInt(quantite) || 0;
    setInventaire(prev =>
      prev.map(item => {
        if (item.produit_id === produitId) {
          const ecart = quantiteNumerique - item.stock_systeme;
          return {
            ...item,
            quantite_physique: quantiteNumerique,
            ecart,
          };
        }
        return item;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Envoyer uniquement les produits avec écart
      const produitsAvecEcart = inventaire
        .filter(item => item.ecart !== 0)
        .map(item => ({
          produit_id: item.produit_id,
          quantite_physique: item.quantite_physique,
        }));

      if (produitsAvecEcart.length === 0) {
        toast.info('Aucun écart détecté, rien à ajuster');
        onOpenChange(false);
        return;
      }

      await produitsService.enregistrerInventaire({
        produits: produitsAvecEcart,
        commentaire,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erreur enregistrement inventaire:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const produitsFiltres = inventaire.filter(item =>
    item.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const nbEcarts = inventaire.filter(item => item.ecart !== 0).length;
  const ecartTotal = inventaire.reduce((sum, item) => sum + Math.abs(item.ecart), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Inventaire Physique</DialogTitle>
          <DialogDescription>
            Comptez physiquement les produits et saisissez les quantités réelles. Les écarts seront automatiquement ajustés.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Barre de recherche et statistiques */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="pl-10"
                />
              </div>

              {nbEcarts > 0 && (
                <div className="flex items-center gap-4 p-3 bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning/50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning dark:text-warning/90">
                      {nbEcarts} écart{nbEcarts > 1 ? 's' : ''} détecté{nbEcarts > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-warning dark:text-warning/80">
                      Différence totale: {ecartTotal} unité{ecartTotal > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Table d'inventaire */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Produit</th>
                    <th className="text-right p-2 text-sm font-medium">Stock système</th>
                    <th className="text-right p-2 text-sm font-medium">Quantité physique</th>
                    <th className="text-right p-2 text-sm font-medium">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {produitsFiltres.map((item) => (
                    <tr key={item.produit_id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{item.nom}</div>
                          {item.categorie_nom && (
                            <div className="text-xs text-muted-foreground">{item.categorie_nom}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-right text-muted-foreground">{item.stock_systeme}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantite_physique}
                          onChange={(e) => handleQuantiteChange(item.produit_id, e.target.value)}
                          className="w-24 ml-auto text-right"
                        />
                      </td>
                      <td className="p-2 text-right">
                        {item.ecart !== 0 ? (
                          <Badge
                            variant={item.ecart > 0 ? 'default' : 'destructive'}
                            className="font-mono"
                          >
                            {item.ecart > 0 ? '+' : ''}{item.ecart}
                          </Badge>
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-success ml-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commentaire */}
            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
              <Textarea
                id="commentaire"
                placeholder="Notes sur cet inventaire..."
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={2}
              />
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || submitting || nbEcarts === 0}>
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              `Valider l'inventaire (${nbEcarts} ajustement${nbEcarts > 1 ? 's' : ''})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
