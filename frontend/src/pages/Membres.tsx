import { useState, useEffect } from 'react';
import { comptesService, adminService } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  Search,
  Eye,
  UserPlus,
  DollarSign,
  RefreshCw,
  Wallet,
  TrendingDown,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { OperationalPageLayout } from '../components/layouts/OperationalPageLayout';
import { UserInfo } from '../components/UserInfo';
import { Can } from '../components/Can';

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

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  is_active: boolean;
}

const Membres = () => {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [filteredComptes, setFilteredComptes] = useState<Compte[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'tous' | 'actifs' | 'inactifs'>('actifs');

  // Dialogs
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [ajusterDialogOpen, setAjusterDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCompte, setSelectedCompte] = useState<Compte | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null);

  // Création de compte
  const [usersWithoutCompte, setUsersWithoutCompte] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newCompteSolde, setNewCompteSolde] = useState('0');

  // Ajustement de solde
  const [ajustementMontant, setAjustementMontant] = useState('');
  const [ajustementRaison, setAjustementRaison] = useState('');
  const [ajustementLoading, setAjustementLoading] = useState(false);

  const loadComptes = async () => {
    try {
      setLoading(true);
      const response = await comptesService.getAllComptes();
      setComptes(response.data);
      setFilteredComptes(response.data);
    } catch (error: unknown) {
      toast.error((error as any).response?.data?.error || 'Erreur lors du chargement des comptes');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsersWithoutCompte = async () => {
    try {
      const response = await adminService.getAllUsers();

      // La réponse du backend est { users: [...] }
      const allUsers = response.users || [];

      const comptesUserIds = comptes.map((c) => c.user_id);
      const usersWithout = allUsers.filter(
        (user: User) => !comptesUserIds.includes(user.id)
      );

      setUsersWithoutCompte(usersWithout);
    } catch (error: unknown) {
      toast.error('Erreur lors du chargement des utilisateurs');
      console.error('Erreur:', error);
    }
  };

  useEffect(() => {
    loadComptes();
  }, []);

  useEffect(() => {
    if (createDialogOpen) {
      loadUsersWithoutCompte();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createDialogOpen, comptes]);

  useEffect(() => {
    let filtered = comptes;

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.nom.toLowerCase().includes(term) ||
          c.prenom.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (filterActive === 'actifs') {
      filtered = filtered.filter((c) => c.is_active);
    } else if (filterActive === 'inactifs') {
      filtered = filtered.filter((c) => !c.is_active);
    }

    setFilteredComptes(filtered);
  }, [searchTerm, filterActive, comptes]);

  const handleVoirDetails = async (compte: Compte) => {
    try {
      setSelectedCompte(compte);
      const [historiqueData, statsData] = await Promise.all([
        comptesService.getHistoriqueByUserId(compte.user_id, { limit: 10 }),
        comptesService.getStatistiquesByUserId(compte.user_id),
      ]);

      setTransactions(historiqueData.data);
      setStatistiques(statsData.data);
      setDetailsDialogOpen(true);
    } catch (error: unknown) {
      toast.error('Erreur lors du chargement des détails');
      console.error('Erreur:', error);
    }
  };

  const handleAjusterSolde = (compte: Compte) => {
    setSelectedCompte(compte);
    setAjustementMontant('');
    setAjustementRaison('');
    setAjusterDialogOpen(true);
  };

  const handleSubmitAjustement = async () => {
    if (!selectedCompte || !ajustementMontant || !ajustementRaison) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const montant = parseFloat(ajustementMontant);
    if (isNaN(montant)) {
      toast.error('Montant invalide');
      return;
    }

    try {
      setAjustementLoading(true);
      await comptesService.ajusterSolde(selectedCompte.user_id, montant, ajustementRaison);
      toast.success('Solde ajusté avec succès');
      setAjusterDialogOpen(false);
      loadComptes();
    } catch (error: unknown) {
      toast.error((error as any).response?.data?.error || 'Erreur lors de l\'ajustement');
      console.error('Erreur:', error);
    } finally {
      setAjustementLoading(false);
    }
  };

  const handleCreateCompte = async () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    const solde = parseFloat(newCompteSolde);
    if (isNaN(solde)) {
      toast.error('Solde initial invalide');
      return;
    }

    try {
      // Créer le compte membre
      await comptesService.createCompte({
        user_id: selectedUserId,
        solde_initial: solde,
      });

      toast.success('Compte créé avec succès');
      setCreateDialogOpen(false);

      // Réinitialiser le formulaire
      setSelectedUserId(null);
      setNewCompteSolde('0');

      loadComptes();
    } catch (error: unknown) {
      toast.error((error as any).response?.data?.error || 'Erreur lors de la création');
      console.error('Erreur:', error);
    }
  };

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
      pageTitle="COMPTES MEMBRES"
      pageIcon={Users}
      borderColor="purple"
      maxWidth="7xl"
      backgroundColor="gray-50"
      rightContent={
        <>
          <UserInfo />
          <Can permission="membres.creer_compte">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Créer un compte</span>
              <span className="sm:hidden">Créer</span>
            </Button>
          </Can>
        </>
      }
    >
      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterActive} onValueChange={(value: any) => setFilterActive(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="actifs">Actifs</SelectItem>
                <SelectItem value="inactifs">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des comptes */}
      <Card>
        <CardHeader>
          <CardTitle>
            Comptes ({filteredComptes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredComptes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucun compte trouvé
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solde</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredComptes.map((compte) => (
                    <tr key={compte.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {compte.prenom} {compte.nom}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{compte.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`font-bold ${
                            compte.solde >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatMontant(compte.solde)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Badge variant={compte.is_active ? 'default' : 'outline'}>
                          {compte.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVoirDetails(compte)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAjusterSolde(compte)}
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Détails du compte - {selectedCompte?.prenom} {selectedCompte?.nom}
            </DialogTitle>
          </DialogHeader>

          {statistiques && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Solde actuel</p>
                      <p
                        className={`text-xl font-bold ${
                          statistiques.solde_actuel >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatMontant(statistiques.solde_actuel)}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total dépensé</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatMontant(statistiques.total_depenses)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Transactions</p>
                      <p className="text-xl font-bold text-gray-900">
                        {statistiques.nb_transactions}
                      </p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-purple-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-4">Dernières transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Aucune transaction
              </p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caissier</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(transaction.created_at)}</td>
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
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Ajustement */}
      <Dialog open={ajusterDialogOpen} onOpenChange={setAjusterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ajuster le solde - {selectedCompte?.prenom} {selectedCompte?.nom}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Solde actuel</p>
              <p className="text-2xl font-bold">
                {selectedCompte && formatMontant(selectedCompte.solde)}
              </p>
            </div>

            <div>
              <Label htmlFor="montant">
                Montant de l'ajustement (positif pour ajouter, négatif pour retirer)
              </Label>
              <Input
                id="montant"
                type="number"
                step="0.01"
                value={ajustementMontant}
                onChange={(e) => setAjustementMontant(e.target.value)}
                placeholder="Ex: 50 ou -20"
              />
            </div>

            <div>
              <Label htmlFor="raison">Raison de l'ajustement</Label>
              <Input
                id="raison"
                value={ajustementRaison}
                onChange={(e) => setAjustementRaison(e.target.value)}
                placeholder="Ex: Rechargement compte, correction d'erreur..."
              />
            </div>

            {ajustementMontant && selectedCompte && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Nouveau solde</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatMontant(
                    selectedCompte.solde + parseFloat(ajustementMontant || '0')
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAjusterDialogOpen(false)}
              disabled={ajustementLoading}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmitAjustement} disabled={ajustementLoading}>
              {ajustementLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Ajustement...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Création */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau compte</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="user">Adhérent</Label>
              {usersWithoutCompte.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  Tous les adhérents ont déjà un compte. Pour ajouter un nouveau membre, allez dans Administration &gt; Utilisateurs.
                </p>
              ) : (
                <Select
                  value={selectedUserId?.toString()}
                  onValueChange={(value) => setSelectedUserId(parseInt(value))}
                >
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Sélectionner un adhérent" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersWithoutCompte.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.prenom} {user.nom} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="solde">Solde initial</Label>
              <Input
                id="solde"
                type="number"
                step="0.01"
                value={newCompteSolde}
                onChange={(e) => setNewCompteSolde(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateCompte}>
              Créer le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageLayout>
  );
};

export default Membres;
