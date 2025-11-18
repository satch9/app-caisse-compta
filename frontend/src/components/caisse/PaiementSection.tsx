import { memo, useCallback, useMemo } from 'react';
import type { Dispatch } from 'react';
import { DollarSign, Coins, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TypePaiement, CaisseAction, LignePanier, ActiveInput } from '@/hooks/useCaisseReducer';

interface PaiementSectionProps {
  panier: LignePanier[];
  typePaiement: TypePaiement;
  referenceCheque: string;
  referenceCB: string;
  montantRecu: string;
  activeInput: ActiveInput;
  dispatch: Dispatch<CaisseAction>;
  onValider: () => void;
  loading: boolean;
}

export const PaiementSection = memo(function PaiementSection({
  panier,
  typePaiement,
  referenceCheque,
  referenceCB,
  montantRecu,
  activeInput,
  dispatch,
  onValider,
  loading
}: PaiementSectionProps) {
  const montantTotal = useMemo(
    () => panier.reduce((sum, ligne) => sum + ligne.produit.prix_vente * ligne.quantite, 0),
    [panier]
  );

  const montantRendu = useMemo(() => {
    if (typePaiement === 'especes' && montantRecu) {
      const recu = parseFloat(montantRecu);
      return Math.max(0, recu - montantTotal);
    }
    return 0;
  }, [typePaiement, montantRecu, montantTotal]);

  const canValider = useMemo(() => {
    if (panier.length === 0) return false;
    if (typePaiement === 'cheque' && !referenceCheque) return false;
    if (typePaiement === 'cb' && !referenceCB) return false;
    if (typePaiement === 'especes' && montantRecu && parseFloat(montantRecu) < montantTotal) return false;
    return true;
  }, [panier, typePaiement, referenceCheque, referenceCB, montantRecu, montantTotal]);

  const handleTypePaiementChange = useCallback((type: TypePaiement) => {
    dispatch({ type: 'SET_TYPE_PAIEMENT', payload: type });
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Type de paiement */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Mode de paiement</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={typePaiement === 'especes' ? 'default' : 'outline'}
            onClick={() => handleTypePaiementChange('especes')}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Coins className="w-6 h-6" />
            <span>Espèces</span>
          </Button>

          <Button
            type="button"
            variant={typePaiement === 'cheque' ? 'default' : 'outline'}
            onClick={() => handleTypePaiementChange('cheque')}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <CheckCircle className="w-6 h-6" />
            <span>Chèque</span>
          </Button>

          <Button
            type="button"
            variant={typePaiement === 'cb' ? 'default' : 'outline'}
            onClick={() => handleTypePaiementChange('cb')}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <DollarSign className="w-6 h-6" />
            <span>CB</span>
          </Button>
        </div>
      </div>

      {/* Champs spécifiques par type */}
      {typePaiement === 'especes' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="montant-recu">Montant reçu</Label>
            <Input
              id="montant-recu"
              type="text"
              placeholder="0.00"
              value={montantRecu}
              onClick={() => dispatch({ type: 'SET_ACTIVE_INPUT', payload: 'montant_recu' })}
              readOnly
              className={`text-lg font-bold text-center cursor-pointer ${
                activeInput === 'montant_recu' ? 'ring-2 ring-primary border-primary' : ''
              }`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cliquez pour utiliser le pavé numérique
            </p>
          </div>
          {montantRecu && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Montant à rendre :</span>
                <span className="font-semibold">{montantRendu.toFixed(2)} €</span>
              </div>
            </div>
          )}
        </div>
      )}

      {typePaiement === 'cheque' && (
        <div>
          <Label htmlFor="reference-cheque">Numéro de chèque *</Label>
          <Input
            id="reference-cheque"
            type="text"
            placeholder="Ex: 1234567"
            value={referenceCheque}
            onClick={() => dispatch({ type: 'SET_ACTIVE_INPUT', payload: 'reference_cheque' })}
            readOnly
            className={`text-lg font-bold text-center cursor-pointer ${
              activeInput === 'reference_cheque' ? 'ring-2 ring-primary border-primary' : ''
            }`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Cliquez pour utiliser le pavé numérique
          </p>
        </div>
      )}

      {typePaiement === 'cb' && (
        <div>
          <Label htmlFor="reference-cb">Référence transaction CB *</Label>
          <Input
            id="reference-cb"
            type="text"
            placeholder="Ex: TPE123456"
            value={referenceCB}
            onClick={() => dispatch({ type: 'SET_ACTIVE_INPUT', payload: 'reference_cb' })}
            readOnly
            className={`text-lg font-bold text-center cursor-pointer ${
              activeInput === 'reference_cb' ? 'ring-2 ring-primary border-primary' : ''
            }`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Cliquez pour utiliser le pavé numérique
          </p>
        </div>
      )}

      {/* Bouton validation */}
      <Button
        onClick={onValider}
        disabled={!canValider || loading}
        className="w-full h-14 text-lg"
        size="lg"
      >
        {loading ? 'Encaissement...' : `Valider - ${montantTotal.toFixed(2)} €`}
      </Button>
    </div>
  );
});
