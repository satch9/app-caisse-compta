import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Produit } from '@/hooks/useCaisseReducer';

interface ProduitCardProps {
  produit: Produit;
  onAjouter: (produit: Produit) => void;
}

export const ProduitCard = memo(function ProduitCard({ produit, onAjouter }: ProduitCardProps) {
  const isRupture = produit.stock_actuel === 0;

  const bgColor = isRupture ? 'bg-muted' :
    produit.niveau_stock === 'critique' ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800' :
    produit.niveau_stock === 'alerte' ? 'bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-800' :
    'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800';

  const textColor = isRupture ? 'text-muted-foreground' :
    produit.niveau_stock === 'critique' ? 'text-red-900 dark:text-red-100' :
    produit.niveau_stock === 'alerte' ? 'text-orange-900 dark:text-orange-100' :
    'text-green-900 dark:text-green-100';

  const priceColor = isRupture ? 'text-muted-foreground' :
    produit.niveau_stock === 'critique' ? 'text-red-700 dark:text-red-400' :
    produit.niveau_stock === 'alerte' ? 'text-orange-700 dark:text-orange-400' :
    'text-green-700 dark:text-green-400';

  return (
    <button
      onClick={() => onAjouter(produit)}
      disabled={isRupture}
      className={`${bgColor} p-4 rounded-lg border-2 transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:hover:shadow-none h-28 flex flex-col justify-between text-left`}
    >
      <div className={`font-bold text-base ${textColor} line-clamp-2`}>
        {produit.nom}
      </div>
      <div className="flex justify-between items-end gap-2">
        <span className={`text-2xl font-bold ${priceColor} flex-shrink-0`}>
          {produit.prix_vente.toFixed(2)}€
        </span>
        <span className={`text-sm font-semibold ${priceColor} flex-shrink-0`}>
          Stock: {produit.stock_actuel}
        </span>
      </div>
    </button>
  );
});
