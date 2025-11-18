import { memo, useCallback } from 'react';
import type { Dispatch } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Can } from '../Can';
import type { CaisseAction, Transaction } from '@/hooks/useCaisseReducer';

interface HistoriqueModalProps {
  showHistorique: boolean;
  showAnnulation: boolean;
  transactions: Transaction[];
  transactionIdAnnulation: string;
  raisonAnnulation: string;
  loading: boolean;
  dispatch: Dispatch<CaisseAction>;
  onAnnulerTransaction: () => Promise<void>;
}

export const HistoriqueModal = memo(function HistoriqueModal({
  showHistorique,
  showAnnulation,
  transactions,
  transactionIdAnnulation,
  raisonAnnulation,
  loading,
  dispatch,
  onAnnulerTransaction
}: HistoriqueModalProps) {
  const handleClose = useCallback(() => {
    dispatch({ type: 'SET_SHOW_HISTORIQUE', payload: false });
    dispatch({ type: 'SET_SHOW_ANNULATION', payload: false });
  }, [dispatch]);

  const handleToggleAnnulation = useCallback(() => {
    dispatch({ type: 'SET_SHOW_ANNULATION', payload: !showAnnulation });
  }, [dispatch, showAnnulation]);

  return (
    <Dialog open={showHistorique} onOpenChange={handleClose}>
      <DialogContent className="bg-card max-w-4xl max-h-[90vh] flex flex-col p-0 border border-border">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Historique des transactions</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Caissier</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Montant</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Paiement</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-2">#{t.id}</td>
                  <td className="px-4 py-2">
                    {new Date(t.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-2">
                    {t.caissier_prenom} {t.caissier_nom}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    {t.type_paiement === 'monnaie' ? (
                      <span className="text-purple-600">
                        {parseFloat((t.montant_recu || 0).toString()).toFixed(2)}€ →{' '}
                        {parseFloat((t.montant_rendu || 0).toString()).toFixed(2)}€
                      </span>
                    ) : t.type_paiement === 'fond_initial' ? (
                      <span className="text-green-600">
                        +{parseFloat(t.montant_total.toString()).toFixed(2)} €
                      </span>
                    ) : t.type_paiement === 'fermeture_caisse' ? (
                      <span className="text-orange-600 font-bold">
                        = {parseFloat(t.montant_total.toString()).toFixed(2)} €
                      </span>
                    ) : (
                      `${parseFloat(t.montant_total.toString()).toFixed(2)} €`
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {t.type_paiement === 'monnaie' ? (
                      <Badge className="bg-purple-500 hover:bg-purple-600">Monnaie</Badge>
                    ) : t.type_paiement === 'fond_initial' ? (
                      <Badge className="bg-green-600 hover:bg-green-700">
                        Fond de caisse
                      </Badge>
                    ) : t.type_paiement === 'fermeture_caisse' ? (
                      <Badge className="bg-orange-600 hover:bg-orange-700">
                        Fermeture caisse
                      </Badge>
                    ) : (
                      <span className="capitalize">{t.type_paiement}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={t.statut === 'validee' ? 'default' : 'destructive'}>
                      {t.statut}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Can permission="caisse.annuler_vente">
          <div className="p-4 border-t bg-muted/50">
            <Button onClick={handleToggleAnnulation} variant="destructive">
              {showAnnulation ? 'Fermer annulation' : 'Annuler une transaction'}
            </Button>

            {showAnnulation && (
              <div className="mt-4 space-y-3">
                <Input
                  type="text"
                  placeholder="ID de la transaction"
                  value={transactionIdAnnulation}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_TRANSACTION_ID_ANNULATION',
                      payload: e.target.value
                    })
                  }
                />
                <textarea
                  placeholder="Raison de l'annulation (minimum 5 caractères)"
                  value={raisonAnnulation}
                  onChange={(e) =>
                    dispatch({ type: 'SET_RAISON_ANNULATION', payload: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  rows={2}
                />
                <Button
                  onClick={onAnnulerTransaction}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? 'Annulation...' : 'Confirmer l\'annulation'}
                </Button>
              </div>
            )}
          </div>
        </Can>
      </DialogContent>
    </Dialog>
  );
});
