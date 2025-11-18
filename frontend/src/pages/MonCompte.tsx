import { useState, useEffect } from 'react';
import { comptesService } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Wallet, TrendingDown, ShoppingCart, Calendar, RefreshCw, User } from 'lucide-react';
import { OperationalPageLayout } from '../components/layouts/OperationalPageLayout';
import { UserInfo } from '../components/UserInfo';

interface Compte {
  id: number;
  user_id: number;
  type_compte: 'membre';
  solde: number;
  created_at: string;
  updated_at: string;
  email: string;
  nom: string;
  prenom: string;
  is_active: boolean;
}

interface Transaction {
  id: number;
  user_id: number | null;
  montant_total: number;
  type_paiement: 'especes' | 'cheque' | 'cb';
  created_at: string;
  caissier_nom?: string;
  caissier_prenom?: string;
}

interface Statistiques {
  solde_actuel: number;
  total_depenses: number;
  nb_transactions: number;
  derniere_transaction: string | null;
  depense_moyenne: number;
}

const MonCompte = () => {
  const [compte, setCompte] = useState<Compte | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const loadCompte = async () => {
    try {
      setLoading(true);
      const [compteData, statsData] = await Promise.all([
        comptesService.getMyCompte(),
        comptesService.getMyStatistiques(),
      ]);

      setCompte(compteData.data);
      setStatistiques(statsData.data);
    } catch (error: unknown) {
      toast.error((error as any).response?.data?.error || 'Erreur lors du chargement du compte');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const result = await comptesService.getMyHistorique({
        limit,
        offset: page * limit,
      });

      setTransactions(result.data);
      setTotal(result.total);
    } catch (error: unknown) {
      toast.error((error as any).response?.data?.error || 'Erreur lors du chargement de l\'historique');
      console.error('Erreur:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    loadCompte();
  }, []);

  useEffect(() => {
    if (compte) {
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, compte]);

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(montant);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypePaiementBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      especes: 'default',
      cheque: 'secondary',
      cb: 'outline',
    };

    const labels: Record<string, string> = {
      especes: 'Espèces',
      cheque: 'Chèque',
      cb: 'CB',
    };

    return (
      <Badge variant={variants[type] || 'default'}>
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <OperationalPageLayout
      pageTitle="MON COMPTE"
      pageIcon={User}
      borderColor="green"
      maxWidth="7xl"
      backgroundColor="gray-50"
      rightContent={<UserInfo />}
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : !compte ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Wallet className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Aucun compte membre
              </h3>
              <p className="text-gray-500 mb-4">
                Vous n'avez pas encore de compte membre. Les comptes membres sont réservés aux adhérents du club.
              </p>
              <p className="text-sm text-gray-400">
                Contactez l'administrateur pour créer un compte membre si vous êtes adhérent.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Informations du compte */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nom complet</p>
              <p className="font-medium">{compte.prenom} {compte.nom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{compte.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Statut</p>
              <Badge variant={compte.is_active ? 'default' : 'outline'}>
                {compte.is_active ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      {statistiques && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Solde actuel</p>
                  <p className={`text-2xl font-bold ${statistiques.solde_actuel >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMontant(statistiques.solde_actuel)}
                  </p>
                </div>
                <Wallet className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total dépensé</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMontant(statistiques.total_depenses)}
                  </p>
                </div>
                <TrendingDown className="w-10 h-10 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiques.nb_transactions}
                  </p>
                </div>
                <ShoppingCart className="w-10 h-10 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dépense moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMontant(statistiques.depense_moyenne)}
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucune transaction trouvée
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type paiement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caissier</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
                          -{formatMontant(transaction.montant_total)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {getTypePaiementBadge(transaction.type_paiement)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {transaction.caissier_nom && transaction.caissier_prenom
                            ? `${transaction.caissier_prenom} ${transaction.caissier_nom}`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Affichage de {page * limit + 1} à {Math.min((page + 1) * limit, total)} sur {total} transactions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                      variant="outline"
                      size="sm"
                    >
                      Précédent
                    </Button>
                    <Button
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= total}
                      variant="outline"
                      size="sm"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </OperationalPageLayout>
  );
};

export default MonCompte;
