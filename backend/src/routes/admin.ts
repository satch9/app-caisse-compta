import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import permissionService from '../services/permissionService';
import { AuthRequest } from '../types';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * GET /api/admin/users
 * Liste tous les utilisateurs (nécessite admin.gerer_utilisateurs)
 */
router.get('/users', authorize('admin.gerer_utilisateurs'), async (req: AuthRequest, res) => {
  try {
    // TODO: Implémenter la récupération de la liste des utilisateurs
    res.json({ message: 'Liste des utilisateurs' });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/roles
 * Liste tous les rôles disponibles
 */
router.get('/roles', authorize('admin.gerer_roles'), async (req: AuthRequest, res) => {
  try {
    const roles = await permissionService.getAllRoles();
    res.json({ roles });
  } catch (error) {
    console.error('Erreur récupération rôles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/permissions
 * Liste toutes les permissions disponibles
 */
router.get('/permissions', authorize('admin.gerer_roles'), async (req: AuthRequest, res) => {
  try {
    const permissions = await permissionService.getAllPermissions();
    res.json({ permissions });
  } catch (error) {
    console.error('Erreur récupération permissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/users/:userId/roles
 * Met à jour les rôles d'un utilisateur
 */
router.put('/users/:userId/roles', authorize('admin.gerer_utilisateurs'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ error: 'Les rôles doivent être un tableau' });
    }

    // TODO: Implémenter la mise à jour des rôles
    res.json({ message: 'Rôles mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour rôles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/roles/:roleCode
 * Assigne un rôle à un utilisateur
 */
router.post('/users/:userId/roles/:roleCode', authorize('admin.gerer_utilisateurs'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { roleCode } = req.params;

    await permissionService.assignRole(userId, roleCode, req.user?.id);

    res.json({ message: 'Rôle assigné avec succès' });
  } catch (error) {
    console.error('Erreur assignation rôle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/users/:userId/roles/:roleCode
 * Retire un rôle à un utilisateur
 */
router.delete('/users/:userId/roles/:roleCode', authorize('admin.gerer_utilisateurs'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { roleCode } = req.params;

    await permissionService.removeRole(userId, roleCode);

    res.json({ message: 'Rôle retiré avec succès' });
  } catch (error) {
    console.error('Erreur retrait rôle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/permissions/:permissionCode
 * Accorde une permission additionnelle à un utilisateur
 */
router.post('/users/:userId/permissions/:permissionCode', authorize('admin.gerer_utilisateurs'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { permissionCode } = req.params;

    await permissionService.grantPermission(userId, permissionCode, req.user?.id);

    res.json({ message: 'Permission accordée avec succès' });
  } catch (error) {
    console.error('Erreur accordage permission:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/users/:userId/permissions/:permissionCode
 * Révoque une permission à un utilisateur
 */
router.delete('/users/:userId/permissions/:permissionCode', authorize('admin.gerer_utilisateurs'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { permissionCode } = req.params;

    await permissionService.revokePermission(userId, permissionCode);

    res.json({ message: 'Permission révoquée avec succès' });
  } catch (error) {
    console.error('Erreur révocation permission:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
