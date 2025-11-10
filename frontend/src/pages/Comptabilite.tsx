import { useState, useEffect } from 'react';
import { FileText, Euro, TrendingUp, Package, DollarSign, AlertCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { OperationalPageLayout } from '../components/layouts/OperationalPageLayout';
import { UserInfo } from '../components/UserInfo';
import { DateRangePicker } from '../components/compta/DateRangePicker';
import { KPICard } from '../components/compta/KPICard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { comptaService } from '../services/api';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export function ComptabilitePage() {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [dateDebut, setDateDebut] = useState(firstDayOfMonth);
  const [dateFin, setDateFin] = useState(today);

  // Data states
  const [journalVentes, setJournalVentes] = useState<any>(null);
  const [rapportSessions, setRapportSessions] = useState<any>(null);
  const [chiffreAffaires, setChiffreAffaires] = useState<any>(null);
  const [ventesParProduit, setVentesParProduit] = useState<any>(null);
  const [valorisationStock, setValorisationStock] = useState<any>(null);
  const [groupBy, setGroupBy] = useState<'jour' | 'mois'>('jour');

  // Tab state (controlled mode to prevent unwanted tab switches)
  const [activeTab, setActiveTab] = useState('journal');

  // Pagination states for Journal des Ventes
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // Export states
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingSessions, setExportingSessions] = useState(false);
  const [exportingCA, setExportingCA] = useState(false);
  const [exportingProduits, setExportingProduits] = useState(false);
  const [exportingStock, setExportingStock] = useState(false);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when date range changes
    loadAllData();
  }, [dateDebut, dateFin, groupBy]);

  useEffect(() => {
    loadJournalVentes(); // Reload journal when page changes
  }, [currentPage]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadJournalVentes(),
        loadRapportSessions(),
        loadChiffreAffaires(),
        loadVentesParProduit(),
        loadValorisationStock()
      ]);
    } catch (error) {
      console.error('Erreur chargement données comptables:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJournalVentes = async () => {
    try {
      const offset = (currentPage - 1) * pageSize;
      const data = await comptaService.getJournalVentes(dateDebut, dateFin, pageSize, offset);
      setJournalVentes(data);
      setTotalCount(data.total_count || 0);
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur chargement journal des ventes');
    }
  };

  const loadRapportSessions = async () => {
    try {
      const data = await comptaService.getRapportSessions(dateDebut, dateFin);
      setRapportSessions(data);
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur chargement rapport sessions');
    }
  };

  const loadChiffreAffaires = async () => {
    try {
      const data = await comptaService.getChiffreAffaires(dateDebut, dateFin, groupBy);
      setChiffreAffaires(data);
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur chargement chiffre d\'affaires');
    }
  };

  const loadVentesParProduit = async () => {
    try {
      const data = await comptaService.getVentesParProduit(dateDebut, dateFin);
      setVentesParProduit(data);
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur chargement ventes par produit');
    }
  };

  const loadValorisationStock = async () => {
    try {
      const data = await comptaService.getValorisationStock();
      setValorisationStock(data);
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur chargement valorisation stock');
    }
  };

  const handleDateRangeApply = (debut: string, fin: string) => {
    setDateDebut(debut);
    setDateFin(fin);
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await comptaService.exportJournalVentesExcel(dateDebut, dateFin);
      toast.success('Export Excel réussi');
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur export Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportSessions = async () => {
    try {
      setExportingSessions(true);
      await comptaService.exportRapportSessionsExcel(dateDebut, dateFin);
      toast.success('Export Excel réussi');
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur export sessions');
    } finally {
      setExportingSessions(false);
    }
  };

  const handleExportCA = async () => {
    try {
      setExportingCA(true);
      await comptaService.exportChiffreAffairesExcel(dateDebut, dateFin, groupBy);
      toast.success('Export Excel réussi');
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur export chiffre affaires');
    } finally {
      setExportingCA(false);
    }
  };

  const handleExportProduits = async () => {
    try {
      setExportingProduits(true);
      await comptaService.exportVentesParProduitExcel(dateDebut, dateFin);
      toast.success('Export Excel réussi');
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur export ventes par produit');
    } finally {
      setExportingProduits(false);
    }
  };

  const handleExportStock = async () => {
    try {
      setExportingStock(true);
      await comptaService.exportValorisationStockExcel();
      toast.success('Export Excel réussi');
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.error || 'Erreur export valorisation stock');
    } finally {
      setExportingStock(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypePaiementBadge = (type: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      especes: { label: 'Espèces', className: 'bg-green-100 text-green-800' },
      cheque: { label: 'Chèque', className: 'bg-blue-100 text-blue-800' },
      cb: { label: 'CB', className: 'bg-purple-100 text-purple-800' }
    };

    const config = variants[type] || { label: type, className: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={config.className} variant="outline">
        {config.label}
      </Badge>
    );
  };

  const getStatutBadge = (statut: string) => {
    if (statut === 'validee') {
      return <Badge className="bg-green-100 text-green-800" variant="outline">Validée</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800" variant="outline">Annulée</Badge>;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <OperationalPageLayout
      pageTitle="COMPTABILITÉ"
      pageIcon={FileText}
      borderColor="purple"
      maxWidth="7xl"
      backgroundColor="gray-50"
      rightContent={<UserInfo />}
    >
      <div className="space-y-6">
        {/* Sélecteur de période */}
        <DateRangePicker
          onApply={handleDateRangeApply}
          defaultDateDebut={dateDebut}
          defaultDateFin={dateFin}
        />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="journal">Journal des ventes</TabsTrigger>
              <TabsTrigger value="sessions">Sessions de caisse</TabsTrigger>
              <TabsTrigger value="ca">Chiffre d'affaires</TabsTrigger>
              <TabsTrigger value="produits">Produits</TabsTrigger>
              <TabsTrigger value="stock">Valorisation stock</TabsTrigger>
            </TabsList>

            {/* ONGLET 1: Journal des Ventes */}
            <TabsContent value="journal">
              {journalVentes && (
                <div className="space-y-6">
                  {/* KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KPICard
                      title="Espèces"
                      value={`${journalVentes.totaux.especes.toFixed(2)} €`}
                      icon={Euro}
                      color="green"
                    />
                    <KPICard
                      title="Chèques"
                      value={`${journalVentes.totaux.cheque.toFixed(2)} €`}
                      icon={FileText}
                      color="blue"
                    />
                    <KPICard
                      title="CB"
                      value={`${journalVentes.totaux.cb.toFixed(2)} €`}
                      icon={DollarSign}
                      color="purple"
                    />
                    <KPICard
                      title="Total"
                      value={`${journalVentes.totaux.total.toFixed(2)} €`}
                      icon={TrendingUp}
                      color="gray"
                    />
                  </div>

                  {/* Export Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleExportExcel}
                      disabled={exportingExcel}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {exportingExcel ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Export en cours...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Exporter Excel
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Tableau */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    {journalVentes.transactions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune transaction sur cette période</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Transaction</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type paiement</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caissier</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {journalVentes.transactions.map((transaction: any) => (
                              <tr key={transaction.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {formatDateTime(transaction.date)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {transaction.numero}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {getTypePaiementBadge(transaction.type_paiement)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                  {transaction.montant.toFixed(2)} €
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {transaction.caissier}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {getStatutBadge(transaction.statut)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {journalVentes.transactions.length > 0 && totalCount > pageSize && (
                      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Page {currentPage} sur {Math.ceil(totalCount / pageSize)} ({totalCount} transactions au total)
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Précédent
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                          >
                            Suivant
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ONGLET 2: Sessions de Caisse */}
            <TabsContent value="sessions">
              {rapportSessions && (
                <div className="space-y-6">
                  {/* KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <KPICard
                      title="Nombre de sessions"
                      value={rapportSessions.sessions.length}
                      icon={FileText}
                      color="blue"
                    />
                    <KPICard
                      title="Total des écarts"
                      value={`${rapportSessions.total_ecarts.toFixed(2)} €`}
                      icon={AlertCircle}
                      color={rapportSessions.total_ecarts > 10 ? 'red' : 'green'}
                    />
                  </div>

                  {/* Export Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleExportSessions}
                      disabled={exportingSessions}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {exportingSessions ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Export en cours...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Exporter Excel
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Tableau */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    {rapportSessions.sessions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune session sur cette période</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date ouverture</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caissier</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fond initial</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde attendu</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde réel</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Écart</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {rapportSessions.sessions.map((session: any) => (
                              <tr key={session.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {formatDateTime(session.date_ouverture)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {session.caissier}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                                  {session.fond_initial.toFixed(2)} €
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                                  {session.solde_attendu.toFixed(2)} €
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                  {session.solde_valide ? session.solde_valide.toFixed(2) + ' €' : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {session.ecart !== null ? (
                                    <span className={`font-medium ${Math.abs(session.ecart) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                      {session.ecart > 0 ? '+' : ''}{session.ecart.toFixed(2)} €
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge className={
                                    session.statut === 'validee' ? 'bg-green-100 text-green-800' :
                                    session.statut === 'fermee' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  } variant="outline">
                                    {session.statut}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ONGLET 3: Chiffre d'Affaires */}
            <TabsContent value="ca">
              {chiffreAffaires && (
                <div className="space-y-6">
                  {/* KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard
                      title="CA Total"
                      value={`${chiffreAffaires.total.toFixed(2)} €`}
                      icon={TrendingUp}
                      color="blue"
                    />
                    <KPICard
                      title="Nombre de ventes"
                      value={chiffreAffaires.nb_total_transactions}
                      icon={FileText}
                      color="green"
                    />
                    <KPICard
                      title="Panier moyen"
                      value={`${chiffreAffaires.panier_moyen.toFixed(2)} €`}
                      icon={DollarSign}
                      color="purple"
                    />
                  </div>

                  {/* Toggle groupBy & Export */}
                  <div className="flex justify-between items-center">
                    <Button
                      type="button"
                      onClick={handleExportCA}
                      disabled={exportingCA}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {exportingCA ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Export en cours...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Exporter Excel
                        </>
                      )}
                    </Button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setGroupBy('jour');
                        }}
                        onKeyDown={(e) => {
                          if ([' ', 'Enter'].includes(e.key)) {
                            e.preventDefault();
                            e.stopPropagation();
                            setGroupBy('jour');
                          }
                        }}
                        className={`px-4 py-2 rounded text-sm font-medium ${
                          groupBy === 'jour'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Par jour
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setGroupBy('mois');
                        }}
                        onKeyDown={(e) => {
                          if ([' ', 'Enter'].includes(e.key)) {
                            e.preventDefault();
                            e.stopPropagation();
                            setGroupBy('mois');
                          }
                        }}
                        className={`px-4 py-2 rounded text-sm font-medium ${
                          groupBy === 'mois'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Par mois
                      </button>
                    </div>
                  </div>

                  {/* Graphique */}
                  <div className="bg-white rounded-lg shadow p-6">
                    {chiffreAffaires.data.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune donnée sur cette période</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chiffreAffaires.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periode" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                          <Legend />
                          <Line type="monotone" dataKey="montant" stroke="#3b82f6" strokeWidth={2} name="Chiffre d'affaires" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ONGLET 4: Produits */}
            <TabsContent value="produits">
              {ventesParProduit && (
                <div className="space-y-6">
                  {/* Export Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleExportProduits}
                      disabled={exportingProduits}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {exportingProduits ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Export en cours...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Exporter Excel
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Graphique par catégorie */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold text-lg mb-4">Répartition par catégorie</h3>
                    {ventesParProduit.par_categorie.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune vente sur cette période</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={ventesParProduit.par_categorie}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.categorie_nom} (${entry.ca_total.toFixed(0)}€)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="ca_total"
                          >
                            {ventesParProduit.par_categorie.map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Top 10 produits */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold text-lg mb-4">Top 10 produits</h3>
                    {ventesParProduit.produits.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune vente sur cette période</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={ventesParProduit.produits.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="produit_nom" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                          <Legend />
                          <Bar dataKey="ca_total" fill="#10b981" name="CA" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Tableau détaillé */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    {ventesParProduit.produits.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantité vendue</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CA Total</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix moyen</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {ventesParProduit.produits.map((produit: any) => (
                              <tr key={produit.produit_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{produit.produit_nom}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{produit.categorie_nom}</td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">{produit.quantite_vendue}</td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{produit.ca_total.toFixed(2)} €</td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">{produit.prix_moyen.toFixed(2)} €</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ONGLET 5: Valorisation Stock */}
            <TabsContent value="stock">
              {valorisationStock && (
                <div className="space-y-6">
                  {/* KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard
                      title="Valeur stock (achat)"
                      value={`${valorisationStock.total_valeur_achat.toFixed(2)} €`}
                      icon={Package}
                      color="blue"
                    />
                    <KPICard
                      title="Valeur stock (vente)"
                      value={`${valorisationStock.total_valeur_vente.toFixed(2)} €`}
                      icon={DollarSign}
                      color="green"
                    />
                    <KPICard
                      title="Marge potentielle"
                      value={`${valorisationStock.marge_potentielle.toFixed(2)} €`}
                      icon={TrendingUp}
                      color={valorisationStock.marge_potentielle > 0 ? 'green' : 'red'}
                    />
                  </div>

                  {/* Export Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleExportStock}
                      disabled={exportingStock}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {exportingStock ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Export en cours...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Exporter Excel
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Tableau par catégorie */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Valorisation par catégorie</h3>
                    </div>
                    {valorisationStock.par_categorie.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucun stock disponible</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur achat</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur vente</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Marge</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {valorisationStock.par_categorie.map((cat: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat.categorie_nom}</td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">{cat.valeur_achat.toFixed(2)} €</td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">{cat.valeur_vente.toFixed(2)} €</td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                                  +{cat.marge.toFixed(2)} €
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </OperationalPageLayout>
  );
}
