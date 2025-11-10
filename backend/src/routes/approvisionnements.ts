import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import approvisionnementService from '../services/approvisionnementService';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * GET /api/approvisionnements
 * Récupérer tous les approvisionnements avec filtres
 * Permission: stock.consulter
 */
router.get(
  '/',
  authorize('stock.consulter'),
  [
    query('type').optional().isIn(['achat_direct', 'commande_fournisseur']),
    query('date_debut').optional().isDate(),
    query('date_fin').optional().isDate(),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const filters: any = {};
      if (req.query.type) filters.type = req.query.type;
      if (req.query.date_debut) filters.date_debut = req.query.date_debut;
      if (req.query.date_fin) filters.date_fin = req.query.date_fin;
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);

      const result = await approvisionnementService.getAll(filters);
      res.json(result);
    } catch (error: any) {
      console.error('Erreur récupération approvisionnements:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/approvisionnements/:id
 * Récupérer un approvisionnement par ID
 * Permission: stock.consulter
 */
router.get(
  '/:id',
  authorize('stock.consulter'),
  [param('id').isInt().withMessage('ID invalide')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const id = parseInt(req.params.id);
      const appro = await approvisionnementService.getById(id);

      if (!appro) {
        return res.status(404).json({ error: 'Approvisionnement non trouvé' });
      }

      res.json(appro);
    } catch (error: any) {
      console.error('Erreur récupération approvisionnement:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * POST /api/approvisionnements
 * Créer un approvisionnement (achat direct ou commande fournisseur)
 * Permission: stock.enregistrer_achat (achat direct) ou stock.gerer_commandes (commande)
 */
router.post(
  '/',
  authenticate,
  [
    body('type').isIn(['achat_direct', 'commande_fournisseur']).withMessage('Type invalide'),
    body('montant_total').isFloat({ min: 0 }).withMessage('Montant total requis'),
    body('date_achat').isISO8601().withMessage('Date d\'achat invalide'),
    body('notes').optional().isString(),
    body('magasin').optional().isString(),
    body('fournisseur_nom').optional().isString(),
    body('fournisseur_contact').optional().isString(),
    body('date_livraison_prevue').optional().isDate(),
    body('lignes').isArray({ min: 1 }).withMessage('Au moins une ligne requise'),
    body('lignes.*.produit_id').isInt({ min: 1 }),
    body('lignes.*.quantite').isInt({ min: 1 }),
    body('lignes.*.prix_unitaire').isFloat({ min: 0 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Données invalides', details: errors.array() });
    }

    try {
      const userId = (req as any).user?.id;

      // Vérifier les permissions selon le type
      if (req.body.type === 'commande_fournisseur') {
        // Vérifier permission stock.gerer_commandes
        const hasPermission = await checkPermission(userId, 'stock.gerer_commandes');
        if (!hasPermission) {
          return res.status(403).json({ error: 'Permission refusée pour créer des commandes fournisseurs' });
        }
      } else {
        // Vérifier permission stock.enregistrer_achat
        const hasPermission = await checkPermission(userId, 'stock.enregistrer_achat');
        if (!hasPermission) {
          return res.status(403).json({ error: 'Permission refusée pour enregistrer des achats' });
        }
      }

      const approId = await approvisionnementService.createApprovisionnement({
        ...req.body,
        user_id: userId
      });

      const appro = await approvisionnementService.getById(approId);
      res.status(201).json({
        success: true,
        message: 'Approvisionnement créé avec succès',
        approvisionnement: appro
      });
    } catch (error: any) {
      console.error('Erreur création approvisionnement:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * PATCH /api/approvisionnements/:id/livrer
 * Marquer une commande fournisseur comme livrée
 * Permission: stock.gerer_commandes
 */
router.patch(
  '/:id/livrer',
  authorize('stock.gerer_commandes'),
  [param('id').isInt().withMessage('ID invalide')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const userId = (req as any).user?.id;
      const id = parseInt(req.params.id);

      await approvisionnementService.marquerCommeLivree(id, userId);

      const appro = await approvisionnementService.getById(id);
      res.json({
        success: true,
        message: 'Commande marquée comme livrée, stocks mis à jour',
        approvisionnement: appro
      });
    } catch (error: any) {
      console.error('Erreur livraison commande:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('réservée') || error.message.includes('déjà')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * DELETE /api/approvisionnements/:id
 * Supprimer un approvisionnement (commandes non livrées uniquement)
 * Permission: stock.gerer_commandes
 */
router.delete(
  '/:id',
  authorize('stock.gerer_commandes'),
  [param('id').isInt().withMessage('ID invalide')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const id = parseInt(req.params.id);
      await approvisionnementService.delete(id);

      res.json({
        success: true,
        message: 'Approvisionnement supprimé'
      });
    } catch (error: any) {
      console.error('Erreur suppression approvisionnement:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('Impossible')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

// Helper pour vérifier les permissions
async function checkPermission(userId: number, permissionCode: string): Promise<boolean> {
  // Import dynamique pour éviter la circularité
  const userService = require('../services/userService').default;
  const permissions = await userService.getUserPermissions(userId);
  return permissions.some((p: any) => p.code === permissionCode);
}

export default router;
