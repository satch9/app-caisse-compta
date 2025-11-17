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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { produitsService } from '../../services/api';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface Produit {
  id: number;
  nom: string;
  stock_actuel: number;
  categorie_nom?: string;
  niveau_stock?: 'normal' | 'alerte' | 'critique';
}

interface AjustementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  produitId?: number; // Optionnel : si on veut pré-sélectionner un produit
}

export function AjustementDialog({
  open,
  onOpenChange,
  onSuccess,
  produitId: initialProduitId,
}: AjustementDialogProps) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [produitSelectionne, setProduitSelectionne] = useState<number | null>(null);
  const [quantiteAjustement, setQuantiteAjustement] = useState<string>('0');
  const [raison, setRaison] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const chargerProduits = async () => {
    try {
      setLoading(true);
      const response = await produitsService.getAll({ actifs_seulement: true });
      setProduits(response.produits || []);

      // Pré-sélectionner le produit si fourni
      if (initialProduitId) {
        setProduitSelectionne(initialProduitId);
      }
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
      setQuantiteAjustement('0');
      setRaison('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!produitSelectionne) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }

    const ajustement = parseInt(quantiteAjustement);
    if (isNaN(ajustement) || ajustement === 0) {
      toast.error('La quantité d\'ajustement doit être différente de zéro');
      return;
    }

    if (!raison.trim()) {
      toast.error('Veuillez saisir une raison pour l\'ajustement');
      return;
    }

    try {
      setSubmitting(true);

      await produitsService.ajusterStock(produitSelectionne, {
        quantite_ajustement: ajustement,
        raison: raison.trim(),
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erreur ajustement:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajustement');
    } finally {
      setSubmitting(false);
    }
  };

  const produitActuel = produits.find(p => p.id === produitSelectionne);
  const ajustementNum = parseInt(quantiteAjustement) || 0;
  const nouveauStock = produitActuel ? produitActuel.stock_actuel + ajustementNum : 0;

  const getNiveauStockBadge = (niveau?: string) => {
    if (niveau === 'critique') {
      return <Badge variant="destructive">Critique</Badge>;
    }
    if (niveau === 'alerte') {
      return <Badge className="bg-orange-500">Alerte</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajustement Manuel de Stock</DialogTitle>
          <DialogDescription>
            Corrigez le stock d'un produit en cas d'erreur ou de perte. L'ajustement sera tracé dans l'historique.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-info" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sélection du produit */}
            <div className="space-y-2">
              <Label htmlFor="produit">Produit</Label>
              <Select
                value={produitSelectionne?.toString()}
                onValueChange={(value) => setProduitSelectionne(parseInt(value))}
              >
                <SelectTrigger id="produit">
                  <SelectValue placeholder="Sélectionnez un produit" />
                </SelectTrigger>
                <SelectContent>
                  {produits.map((produit) => (
                    <SelectItem key={produit.id} value={produit.id.toString()}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{produit.nom}</span>
                        <span className="text-xs text-muted-foreground">
                          (Stock: {produit.stock_actuel})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info produit sélectionné */}
            {produitActuel && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stock actuel:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{produitActuel.stock_actuel}</span>
                    {getNiveauStockBadge(produitActuel.niveau_stock)}
                  </div>
                </div>
                {produitActuel.categorie_nom && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Catégorie:</span>
                    <span className="text-sm">{produitActuel.categorie_nom}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quantité d'ajustement */}
            <div className="space-y-2">
              <Label htmlFor="quantite">
                Ajustement
                <span className="text-xs text-muted-foreground ml-2">
                  (négatif pour retirer, positif pour ajouter)
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantite"
                  type="number"
                  value={quantiteAjustement}
                  onChange={(e) => setQuantiteAjustement(e.target.value)}
                  placeholder="0"
                  className="text-center font-mono text-lg"
                />
                {ajustementNum !== 0 && (
                  <div className="flex items-center gap-1">
                    {ajustementNum > 0 ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Prévisualisation nouveau stock */}
            {produitActuel && ajustementNum !== 0 && (
              <div className="p-3 bg-info/10 dark:bg-info/20 border border-info/30 dark:border-info/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-info dark:text-info/90">Nouveau stock:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-info dark:text-info/90">{nouveauStock}</span>
                    <Badge
                      variant={ajustementNum > 0 ? 'default' : 'destructive'}
                      className="font-mono"
                    >
                      {ajustementNum > 0 ? '+' : ''}{ajustementNum}
                    </Badge>
                  </div>
                </div>
                {nouveauStock < 0 && (
                  <div className="flex items-center gap-2 mt-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Attention: le stock ne peut pas être négatif</span>
                  </div>
                )}
              </div>
            )}

            {/* Raison */}
            <div className="space-y-2">
              <Label htmlFor="raison">
                Raison de l'ajustement <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="raison"
                placeholder="Ex: Perte, casse, erreur de comptage, correction inventaire..."
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              submitting ||
              !produitSelectionne ||
              ajustementNum === 0 ||
              !raison.trim() ||
              nouveauStock < 0
            }
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Ajustement...
              </>
            ) : (
              'Valider l\'ajustement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
