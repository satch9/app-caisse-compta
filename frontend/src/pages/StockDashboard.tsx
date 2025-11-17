import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OperationalPageLayout } from '../components/layouts/OperationalPageLayout';
import { UserInfo } from '../components/UserInfo';
import { Can } from '../components/Can';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  ClipboardList,
  Edit3,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { produitsService } from '../services/api';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { InventaireDialog } from '../components/stock/InventaireDialog';
import { AjustementDialog } from '../components/stock/AjustementDialog';

interface StockStats {
  valeur_totale_stock: number;
  nb_produits_actifs: number;
  nb_produits_alerte: number;
  nb_produits_critiques: number;
  top_produits_vendus: Array<{
    produit_id: number;
    nom: string;
    categorie_nom: string;
    quantite_vendue: number;
    ca_genere: number;
  }>;
  stock_par_categorie: Array<{
    categorie_id: number;
    categorie_nom: string;
    nb_produits: number;
    valeur_stock: number;
  }>;
}

const COULEURS_GRAPHIQUE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function StockDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventaireOpen, setInventaireOpen] = useState(false);
  const [ajustementOpen, setAjustementOpen] = useState(false);

  const chargerStats = async () => {
    try {
      setLoading(true);
      const response = await produitsService.getStockDashboardStats();
      setStats(response);
    } catch (error: any) {
      console.error('Erreur chargement stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerStats();
  }, []);

  const handleInventaireSuccess = () => {
    setInventaireOpen(false);
    chargerStats();
    toast.success('Inventaire enregistré avec succès');
  };

  const handleAjustementSuccess = () => {
    setAjustementOpen(false);
    chargerStats();
    toast.success('Ajustement effectué avec succès');
  };

  if (loading) {
    return (
      <OperationalPageLayout
        pageTitle="TABLEAU DE BORD STOCK"
        pageIcon={Package}
        borderColor="blue"
        maxWidth="7xl"
        backgroundColor="gray-50"
        leftContent={
          <Button
            onClick={() => navigate('/stock')}
            variant="outline"
            size="sm"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Retour au Stock</span>
            <span className="sm:hidden">Stock</span>
          </Button>
        }
        rightContent={<UserInfo />}
      >
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </OperationalPageLayout>
    );
  }

  return (
    <>
      <OperationalPageLayout
        pageTitle="TABLEAU DE BORD STOCK"
        pageIcon={Package}
        borderColor="blue"
        maxWidth="7xl"
        backgroundColor="gray-50"
        leftContent={
          <Button
            onClick={() => navigate('/stock')}
            variant="outline"
            size="sm"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Retour au Stock</span>
            <span className="sm:hidden">Stock</span>
          </Button>
        }
        rightContent={
          <div className="flex items-center gap-2">
            <UserInfo />
            <Can permission="stock.faire_inventaire">
              <Button
                onClick={() => setInventaireOpen(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Inventaire
              </Button>
            </Can>
            <Can permission="stock.modifier">
              <Button
                onClick={() => setAjustementOpen(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Ajuster
              </Button>
            </Can>
            <Button
              onClick={chargerStats}
              variant="ghost"
              size="sm"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        }
      >
        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur totale du stock</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.valeur_totale_stock.toFixed(2)} €
              </div>
              <p className="text-xs text-muted-foreground">
                Prix d'achat total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits actifs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.nb_produits_actifs}</div>
              <p className="text-xs text-muted-foreground">
                Références en stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.nb_produits_alerte}
              </div>
              <p className="text-xs text-muted-foreground">
                Produits à surveiller
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock critique</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.nb_produits_critiques}
              </div>
              <p className="text-xs text-muted-foreground">
                À réapprovisionner
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top produits vendus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Top 10 produits vendus (30 jours)
              </CardTitle>
              <CardDescription>Classement par quantité vendue</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.top_produits_vendus && stats.top_produits_vendus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.top_produits_vendus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nom" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantite_vendue" fill="#0088FE" name="Quantité vendue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune vente enregistrée sur les 30 derniers jours
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock par catégorie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Valorisation par catégorie
              </CardTitle>
              <CardDescription>Répartition de la valeur du stock</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.stock_par_categorie && stats.stock_par_categorie.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.stock_par_categorie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ categorie_nom, percent }) => `${categorie_nom} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valeur_stock"
                    >
                      {stats.stock_par_categorie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COULEURS_GRAPHIQUE[index % COULEURS_GRAPHIQUE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune catégorie avec stock
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table détaillée produits vendus */}
        {stats?.top_produits_vendus && stats.top_produits_vendus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Détail des ventes par produit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Produit</th>
                      <th className="text-left p-2">Catégorie</th>
                      <th className="text-right p-2">Quantité</th>
                      <th className="text-right p-2">CA généré</th>
                      <th className="text-right p-2">Prix moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_produits_vendus.map((produit, index) => (
                      <tr key={produit.produit_id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="font-medium">{produit.nom}</span>
                          </div>
                        </td>
                        <td className="p-2 text-gray-600">{produit.categorie_nom || 'Sans catégorie'}</td>
                        <td className="p-2 text-right font-medium">{produit.quantite_vendue}</td>
                        <td className="p-2 text-right font-medium text-green-600">
                          {Number(produit.ca_genere).toFixed(2)} €
                        </td>
                        <td className="p-2 text-right text-gray-600">
                          {(Number(produit.ca_genere) / Number(produit.quantite_vendue)).toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </OperationalPageLayout>

      {/* Dialogs */}
      <InventaireDialog
        open={inventaireOpen}
        onOpenChange={setInventaireOpen}
        onSuccess={handleInventaireSuccess}
      />

      <AjustementDialog
        open={ajustementOpen}
        onOpenChange={setAjustementOpen}
        onSuccess={handleAjustementSuccess}
      />
    </>
  );
}
