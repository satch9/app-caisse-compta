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
        return <ArrowDownCircle className="w-4 h-4 text-success" />;
      case 'sortie':
        return <ArrowUpCircle className="w-4 h-4 text-destructive" />;
      case 'ajustement':
        return <Edit3 className="w-4 h-4 text-info" />;
      case 'inventaire':
        return <ClipboardList className="w-4 h-4 text-accent" />;
      case 'perte':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'transfert':
        return <ArrowLeftRight className="w-4 h-4 text-info" />;
    }
  };

  const getTypeMouvementBadge = (type: TypeMouvement) => {
    const variants: Record<TypeMouvement, { label: string; className: string }> = {
      entree: { label: 'Entrée', className: 'bg-success/20 dark:bg-success/30 text-success dark:text-success' },
      sortie: { label: 'Sortie', className: 'bg-destructive/20 dark:bg-destructive/30 text-destructive dark:text-destructive' },
      ajustement: { label: 'Ajustement', className: 'bg-info/20 dark:bg-info/30 text-info dark:text-info' },
      inventaire: { label: 'Inventaire', className: 'bg-accent/20 dark:bg-accent/30 text-accent-foreground dark:text-accent-foreground' },
      perte: { label: 'Perte', className: 'bg-warning/20 dark:bg-warning/30 text-warning dark:text-warning' },
      transfert: { label: 'Transfert', className: 'bg-info/20 dark:bg-info/30 text-info dark:text-info' }
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
      <div className="bg-card rounded-lg shadow p-4 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
          <Package className="w-5 h-5 text-primary" />
          Filtres
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Type de mouvement</Label>
            <Select
              value={typeMouvementFilter}
              onValueChange={(value) => setTypeMouvementFilter(value as TypeMouvement | 'tous')}
            >
              <SelectTrigger className="bg-muted/50 border-2 border-input hover:border-primary/50 dark:bg-muted/30">
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
            className="mt-3 text-sm text-primary hover:text-primary/80"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Résultats */}
      <div className="bg-card rounded-lg shadow border border-border">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {total} mouvement(s) trouvé(s)
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : mouvements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 text-primary/50" />
            <p>Aucun mouvement de stock trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  {!produitId && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Produit
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Avant
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Après
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Utilisateur
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {mouvements.map((mvt) => (
                  <tr key={mvt.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(mvt.created_at)}
                      </div>
                    </td>
                    {!produitId && (
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-foreground">{mvt.produit_nom}</div>
                          <div className="text-muted-foreground text-xs">{mvt.categorie_nom}</div>
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
                      <span className={`font-medium ${mvt.quantite > 0 ? 'text-success' : 'text-destructive'
                        }`}>
                        {mvt.quantite > 0 ? '+' : ''}{mvt.quantite}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-muted-foreground">
                      {mvt.stock_avant}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-foreground">
                      {mvt.stock_apres}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                      {mvt.motif || mvt.commentaire || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {mvt.user_nom ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{mvt.user_nom}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
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
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1 text-sm border rounded hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed bg-background text-foreground border-input"
            >
              Précédent
            </button>
            <span className="text-sm text-muted-foreground">
              {offset + 1} - {Math.min(offset + limit, total)} sur {total}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1 text-sm border rounded hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed bg-background text-foreground border-input"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
