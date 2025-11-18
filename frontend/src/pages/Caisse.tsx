import { useEffect, useCallback } from 'react';
import { Can } from '../components/Can';
import { UserInfo } from '../components/UserInfo';
import { SoldeCaisseDisplay } from '../components/SoldeCaisseDisplay';
import { SessionCaisseBanner } from '../components/SessionCaisseBanner';
import { OperationalPageLayout } from '../components/layouts/OperationalPageLayout';
import { AlertBanner } from '../components/AlertBanner';
import { produitsService, transactionsService, sessionsCaisseService } from '../services/api';
import { useAuth, usePermissions } from '@/hooks';
import { useCaisseReducer } from '@/hooks/useCaisseReducer';
import type { Produit, Transaction } from '@/hooks/useCaisseReducer';
import { DollarSign, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ProduitsGrid } from '@/components/caisse/ProduitsGrid';
import { PanierSection } from '@/components/caisse/PanierSection';
import { PaiementSection } from '@/components/caisse/PaiementSection';
import { ClavierSection } from '@/components/caisse/ClavierSection';
import { SessionManagementDialogs } from '@/components/caisse/SessionManagementDialogs';
import { HistoriqueModal } from '@/components/caisse/HistoriqueModal';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export function CaissePage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const peutOpererCaisse = can('caisse.recevoir_fond');
  const peutVoirHistorique = can('caisse.voir_historique');

  const [state, dispatch] = useCaisseReducer();

  // Fonctions de chargement
  const chargerProduits = useCallback(async () => {
    try {
      const result = await produitsService.getAll({ actifs_seulement: true });
      const produitsAvecPrixNumerique = result.produits.map((p: Produit) => ({
        ...p,
        prix_vente: typeof p.prix_vente === 'string' ? parseFloat(p.prix_vente) : p.prix_vente
      }));
      dispatch({ type: 'SET_PRODUITS', payload: produitsAvecPrixNumerique });
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur lors du chargement des produits');
    }
  }, [dispatch]);

  const chargerSessionActive = useCallback(async () => {
    try {
      const result = await sessionsCaisseService.getActive();
      dispatch({ type: 'SET_SESSION_ACTIVE', payload: result.session });
    } catch {
      dispatch({ type: 'SET_SESSION_ACTIVE', payload: null });
    }
  }, [dispatch]);

  const chargerSoldeCaisse = useCallback(async () => {
    try {
      const sessionResult = await sessionsCaisseService.getActive();
      const fondInitial = sessionResult.session?.fond_initial
        ? parseFloat(sessionResult.session.fond_initial.toString())
        : 0;

      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);

      const result = await transactionsService.getAll({
        date_debut: aujourdhui.toISOString(),
        statut: 'validee',
        limit: 100
      });

      const especesTransactions = result.transactions
        .filter((t: Transaction) => t.type_paiement === 'especes')
        .reduce((sum: number, t: Transaction) => sum + parseFloat(t.montant_total.toString()), 0);

      const cheques = result.transactions
        .filter((t: Transaction) => t.type_paiement === 'cheque')
        .reduce((sum: number, t: Transaction) => sum + parseFloat(t.montant_total.toString()), 0);

      const cb = result.transactions
        .filter((t: Transaction) => t.type_paiement === 'cb')
        .reduce((sum: number, t: Transaction) => sum + parseFloat(t.montant_total.toString()), 0);

      const especes = fondInitial + especesTransactions;

      dispatch({
        type: 'SET_SOLDE_CAISSE',
        payload: {
          especes,
          cheques,
          cb,
          total: especes + cheques + cb
        }
      });
    } catch (err) {
      console.error('Erreur chargement solde caisse:', err);
    }
  }, [dispatch]);

  const chargerHistorique = useCallback(async () => {
    try {
      const result = await transactionsService.getAll({ limit: 20 });
      const transactionsAvecMontantsNumeriques = result.transactions.map((t: Transaction) => ({
        ...t,
        montant_total: typeof t.montant_total === 'string' ? parseFloat(t.montant_total) : t.montant_total
      }));
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactionsAvecMontantsNumeriques });
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  }, [dispatch]);

  // Validation transaction
  const validerTransaction = useCallback(async () => {
    if (state.panier.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    if (!state.sessionActive || state.sessionActive.statut !== 'ouverte') {
      toast.error('Aucune session de caisse ouverte');
      return;
    }

    if (state.typePaiement === 'cheque' && !state.referenceCheque) {
      toast.error('Veuillez saisir le numéro de chèque');
      return;
    }

    if (state.typePaiement === 'cb' && !state.referenceCB) {
      toast.error('Veuillez saisir la référence de transaction CB');
      return;
    }

    const montantTotal = state.panier.reduce(
      (sum, ligne) => sum + ligne.produit.prix_vente * ligne.quantite,
      0
    );

    if (state.typePaiement === 'especes' && state.montantRecu) {
      const recu = parseFloat(state.montantRecu);
      if (recu < montantTotal) {
        toast.error('Le montant reçu est insuffisant');
        return;
      }
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const lignes = state.panier.map(ligne => ({
        produit_id: ligne.produit.id,
        quantite: ligne.quantite,
        prix_unitaire: ligne.produit.prix_vente
      }));

      const transactionData = {
        user_id: null,
        caissier_id: user!.id,
        type_paiement: state.typePaiement,
        lignes,
        reference_cheque: state.typePaiement === 'cheque' ? state.referenceCheque : undefined,
        reference_cb: state.typePaiement === 'cb' ? state.referenceCB : undefined,
        montant_recu: state.typePaiement === 'especes' && state.montantRecu
          ? parseFloat(state.montantRecu)
          : undefined,
        montant_rendu: state.typePaiement === 'especes' && state.montantRecu
          ? Math.max(0, parseFloat(state.montantRecu) - montantTotal)
          : undefined
      };

      await transactionsService.create(transactionData);

      dispatch({ type: 'SET_LAST_TRANSACTION_AMOUNT', payload: montantTotal });
      dispatch({ type: 'SET_SHOW_SUCCESS_MODAL', payload: true });
      dispatch({ type: 'CLEAR_PANIER' });
      dispatch({ type: 'RESET_PAIEMENT_FORM' });
      dispatch({ type: 'SET_ACTIVE_INPUT', payload: null });

      await chargerSoldeCaisse();
      await chargerProduits();

      toast.success(`Transaction enregistrée : ${montantTotal.toFixed(2)} €`);
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur enregistrement transaction:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state, user, dispatch, chargerSoldeCaisse, chargerProduits]);

  // Gestion session
  const ouvrirSession = useCallback(async () => {
    if (!state.sessionActive || state.sessionActive.statut !== 'en_attente_caissier') {
      toast.error('Aucune session en attente');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await sessionsCaisseService.ouvrir(
        state.sessionActive.id,
        state.noteOuverture || undefined
      );
      toast.success('Session ouverte avec succès');
      dispatch({ type: 'SET_SHOW_OUVRIR_SESSION', payload: false });
      dispatch({ type: 'SET_NOTE_OUVERTURE', payload: '' });
      chargerSessionActive();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur ouverture session:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ouverture de la session');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.sessionActive, state.noteOuverture, dispatch, chargerSessionActive]);

  const fermerSession = useCallback(async () => {
    if (!state.sessionActive || state.sessionActive.statut !== 'ouverte') {
      toast.error('Aucune session ouverte');
      return;
    }

    const solde = parseFloat(state.soldeDeclare);
    if (!solde || solde < 0) {
      toast.error('Veuillez saisir le solde final');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await sessionsCaisseService.fermer(
        state.sessionActive.id,
        solde,
        state.noteFermeture || undefined
      );
      toast.success('Session fermée avec succès');
      dispatch({ type: 'RESET_SESSION_FORM' });
      chargerSessionActive();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur fermeture session:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la fermeture de la session');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.sessionActive, state.soldeDeclare, state.noteFermeture, dispatch, chargerSessionActive]);

  // Annulation transaction
  const annulerTransaction = useCallback(async () => {
    if (!state.transactionIdAnnulation || !state.raisonAnnulation.trim()) {
      toast.error('ID de transaction et raison requis');
      return;
    }

    if (state.raisonAnnulation.trim().length < 5) {
      toast.error('La raison doit contenir au moins 5 caractères');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await transactionsService.cancel(
        parseInt(state.transactionIdAnnulation),
        state.raisonAnnulation
      );
      dispatch({ type: 'SET_SHOW_ANNULATION', payload: false });
      dispatch({ type: 'SET_TRANSACTION_ID_ANNULATION', payload: '' });
      dispatch({ type: 'SET_RAISON_ANNULATION', payload: '' });
      chargerHistorique();
      chargerProduits();
      chargerSoldeCaisse();
      toast.success('Transaction annulée avec succès');
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur annulation:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.transactionIdAnnulation, state.raisonAnnulation, dispatch, chargerHistorique, chargerProduits, chargerSoldeCaisse]);

  // Enregistrer monnaie
  const enregistrerMonnaie = useCallback(async () => {
    const recu = parseFloat(state.montantMonnaieurRecu);
    const rendu = parseFloat(state.montantMonnaieurRendu);

    if (!recu || !rendu) {
      toast.error('Veuillez saisir le montant reçu et le montant rendu');
      return;
    }

    if (!user) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await transactionsService.create({
        user_id: user.id,
        type_paiement: 'monnaie',
        montant_recu: recu,
        montant_rendu: rendu
      });

      toast.success('Opération de monnaie enregistrée');
      dispatch({ type: 'RESET_MONNAIEUR_FORM' });
      chargerSoldeCaisse();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur enregistrement monnaie:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement de la monnaie');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.montantMonnaieurRecu, state.montantMonnaieurRendu, user, dispatch, chargerSoldeCaisse]);

  // Effets - Chargement initial
  useEffect(() => {
    chargerProduits();
  }, [chargerProduits]);

  useEffect(() => {
    if (peutOpererCaisse) {
      chargerSoldeCaisse();
      chargerSessionActive();
    }
  }, [peutOpererCaisse, chargerSoldeCaisse, chargerSessionActive]);

  return (
    <OperationalPageLayout
      pageTitle="CAISSE"
      pageIcon={DollarSign}
      borderColor="green"
      maxWidth="full"
      backgroundColor="background"
      rightContent={
        <>
          {peutOpererCaisse && <SoldeCaisseDisplay solde={state.soldeCaisse} />}
          <UserInfo />
          {peutVoirHistorique && (
            <Button
              onClick={() => {
                chargerHistorique();
                dispatch({ type: 'SET_SHOW_HISTORIQUE', payload: true });
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <History className="w-5 h-5 mr-2" />
              Historique
            </Button>
          )}
        </>
      }
    >
      {/* Banner de session */}
      {peutOpererCaisse && state.sessionActive && (
        <SessionCaisseBanner
          session={state.sessionActive}
          onOuvrirSession={() => dispatch({ type: 'SET_SHOW_OUVRIR_SESSION', payload: true })}
          onFermerSession={() => dispatch({ type: 'SET_SHOW_FERMER_SESSION', payload: true })}
        />
      )}

      {/* Contenu principal */}
      {!peutOpererCaisse ? (
        <div className="p-6">
          <AlertBanner
            type="warning"
            title="Accès limité"
            message="Vous n'avez pas les permissions nécessaires pour opérer la caisse. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur."
          />
        </div>
      ) : !state.sessionActive || state.sessionActive.statut !== 'ouverte' ? (
        <div className="p-6">
          <AlertBanner
            type="info"
            title="Session non ouverte"
            message="Vous devez ouvrir une session de caisse pour commencer à enregistrer des ventes."
          />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 p-4">
          {/* Colonne 1: Produits (flex-1) */}
          <div className="flex-1">
            <Can permission="caisse.encaisser_especes">
              <ProduitsGrid
                produits={state.produits}
                recherche={state.recherche}
                dispatch={dispatch}
              />
            </Can>
          </div>

          {/* Colonne 2: Panier + Paiement (flex-1) */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-card border rounded-lg p-6">
              <PanierSection panier={state.panier} dispatch={dispatch} />
            </div>

            {state.panier.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <PaiementSection
                  panier={state.panier}
                  typePaiement={state.typePaiement}
                  referenceCheque={state.referenceCheque}
                  referenceCB={state.referenceCB}
                  montantRecu={state.montantRecu}
                  activeInput={state.activeInput}
                  dispatch={dispatch}
                  onValider={validerTransaction}
                  loading={state.loading}
                />
              </div>
            )}
          </div>

          {/* Colonne 3: Clavier + Monnaie (w-64, caché sur mobile) */}
          <div className="hidden lg:block lg:w-64">
            <ClavierSection
              activeInput={state.activeInput}
              montantRecu={state.montantRecu}
              referenceCheque={state.referenceCheque}
              referenceCB={state.referenceCB}
              montantMonnaieurRecu={state.montantMonnaieurRecu}
              montantMonnaieurRendu={state.montantMonnaieurRendu}
              soldeDeclare={state.soldeDeclare}
              loading={state.loading}
              dispatch={dispatch}
              onEnregistrerMonnaie={enregistrerMonnaie}
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SessionManagementDialogs
        showOuvrirSession={state.showOuvrirSession}
        showFermerSession={state.showFermerSession}
        sessionActive={state.sessionActive}
        noteOuverture={state.noteOuverture}
        soldeDeclare={state.soldeDeclare}
        noteFermeture={state.noteFermeture}
        soldeCaisse={state.soldeCaisse}
        loading={state.loading}
        dispatch={dispatch}
        onOuvrirSession={ouvrirSession}
        onFermerSession={fermerSession}
      />

      <HistoriqueModal
        showHistorique={state.showHistorique}
        showAnnulation={state.showAnnulation}
        transactions={state.transactions}
        transactionIdAnnulation={state.transactionIdAnnulation}
        raisonAnnulation={state.raisonAnnulation}
        loading={state.loading}
        dispatch={dispatch}
        onAnnulerTransaction={annulerTransaction}
      />

      {/* Modal de succès */}
      <Dialog
        open={state.showSuccessModal}
        onOpenChange={(open) => dispatch({ type: 'SET_SHOW_SUCCESS_MODAL', payload: open })}
      >
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-green-600">
              Transaction réussie !
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-4xl font-bold text-green-600">
              {state.lastTransactionAmount.toFixed(2)} €
            </p>
            <p className="text-muted-foreground mt-2">Transaction enregistrée avec succès</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => dispatch({ type: 'SET_SHOW_SUCCESS_MODAL', payload: false })}
              className="w-full"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageLayout>
  );
}
