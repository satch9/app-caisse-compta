import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Can } from '../components/Can';
import { UserInfo } from '../components/UserInfo';
import { AlertBanner } from '../components/AlertBanner';
import { HistoriqueMouvements } from '../components/HistoriqueMouvements';
import { CategoryManager } from '../components/CategoryManager';
import { RapportEcarts } from '../components/RapportEcarts';
import { EnregistrerAchat } from '../components/EnregistrerAchat';
import { CommandeFournisseur } from '../components/CommandeFournisseur';
import { ListeCommandes } from '../components/ListeCommandes';
import type { Categorie as Category } from '../components/CategoryManager';
import { OperationalPageLayout } from '../components/layouts/OperationalPageLayout';
import { produitsService, categoriesService, mouvementsStockService } from '../services/api';
import {
  Package, Plus, Edit, Trash2, Search, AlertCircle,
  CheckCircle, AlertTriangle, Filter, X, List, History, Tag, Settings, FileText, ShoppingCart, Truck, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  description: string | null;
  categorie_id: number;
  categorie_nom: string;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  stock_minimum: number;
  is_active: boolean;
  niveau_stock: 'normal' | 'alerte' | 'critique';
  created_at: string;
  updated_at: string;
}

type FiltreNiveauStock = 'tous' | 'normal' | 'alerte' | 'critique';

export function StockPage() {
  const navigate = useNavigate();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [categorieFilter, setCategorieFilter] = useState<number | null>(null);
  const [niveauStockFilter, setNiveauStockFilter] = useState<FiltreNiveauStock>('tous');

  // Dialog états
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAjusterDialog, setShowAjusterDialog] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);

  // Ajustement stock
  const [nouvelleQuantite, setNouvelleQuantite] = useState('');
  const [motifAjustement, setMotifAjustement] = useState('');

  // Dialog achat
  const [showAchatDialog, setShowAchatDialog] = useState(false);

  // Dialog commande fournisseur
  const [showCommandeDialog, setShowCommandeDialog] = useState(false);

  // Form états
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    categorie_id: '',
    prix_achat: '',
    prix_vente: '',
    stock_actuel: '',
    stock_minimum: '',
    is_active: true
  });

  useEffect(() => {
    loadProduits();
    loadCategories();
  }, []);

  const loadProduits = async () => {
    try {
      setLoading(true);
      const data = await produitsService.getAll({
        actifs_seulement: false
      });
      const produitsFormates = (data.produits || []).map((p: any) => {
        const toNumber = (value: unknown, fallback: number = 0) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : fallback;
        };

        return {
          ...p,
          prix_achat: toNumber(p.prix_achat),
          prix_vente: toNumber(p.prix_vente),
          stock_actuel: Math.trunc(toNumber(p.stock_actuel)),
          stock_minimum: Math.trunc(toNumber(p.stock_minimum))
        };
      });
      setProduits(produitsFormates);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur chargement produits:', err);
      toast.error(err.response?.data?.error || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getAll();
      setCategories(data.categories || []);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur chargement catégories:', err);
    }
  };

  const handleAddProduit = async () => {
    try {
      setLoading(true);
      await produitsService.create({
        nom: formData.nom,
        description: formData.description || undefined,
        categorie_id: parseInt(formData.categorie_id),
        prix_achat: parseFloat(formData.prix_achat),
        prix_vente: parseFloat(formData.prix_vente),
        stock_actuel: parseInt(formData.stock_actuel),
        stock_minimum: parseInt(formData.stock_minimum),
        is_active: formData.is_active
      });

      toast.success('Produit créé avec succès');
      setShowAddDialog(false);
      resetForm();
      await loadProduits();
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur création produit:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduit = async () => {
    if (!selectedProduit) return;

    try {
      setLoading(true);
      await produitsService.update(selectedProduit.id, {
        nom: formData.nom,
        description: formData.description || undefined,
        categorie_id: parseInt(formData.categorie_id),
        prix_achat: parseFloat(formData.prix_achat),
        prix_vente: parseFloat(formData.prix_vente),
        stock_actuel: parseInt(formData.stock_actuel),
        stock_minimum: parseInt(formData.stock_minimum),
        is_active: formData.is_active
      });

      toast.success('Produit modifié avec succès');
      setShowEditDialog(false);
      setSelectedProduit(null);
      resetForm();
      await loadProduits();
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur modification produit:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la modification du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduit = async () => {
    if (!selectedProduit) return;

    try {
      setLoading(true);
      await produitsService.delete(selectedProduit.id);

      toast.success('Produit supprimé avec succès');
      setShowDeleteDialog(false);
      setSelectedProduit(null);
      await loadProduits();
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur suppression produit:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleAjuster = async () => {
    if (!selectedProduit) return;
    const nouvelleQty = parseInt(nouvelleQuantite);
    if (isNaN(nouvelleQty) || nouvelleQty < 0) {
      toast.error('Quantité invalide');
      return;
    }

    const difference = nouvelleQty - selectedProduit.stock_actuel;
    if (difference === 0) {
      toast.warning('Aucun changement de stock');
      return;
    }

    try {
      setLoading(true);
      await mouvementsStockService.create({
        produit_id: selectedProduit.id,
        type_mouvement: 'ajustement',
        quantite: difference,
        motif: motifAjustement || 'Ajustement manuel'
      });
      toast.success('Stock ajusté avec succès');
      setShowAjusterDialog(false);
      setSelectedProduit(null);
      setNouvelleQuantite('');
      setMotifAjustement('');
      await loadProduits();
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur ajustement stock:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de l\'ajustement du stock');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (produit: Produit) => {
    setSelectedProduit(produit);
    setFormData({
      nom: produit.nom,
      description: produit.description || '',
      categorie_id: produit.categorie_id.toString(),
      prix_achat: produit.prix_achat.toString(),
      prix_vente: produit.prix_vente.toString(),
      stock_actuel: produit.stock_actuel.toString(),
      stock_minimum: produit.stock_minimum.toString(),
      is_active: produit.is_active
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (produit: Produit) => {
    setSelectedProduit(produit);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      categorie_id: '',
      prix_achat: '',
      prix_vente: '',
      stock_actuel: '',
      stock_minimum: '',
      is_active: true
    });
  };

  const getNiveauStockBadge = (niveau: string) => {
    switch (niveau) {
      case 'critique':
        return <Badge className="bg-red-500 text-white"><AlertCircle className="w-3 h-3 mr-1" /> Critique</Badge>;
      case 'alerte':
        return <Badge className="bg-yellow-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" /> Alerte</Badge>;
      default:
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" /> Normal</Badge>;
    }
  };

  // Filtrage des produits
  const produitsFiltres = produits.filter(p => {
    const matchRecherche = !recherche ||
      p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(recherche.toLowerCase()));

    const matchCategorie = !categorieFilter || p.categorie_id === categorieFilter;

    const matchNiveau = niveauStockFilter === 'tous' || p.niveau_stock === niveauStockFilter;

    return matchRecherche && matchCategorie && matchNiveau;
  });

  const isFormValid = formData.nom.trim() !== '' &&
    formData.categorie_id !== '' &&
    formData.prix_achat !== '' &&
    formData.prix_vente !== '' &&
    formData.stock_actuel !== '' &&
    formData.stock_minimum !== '';

  // Compter les produits en alerte
  const produitsEnAlerte = produits.filter(p => p.niveau_stock === 'critique' || p.niveau_stock === 'alerte');
  const produitsCritiques = produits.filter(p => p.niveau_stock === 'critique');

  return (
    <OperationalPageLayout
      pageTitle="STOCKS"
      pageIcon={Package}
      borderColor="blue"
      maxWidth="7xl"
      backgroundColor="gray-50"
      rightContent={
        <>
          <UserInfo />
          <div className="flex gap-2">
            <Can permission="stock.consulter">
              <Button
                onClick={() => navigate('/stock/dashboard')}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Tableau de bord</span>
                <span className="sm:hidden">Stats</span>
              </Button>
            </Can>
            <Can permission="stock.enregistrer_achat">
              <Button
                onClick={() => setShowAchatDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Enregistrer un achat</span>
                <span className="sm:hidden">Achat</span>
              </Button>
            </Can>
            <Can permission="stock.gerer_commandes">
              <Button
                onClick={() => setShowCommandeDialog(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Truck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Commande fournisseur</span>
                <span className="sm:hidden">Commande</span>
              </Button>
            </Can>
            <Can permission="stock.ajouter_produit">
              <Button
                onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Ajouter un produit</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </Can>
          </div>
        </>
      }
      banner={
        produitsCritiques.length > 0 ? (
          <AlertBanner
            type="error"
            message={
              <>
                <strong>{produitsCritiques.length}</strong> produit(s) en stock critique
                {produitsEnAlerte.length > produitsCritiques.length && (
                  <> et <strong>{produitsEnAlerte.length - produitsCritiques.length}</strong> en alerte</>
                )}
              </>
            }
            action={{
              label: 'Voir les alertes',
              onClick: () => setNiveauStockFilter('critique')
            }}
          />
        ) : produitsEnAlerte.length > 0 ? (
          <AlertBanner
            type="warning"
            message={
              <>
                <strong>{produitsEnAlerte.length}</strong> produit(s) en alerte de stock
              </>
            }
            action={{
              label: 'Voir les alertes',
              onClick: () => setNiveauStockFilter('alerte')
            }}
          />
        ) : null
      }
    >
      {/* Contenu principal avec tabs */}
      <Tabs defaultValue="produits" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="produits" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="historique" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historique des mouvements
          </TabsTrigger>
          <TabsTrigger value="rapport-ecarts" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Rapport d'écarts
          </TabsTrigger>
          <TabsTrigger value="approvisionnements" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Approvisionnements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produits">
          {/* En-tête avec compteur */}
          <div className="mb-6">
            <p className="text-gray-600">
              {produitsFiltres.length} produit(s) affiché(s)
            </p>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche */}
              <div>
                <Label htmlFor="recherche" className="text-sm font-medium text-gray-700">
                  <Search className="w-4 h-4 inline mr-1" />
                  Rechercher
                </Label>
                <Input
                  id="recherche"
                  type="text"
                  placeholder="Nom ou description..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Filtre catégorie */}
              <div>
                <Label htmlFor="categorie" className="text-sm font-medium text-gray-700">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Catégorie
                </Label>
                <select
                  id="categorie"
                  value={categorieFilter || ''}
                  onChange={(e) => setCategorieFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              {/* Filtre niveau stock */}
              <div>
                <Label htmlFor="niveau" className="text-sm font-medium text-gray-700">
                  <Package className="w-4 h-4 inline mr-1" />
                  Niveau de stock
                </Label>
                <select
                  id="niveau"
                  value={niveauStockFilter}
                  onChange={(e) => setNiveauStockFilter(e.target.value as FiltreNiveauStock)}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="tous">Tous les niveaux</option>
                  <option value="normal">Normal</option>
                  <option value="alerte">Alerte</option>
                  <option value="critique">Critique</option>
                </select>
              </div>
            </div>

            {/* Réinitialiser filtres */}
            {(recherche || categorieFilter || niveauStockFilter !== 'tous') && (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRecherche('');
                    setCategorieFilter(null);
                    setNiveauStockFilter('tous');
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>

          {/* Liste des produits */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : produitsFiltres.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix Achat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix Vente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Niveau
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produitsFiltres.map(produit => (
                    <tr key={produit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{produit.nom}</div>
                          {produit.description && (
                            <div className="text-xs text-gray-500">{produit.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {produit.categorie_nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {produit.prix_achat.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {produit.prix_vente.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {produit.stock_actuel} / {produit.stock_minimum}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getNiveauStockBadge(produit.niveau_stock)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {produit.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Actif</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <Can permission="stock.modifier">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(produit)}
                              title="Modifier le produit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Can>
                          <Can permission="stock.modifier">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduit(produit);
                                setNouvelleQuantite(produit.stock_actuel.toString());
                                setMotifAjustement('');
                                setShowAjusterDialog(true);
                              }}
                              title="Ajuster le stock"
                              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </Can>
                          <Can permission="stock.supprimer_produit">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(produit)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                              title="Supprimer le produit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager
            categories={categories}
            onRefresh={loadCategories}
          />
        </TabsContent>

        <TabsContent value="historique">
          <HistoriqueMouvements />
        </TabsContent>

        <TabsContent value="rapport-ecarts">
          <RapportEcarts />
        </TabsContent>

        <TabsContent value="approvisionnements">
          <ListeCommandes />
        </TabsContent>
      </Tabs>

      {/* Dialog Ajout Produit */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white dark:bg-slate-900 max-w-2xl border border-border">
          <DialogHeader>
            <DialogTitle>Ajouter un produit</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="nom">Nom du produit *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Coca-Cola 33cl"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle"
              />
            </div>

            <div>
              <Label htmlFor="categorie_id">Catégorie *</Label>
              <select
                id="categorie_id"
                value={formData.categorie_id}
                onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="prix_achat">Prix d'achat (€) *</Label>
              <Input
                id="prix_achat"
                type="number"
                step="0.01"
                min="0"
                value={formData.prix_achat}
                onChange={(e) => setFormData({ ...formData, prix_achat: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="prix_vente">Prix de vente (€) *</Label>
              <Input
                id="prix_vente"
                type="number"
                step="0.01"
                min="0"
                value={formData.prix_vente}
                onChange={(e) => setFormData({ ...formData, prix_vente: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="stock_actuel">Stock actuel *</Label>
              <Input
                id="stock_actuel"
                type="number"
                min="0"
                value={formData.stock_actuel}
                onChange={(e) => setFormData({ ...formData, stock_actuel: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="stock_minimum">Stock minimum *</Label>
              <Input
                id="stock_minimum"
                type="number"
                min="0"
                value={formData.stock_minimum}
                onChange={(e) => setFormData({ ...formData, stock_minimum: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Produit actif
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddProduit}
              disabled={!isFormValid || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modification Produit */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white dark:bg-slate-900 max-w-2xl border border-border">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="edit-nom">Nom du produit *</Label>
              <Input
                id="edit-nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-categorie_id">Catégorie *</Label>
              <select
                id="edit-categorie_id"
                value={formData.categorie_id}
                onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="edit-prix_achat">Prix d'achat (€) *</Label>
              <Input
                id="edit-prix_achat"
                type="number"
                step="0.01"
                min="0"
                value={formData.prix_achat}
                onChange={(e) => setFormData({ ...formData, prix_achat: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-prix_vente">Prix de vente (€) *</Label>
              <Input
                id="edit-prix_vente"
                type="number"
                step="0.01"
                min="0"
                value={formData.prix_vente}
                onChange={(e) => setFormData({ ...formData, prix_vente: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-stock_actuel">Stock actuel *</Label>
              <Input
                id="edit-stock_actuel"
                type="number"
                min="0"
                value={formData.stock_actuel}
                onChange={(e) => setFormData({ ...formData, stock_actuel: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit-stock_minimum">Stock minimum *</Label>
              <Input
                id="edit-stock_minimum"
                type="number"
                min="0"
                value={formData.stock_minimum}
                onChange={(e) => setFormData({ ...formData, stock_minimum: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Produit actif
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleEditProduit}
              disabled={!isFormValid || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>

          <p className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer le produit{' '}
            <strong>{selectedProduit?.nom}</strong> ?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Si ce produit a été utilisé dans des transactions, il sera désactivé au lieu d'être supprimé.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleDeleteProduit}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ajuster Stock */}
      <Dialog open={showAjusterDialog} onOpenChange={setShowAjusterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster le stock</DialogTitle>
          </DialogHeader>
          {selectedProduit && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600">Produit</p>
                <p className="font-medium">{selectedProduit.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock actuel</p>
                <p className="font-medium">{selectedProduit.stock_actuel}</p>
              </div>
              <div>
                <Label htmlFor="nouvelle-quantite">Nouvelle quantité *</Label>
                <Input
                  id="nouvelle-quantite"
                  type="number"
                  min="0"
                  value={nouvelleQuantite}
                  onChange={(e) => setNouvelleQuantite(e.target.value)}
                />
                {nouvelleQuantite && !isNaN(parseInt(nouvelleQuantite)) && (
                  <p className="text-sm mt-1">
                    Différence:
                    <span className={`font-medium ml-1 ${
                      parseInt(nouvelleQuantite) - selectedProduit.stock_actuel > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {parseInt(nouvelleQuantite) - selectedProduit.stock_actuel > 0 ? '+' : ''}
                      {parseInt(nouvelleQuantite) - selectedProduit.stock_actuel}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="motif-ajustement">Motif</Label>
                <textarea
                  id="motif-ajustement"
                  value={motifAjustement}
                  onChange={(e) => setMotifAjustement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Raison de l'ajustement..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAjusterDialog(false);
                setSelectedProduit(null);
                setNouvelleQuantite('');
                setMotifAjustement('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAjuster}
              disabled={loading || !nouvelleQuantite}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : null}
              Ajuster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Enregistrer Achat */}
      <EnregistrerAchat
        open={showAchatDialog}
        onClose={() => setShowAchatDialog(false)}
        onSuccess={() => loadProduits()}
      />

      {/* Dialog Commande Fournisseur */}
      <CommandeFournisseur
        open={showCommandeDialog}
        onClose={() => setShowCommandeDialog(false)}
        onSuccess={() => {
          setShowCommandeDialog(false);
          // Optionnel: recharger les produits si besoin
          loadProduits();
        }}
      />
    </OperationalPageLayout>
  );
}
