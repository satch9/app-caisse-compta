import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import mouvementStockService, { TypeMouvement } from '../services/mouvementStockService';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * GET /api/mouvements-stock
 * Récupérer les mouvements de stock avec filtres
 * Permission: stock.consulter
 */
router.get(
  '/',
  authorize('stock.consulter'),
  [
    query('produit_id').optional().isInt().withMessage('produit_id doit être un entier'),
    query('type_mouvement').optional().isIn(['entree', 'sortie', 'ajustement', 'inventaire', 'perte', 'transfert']),
    query('date_debut').optional().isDate().withMessage('date_debut doit être une date valide (YYYY-MM-DD)'),
    query('date_fin').optional().isDate().withMessage('date_fin doit être une date valide (YYYY-MM-DD)'),
    query('user_id').optional().isInt().withMessage('user_id doit être un entier'),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit doit être entre 1 et 200'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset doit être >= 0')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const filters = {
        produit_id: req.query.produit_id ? parseInt(req.query.produit_id as string) : undefined,
        type_mouvement: req.query.type_mouvement as TypeMouvement | undefined,
        date_debut: req.query.date_debut as string | undefined,
        date_fin: req.query.date_fin as string | undefined,
        user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await mouvementStockService.getMouvements(filters);
      res.json(result);
    } catch (error: any) {
      console.error('Erreur récupération mouvements:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/mouvements-stock/produit/:id
 * Récupérer les mouvements d'un produit spécifique
 * Permission: stock.consulter
 */
router.get(
  '/produit/:id',
  authorize('stock.consulter'),
  [
    param('id').isInt().withMessage('ID produit invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit doit être entre 1 et 100')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const produitId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const mouvements = await mouvementStockService.getMouvementsByProduit(produitId, limit);
      res.json(mouvements);
    } catch (error: any) {
      console.error('Erreur récupération mouvements produit:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/mouvements-stock/statistiques/:produitId
 * Récupérer les statistiques de mouvements pour un produit
 * Permission: stock.consulter
 */
router.get(
  '/statistiques/:produitId',
  authorize('stock.consulter'),
  [
    param('produitId').isInt().withMessage('ID produit invalide'),
    query('date_debut').optional().isDate(),
    query('date_fin').optional().isDate()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const produitId = parseInt(req.params.produitId);
      const dateDebut = req.query.date_debut as string | undefined;
      const dateFin = req.query.date_fin as string | undefined;

      const stats = await mouvementStockService.getStatistiquesProduit(produitId, dateDebut, dateFin);
      res.json(stats);
    } catch (error: any) {
      console.error('Erreur récupération statistiques:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/mouvements-stock/:id
 * Récupérer un mouvement spécifique
 * Permission: stock.consulter
 */
router.get(
  '/:id',
  authorize('stock.consulter'),
  [param('id').isInt().withMessage('ID mouvement invalide')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const id = parseInt(req.params.id);
      const mouvement = await mouvementStockService.getMouvementById(id);
      res.json(mouvement);
    } catch (error: any) {
      console.error('Erreur récupération mouvement:', error);
      if (error.message === 'Mouvement introuvable') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * POST /api/mouvements-stock
 * Créer un mouvement de stock (ajustement manuel, perte, etc.)
 * Permission: stock.modifier (pour ajustements/pertes) ou stock.faire_inventaire (pour inventaire)
 *
 * Note: Les mouvements liés aux ventes (sortie via caisse) sont créés automatiquement
 * par le système de transactions, pas via cette route.
 */
router.post(
  '/',
  authorize('stock.modifier'), // Pour l'instant, stock.modifier permet tous les ajustements manuels
  [
    body('produit_id').isInt({ min: 1 }).withMessage('produit_id requis et doit être un entier positif'),
    body('type_mouvement').isIn(['entree', 'ajustement', 'inventaire', 'perte']).withMessage('type_mouvement invalide (entree, ajustement, inventaire, perte)'),
    body('quantite').isInt().withMessage('quantite doit être un entier'),
    body('motif').optional().isString().isLength({ max: 500 }).withMessage('motif max 500 caractères'),
    body('commentaire').optional().isString().withMessage('commentaire doit être une chaîne')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Données invalides', details: errors.array() });
    }

    try {
      const userId = (req as any).user?.userId;

      // Validation: pour les inventaires, vérifier la permission spécifique
      if (req.body.type_mouvement === 'inventaire') {
        // TODO: Vérifier la permission stock.faire_inventaire
        // Pour l'instant, stock.modifier suffit
      }

      const mouvementId = await mouvementStockService.createMouvement({
        produit_id: req.body.produit_id,
        type_mouvement: req.body.type_mouvement,
        quantite: req.body.quantite,
        motif: req.body.motif,
        commentaire: req.body.commentaire,
        user_id: userId
      });

      const mouvement = await mouvementStockService.getMouvementById(mouvementId);
      res.status(201).json(mouvement);
    } catch (error: any) {
      console.error('Erreur création mouvement:', error);

      if (error.message.includes('Stock insuffisant')) {
        return res.status(400).json({ error: error.message });
      }

      if (error.message === 'Produit introuvable') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

export default router;
