import { memo, useCallback } from 'react';
import type { Dispatch } from 'react';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LignePanier, CaisseAction } from '@/hooks/useCaisseReducer';

interface PanierSectionProps {
  panier: LignePanier[];
  dispatch: Dispatch<CaisseAction>;
}

export const PanierSection = memo(function PanierSection({ panier, dispatch }: PanierSectionProps) {
  const montantTotal = panier.reduce(
    (sum, ligne) => sum + ligne.produit.prix_vente * ligne.quantite,
    0
  );

  const handleIncrement = useCallback((produitId: number, currentQuantite: number, stockMax: number) => {
    if (currentQuantite < stockMax) {
      dispatch({ type: 'UPDATE_QUANTITE', payload: { produitId, quantite: currentQuantite + 1 } });
    }
  }, [dispatch]);

  const handleDecrement = useCallback((produitId: number, currentQuantite: number) => {
    if (currentQuantite > 1) {
      dispatch({ type: 'UPDATE_QUANTITE', payload: { produitId, quantite: currentQuantite - 1 } });
    }
  }, [dispatch]);

  const handleRemove = useCallback((produitId: number) => {
    dispatch({ type: 'REMOVE_FROM_PANIER', payload: produitId });
  }, [dispatch]);

  if (panier.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">Panier vide</p>
        <p className="text-sm mt-1">Sélectionnez des produits pour commencer</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Liste des articles */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {panier.map((ligne) => (
          <div
            key={ligne.produit.id}
            className="flex items-center gap-3 p-3 bg-card border rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{ligne.produit.nom}</p>
              <p className="text-sm text-muted-foreground">
                {ligne.produit.prix_vente.toFixed(2)} € × {ligne.quantite}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecrement(ligne.produit.id, ligne.quantite)}
                disabled={ligne.quantite <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>

              <Badge variant="secondary" className="min-w-[3rem] justify-center">
                {ligne.quantite}
              </Badge>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleIncrement(ligne.produit.id, ligne.quantite, ligne.produit.stock_actuel)}
                disabled={ligne.quantite >= ligne.produit.stock_actuel}
              >
                <Plus className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemove(ligne.produit.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-right font-semibold min-w-[5rem]">
              {(ligne.produit.prix_vente * ligne.quantite).toFixed(2)} €
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total</span>
          <span>{montantTotal.toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );
});
