import { memo, useCallback } from 'react';
import type { Dispatch } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { CaisseAction, SessionCaisse, SoldeCaisse } from '@/hooks/useCaisseReducer';

interface SessionManagementDialogsProps {
  // État
  showOuvrirSession: boolean;
  showFermerSession: boolean;
  sessionActive: SessionCaisse | null;
  noteOuverture: string;
  soldeDeclare: string;
  noteFermeture: string;
  soldeCaisse: SoldeCaisse;
  loading: boolean;

  // Dispatch
  dispatch: Dispatch<CaisseAction>;

  // Handlers
  onOuvrirSession: () => Promise<void>;
  onFermerSession: () => Promise<void>;
}

export const SessionManagementDialogs = memo(function SessionManagementDialogs({
  showOuvrirSession,
  showFermerSession,
  sessionActive,
  noteOuverture,
  soldeDeclare,
  noteFermeture,
  soldeCaisse,
  loading,
  dispatch,
  onOuvrirSession,
  onFermerSession
}: SessionManagementDialogsProps) {
  const handleCloseOuvrirSession = useCallback(() => {
    dispatch({ type: 'SET_SHOW_OUVRIR_SESSION', payload: false });
  }, [dispatch]);

  const handleCloseFermerSession = useCallback(() => {
    dispatch({ type: 'RESET_SESSION_FORM' });
  }, [dispatch]);

  return (
    <>
      {/* Dialog ouvrir session */}
      <Dialog open={showOuvrirSession} onOpenChange={handleCloseOuvrirSession}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl">Ouvrir la session de caisse</DialogTitle>
          </DialogHeader>

          {sessionActive && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Informations de la session
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p>
                    Trésorier:{' '}
                    <span className="font-semibold">
                      {sessionActive.tresorier_prenom} {sessionActive.tresorier_nom}
                    </span>
                  </p>
                  <p>
                    Fond initial:{' '}
                    <span className="font-bold text-lg">
                      {parseFloat(sessionActive.fond_initial.toString()).toFixed(2)}€
                    </span>
                  </p>
                  <p>
                    Créée le: {new Date(sessionActive.creee_at).toLocaleString('fr-FR')}
                  </p>
                  {sessionActive.note_ouverture && (
                    <p className="mt-2 italic">Note: {sessionActive.note_ouverture}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Note d'ouverture (optionnel)</Label>
                <textarea
                  value={noteOuverture}
                  onChange={(e) => dispatch({ type: 'SET_NOTE_OUVERTURE', payload: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  rows={3}
                  placeholder="Ajouter une note..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleCloseOuvrirSession} variant="outline">
              Annuler
            </Button>
            <Button
              onClick={onOuvrirSession}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Ouverture en cours...
                </>
              ) : (
                'Confirmer l\'ouverture'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog fermer session */}
      <Dialog open={showFermerSession} onOpenChange={handleCloseFermerSession}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl">Fermer la session de caisse</DialogTitle>
          </DialogHeader>

          {sessionActive && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Informations de la session
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p>
                    Fond initial:{' '}
                    <span className="font-bold">
                      {parseFloat(sessionActive.fond_initial.toString()).toFixed(2)}€
                    </span>
                  </p>
                  <p>
                    Ouverte le:{' '}
                    {sessionActive.ouverte_at &&
                      new Date(sessionActive.ouverte_at).toLocaleString('fr-FR')}
                  </p>
                  <p className="mt-2">
                    Solde caisse actuel:{' '}
                    <span className="font-bold text-lg">{soldeCaisse.especes.toFixed(2)}€</span>
                  </p>
                </div>
              </div>

              <div>
                <Label>Solde final déclaré *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={soldeDeclare}
                  onChange={(e) => dispatch({ type: 'SET_SOLDE_DECLARE', payload: e.target.value })}
                  placeholder="0.00"
                  className="text-lg font-bold text-center"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comptez les espèces et saisissez le montant total
                </p>
              </div>

              <div>
                <Label>Note de fermeture (optionnel)</Label>
                <textarea
                  value={noteFermeture}
                  onChange={(e) =>
                    dispatch({ type: 'SET_NOTE_FERMETURE', payload: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  rows={3}
                  placeholder="Commentaires éventuels..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleCloseFermerSession} variant="outline">
              Annuler
            </Button>
            <Button
              onClick={onFermerSession}
              disabled={loading || !soldeDeclare}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Fermeture en cours...
                </>
              ) : (
                'Confirmer la fermeture'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
