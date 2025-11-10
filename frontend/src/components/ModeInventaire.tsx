import { useState, useEffect } from 'react';
import { produitsService, mouvementsStockService } from '../services/api';
import { Can } from './Can';
import { ClipboardList, Package, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  categorie_nom: string;
  stock_actuel: number;
  is_active: boolean;
}

interface InventaireItem {
  produit: Produit;
  quantite_comptee: string;
  ecart: number | null;
}

interface ModeInventaireProps {
  onClose: () => void;
  onComplete: () => void;
}

export function ModeInventaire({ onClose, onComplete }: ModeInventaireProps) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [inventaire, setInventaire] = useState<Map<number, InventaireItem>>(new Map());
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    try {
      setLoading(true);
      const data = await produitsService.getAll();
      const produitsActifs = data.produits.filter((p: Produit) => p.is_active);
      setProduits(produitsActifs);

      // Initialiser l'inventaire
      const newInventaire = new Map<number, InventaireItem>();
      produitsActifs.forEach((produit: Produit) => {
        newInventaire.set(produit.id, {
          produit,
          quantite_comptee: '',
          ecart: null
        });
      });
      setInventaire(newInventaire);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur chargement produits:', err);
      toast.error(err.response?.data?.error || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantiteChange = (produitId: number, quantiteStr: string) => {
    const item = inventaire.get(produitId);
    if (!item) return;

    let ecart: number | null = null;
    if (quantiteStr !== '') {
      const quantite = parseInt(quantiteStr);
      if (!isNaN(quantite) && quantite >= 0) {
        ecart = quantite - item.produit.stock_actuel;
      }
    }

    const newInventaire = new Map(inventaire);
    newInventaire.set(produitId, {
      ...item,
      quantite_comptee: quantiteStr,
      ecart
    });
    setInventaire(newInventaire);
  };

  const getInventaireStats = () => {
    const items = Array.from(inventaire.values());
    const total = items.length;
    const comptes = items.filter(item => item.quantite_comptee !== '').length;
    const avecEcarts = items.filter(item => item.ecart !== null && item.ecart !== 0).length;

    return { total, comptes, avecEcarts };
  };

  const handleValiderInventaire = async () => {
    const items = Array.from(inventaire.values());
    const itemsComptes = items.filter(item => item.quantite_comptee !== '');

    if (itemsComptes.length === 0) {
      toast.error('Veuillez compter au moins un produit');
      return;
    }

    // Vérifier qu'il y a au moins un écart
    const itemsAvecEcarts = itemsComptes.filter(item => item.ecart !== 0);
    if (itemsAvecEcarts.length === 0) {
      toast.info('Aucun écart détecté, inventaire conforme');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmerInventaire = async () => {
    try {
      setValidating(true);
      const items = Array.from(inventaire.values());
      const itemsAvecEcarts = items.filter(
        item => item.quantite_comptee !== '' && item.ecart !== null && item.ecart !== 0
      );

      // Créer un mouvement d'inventaire pour chaque écart
      for (const item of itemsAvecEcarts) {
        await mouvementsStockService.create({
          produit_id: item.produit.id,
          type_mouvement: 'inventaire',
          quantite: item.ecart!,
          motif: `Inventaire physique - Écart: ${item.ecart! > 0 ? '+' : ''}${item.ecart}`
        });
      }

      toast.success(`Inventaire validé : ${itemsAvecEcarts.length} ajustement(s) effectué(s)`);
      setShowConfirmDialog(false);
      onComplete();
      onClose();
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur validation inventaire:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la validation de l\'inventaire');
    } finally {
      setValidating(false);
    }
  };

  const stats = getInventaireStats();
  const progress = stats.total > 0 ? Math.round((stats.comptes / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Mode Inventaire
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Comptez physiquement chaque produit et saisissez la quantité réelle
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white rounded p-3">
            <p className="text-xs text-gray-600">Progression</p>
            <p className="text-2xl font-bold text-blue-600">{progress}%</p>
            <p className="text-xs text-gray-500">{stats.comptes} / {stats.total} produits</p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="text-xs text-gray-600">Écarts détectés</p>
            <p className="text-2xl font-bold text-orange-600">{stats.avecEcarts}</p>
            <p className="text-xs text-gray-500">produits avec écarts</p>
          </div>
          <div className="bg-white rounded p-3 flex items-center justify-center">
            <Button
              onClick={handleValiderInventaire}
              disabled={stats.comptes === 0 || validating}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              {validating ? <Spinner size="sm" className="mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Valider l'inventaire
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : produits.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun produit actif</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Système
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité Comptée
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Écart
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produits.map((produit) => {
                  const item = inventaire.get(produit.id);
                  if (!item) return null;

                  return (
                    <tr key={produit.id} className={`hover:bg-gray-50 ${item.quantite_comptee !== '' ? 'bg-green-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{produit.nom}</div>
                          <div className="text-xs text-gray-500">{produit.categorie_nom}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {produit.stock_actuel}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantite_comptee}
                          onChange={(e) => handleQuantiteChange(produit.id, e.target.value)}
                          placeholder="Compter..."
                          className="w-32 mx-auto text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.ecart !== null && (
                          <div className="flex items-center justify-end gap-2">
                            {item.ecart !== 0 && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                            <span className={`font-medium ${
                              item.ecart === 0 ? 'text-green-600' :
                              item.ecart > 0 ? 'text-green-600' :
                              'text-red-600'
                            }`}>
                              {item.ecart > 0 ? '+' : ''}{item.ecart}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog de confirmation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'inventaire</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Vous êtes sur le point de valider l'inventaire et d'ajuster les stocks pour{' '}
              <strong>{stats.avecEcarts} produit(s)</strong> avec écarts.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Cette action créera des mouvements d'inventaire et modifiera les stocks en conséquence.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={validating}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmerInventaire}
              disabled={validating}
              className="bg-green-600 hover:bg-green-700"
            >
              {validating ? <Spinner size="sm" className="mr-2" /> : null}
              Confirmer et ajuster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
