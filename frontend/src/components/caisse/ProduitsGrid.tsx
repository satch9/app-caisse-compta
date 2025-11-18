import { memo, useMemo, useCallback } from 'react';
import type { Dispatch } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProduitCard } from './ProduitCard';
import type { Produit, CaisseAction } from '@/hooks/useCaisseReducer';
import { toast } from 'sonner';

interface ProduitsGridProps {
  produits: Produit[];
  recherche: string;
  dispatch: Dispatch<CaisseAction>;
}

export const ProduitsGrid = memo(function ProduitsGrid({
  produits,
  recherche,
  dispatch
}: ProduitsGridProps) {
  const produitsFiltres = useMemo(
    () => produits.filter(p => p.nom.toLowerCase().includes(recherche.toLowerCase())),
    [produits, recherche]
  );

  const handleAjouterProduit = useCallback((produit: Produit) => {
    if (produit.stock_actuel === 0) {
      toast.error(`${produit.nom} est en rupture de stock`);
      return;
    }
    dispatch({ type: 'ADD_TO_PANIER', payload: produit });
  }, [dispatch]);

  const handleRechercheChange = useCallback((value: string) => {
    dispatch({ type: 'SET_RECHERCHE', payload: value });
  }, [dispatch]);

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un produit..."
          value={recherche}
          onChange={(e) => handleRechercheChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grille de produits */}
      {produitsFiltres.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">Aucun produit trouvé</p>
          {recherche && (
            <p className="text-sm mt-2">
              Essayez une autre recherche ou{' '}
              <button
                onClick={() => handleRechercheChange('')}
                className="text-primary underline"
              >
                réinitialisez les filtres
              </button>
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {produitsFiltres.map((produit) => (
            <ProduitCard
              key={produit.id}
              produit={produit}
              onAjouter={handleAjouterProduit}
            />
          ))}
        </div>
      )}
    </div>
  );
});
