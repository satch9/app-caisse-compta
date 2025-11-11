import express, { Response } from 'express';
import comptesService from '../services/comptesService';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { AuthRequest } from '../types';

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

/**
 * GET /api/comptes
 * Lister tous les comptes (admin/secrétaire)
 */
router.get(
  '/',
  authorize('membres.voir_liste'),
  async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      };

      const comptes = await comptesService.getAllComptes(filters);

      res.json({
        success: true,
        data: comptes,
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des comptes:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur serveur',
      });
    }
  }
);

/**
 * GET /api/comptes/me
 * Récupérer son propre compte (membre/non-membre)
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié',
      });
    }

    const compte = await comptesService.getCompteByUserId(userId);

    if (!compte) {
      return res.status(404).json({
        success: false,
        error: 'Compte non trouvé',
      });
    }

    res.json({
      success: true,
      data: compte,
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération du compte:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur',
    });
  }
});

/**
 * GET /api/comptes/me/historique
 * Récupérer l'historique de son propre compte
 */
router.get('/me/historique', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié',
      });
    }

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      dateDebut: req.query.date_debut as string | undefined,
      dateFin: req.query.date_fin as string | undefined,
    };

    const result = await comptesService.getHistoriqueCompte(userId, options);

    res.json({
      success: true,
      data: result.transactions,
      total: result.total,
      limit: options.limit,
      offset: options.offset,
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur',
    });
  }
});

/**
 * GET /api/comptes/me/statistiques
 * Récupérer les statistiques de son propre compte
 */
router.get('/me/statistiques', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié',
      });
    }

    const stats = await comptesService.getStatistiquesCompte(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur',
    });
  }
});

/**
 * GET /api/comptes/:userId
 * Récupérer un compte spécifique (admin/secrétaire)
 */
router.get(
  '/:userId',
  authorize('membres.voir_liste'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'ID utilisateur invalide',
        });
      }

      const compte = await comptesService.getCompteByUserId(userId);

      if (!compte) {
        return res.status(404).json({
          success: false,
          error: 'Compte non trouvé',
        });
      }

      res.json({
        success: true,
        data: compte,
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération du compte:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur serveur',
      });
    }
  }
);

/**
 * GET /api/comptes/:userId/historique
 * Récupérer l'historique d'un compte (admin/secrétaire)
 */
router.get(
  '/:userId/historique',
  authorize('membres.voir_liste'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'ID utilisateur invalide',
        });
      }

      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        dateDebut: req.query.date_debut as string | undefined,
        dateFin: req.query.date_fin as string | undefined,
      };

      const result = await comptesService.getHistoriqueCompte(userId, options);

      res.json({
        success: true,
        data: result.transactions,
        total: result.total,
        limit: options.limit,
        offset: options.offset,
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur serveur',
      });
    }
  }
);

/**
 * GET /api/comptes/:userId/statistiques
 * Récupérer les statistiques d'un compte (admin/secrétaire)
 */
router.get(
  '/:userId/statistiques',
  authorize('membres.voir_liste'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'ID utilisateur invalide',
        });
      }

      const stats = await comptesService.getStatistiquesCompte(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur serveur',
      });
    }
  }
);

/**
 * POST /api/comptes
 * Créer un compte pour un membre (adhérent)
 */
router.post(
  '/',
  authorize('membres.creer_compte'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { user_id, solde_initial } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'user_id est requis',
        });
      }

      const compteId = await comptesService.createCompte(
        user_id,
        solde_initial || 0
      );

      const compte = await comptesService.getCompteByUserId(user_id);

      res.status(201).json({
        success: true,
        data: compte,
      });
    } catch (error: any) {
      console.error('Erreur lors de la création du compte:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erreur serveur',
      });
    }
  }
);

/**
 * POST /api/comptes/:userId/ajuster-solde
 * Ajuster manuellement le solde d'un compte (admin uniquement)
 */
router.post(
  '/:userId/ajuster-solde',
  authorize('admin.modifier_config'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { montant, raison } = req.body;
      const adminId = req.user?.id;

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'ID utilisateur invalide',
        });
      }

      if (montant === undefined || !raison) {
        return res.status(400).json({
          success: false,
          error: 'montant et raison sont requis',
        });
      }

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Non authentifié',
        });
      }

      await comptesService.ajusterSolde({
        user_id: userId,
        montant: parseFloat(montant),
        raison,
        admin_id: adminId,
      });

      const compte = await comptesService.getCompteByUserId(userId);

      res.json({
        success: true,
        data: compte,
        message: 'Solde ajusté avec succès',
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'ajustement du solde:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur serveur',
      });
    }
  }
);

/**
 * DELETE /api/comptes/:userId
 * Supprimer un compte (admin uniquement)
 */
router.delete(
  '/:userId',
  authorize('membres.supprimer_compte'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'ID utilisateur invalide',
        });
      }

      await comptesService.deleteCompte(userId);

      res.json({
        success: true,
        message: 'Compte supprimé avec succès',
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression du compte:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erreur serveur',
      });
    }
  }
);

export default router;
