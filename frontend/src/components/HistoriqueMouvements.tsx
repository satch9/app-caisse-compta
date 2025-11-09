import { useState, useEffect } from 'react';
import { mouvementsStockService } from '../services/api';
import type { TypeMouvement } from '../services/api';
import { ArrowDownCircle, ArrowUpCircle, Edit3, ClipboardList, AlertCircle, ArrowLeftRight, Calendar, User, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface MouvementStock {
  id: number;
  produit_id: number;
  produit_nom: string;
  categorie_nom: string;
  type_mouvement: TypeMouvement;
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  motif: string | null;
  commentaire: string | null;
  user_id: number | null;
  user_nom: string | null;
  created_at: string;
}

interface HistoriqueMouvementsProps {
  produitId?: number; // Si fourni, affiche seulement les mouvements de ce produit
}

export function HistoriqueMouvements({ produitId }: HistoriqueMouvementsProps) {
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filtres
  const [typeMouvementFilter, setTypeMouvementFilter] = useState<TypeMouvement | 'tous'>('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    loadMouvements();
  }, [produitId, typeMouvementFilter, dateDebut, dateFin, offset]);

  const loadMouvements = async () => {
    try {
      setLoading(true);
      const filters: any = {
        limit,
        offset
      };

      if (produitId) {
        filters.produit_id = produitId;
      }

      if (typeMouvementFilter && typeMouvementFilter !== 'tous') {
        filters.type_mouvement = typeMouvementFilter;
      }

      if (dateDebut) {
        filters.date_debut = dateDebut;
      }

      if (dateFin) {
        filters.date_fin = dateFin;
      }

      const data = await mouvementsStockService.getAll(filters);
      setMouvements(data.mouvements || []);
      setTotal(data.total || 0);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur chargement mouvements:', err);
      toast.error(err.response?.data?.error || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const getTypeMouvementIcon = (type: TypeMouvement) => {
    switch (type) {
      case 'entree':
        return <ArrowDownCircle className="w-4 h-4 text-green-600" />;
      case 'sortie':
        return <ArrowUpCircle className="w-4 h-4 text-red-600" />;
      case 'ajustement':
        return <Edit3 className="w-4 h-4 text-blue-600" />;
      case 'inventaire':
        return <ClipboardList className="w-4 h-4 text-purple-600" />;
      case 'perte':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'transfert':
        return <ArrowLeftRight className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getTypeMouvementBadge = (type: TypeMouvement) => {
    const variants: Record<TypeMouvement, { label: string; className: string }> = {
      entree: { label: 'Entrée', className: 'bg-green-100 text-green-800' },
      sortie: { label: 'Sortie', className: 'bg-red-100 text-red-800' },
      ajustement: { label: 'Ajustement', className: 'bg-blue-100 text-blue-800' },
      inventaire: { label: 'Inventaire', className: 'bg-purple-100 text-purple-800' },
      perte: { label: 'Perte', className: 'bg-orange-100 text-orange-800' },
      transfert: { label: 'Transfert', className: 'bg-indigo-100 text-indigo-800' }
    };

    const config = variants[type];
    return (
      <Badge className={config.className} variant="outline">
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const resetFilters = () => {
    setTypeMouvementFilter('tous');
    setDateDebut('');
    setDateFin('');
    setOffset(0);
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Filtres
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Type de mouvement</Label>
            <Select
              value={typeMouvementFilter}
              onValueChange={(value) => setTypeMouvementFilter(value as TypeMouvement | 'tous')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="entree">Entrée</SelectItem>
                <SelectItem value="sortie">Sortie</SelectItem>
                <SelectItem value="ajustement">Ajustement</SelectItem>
                <SelectItem value="inventaire">Inventaire</SelectItem>
                <SelectItem value="perte">Perte</SelectItem>
                <SelectItem value="transfert">Transfert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date début</Label>
            <Input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
          </div>

          <div>
            <Label>Date fin</Label>
            <Input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />
          </div>
        </div>

        {(typeMouvementFilter !== 'tous' || dateDebut || dateFin) && (
          <button
            onClick={resetFilters}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Résultats */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {total} mouvement(s) trouvé(s)
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : mouvements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun mouvement de stock trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {!produitId && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avant
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Après
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(mvt.created_at)}
                      </div>
                    </td>
                    {!produitId && (
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{mvt.produit_nom}</div>
                          <div className="text-gray-500 text-xs">{mvt.categorie_nom}</div>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeMouvementIcon(mvt.type_mouvement)}
                        {getTypeMouvementBadge(mvt.type_mouvement)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className={`font-medium ${mvt.quantite > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {mvt.quantite > 0 ? '+' : ''}{mvt.quantite}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                      {mvt.stock_avant}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {mvt.stock_apres}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {mvt.motif || mvt.commentaire || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {mvt.user_nom ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {mvt.user_nom}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination simple */}
        {total > limit && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-600">
              {offset + 1} - {Math.min(offset + limit, total)} sur {total}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
