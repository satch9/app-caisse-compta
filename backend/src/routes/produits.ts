import { Router, Request, Response } from 'express';
import { query, body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import produitService from '../services/produitService';

const router = Router();

/**
 * GET /api/produits
 * Récupérer la liste des produits avec stock
 * Permissions: stock.consulter
 */
router.get(
  '/',
  authenticate,
  authorize('stock.consulter'),
  [
    query('categorie_id').optional().isInt({ min: 1 }),
    query('actifs_seulement').optional().isBoolean(),
    query('recherche').optional().isString().trim()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let whereConditions: string[] = [];
      let params: any[] = [];

      // Filtrer par défaut sur les produits actifs
      const actifsSeul = req.query.actifs_seulement !== 'false';
      if (actifsSeul) {
        whereConditions.push('p.is_active = TRUE');
      }

      if (req.query.categorie_id) {
        whereConditions.push('p.categorie_id = ?');
        params.push(parseInt(req.query.categorie_id as string));
      }

      if (req.query.recherche) {
        whereConditions.push('(p.nom LIKE ? OR p.description LIKE ?)');
        const searchTerm = `%${req.query.recherche}%`;
        params.push(searchTerm, searchTerm);
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      const [rows] = await pool.query<any[]>(
        `SELECT p.*,
                c.nom as categorie_nom,
                CASE
                  WHEN p.stock_actuel <= p.stock_minimum THEN 'critique'
                  WHEN p.stock_actuel <= (p.stock_minimum * 1.5) THEN 'alerte'
                  ELSE 'normal'
                END as niveau_stock
         FROM produits p
         LEFT JOIN categories_produits c ON p.categorie_id = c.id
         ${whereClause}
         ORDER BY p.nom ASC`,
        params
      );

      res.json({
        success: true,
        produits: rows,
        total: rows.length
      });

    } catch (error: any) {
      console.error('Erreur récupération produits:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération des produits'
      });
    }
  }
);

/**
 * GET /api/produits/:id
 * Récupérer un produit par ID
 * Permissions: stock.consulter
 */
router.get(
  '/:id',
  authenticate,
  authorize('stock.consulter'),
  async (req: Request, res: Response) => {
    try {
      const produitId = parseInt(req.params.id);

      if (isNaN(produitId)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const [rows] = await pool.query<any[]>(
        `SELECT p.*,
                c.nom as categorie_nom,
                CASE
                  WHEN p.stock_actuel <= p.stock_minimum THEN 'critique'
                  WHEN p.stock_actuel <= (p.stock_minimum * 1.5) THEN 'alerte'
                  ELSE 'normal'
                END as niveau_stock
         FROM produits p
         LEFT JOIN categories_produits c ON p.categorie_id = c.id
         WHERE p.id = ?`,
        [produitId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }

      res.json({
        success: true,
        produit: rows[0]
      });

    } catch (error: any) {
      console.error('Erreur récupération produit:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération du produit'
      });
    }
  }
);

/**
 * GET /api/produits/alertes/stock
 * Récupérer les produits en alerte de stock
 * Permissions: stock.consulter
 */
router.get(
  '/alertes/stock',
  authenticate,
  authorize('stock.consulter'),
  async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.query<any[]>(
        `SELECT p.*,
                c.nom as categorie_nom,
                CASE
                  WHEN p.stock_actuel <= p.stock_minimum THEN 'critique'
                  WHEN p.stock_actuel <= (p.stock_minimum * 1.5) THEN 'alerte'
                  ELSE 'normal'
                END as niveau_stock
         FROM produits p
         LEFT JOIN categories_produits c ON p.categorie_id = c.id
         WHERE p.is_active = TRUE
           AND p.stock_actuel <= (p.stock_minimum * 1.5)
         ORDER BY
           CASE
             WHEN p.stock_actuel <= p.stock_minimum THEN 1
             ELSE 2
           END,
           p.stock_actuel ASC`
      );

      res.json({
        success: true,
        produits: rows,
        total: rows.length
      });

    } catch (error: any) {
      console.error('Erreur récupération alertes stock:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération des alertes'
      });
    }
  }
);

/**
 * POST /api/produits
 * Créer un nouveau produit
 * Permissions: stock.ajouter_produit
 */
router.post(
  '/',
  authenticate,
  authorize('stock.ajouter_produit'),
  [
    body('nom').isString().trim().notEmpty().withMessage('Le nom est requis'),
    body('description').optional().isString().trim(),
    body('categorie_id').isInt({ min: 1 }).withMessage('La catégorie est requise'),
    body('prix_achat').isFloat({ min: 0 }).withMessage('Le prix d\'achat doit être positif'),
    body('prix_vente').isFloat({ min: 0 }).withMessage('Le prix de vente doit être positif'),
    body('stock_actuel').isInt({ min: 0 }).withMessage('Le stock actuel doit être positif'),
    body('stock_minimum').isInt({ min: 0 }).withMessage('Le stock minimum doit être positif'),
    body('is_active').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const produitId = await produitService.createProduit({
        nom: req.body.nom,
        description: req.body.description,
        categorie_id: parseInt(req.body.categorie_id),
        prix_achat: parseFloat(req.body.prix_achat),
        prix_vente: parseFloat(req.body.prix_vente),
        stock_actuel: parseInt(req.body.stock_actuel),
        stock_minimum: parseInt(req.body.stock_minimum),
        is_active: req.body.is_active
      });

      const produit = await produitService.getProduitById(produitId);

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        produit
      });

    } catch (error: any) {
      console.error('Erreur création produit:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la création du produit'
      });
    }
  }
);

/**
 * PUT /api/produits/:id
 * Mettre à jour un produit
 * Permissions: stock.modifier
 */
router.put(
  '/:id',
  authenticate,
  authorize('stock.modifier'),
  [
    body('nom').optional().isString().trim().notEmpty(),
    body('description').optional().isString().trim(),
    body('categorie_id').optional().isInt({ min: 1 }),
    body('prix_achat').optional().isFloat({ min: 0 }),
    body('prix_vente').optional().isFloat({ min: 0 }),
    body('stock_actuel').optional().isInt({ min: 0 }),
    body('stock_minimum').optional().isInt({ min: 0 }),
    body('is_active').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const produitId = parseInt(req.params.id);

      if (isNaN(produitId)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const updateData: any = {};

      if (req.body.nom !== undefined) updateData.nom = req.body.nom;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.categorie_id !== undefined) updateData.categorie_id = parseInt(req.body.categorie_id);
      if (req.body.prix_achat !== undefined) updateData.prix_achat = parseFloat(req.body.prix_achat);
      if (req.body.prix_vente !== undefined) updateData.prix_vente = parseFloat(req.body.prix_vente);
      if (req.body.stock_actuel !== undefined) updateData.stock_actuel = parseInt(req.body.stock_actuel);
      if (req.body.stock_minimum !== undefined) updateData.stock_minimum = parseInt(req.body.stock_minimum);
      if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;

      const userId = (req as any).user?.userId;
      await produitService.updateProduit(produitId, updateData, userId);

      const produit = await produitService.getProduitById(produitId);

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        produit
      });

    } catch (error: any) {
      console.error('Erreur mise à jour produit:', error);

      if (error.message === 'Produit non trouvé') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({
        error: error.message || 'Erreur lors de la mise à jour du produit'
      });
    }
  }
);

/**
 * DELETE /api/produits/:id
 * Supprimer un produit (soft delete si transactions existent)
 * Permissions: stock.supprimer_produit
 */
router.delete(
  '/:id',
  authenticate,
  authorize('stock.supprimer_produit'),
  async (req: Request, res: Response) => {
    try {
      const produitId = parseInt(req.params.id);

      if (isNaN(produitId)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      await produitService.deleteProduit(produitId);

      res.json({
        success: true,
        message: 'Produit supprimé avec succès'
      });

    } catch (error: any) {
      console.error('Erreur suppression produit:', error);

      if (error.message === 'Produit non trouvé') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({
        error: error.message || 'Erreur lors de la suppression du produit'
      });
    }
  }
);

export default router;
