import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import permissionService from '../services/permissionService';
import userService from '../services/userService';
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
    const users = await userService.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/users/by-role/:roleCode
 * Récupère les utilisateurs ayant un rôle spécifique
 */
router.get('/users/by-role/:roleCode', authenticate, async (req: AuthRequest, res) => {
  try {
    const roleCode = req.params.roleCode.toUpperCase();
    const users = await userService.getUsersByRole(roleCode);
    res.json({ users });
  } catch (error) {
    console.error('Erreur récupération utilisateurs par rôle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/users/:id
 * Récupère un utilisateur par ID
 */
router.get('/users/:id', authorize('admin.gerer_utilisateurs'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users
 * Créer un nouvel utilisateur
 */
router.post(
  '/users',
  authorize('admin.gerer_utilisateurs'),
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('prenom').notEmpty().withMessage('Le prénom est requis')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, nom, prenom } = req.body;
      const userId = await userService.createUser({ email, password, nom, prenom });

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        userId
      });
    } catch (error: any) {
      console.error('Erreur création utilisateur:', error);
      res.status(400).json({ error: error.message || 'Erreur lors de la création' });
    }
  }
);

/**
 * PUT /api/admin/users/:id
 * Mettre à jour un utilisateur
 */
router.put(
  '/users/:id',
  authorize('admin.gerer_utilisateurs'),
  [
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('password').optional().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('nom').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
    body('prenom').optional().notEmpty().withMessage('Le prénom ne peut pas être vide')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = parseInt(req.params.id);
      const { email, password, nom, prenom } = req.body;

      await userService.updateUser(userId, { email, password, nom, prenom });

      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès'
      });
    } catch (error: any) {
      console.error('Erreur mise à jour utilisateur:', error);
      res.status(400).json({ error: error.message || 'Erreur lors de la mise à jour' });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Supprimer un utilisateur
 */
router.delete('/users/:id', authorize('admin.gerer_utilisateurs'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Empêcher de supprimer son propre compte
    if (req.user && req.user.id === userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await userService.deleteUser(userId);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error: any) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la suppression' });
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
