import { useState, useEffect } from 'react';
import { useAuthorization } from '../hooks/useAuthorization';
import { Can } from '../components/Can';
import { produitsService, transactionsService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Trash2, Plus, Minus, DollarSign, CreditCard, FileText, AlertCircle, CheckCircle } from 'lucide-react';

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

export function CaissePage() {
  const { can } = useAuthorization();
  const { user } = useAuth();

  const [produits, setProduits] = useState<Produit[]>([]);
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [recherche, setRecherche] = useState('');
  const [typePaiement, setTypePaiement] = useState<TypePaiement>('especes');
  const [referenceCheque, setReferenceCheque] = useState('');
  const [referenceCB, setReferenceCB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showAnnulation, setShowAnnulation] = useState(false);
  const [transactionIdAnnulation, setTransactionIdAnnulation] = useState('');
  const [raisonAnnulation, setRaisonAnnulation] = useState('');

  // Charger les produits au démarrage
  useEffect(() => {
    chargerProduits();
    chargerHistorique();
  }, []);

  const chargerProduits = async () => {
    try {
      const result = await produitsService.getAll({ actifs_seulement: true });
      setProduits(result.produits);
    } catch (err: any) {
      console.error('Erreur chargement produits:', err);
      setError('Erreur lors du chargement des produits');
    }
  };

  const chargerHistorique = async () => {
    try {
      const result = await transactionsService.getAll({ limit: 10 });
      setTransactions(result.transactions);
    } catch (err: any) {
      console.error('Erreur chargement historique:', err);
    }
  };

  const produitsFiltres = produits.filter(p =>
    p.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const ajouterAuPanier = (produit: Produit) => {
    const ligneExistante = panier.find(l => l.produit.id === produit.id);

    if (ligneExistante) {
      if (ligneExistante.quantite < produit.stock_actuel) {
        setPanier(panier.map(l =>
          l.produit.id === produit.id
            ? { ...l, quantite: l.quantite + 1 }
            : l
        ));
      } else {
        setError(`Stock insuffisant pour ${produit.nom}`);
        setTimeout(() => setError(null), 3000);
      }
    } else {
      if (produit.stock_actuel > 0) {
        setPanier([...panier, { produit, quantite: 1 }]);
      } else {
        setError(`${produit.nom} est en rupture de stock`);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const modifierQuantite = (produitId: number, delta: number) => {
    setPanier(panier.map(l => {
      if (l.produit.id === produitId) {
        const nouvelleQuantite = l.quantite + delta;
        if (nouvelleQuantite <= 0) return l;
        if (nouvelleQuantite > l.produit.stock_actuel) {
          setError(`Stock insuffisant pour ${l.produit.nom}`);
          setTimeout(() => setError(null), 3000);
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

  const montantTotal = panier.reduce((sum, l) => sum + (l.produit.prix_vente * l.quantite), 0);

  const validerVente = async () => {
    if (panier.length === 0) {
      setError('Le panier est vide');
      return;
    }

    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    // Validation selon le type de paiement
    if (typePaiement === 'cheque' && !referenceCheque.trim()) {
      setError('Le numéro de chèque est requis');
      return;
    }

    if (typePaiement === 'cb' && !referenceCB.trim()) {
      setError('La référence CB est requise');
      return;
    }

    setLoading(true);
    setError(null);

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

      setSuccess(`Vente enregistrée : ${montantTotal.toFixed(2)} €`);
      setTimeout(() => setSuccess(null), 3000);

      // Réinitialiser
      setPanier([]);
      setReferenceCheque('');
      setReferenceCB('');
      chargerProduits(); // Recharger pour mettre à jour les stocks
      chargerHistorique();

    } catch (err: any) {
      console.error('Erreur validation vente:', err);
      setError(err.response?.data?.error || 'Erreur lors de la validation de la vente');
    } finally {
      setLoading(false);
    }
  };

  const annulerTransaction = async () => {
    if (!transactionIdAnnulation || !raisonAnnulation.trim()) {
      setError('ID de transaction et raison requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await transactionsService.cancel(parseInt(transactionIdAnnulation), raisonAnnulation);
      setSuccess('Transaction annulée avec succès');
      setTimeout(() => setSuccess(null), 3000);
      setShowAnnulation(false);
      setTransactionIdAnnulation('');
      setRaisonAnnulation('');
      chargerHistorique();
      chargerProduits();
    } catch (err: any) {
      console.error('Erreur annulation:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'annulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Caisse</h1>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sélection produits */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Produits</h2>

              {/* Recherche */}
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Liste produits */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {produitsFiltres.map((produit) => (
                  <button
                    key={produit.id}
                    onClick={() => ajouterAuPanier(produit)}
                    disabled={produit.stock_actuel === 0}
                    className={`p-4 border rounded-lg text-left hover:shadow-md transition-shadow ${
                      produit.stock_actuel === 0
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="font-semibold text-sm">{produit.nom}</div>
                    <div className="text-lg font-bold text-blue-600">{produit.prix_vente.toFixed(2)} €</div>
                    <div className={`text-xs ${
                      produit.niveau_stock === 'critique' ? 'text-red-600' :
                      produit.niveau_stock === 'alerte' ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      Stock: {produit.stock_actuel}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panier & Paiement */}
          <div className="space-y-6">
            {/* Panier */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Panier</h2>
              </div>

              {panier.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Panier vide</p>
              ) : (
                <div className="space-y-3">
                  {panier.map((ligne) => (
                    <div key={ligne.produit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{ligne.produit.nom}</div>
                        <div className="text-xs text-gray-600">{ligne.produit.prix_vente.toFixed(2)} € × {ligne.quantite}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => modifierQuantite(ligne.produit.id, -1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{ligne.quantite}</span>
                        <button
                          onClick={() => modifierQuantite(ligne.produit.id, 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => retirerDuPanier(ligne.produit.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{montantTotal.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Moyen de paiement */}
            {panier.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Moyen de paiement</h3>

                <div className="space-y-3">
                  <Can permission="caisse.encaisser_especes">
                    <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paiement"
                        value="especes"
                        checked={typePaiement === 'especes'}
                        onChange={(e) => setTypePaiement(e.target.value as TypePaiement)}
                        className="w-4 h-4"
                      />
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span>Espèces</span>
                    </label>
                  </Can>

                  <Can permission="caisse.encaisser_cheque">
                    <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paiement"
                        value="cheque"
                        checked={typePaiement === 'cheque'}
                        onChange={(e) => setTypePaiement(e.target.value as TypePaiement)}
                        className="w-4 h-4"
                      />
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <span>Chèque</span>
                    </label>
                    {typePaiement === 'cheque' && (
                      <input
                        type="text"
                        placeholder="Numéro de chèque"
                        value={referenceCheque}
                        onChange={(e) => setReferenceCheque(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md ml-11"
                      />
                    )}
                  </Can>

                  <Can permission="caisse.encaisser_cb">
                    <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paiement"
                        value="cb"
                        checked={typePaiement === 'cb'}
                        onChange={(e) => setTypePaiement(e.target.value as TypePaiement)}
                        className="w-4 h-4"
                      />
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span>Carte bancaire</span>
                    </label>
                    {typePaiement === 'cb' && (
                      <input
                        type="text"
                        placeholder="Référence CB (4 derniers chiffres)"
                        value={referenceCB}
                        onChange={(e) => setReferenceCB(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md ml-11"
                      />
                    )}
                  </Can>
                </div>

                <button
                  onClick={validerVente}
                  disabled={loading}
                  className="w-full mt-4 py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                >
                  {loading ? 'Validation en cours...' : `Valider ${montantTotal.toFixed(2)} €`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Historique */}
        <Can permission="caisse.voir_historique">
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Historique des transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
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
                    <tr key={t.id} className="border-t">
                      <td className="px-4 py-2">#{t.id}</td>
                      <td className="px-4 py-2">{new Date(t.created_at).toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-2">{t.caissier_prenom} {t.caissier_nom}</td>
                      <td className="px-4 py-2 font-semibold">{t.montant_total.toFixed(2)} €</td>
                      <td className="px-4 py-2 capitalize">{t.type_paiement}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          t.statut === 'validee' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {t.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Can>

        {/* Annulation */}
        <Can permission="caisse.annuler_vente">
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Annulation de vente</h2>
            {!showAnnulation ? (
              <button
                onClick={() => setShowAnnulation(true)}
                className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Annuler une transaction
              </button>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="ID de la transaction"
                  value={transactionIdAnnulation}
                  onChange={(e) => setTransactionIdAnnulation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <textarea
                  placeholder="Raison de l'annulation (minimum 5 caractères)"
                  value={raisonAnnulation}
                  onChange={(e) => setRaisonAnnulation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={annulerTransaction}
                    disabled={loading}
                    className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Annulation...' : 'Confirmer l\'annulation'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAnnulation(false);
                      setTransactionIdAnnulation('');
                      setRaisonAnnulation('');
                    }}
                    className="py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </Can>
      </div>
    </div>
  );
}
