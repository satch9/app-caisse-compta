import { useState, useEffect } from 'react';
import { Can } from '../components/Can';
import { UserInfo } from '../components/UserInfo';
import { SoldeCaisseDisplay } from '../components/SoldeCaisseDisplay';
import { SessionCaisseBanner } from '../components/SessionCaisseBanner';
import { OperationalPageLayout } from '../components/layouts/OperationalPageLayout';
import { AlertBanner } from '../components/AlertBanner';
import { produitsService, transactionsService, sessionsCaisseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import {
  ShoppingCart, Trash2, Plus, Minus, History,
  DollarSign, Coins, CheckCircle
} from 'lucide-react';
import { NumericKeypad } from '../components/NumericKeypad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

interface Produit {
  id: number;
  nom: string;
  prix_vente: number;
  stock_actuel: number;
  categorie_nom?: string;
  niveau_stock: 'normal' | 'alerte' | 'critique';
}

interface LignePanier {
  produit: Produit;
  quantite: number;
}

type TypePaiement = 'especes' | 'cheque' | 'cb';

interface SoldeCaisse {
  especes: number;
  cheques: number;
  cb: number;
  total: number;
}

interface Transaction {
  id: number;
  type_paiement: string;
  montant_total: number | string;
  created_at: string;
  statut: string;
  caissier_nom?: string;
  caissier_prenom?: string;
  reference_cheque?: string;
  reference_cb?: string;
  montant_recu?: number | string;
  montant_rendu?: number | string;
}

interface SessionCaisse {
  id: number;
  tresorier_id: number;
  caissier_id: number;
  creee_at: string;
  ouverte_at: string | null;
  fermee_at: string | null;
  validee_at: string | null;
  fond_initial: number;
  solde_attendu: number | null;
  solde_declare: number | null;
  solde_valide: number | null;
  ecart: number | null;
  statut: 'en_attente_caissier' | 'ouverte' | 'en_attente_validation' | 'validee' | 'anomalie';
  note_ouverture: string | null;
  note_fermeture: string | null;
  note_validation: string | null;
  tresorier_nom?: string;
  tresorier_prenom?: string;
  caissier_nom?: string;
  caissier_prenom?: string;
}

export function CaissePage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const peutOpererCaisse = can('caisse.recevoir_fond');
  const peutVoirHistorique = can('caisse.voir_historique');

  const [produits, setProduits] = useState<Produit[]>([]);
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [recherche, setRecherche] = useState('');
  const [typePaiement, setTypePaiement] = useState<TypePaiement>('especes');
  const [referenceCheque, setReferenceCheque] = useState('');
  const [referenceCB, setReferenceCB] = useState('');
  const [montantRecu, setMontantRecu] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransactionAmount, setLastTransactionAmount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showHistorique, setShowHistorique] = useState(false);
  const [showAnnulation, setShowAnnulation] = useState(false);
  const [transactionIdAnnulation, setTransactionIdAnnulation] = useState('');
  const [raisonAnnulation, setRaisonAnnulation] = useState('');
  const [soldeCaisse, setSoldeCaisse] = useState<SoldeCaisse>({
    especes: 0,
    cheques: 0,
    cb: 0,
    total: 0
  });
  const [montantMonnaieurRecu, setMontantMonnaieurRecu] = useState('');
  const [montantMonnaieurRendu, setMontantMonnaieurRendu] = useState('');

  // Session caisse
  const [sessionActive, setSessionActive] = useState<SessionCaisse | null>(null);
  const [showOuvrirSession, setShowOuvrirSession] = useState(false);
  const [showFermerSession, setShowFermerSession] = useState(false);
  const [noteOuverture, setNoteOuverture] = useState('');
  const [soldeDeclare, setSoldeDeclare] = useState('');
  const [noteFermeture, setNoteFermeture] = useState('');

  // Mode saisie pour le clavier numérique
  const [activeInput, setActiveInput] = useState<
    'montant_recu' | 'reference_cheque' | 'reference_cb' |
    'monnaieur_recu' | 'monnaieur_rendu' | 'solde_declare' | null
  >(null);

  useEffect(() => {
    chargerProduits();
  }, []);

  useEffect(() => {
    if (peutOpererCaisse) {
      chargerSoldeCaisse();
      chargerSessionActive();
    } else {
      setSessionActive(null);
      setSoldeCaisse({
        especes: 0,
        cheques: 0,
        cb: 0,
        total: 0
      });
    }
  }, [peutOpererCaisse]);

  const chargerSessionActive = async () => {
    try {
      const result = await sessionsCaisseService.getActive();
      setSessionActive(result.session);
    } catch {
      // Pas de session active, c'est OK
      setSessionActive(null);
    }
  };

  const chargerProduits = async () => {
    try {
      const result = await produitsService.getAll({ actifs_seulement: true });
      const produitsAvecPrixNumerique = result.produits.map((p: Produit) => ({
        ...p,
        prix_vente: typeof p.prix_vente === 'string' ? parseFloat(p.prix_vente) : p.prix_vente
      }));
      setProduits(produitsAvecPrixNumerique);
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur lors du chargement des produits');
    }
  };

  const chargerSoldeCaisse = async () => {
    try {
      // Récupérer la session active pour obtenir le fond initial
      const sessionResult = await sessionsCaisseService.getActive();
      const fondInitial = sessionResult.session?.fond_initial
        ? parseFloat(sessionResult.session.fond_initial.toString())
        : 0;

      // Récupérer les transactions du jour
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

      // Ajouter le fond initial aux espèces
      const especes = fondInitial + especesTransactions;

      setSoldeCaisse({
        especes,
        cheques,
        cb,
        total: especes + cheques + cb
      });
    } catch (err) {
      console.error('Erreur chargement solde caisse:', err);
    }
  };

  const chargerHistorique = async () => {
    try {
      const result = await transactionsService.getAll({ limit: 20 });
      const transactionsAvecMontantsNumeriques = result.transactions.map((t: Transaction) => ({
        ...t,
        montant_total: typeof t.montant_total === 'string' ? parseFloat(t.montant_total) : t.montant_total
      }));
      setTransactions(transactionsAvecMontantsNumeriques);
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur chargement historique:', error);
    }
  };

  const produitsFiltres = produits.filter(p =>
    p.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const ajouterAuPanier = (produit: Produit) => {
    if (produit.stock_actuel === 0) {
      toast.error(`${produit.nom} est en rupture de stock`);
      return;
    }

    const ligneExistante = panier.find(l => l.produit.id === produit.id);

    if (ligneExistante) {
      // Produit déjà dans le panier, ajouter 1
      if (ligneExistante.quantite < produit.stock_actuel) {
        setPanier(panier.map(l =>
          l.produit.id === produit.id
            ? { ...l, quantite: l.quantite + 1 }
            : l
        ));
      } else {
        toast.error(`Stock insuffisant pour ${produit.nom}`);
      }
    } else {
      // Nouveau produit, ajouter avec quantité 1
      setPanier([...panier, { produit, quantite: 1 }]);
    }
  };

  const modifierQuantite = (produitId: number, delta: number) => {
    setPanier(panier.map(l => {
      if (l.produit.id === produitId) {
        const nouvelleQuantite = l.quantite + delta;
        if (nouvelleQuantite <= 0) return l;
        if (nouvelleQuantite > l.produit.stock_actuel) {
          toast.error(`Stock insuffisant pour ${l.produit.nom}`);
          return l;
        }
        return { ...l, quantite: nouvelleQuantite };
      }
      return l;
    }));
  };

  const retirerDuPanier = (produitId: number) => {
    setPanier(panier.filter(l => l.produit.id !== produitId));
  };

  const viderPanier = () => {
    setPanier([]);
    setReferenceCheque('');
    setReferenceCB('');
    setMontantRecu('');
  };

  const montantTotal = panier.reduce((sum, l) => sum + (l.produit.prix_vente * l.quantite), 0);
  const montantRecuFloat = parseFloat(montantRecu) || 0;
  const monnaieARendreCalculee = montantRecuFloat - montantTotal;

  const validerVente = async () => {
    if (panier.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    if (!user) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    if (typePaiement === 'cheque' && !referenceCheque.trim()) {
      toast.error('Le numéro de chèque est requis');
      return;
    }

    if (typePaiement === 'cb' && !referenceCB.trim()) {
      toast.error('La référence CB est requise');
      return;
    }

    if (typePaiement === 'especes' && montantRecuFloat < montantTotal) {
      toast.error('Montant reçu insuffisant');
      return;
    }

    setLoading(true);

    try {
      const lignes = panier.map(l => ({
        produit_id: l.produit.id,
        quantite: l.quantite,
        prix_unitaire: l.produit.prix_vente
      }));

      await transactionsService.create({
        user_id: user.id,
        type_paiement: typePaiement,
        lignes,
        reference_cheque: typePaiement === 'cheque' ? referenceCheque : undefined,
        reference_cb: typePaiement === 'cb' ? referenceCB : undefined
      });

      setLastTransactionAmount(montantTotal);
      setShowSuccessModal(true);
      viderPanier();
      chargerProduits();
      chargerSoldeCaisse();

    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur validation vente:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la validation de la vente');
    } finally {
      setLoading(false);
    }
  };

  const annulerTransaction = async () => {
    if (!transactionIdAnnulation || !raisonAnnulation.trim()) {
      toast.error('ID de transaction et raison requis');
      return;
    }

    setLoading(true);

    try {
      await transactionsService.cancel(parseInt(transactionIdAnnulation), raisonAnnulation);
      setShowAnnulation(false);
      setTransactionIdAnnulation('');
      setRaisonAnnulation('');
      chargerHistorique();
      chargerProduits();
      chargerSoldeCaisse();
      toast.success('Transaction annulée avec succès');
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur annulation:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadDigit = (digit: string) => {
    if (activeInput === 'montant_recu') {
      setMontantRecu(prev => prev + digit);
    } else if (activeInput === 'reference_cheque') {
      setReferenceCheque(prev => prev + digit);
    } else if (activeInput === 'reference_cb') {
      setReferenceCB(prev => prev + digit);
    } else if (activeInput === 'monnaieur_recu') {
      setMontantMonnaieurRecu(prev => prev + digit);
    } else if (activeInput === 'monnaieur_rendu') {
      setMontantMonnaieurRendu(prev => prev + digit);
    } else if (activeInput === 'solde_declare') {
      setSoldeDeclare(prev => prev + digit);
    }
  };

  const handleKeypadClear = () => {
    if (activeInput === 'montant_recu') {
      setMontantRecu('');
    } else if (activeInput === 'reference_cheque') {
      setReferenceCheque('');
    } else if (activeInput === 'reference_cb') {
      setReferenceCB('');
    } else if (activeInput === 'monnaieur_recu') {
      setMontantMonnaieurRecu('');
    } else if (activeInput === 'monnaieur_rendu') {
      setMontantMonnaieurRendu('');
    } else if (activeInput === 'solde_declare') {
      setSoldeDeclare('');
    }
  };

  const calculerMonnaie = () => {
    const recu = parseFloat(montantMonnaieurRecu) || 0;
    const rendu = parseFloat(montantMonnaieurRendu) || 0;
    return recu - rendu;
  };

  const enregistrerMonnaie = async () => {
    const recu = parseFloat(montantMonnaieurRecu);
    const rendu = parseFloat(montantMonnaieurRendu);

    if (!recu || !rendu) {
      toast.error('Veuillez saisir le montant reçu et le montant rendu');
      return;
    }

    if (!user) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    setLoading(true);

    try {
      await transactionsService.create({
        user_id: user.id,
        type_paiement: 'monnaie',
        montant_recu: recu,
        montant_rendu: rendu
      });

      toast.success('Opération de monnaie enregistrée');
      setMontantMonnaieurRecu('');
      setMontantMonnaieurRendu('');
      setActiveInput(null);
      chargerSoldeCaisse();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur enregistrement monnaie:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement de la monnaie');
    } finally {
      setLoading(false);
    }
  };

  const ouvrirSession = async () => {
    if (!sessionActive || sessionActive.statut !== 'en_attente_caissier') {
      toast.error('Aucune session en attente');
      return;
    }

    setLoading(true);

    try {
      await sessionsCaisseService.ouvrir(sessionActive.id, noteOuverture || undefined);
      toast.success('Session ouverte avec succès');
      setShowOuvrirSession(false);
      setNoteOuverture('');
      chargerSessionActive();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur ouverture session:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ouverture de la session');
    } finally {
      setLoading(false);
    }
  };

  const fermerSession = async () => {
    if (!sessionActive || sessionActive.statut !== 'ouverte') {
      toast.error('Aucune session ouverte');
      return;
    }

    const solde = parseFloat(soldeDeclare);
    if (!solde || solde < 0) {
      toast.error('Veuillez saisir le solde final');
      return;
    }

    setLoading(true);

    try {
      await sessionsCaisseService.fermer(sessionActive.id, solde, noteFermeture || undefined);
      toast.success('Session fermée avec succès');
      setShowFermerSession(false);
      setSoldeDeclare('');
      setNoteFermeture('');
      setActiveInput(null);
      chargerSessionActive();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur fermeture session:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la fermeture de la session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperationalPageLayout
      pageTitle="CAISSE"
      pageIcon={DollarSign}
      borderColor="green"
      maxWidth="full"
      backgroundColor="background"
      rightContent={
        <>
          {peutOpererCaisse && <SoldeCaisseDisplay solde={soldeCaisse} />}
          <UserInfo />
          {peutVoirHistorique && (
            <Button
              onClick={() => {
                chargerHistorique();
                setShowHistorique(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <History className="w-5 h-5 mr-2" />
              <span className="hidden lg:inline">Historique</span>
            </Button>
          )}
        </>
      }
      banner={
        peutOpererCaisse ? (
          <SessionCaisseBanner
            session={sessionActive}
            onOuvrirSession={() => setShowOuvrirSession(true)}
            onFermerSession={() => setShowFermerSession(true)}
          />
        ) : null
      }
    >
      {/* Contenu principal */}
      {!peutOpererCaisse ? (
        <div className="p-6">
          <AlertBanner
            type="info"
            message={
              <>
                Vous êtes connecté en tant que trésorier. Cette page est réservée aux caissiers pour les opérations de caisse.
                Rendez-vous sur l’espace Trésorerie pour gérer les sessions.
              </>
            }
          />
        </div>
      ) : (
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Produits - 50% */}
          <div className="flex-1 bg-white rounded-lg shadow-lg p-4 flex flex-col">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="🔍 Rechercher un produit..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                {produitsFiltres.map((produit) => {
                  const bgColor = produit.stock_actuel === 0 ? 'bg-gray-200' :
                    produit.niveau_stock === 'critique' ? 'bg-red-50 border-red-300' :
                      produit.niveau_stock === 'alerte' ? 'bg-orange-50 border-orange-300' :
                        'bg-green-50 border-green-300';

                  const textColor = produit.stock_actuel === 0 ? 'text-gray-500' : 'text-gray-900';

                  return (
                    <button
                      key={produit.id}
                      onClick={() => ajouterAuPanier(produit)}
                      disabled={produit.stock_actuel === 0}
                      className={`${bgColor} ${textColor} p-4 rounded-lg border-2 transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:hover:shadow-none h-28 flex flex-col justify-between`}
                    >
                      <div className="font-bold text-left text-base">{produit.nom}</div>
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold text-green-600">
                          {produit.prix_vente.toFixed(2)}€
                        </span>
                        <span className={`text-sm ${produit.niveau_stock === 'critique' ? 'text-red-600 font-bold' :
                          produit.niveau_stock === 'alerte' ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                          Stock: {produit.stock_actuel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panier + Clavier - 50% */}
          <div className="flex-1 flex gap-4">
            {/* Panier */}
            <div className="flex-1 bg-white rounded-lg shadow-lg p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold">Panier</h2>
                </div>
                {panier.length > 0 && (
                  <Button
                    onClick={viderPanier}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Vider
                  </Button>
                )}
              </div>

              {/* Total */}
              <div className="bg-green-600 text-white rounded-lg p-4 mb-3">
                <div className="text-sm uppercase">Total</div>
                <div className="text-4xl font-bold">{montantTotal.toFixed(2)} €</div>
                <div className="text-sm">{panier.length} article{panier.length > 1 ? 's' : ''}</div>
              </div>

              {/* Liste articles */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {panier.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">Panier vide</div>
                ) : (
                  panier.map((ligne) => (
                    <div key={ligne.produit.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                      <div className="flex-1">
                        <div className="font-semibold">{ligne.produit.nom}</div>
                        <div className="text-sm text-gray-600">
                          {ligne.produit.prix_vente.toFixed(2)}€ × {ligne.quantite} = {(ligne.produit.prix_vente * ligne.quantite).toFixed(2)}€
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => modifierQuantite(ligne.produit.id, -1)}
                          size="icon"
                          variant="outline"
                          className="w-8 h-8"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{ligne.quantite}</span>
                        <Button
                          onClick={() => modifierQuantite(ligne.produit.id, 1)}
                          size="icon"
                          variant="outline"
                          className="w-8 h-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => retirerDuPanier(ligne.produit.id)}
                          size="icon"
                          variant="destructive"
                          className="w-8 h-8 ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Paiement */}
              {panier.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <h3 className="font-bold mb-2">Paiement</h3>

                  <div className="grid grid-cols-3 gap-2">
                    <Can permission="caisse.encaisser_especes">
                      <Button
                        onClick={() => setTypePaiement('especes')}
                        variant={typePaiement === 'especes' ? 'default' : 'outline'}
                        className={typePaiement === 'especes' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        💵 Espèces
                      </Button>
                    </Can>

                    <Can permission="caisse.encaisser_cheque">
                      <Button
                        onClick={() => setTypePaiement('cheque')}
                        variant={typePaiement === 'cheque' ? 'default' : 'outline'}
                        className={typePaiement === 'cheque' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                      >
                        📝 Chèque
                      </Button>
                    </Can>

                    <Can permission="caisse.encaisser_cb">
                      <Button
                        onClick={() => setTypePaiement('cb')}
                        variant={typePaiement === 'cb' ? 'default' : 'outline'}
                        className={typePaiement === 'cb' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        💳 CB
                      </Button>
                    </Can>
                  </div>

                  {/* Champs conditionnels */}
                  {typePaiement === 'especes' && (
                    <div>
                      <Label>Montant reçu</Label>
                      <Input
                        type="text"
                        value={montantRecu}
                        onFocus={() => setActiveInput('montant_recu')}
                        readOnly
                        placeholder="0.00"
                        className="text-lg font-bold text-center cursor-pointer"
                      />
                      {montantRecuFloat > 0 && (
                        <div className={`mt-2 text-center text-lg font-bold ${monnaieARendreCalculee >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          Monnaie à rendre: {monnaieARendreCalculee.toFixed(2)} €
                        </div>
                      )}
                    </div>
                  )}

                  {typePaiement === 'cheque' && (
                    <div>
                      <Label>N° chèque</Label>
                      <Input
                        type="text"
                        value={referenceCheque}
                        onFocus={() => setActiveInput('reference_cheque')}
                        readOnly
                        placeholder="Numéro"
                        className="cursor-pointer"
                      />
                    </div>
                  )}

                  {typePaiement === 'cb' && (
                    <div>
                      <Label>4 derniers chiffres</Label>
                      <Input
                        type="text"
                        value={referenceCB}
                        onFocus={() => setActiveInput('reference_cb')}
                        readOnly
                        placeholder="****"
                        maxLength={4}
                        className="cursor-pointer"
                      />
                    </div>
                  )}

                  <Button
                    onClick={validerVente}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-lg font-bold shadow-lg"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Validation en cours...
                      </>
                    ) : (
                      `VALIDER ${montantTotal.toFixed(2)} €`
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Clavier numérique */}
            <div className="w-64 bg-white rounded-lg shadow-lg p-4">
              <div className="mb-3">
                <div className="text-sm font-semibold text-gray-600 mb-1">
                  {activeInput === 'montant_recu' && 'Montant reçu'}
                  {activeInput === 'reference_cheque' && 'N° chèque'}
                  {activeInput === 'reference_cb' && 'Référence CB'}
                  {activeInput === 'monnaieur_recu' && 'Montant reçu'}
                  {activeInput === 'monnaieur_rendu' && 'Montant rendu'}
                  {activeInput === 'solde_declare' && 'Solde déclaré'}
                  {!activeInput && 'Clavier numérique'}
                </div>
                <div className="h-12 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200">
                  <span className="text-2xl font-bold">
                    {activeInput === 'montant_recu' && (montantRecu || '0')}
                    {activeInput === 'reference_cheque' && (referenceCheque || '-')}
                    {activeInput === 'reference_cb' && (referenceCB || '-')}
                    {activeInput === 'monnaieur_recu' && (montantMonnaieurRecu || '0')}
                    {activeInput === 'monnaieur_rendu' && (montantMonnaieurRendu || '0')}
                    {activeInput === 'solde_declare' && (soldeDeclare || '0')}
                    {!activeInput && '-'}
                  </span>
                </div>
              </div>

              <NumericKeypad
                onDigit={handleKeypadDigit}
                onClear={handleKeypadClear}
                disabled={!activeInput}
              />

              {/* Section Monnaie */}
              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-purple-600">FAIRE DE LA MONNAIE</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600">Montant reçu</Label>
                    <Input
                      type="text"
                      value={montantMonnaieurRecu}
                      onClick={() => setActiveInput('monnaieur_recu')}
                      readOnly
                      placeholder="0.00"
                      className={`text-lg font-bold text-center cursor-pointer ${activeInput === 'monnaieur_recu' ? 'ring-2 ring-purple-500 border-purple-500' : ''
                        }`}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Montant à rendre</Label>
                    <Input
                      type="text"
                      value={montantMonnaieurRendu}
                      onClick={() => setActiveInput('monnaieur_rendu')}
                      readOnly
                      placeholder="0.00"
                      className={`text-lg font-bold text-center cursor-pointer ${activeInput === 'monnaieur_rendu' ? 'ring-2 ring-purple-500 border-purple-500' : ''
                        }`}
                    />
                  </div>

                  {(montantMonnaieurRecu || montantMonnaieurRendu) && (
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-600">Monnaie restante</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {calculerMonnaie().toFixed(2)} €
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setMontantMonnaieurRecu('');
                        setMontantMonnaieurRendu('');
                        setActiveInput(null);
                      }}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={enregistrerMonnaie}
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
          </div>
        </div>
      )}

      {peutOpererCaisse && (
        <>
          {/* Modal succès */}
          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent className="bg-white text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl">Vente enregistrée !</DialogTitle>
              </DialogHeader>
              <p className="text-4xl font-bold text-green-600 mb-6">{lastTransactionAmount.toFixed(2)} €</p>
              {typePaiement === 'especes' && monnaieARendreCalculee > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <div className="text-sm text-gray-600">Monnaie à rendre</div>
                  <div className="text-3xl font-bold text-yellow-700">{monnaieARendreCalculee.toFixed(2)} €</div>
                </div>
              )}
              <DialogFooter>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Nouvelle vente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal historique */}
          <Dialog open={showHistorique} onOpenChange={setShowHistorique}>
            <DialogContent className="bg-white max-w-4xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-4 border-b">
                <DialogTitle>Historique des transactions</DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
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
                      <tr key={t.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">#{t.id}</td>
                        <td className="px-4 py-2">{new Date(t.created_at).toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-2">{t.caissier_prenom} {t.caissier_nom}</td>
                        <td className="px-4 py-2 font-semibold">
                          {t.type_paiement === 'monnaie' ? (
                            <span className="text-purple-600">
                              {parseFloat((t.montant_recu || 0).toString()).toFixed(2)}€ → {parseFloat((t.montant_rendu || 0).toString()).toFixed(2)}€
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
                            <Badge className="bg-green-600 hover:bg-green-700">Fond de caisse</Badge>
                          ) : t.type_paiement === 'fermeture_caisse' ? (
                            <Badge className="bg-orange-600 hover:bg-orange-700">Fermeture caisse</Badge>
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
                <div className="p-4 border-t bg-gray-50">
                  <Button
                    onClick={() => setShowAnnulation(!showAnnulation)}
                    variant="destructive"
                  >
                    {showAnnulation ? 'Fermer annulation' : 'Annuler une transaction'}
                  </Button>

                  {showAnnulation && (
                    <div className="mt-4 space-y-3">
                      <Input
                        type="text"
                        placeholder="ID de la transaction"
                        value={transactionIdAnnulation}
                        onChange={(e) => setTransactionIdAnnulation(e.target.value)}
                      />
                      <textarea
                        placeholder="Raison de l'annulation (minimum 5 caractères)"
                        value={raisonAnnulation}
                        onChange={(e) => setRaisonAnnulation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        rows={2}
                      />
                      <Button
                        onClick={annulerTransaction}
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

          {/* Dialog ouvrir session */}
          <Dialog open={showOuvrirSession} onOpenChange={setShowOuvrirSession}>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl">Ouvrir la session de caisse</DialogTitle>
              </DialogHeader>

              {sessionActive && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Informations de la session</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>Trésorier: <span className="font-semibold">{sessionActive.tresorier_prenom} {sessionActive.tresorier_nom}</span></p>
                      <p>Fond initial: <span className="font-bold text-lg">{parseFloat(sessionActive.fond_initial.toString()).toFixed(2)}€</span></p>
                      <p>Créée le: {new Date(sessionActive.creee_at).toLocaleString('fr-FR')}</p>
                      {sessionActive.note_ouverture && (
                        <p className="mt-2 italic">Note: {sessionActive.note_ouverture}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Note d'ouverture (optionnel)</Label>
                    <textarea
                      value={noteOuverture}
                      onChange={(e) => setNoteOuverture(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Ajouter une note..."
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={() => setShowOuvrirSession(false)}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={ouvrirSession}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
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
          <Dialog open={showFermerSession} onOpenChange={setShowFermerSession}>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl">Fermer la session de caisse</DialogTitle>
              </DialogHeader>

              {sessionActive && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Informations de la session</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>Fond initial: <span className="font-bold">{parseFloat(sessionActive.fond_initial.toString()).toFixed(2)}€</span></p>
                      <p>Ouverte le: {sessionActive.ouverte_at && new Date(sessionActive.ouverte_at).toLocaleString('fr-FR')}</p>
                      <p className="mt-2">Solde caisse actuel: <span className="font-bold text-lg">{soldeCaisse.especes.toFixed(2)}€</span></p>
                    </div>
                  </div>

                  <div>
                    <Label>Solde final déclaré *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={soldeDeclare}
                      onChange={(e) => setSoldeDeclare(e.target.value)}
                      onFocus={() => setActiveInput('solde_declare')}
                      placeholder="0.00"
                      className="text-lg font-bold text-center"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comptez les espèces et saisissez le montant total (clavier ou pavé numérique)
                    </p>
                  </div>

                  <div>
                    <Label>Note de fermeture (optionnel)</Label>
                    <textarea
                      value={noteFermeture}
                      onChange={(e) => setNoteFermeture(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Commentaires éventuels..."
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowFermerSession(false);
                    setSoldeDeclare('');
                    setNoteFermeture('');
                    setActiveInput(null);
                  }}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={fermerSession}
                  disabled={loading || !soldeDeclare}
                  className="bg-red-600 hover:bg-red-700"
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
      )}
    </OperationalPageLayout>
  );
}
