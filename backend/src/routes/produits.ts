import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

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

export default router;
