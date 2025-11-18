import { memo, useCallback, useMemo } from 'react';
import type { Dispatch } from 'react';
import { Coins } from 'lucide-react';
import { NumericKeypad } from '../NumericKeypad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CaisseAction, ActiveInput } from '@/hooks/useCaisseReducer';

interface ClavierSectionProps {
  activeInput: ActiveInput;
  montantRecu: string;
  referenceCheque: string;
  referenceCB: string;
  montantMonnaieurRecu: string;
  montantMonnaieurRendu: string;
  soldeDeclare: string;
  loading: boolean;
  dispatch: Dispatch<CaisseAction>;
  onEnregistrerMonnaie: () => Promise<void>;
}

export const ClavierSection = memo(function ClavierSection({
  activeInput,
  montantRecu,
  referenceCheque,
  referenceCB,
  montantMonnaieurRecu,
  montantMonnaieurRendu,
  soldeDeclare,
  loading,
  dispatch,
  onEnregistrerMonnaie
}: ClavierSectionProps) {
  // Calcul de la monnaie restante
  const calculerMonnaie = useMemo(() => {
    const recu = parseFloat(montantMonnaieurRecu) || 0;
    const rendu = parseFloat(montantMonnaieurRendu) || 0;
    return recu - rendu;
  }, [montantMonnaieurRecu, montantMonnaieurRendu]);

  // Handler pavé numérique
  const handleKeypadDigit = useCallback((digit: string) => {
    dispatch({ type: 'KEYPAD_DIGIT', payload: digit });
  }, [dispatch]);

  const handleKeypadClear = useCallback(() => {
    dispatch({ type: 'KEYPAD_CLEAR' });
  }, [dispatch]);

  // Affichage de la valeur actuelle
  const currentValue = useMemo(() => {
    switch (activeInput) {
      case 'montant_recu':
        return montantRecu || '0';
      case 'reference_cheque':
        return referenceCheque || '-';
      case 'reference_cb':
        return referenceCB || '-';
      case 'monnaieur_recu':
        return montantMonnaieurRecu || '0';
      case 'monnaieur_rendu':
        return montantMonnaieurRendu || '0';
      case 'solde_declare':
        return soldeDeclare || '0';
      default:
        return '-';
    }
  }, [activeInput, montantRecu, referenceCheque, referenceCB, montantMonnaieurRecu, montantMonnaieurRendu, soldeDeclare]);

  // Label de l'input actif
  const activeInputLabel = useMemo(() => {
    switch (activeInput) {
      case 'montant_recu':
        return 'Montant reçu';
      case 'reference_cheque':
        return 'N° chèque';
      case 'reference_cb':
        return 'Référence CB';
      case 'monnaieur_recu':
        return 'Montant reçu';
      case 'monnaieur_rendu':
        return 'Montant à rendre';
      case 'solde_declare':
        return 'Solde déclaré';
      default:
        return 'Clavier numérique';
    }
  }, [activeInput]);

  return (
    <div className="bg-card rounded-lg shadow-lg p-4 border h-fit sticky top-4">
      {/* Affichage de l'input actif */}
      <div className="mb-3">
        <div className="text-sm font-semibold text-muted-foreground mb-1">
          {activeInputLabel}
        </div>
        <div className="h-12 flex items-center justify-center bg-muted/50 rounded-lg border-2 border-border">
          <span className="text-2xl font-bold">
            {currentValue}
          </span>
        </div>
      </div>

      {/* Pavé numérique */}
      <NumericKeypad
        onDigit={handleKeypadDigit}
        onClear={handleKeypadClear}
        disabled={!activeInput}
      />

      {/* Section Faire de la monnaie */}
      <div className="mt-4 pt-4 border-t-2 border-border">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-bold text-purple-600 dark:text-purple-400">FAIRE DE LA MONNAIE</h3>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Montant reçu</Label>
            <Input
              type="text"
              value={montantMonnaieurRecu}
              onClick={() => dispatch({ type: 'SET_ACTIVE_INPUT', payload: 'monnaieur_recu' })}
              readOnly
              placeholder="0.00"
              className={`text-lg font-bold text-center cursor-pointer ${
                activeInput === 'monnaieur_recu' ? 'ring-2 ring-purple-500 border-purple-500' : ''
              }`}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Montant à rendre</Label>
            <Input
              type="text"
              value={montantMonnaieurRendu}
              onClick={() => dispatch({ type: 'SET_ACTIVE_INPUT', payload: 'monnaieur_rendu' })}
              readOnly
              placeholder="0.00"
              className={`text-lg font-bold text-center cursor-pointer ${
                activeInput === 'monnaieur_rendu' ? 'ring-2 ring-purple-500 border-purple-500' : ''
              }`}
            />
          </div>

          {(montantMonnaieurRecu || montantMonnaieurRendu) && (
            <div className="bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">Monnaie restante</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {calculerMonnaie.toFixed(2)} €
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => dispatch({ type: 'RESET_MONNAIEUR_FORM' })}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Réinitialiser
            </Button>
            <Button
              onClick={onEnregistrerMonnaie}
              disabled={loading || !montantMonnaieurRecu || !montantMonnaieurRendu}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'En cours...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
