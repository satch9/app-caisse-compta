import { useState, useEffect } from 'react';
import { categoriesService } from '../services/api';
import { Can } from './Can';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Categorie {
  id: number;
  nom: string;
  description: string | null;
  created_at: string;
}

export function GestionCategories() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState<Categorie | null>(null);

  // Form
  const [formData, setFormData] = useState({
    nom: '',
    description: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.getAll();
      setCategories(data.categories || []);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur chargement catégories:', err);
      toast.error(err.response?.data?.error || 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nom: '', description: '' });
  };

  const handleAdd = async () => {
    if (!formData.nom.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    try {
      setLoading(true);
      await categoriesService.create({
        nom: formData.nom.trim(),
        description: formData.description.trim() || undefined
      });
      toast.success('Catégorie créée avec succès');
      setShowAddDialog(false);
      resetForm();
      loadCategories();
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur création catégorie:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la création de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategorie) return;
    if (!formData.nom.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    try {
      setLoading(true);
      await categoriesService.update(selectedCategorie.id, {
        nom: formData.nom.trim(),
        description: formData.description.trim() || undefined
      });
      toast.success('Catégorie mise à jour avec succès');
      setShowEditDialog(false);
      setSelectedCategorie(null);
      resetForm();
      loadCategories();
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur mise à jour catégorie:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategorie) return;

    try {
      setLoading(true);
      await categoriesService.delete(selectedCategorie.id);
      toast.success('Catégorie supprimée avec succès');
      setShowDeleteDialog(false);
      setSelectedCategorie(null);
      loadCategories();
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Erreur suppression catégorie:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (categorie: Categorie) => {
    setSelectedCategorie(categorie);
    setFormData({
      nom: categorie.nom,
      description: categorie.description || ''
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (categorie: Categorie) => {
    setSelectedCategorie(categorie);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            Gestion des catégories
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {categories.length} catégorie(s)
          </p>
        </div>
        <Can permission="stock.gerer_categories">
          <Button
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une catégorie
          </Button>
        </Can>
      </div>

      {/* Liste des catégories */}
      <div className="bg-card rounded-lg shadow">
        {loading && categories.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted/50" />
            <p>Aucune catégorie</p>
            <Can permission="stock.gerer_categories">
              <p className="text-sm mt-2">Cliquez sur "Ajouter une catégorie" pour commencer</p>
            </Can>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Créée le
                  </th>
                  <Can permission="stock.gerer_categories">
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </Can>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {categories.map((categorie) => (
                  <tr key={categorie.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-foreground">{categorie.nom}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground">
                        {categorie.description || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(categorie.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <Can permission="stock.gerer_categories">
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(categorie)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(categorie)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </Can>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog Ajouter */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-nom">Nom de la catégorie *</Label>
              <Input
                id="add-nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Boissons"
              />
            </div>
            <div>
              <Label htmlFor="add-description">Description</Label>
              <textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                rows={3}
                placeholder="Description optionnelle..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAdd}
              disabled={loading || !formData.nom.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : null}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-nom">Nom de la catégorie *</Label>
              <Input
                id="edit-nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedCategorie(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEdit}
              disabled={loading || !formData.nom.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : null}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Supprimer */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">
              Êtes-vous sûr de vouloir supprimer la catégorie{' '}
              <strong>{selectedCategorie?.nom}</strong> ?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Cette action ne peut pas être annulée. La catégorie ne peut pas être supprimée si des produits l'utilisent.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedCategorie(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
