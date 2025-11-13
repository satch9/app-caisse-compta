import { useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { categoriesService } from '../services/api';
import { usePermissions } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

interface ApiError {
    response?: {
        data?: {
            error?: string;
        };
    };
    message?: string;
}

export interface Categorie {
    id: number;
    nom: string;
    description: string | null;
    created_at?: string;
}

interface CategoryManagerProps {
    categories: Categorie[];
    onRefresh: () => Promise<void> | void;
}

type DialogMode = 'create' | 'edit' | null;

export function CategoryManager({ categories, onRefresh }: CategoryManagerProps) {
    const { can } = usePermissions();
    const canManageCategories = can('stock.gerer_categories');

    const [dialogMode, setDialogMode] = useState<DialogMode>(null);
    const [selectedCategory, setSelectedCategory] = useState<Categorie | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Categorie | null>(null);
    const [formData, setFormData] = useState({ nom: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const hasCategories = categories.length > 0;

    const resetForm = () => {
        setFormData({ nom: '', description: '' });
        setSelectedCategory(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setDialogMode('create');
    };

    const handleOpenEdit = (categorie: Categorie) => {
        setSelectedCategory(categorie);
        setFormData({
            nom: categorie.nom,
            description: categorie.description || ''
        });
        setDialogMode('edit');
    };

    const handleOpenDelete = (categorie: Categorie) => {
        setDeleteTarget(categorie);
    };

    const closeDialog = () => {
        setDialogMode(null);
        resetForm();
    };

    const closeDeleteDialog = () => {
        setDeleteTarget(null);
    };

    const runRefresh = async () => {
        try {
            setIsRefreshing(true);
            await Promise.resolve(onRefresh());
        } catch (error) {
            console.error('Erreur rafraîchissement catégories:', error);
            toast.error('Erreur lors du rafraîchissement des catégories');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSave = async () => {
        if (!formData.nom.trim()) {
            toast.error('Le nom de la catégorie est requis');
            return;
        }

        setIsSubmitting(true);
        try {
            if (dialogMode === 'create') {
                await categoriesService.create({
                    nom: formData.nom.trim(),
                    description: formData.description.trim() || undefined
                });
                toast.success('Catégorie créée avec succès');
            } else if (dialogMode === 'edit' && selectedCategory) {
                await categoriesService.update(selectedCategory.id, {
                    nom: formData.nom.trim(),
                    description: formData.description.trim() || undefined
                });
                toast.success('Catégorie mise à jour avec succès');
            }

            closeDialog();
            await runRefresh();
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Erreur sauvegarde catégorie:', err);
            toast.error(err.response?.data?.error || 'Erreur lors de l’enregistrement de la catégorie');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsSubmitting(true);
        try {
            await categoriesService.delete(deleteTarget.id);
            toast.success('Catégorie supprimée avec succès');
            closeDeleteDialog();
            await runRefresh();
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Erreur suppression catégorie:', err);
            toast.error(err.response?.data?.error || 'Erreur lors de la suppression de la catégorie');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Gestion des catégories</h3>
                    <p className="text-sm text-gray-500">
                        Créez, modifiez ou supprimez les catégories de produits utilisées dans la gestion des stocks.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={runRefresh}
                        disabled={isRefreshing || isSubmitting}
                    >
                        {isRefreshing ? <Spinner className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Actualiser
                    </Button>
                    {canManageCategories && (
                        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvelle catégorie
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                        {categories.length} catégorie(s)
                    </span>
                </div>

                {hasCategories ? (
                    <div className="divide-y divide-gray-100">
                        {categories.map((categorie) => (
                            <div key={categorie.id} className="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{categorie.nom}</p>
                                    {categorie.description && (
                                        <p className="text-sm text-gray-500 mt-1">{categorie.description}</p>
                                    )}
                                    {!categorie.description && (
                                        <p className="text-xs text-gray-400 mt-1">Aucune description</p>
                                    )}
                                </div>

                                {canManageCategories && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenEdit(categorie)}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => handleOpenDelete(categorie)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Supprimer
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                        Aucune catégorie définie pour le moment.
                        {canManageCategories && (
                            <>
                                {' '}
                                Cliquez sur « Nouvelle catégorie » pour en créer une.
                            </>
                        )}
                    </div>
                )}
            </div>

            <Dialog
                open={dialogMode !== null}
                onOpenChange={(open) => {
                    if (!open) closeDialog();
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === 'create' ? 'Créer une catégorie' : 'Modifier la catégorie'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="categorie-nom">Nom</Label>
                            <Input
                                id="categorie-nom"
                                value={formData.nom}
                                onChange={(event) => setFormData((prev) => ({ ...prev, nom: event.target.value }))}
                                placeholder="Catégorie (ex : Boissons, Accessoires...)"
                            />
                        </div>

                        <div>
                            <Label htmlFor="categorie-description">Description</Label>
                            <textarea
                                id="categorie-description"
                                value={formData.description}
                                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                                placeholder="Décrivez l’usage de cette catégorie"
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeDialog}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) closeDeleteDialog();
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer la catégorie</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600">
                        Êtes-vous sûr de vouloir supprimer la catégorie{' '}
                        <span className="font-medium text-gray-900">{deleteTarget?.nom}</span> ?
                        Cette action est irréversible.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeDeleteDialog}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

