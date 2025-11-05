import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import transactionService from '../services/transactionService';
import { authenticate } from '../middleware/authenticate';
import { authorize, authorizeAny } from '../middleware/authorize';

const router = Router();

/**
 * POST /api/transactions
 * Créer une nouvelle transaction
 * Permissions: caisse.encaisser_*
 */
router.post(
  '/',
  authenticate,
  authorizeAny('caisse.encaisser_especes', 'caisse.encaisser_cheque', 'caisse.encaisser_cb'),
  [
    body('user_id').isInt({ min: 1 }).withMessage('user_id doit être un entier positif'),
    body('type_paiement').isIn(['especes', 'cheque', 'cb']).withMessage('type_paiement invalide'),
    body('lignes').isArray({ min: 1 }).withMessage('Au moins une ligne requise'),
    body('lignes.*.produit_id').isInt({ min: 1 }).withMessage('produit_id invalide'),
    body('lignes.*.quantite').isInt({ min: 1 }).withMessage('quantite doit être >= 1'),
    body('lignes.*.prix_unitaire').isFloat({ min: 0 }).withMessage('prix_unitaire invalide'),
    body('reference_cheque').optional().isString().trim(),
    body('reference_cb').optional().isString().trim()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user_id, type_paiement, lignes, reference_cheque, reference_cb } = req.body;
      const caissier_id = req.user!.id;

      // Vérifier la permission spécifique selon le type de paiement
      const permissionRequise = `caisse.encaisser_${type_paiement === 'especes' ? 'especes' : type_paiement === 'cheque' ? 'cheque' : 'cb'}`;
      if (!req.userPermissions?.includes(permissionRequise)) {
        return res.status(403).json({
          error: `Permission manquante: ${permissionRequise}`
        });
      }

      // Validation conditionnelle des références
      if (type_paiement === 'cheque' && !reference_cheque) {
        return res.status(400).json({
          error: 'Le numéro de chèque est requis pour un paiement par chèque'
        });
      }

      if (type_paiement === 'cb' && !reference_cb) {
        return res.status(400).json({
          error: 'La référence CB est requise pour un paiement par carte bancaire'
        });
      }

      const transaction = await transactionService.createTransaction({
        user_id,
        caissier_id,
        type_paiement,
        lignes,
        reference_cheque,
        reference_cb
      });

      res.status(201).json({
        success: true,
        transaction
      });

    } catch (error: any) {
      console.error('Erreur création transaction:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la création de la transaction'
      });
    }
  }
);

/**
 * GET /api/transactions
 * Récupérer les transactions avec filtres
 * Permissions: caisse.voir_historique ou caisse.voir_historique_global
 */
router.get(
  '/',
  authenticate,
  authorizeAny('caisse.voir_historique', 'caisse.voir_historique_global'),
  [
    query('caissier_id').optional().isInt({ min: 1 }),
    query('user_id').optional().isInt({ min: 1 }),
    query('type_paiement').optional().isIn(['especes', 'cheque', 'cb']),
    query('statut').optional().isIn(['validee', 'annulee']),
    query('date_debut').optional().isISO8601(),
    query('date_fin').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters: any = {
        type_paiement: req.query.type_paiement as string,
        statut: req.query.statut as string,
        date_debut: req.query.date_debut as string,
        date_fin: req.query.date_fin as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      // Si l'utilisateur n'a pas la permission globale, on filtre sur ses propres transactions
      if (!req.userPermissions?.includes('caisse.voir_historique_global')) {
        filters.caissier_id = req.user!.id;
      } else {
        // Sinon, on peut filtrer sur un caissier spécifique si demandé
        if (req.query.caissier_id) {
          filters.caissier_id = parseInt(req.query.caissier_id as string);
        }
        if (req.query.user_id) {
          filters.user_id = parseInt(req.query.user_id as string);
        }
      }

      const result = await transactionService.getTransactions(filters);

      res.json({
        success: true,
        transactions: result.transactions,
        total: result.total,
        limit: filters.limit,
        offset: filters.offset
      });

    } catch (error: any) {
      console.error('Erreur récupération transactions:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération des transactions'
      });
    }
  }
);

/**
 * GET /api/transactions/:id
 * Récupérer une transaction par ID
 * Permissions: caisse.voir_historique
 */
router.get(
  '/:id',
  authenticate,
  authorizeAny('caisse.voir_historique', 'caisse.voir_historique_global'),
  async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);

      if (isNaN(transactionId)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const transaction = await transactionService.getTransactionById(transactionId);

      // Vérifier que l'utilisateur peut voir cette transaction
      if (
        !req.userPermissions?.includes('caisse.voir_historique_global') &&
        transaction.caissier_id !== req.user!.id
      ) {
        return res.status(403).json({
          error: 'Vous ne pouvez consulter que vos propres transactions'
        });
      }

      res.json({
        success: true,
        transaction
      });

    } catch (error: any) {
      console.error('Erreur récupération transaction:', error);
      res.status(404).json({
        error: error.message || 'Transaction non trouvée'
      });
    }
  }
);

/**
 * DELETE /api/transactions/:id
 * Annuler une transaction
 * Permissions: caisse.annuler_vente
 */
router.delete(
  '/:id',
  authenticate,
  authorize('caisse.annuler_vente'),
  [
    body('raison').isString().trim().isLength({ min: 5 }).withMessage('Raison d\'annulation requise (min 5 caractères)')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const transactionId = parseInt(req.params.id);

      if (isNaN(transactionId)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const { raison } = req.body;

      await transactionService.cancelTransaction(transactionId, req.user!.id, raison);

      res.json({
        success: true,
        message: 'Transaction annulée avec succès'
      });

    } catch (error: any) {
      console.error('Erreur annulation transaction:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de l\'annulation de la transaction'
      });
    }
  }
);

export default router;
