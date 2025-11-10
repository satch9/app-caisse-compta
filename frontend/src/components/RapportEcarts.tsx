import { useState, useEffect } from 'react';
import { mouvementsStockService } from '../services/api';
import type { TypeMouvement } from '../services/api';
import { FileText, Download, Calendar, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface MouvementInventaire {
  id: number;
  produit_id: number;
  produit_nom: string;
  categorie_nom: string;
  type_mouvement: TypeMouvement;
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  motif: string | null;
  user_nom: string | null;
  created_at: string;
}

interface StatistiquesEcarts {
  total_produits: number;
  ecarts_positifs: number;
  ecarts_negatifs: number;
  valeur_totale_ecarts: number;
}

export function RapportEcarts() {
  const [mouvements, setMouvements] = useState<MouvementInventaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => {
    // Définir par défaut les 30 derniers jours
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setDateFin(today.toISOString().split('T')[0]);
    setDateDebut(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateDebut && dateFin) {
      loadRapport();
    }
  }, [dateDebut, dateFin]);

  const loadRapport = async () => {
    try {
      setLoading(true);
      const filters: any = {
        type_mouvement: 'inventaire',
        date_debut: dateDebut,
        date_fin: dateFin,
        limit: 200
      };

      const data = await mouvementsStockService.getAll(filters);
      setMouvements(data.mouvements || []);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur chargement rapport:', err);
      toast.error(err.response?.data?.error || 'Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const getStatistiques = (): StatistiquesEcarts => {
    const stats: StatistiquesEcarts = {
      total_produits: mouvements.length,
      ecarts_positifs: 0,
      ecarts_negatifs: 0,
      valeur_totale_ecarts: 0
    };

    mouvements.forEach(mvt => {
      if (mvt.quantite > 0) {
        stats.ecarts_positifs++;
      } else if (mvt.quantite < 0) {
        stats.ecarts_negatifs++;
      }
      stats.valeur_totale_ecarts += Math.abs(mvt.quantite);
    });

    return stats;
  };

  const handleExportCSV = () => {
    if (mouvements.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    // Créer le contenu CSV
    const headers = ['Date', 'Produit', 'Catégorie', 'Stock Avant', 'Stock Après', 'Écart', 'Motif', 'Utilisateur'];
    const rows = mouvements.map(mvt => [
      new Date(mvt.created_at).toLocaleDateString('fr-FR'),
      mvt.produit_nom,
      mvt.categorie_nom,
      mvt.stock_avant.toString(),
      mvt.stock_apres.toString(),
      mvt.quantite.toString(),
      mvt.motif || '',
      mvt.user_nom || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_ecarts_${dateDebut}_${dateFin}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Rapport exporté en CSV');
  };

  const stats = getStatistiques();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Rapport d'écarts d'inventaire
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Analyse des mouvements d'inventaire et des écarts détectés
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={mouvements.length === 0}
          variant="outline"
          className="text-green-600 hover:text-green-700 hover:border-green-300"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Filtres de date */}
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Période
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Date de début</Label>
            <Input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
          </div>
          <div>
            <Label>Date de fin</Label>
            <Input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {!loading && mouvements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total produits ajustés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_produits}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Écarts positifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.ecarts_positifs}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Stock réel &gt; stock système</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Écarts négatifs</p>
                <p className="text-2xl font-bold text-red-600">{stats.ecarts_negatifs}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Stock réel &lt; stock système</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Volume total écarts</p>
                <p className="text-2xl font-bold text-purple-600">{stats.valeur_totale_ecarts}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Unités (valeur absolue)</p>
          </div>
        </div>
      )}

      {/* Tableau des écarts */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : mouvements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun mouvement d'inventaire trouvé pour cette période</p>
            <p className="text-sm mt-2">Modifiez les dates ou effectuez un inventaire</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Avant
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Après
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Écart
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mouvements.map((mvt) => (
                  <tr key={mvt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {new Date(mvt.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{mvt.produit_nom}</div>
                        <div className="text-xs text-gray-500">{mvt.categorie_nom}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {mvt.stock_avant}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {mvt.stock_apres}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {mvt.quantite !== 0 && (
                          mvt.quantite > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )
                        )}
                        <span className={`font-medium ${
                          mvt.quantite > 0 ? 'text-green-600' :
                          mvt.quantite < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {mvt.quantite > 0 ? '+' : ''}{mvt.quantite}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {mvt.motif || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {mvt.user_nom || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
