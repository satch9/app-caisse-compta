import express from 'express';
import authService from '../services/authService';
import permissionService from '../services/permissionService';
import logService from '../services/logService';
import { authenticate } from '../middleware/authenticate';
import { AuthRequest } from '../types';

const router = express.Router();

/**
 * POST /api/auth/register
 * Créer un nouvel utilisateur
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, nom, prenom } = req.body;

    if (!email || !password || !nom || !prenom) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const userId = await authService.createUser(email, password, nom, prenom);

    // Log de l'inscription
    await logService.createLog({
      user_id: undefined, // Inscription auto, pas d'utilisateur connecté
      action: 'register',
      entity_type: 'user',
      entity_id: userId,
      details: `Nouvel utilisateur inscrit: ${email}`,
      ip_address: req.ip
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      userId
    });
  } catch (error: any) {
    console.error('Erreur création utilisateur:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/login
 * Authentifier un utilisateur
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const result = await authService.login(email, password);

    if (!result) {
      // Log de tentative de connexion échouée
      await logService.createLog({
        user_id: undefined,
        action: 'login_failed',
        entity_type: 'user',
        entity_id: undefined,
        details: `Tentative de connexion échouée pour: ${email}`,
        ip_address: req.ip
      });
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Log de connexion réussie
    await logService.createLog({
      user_id: result.user.id,
      action: 'login',
      entity_type: 'user',
      entity_id: result.user.id,
      details: `Connexion réussie pour: ${email}`,
      ip_address: req.ip
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/auth/me
 * Récupérer les informations de l'utilisateur connecté
 */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/auth/me/permissions
 * Récupérer les permissions de l'utilisateur connecté
 */
router.get('/me/permissions', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    console.log('📋 Récupération permissions pour user ID:', req.user.id);

    const permissions = await permissionService.getUserPermissions(req.user.id);
    const roles = await permissionService.getUserRoles(req.user.id);

    console.log('✅ Permissions trouvées:', permissions.length);
    console.log('✅ Rôles trouvés:', roles.map(r => r.code));

    res.json({
      permissions,
      roles: roles.map(r => r.code)
    });
  } catch (error) {
    console.error('❌ Erreur récupération permissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
