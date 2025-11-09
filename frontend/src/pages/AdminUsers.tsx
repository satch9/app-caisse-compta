import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { Link } from 'react-router-dom';
import { Home, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { adminService } from '../services/api';
import { Spinner } from '@/components/ui/spinner';

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  created_at: string;
  roles?: string[];
  permissions?: string[];
}

interface Role {
  id: number;
  code: string;
  nom: string;
  description: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

interface UpdateUserData {
  email?: string;
  nom?: string;
  prenom?: string;
  password?: string;
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { roles: currentRoles } = usePermissions();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState<{[key: string]: boolean}>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form état
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');

  useEffect(() => {
    chargerUsers();
    chargerRoles();
  }, []);

  const chargerUsers = async () => {
    try {
      const result = await adminService.getAllUsers();
      setUsers(result.users || []);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  const chargerRoles = async () => {
    try {
      const result = await adminService.getAllRoles();
      setRoles(result.roles || []);
    } catch (err) {
      console.error('Erreur chargement rôles:', err);
    }
  };

  const creerUtilisateur = async () => {
    if (!email || !password || !nom || !prenom) {
      toast.error('Tous les champs sont requis');
      return;
    }

    setLoading(true);
    try {
      await adminService.createUser({ email, password, nom, prenom });
      toast.success('Utilisateur créé avec succès');
      setShowCreateModal(false);
      resetForm();
      chargerUsers();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur création utilisateur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const modifierUtilisateur = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const data: UpdateUserData = {};
      if (email !== selectedUser.email) data.email = email;
      if (nom !== selectedUser.nom) data.nom = nom;
      if (prenom !== selectedUser.prenom) data.prenom = prenom;
      if (password) data.password = password;

      await adminService.updateUser(selectedUser.id, data);
      toast.success('Utilisateur modifié avec succès');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      chargerUsers();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur modification utilisateur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const supprimerUtilisateur = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    setLoading(true);
    try {
      await adminService.deleteUser(userId);
      toast.success('Utilisateur supprimé avec succès');
      chargerUsers();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur suppression utilisateur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: number, roleCode: string, hasRole: boolean) => {
    const key = `${userId}-${roleCode}`;
    setLoadingRoles(prev => ({ ...prev, [key]: true }));
    try {
      if (hasRole) {
        await adminService.removeRole(userId, roleCode);
        // Mettre à jour selectedUser immédiatement
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({
            ...selectedUser,
            roles: selectedUser.roles?.filter(r => r !== roleCode) || []
          });
        }
        toast.success('Rôle retiré');
      } else {
        await adminService.assignRole(userId, roleCode);
        // Mettre à jour selectedUser immédiatement
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({
            ...selectedUser,
            roles: [...(selectedUser.roles || []), roleCode]
          });
        }
        toast.success('Rôle attribué');
      }

      // Recharger la liste des utilisateurs en arrière-plan
      chargerUsers();
    } catch (err) {
      const error = err as ApiError;
      toast.error(error.response?.data?.error || 'Erreur');
      // En cas d'erreur, recharger selectedUser pour avoir l'état correct
      if (selectedUser) {
        const result = await adminService.getAllUsers();
        const updatedUser = result.users?.find((u: User) => u.id === userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } finally {
      setLoadingRoles(prev => ({ ...prev, [key]: false }));
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setNom('');
    setPrenom('');
  };

  const ouvrirModalEdit = (user: User) => {
    setSelectedUser(user);
    setEmail(user.email);
    setNom(user.nom);
    setPrenom(user.prenom);
    setPassword('');
    setShowEditModal(true);
  };

  const ouvrirModalRoles = (user: User) => {
    setSelectedUser(user);
    setShowRolesModal(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b-2 border-blue-500">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 hover:opacity-70 transition">
              <Home className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-lg">Retour</span>
            </Link>
            <div className="h-8 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-blue-600">GESTION UTILISATEURS</h1>
          </div>

          <div className="text-right">
            <div className="font-semibold">{currentUser?.prenom} {currentUser?.nom}</div>
            <div className="text-sm text-gray-600">{currentRoles.join(', ')}</div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Liste des utilisateurs ({users.length})</h2>
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{user.prenom} {user.nom}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role} variant="secondary">{role}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Aucun rôle</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => ouvrirModalRoles(user)} size="sm" variant="outline">
                          <Shield className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => ouvrirModalEdit(user)} size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => supprimerUtilisateur(user.id)}
                          size="sm"
                          variant="destructive"
                          disabled={currentUser?.id === user.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Créer */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white sm:max-w-[500px]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Créer un utilisateur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Mot de passe *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div>
              <Label>Prénom *</Label>
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button onClick={() => { setShowCreateModal(false); resetForm(); }} variant="outline">
              Annuler
            </Button>
            <Button onClick={creerUtilisateur} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Création en cours...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-white sm:max-w-[500px]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Modifier l'utilisateur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Nouveau mot de passe (optionnel)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" />
            </div>
            <div>
              <Label>Nom</Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div>
              <Label>Prénom</Label>
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }} variant="outline">
              Annuler
            </Button>
            <Button onClick={modifierUtilisateur} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Enregistrement en cours...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Rôles */}
      <Dialog open={showRolesModal} onOpenChange={setShowRolesModal}>
        <DialogContent className="bg-white sm:max-w-[600px]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">
              Gérer les rôles - {selectedUser?.prenom} {selectedUser?.nom}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {roles.map((role) => {
              const hasRole = selectedUser?.roles?.includes(role.code) || false;
              const key = `${selectedUser?.id}-${role.code}`;
              const isLoadingRole = loadingRoles[key] || false;
              return (
                <div key={role.code} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-semibold">{role.nom}</div>
                    <div className="text-sm text-gray-600">{role.description}</div>
                  </div>
                  <Button
                    onClick={() => selectedUser && toggleRole(selectedUser.id, role.code, hasRole)}
                    size="sm"
                    variant={hasRole ? 'destructive' : 'default'}
                    disabled={isLoadingRole}
                  >
                    {isLoadingRole ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        {hasRole ? 'Retrait...' : 'Attribution...'}
                      </>
                    ) : (
                      hasRole ? 'Retirer' : 'Attribuer'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          <DialogFooter className="mt-6">
            <Button onClick={() => { setShowRolesModal(false); setSelectedUser(null); }}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
