import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * GET /api/categories
 * Récupérer la liste des catégories de produits
 * Permissions: stock.consulter
 */
router.get(
  '/',
  authenticate,
  authorize('stock.consulter'),
  async (_req: Request, res: Response) => {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, nom, description, created_at
         FROM categories_produits
         ORDER BY nom ASC`
      );

      res.json({
        success: true,
        categories: rows,
        total: rows.length
      });
    } catch (error: any) {
      console.error('Erreur récupération catégories:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération des catégories'
      });
    }
  }
);

/**
 * POST /api/categories
 * Créer une nouvelle catégorie de produit
 * Permissions: stock.gerer_categories
 */
router.post(
  '/',
  authenticate,
  authorize('stock.gerer_categories'),
  [
    body('nom')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Le nom de la catégorie est requis'),
    body('description').optional().isString().trim()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const nom = req.body.nom.trim();
      const description = req.body.description ? req.body.description.trim() : null;

      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM categories_produits WHERE nom = ?',
        [nom]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          error: 'Une catégorie avec ce nom existe déjà'
        });
      }

      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO categories_produits (nom, description) VALUES (?, ?)',
        [nom, description]
      );

      const newCategoryId = result.insertId;

      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, nom, description, created_at
         FROM categories_produits
         WHERE id = ?`,
        [newCategoryId]
      );

      res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        categorie: rows[0]
      });
    } catch (error: any) {
      console.error('Erreur création catégorie:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la création de la catégorie'
      });
    }
  }
);

/**
 * PUT /api/categories/:id
 * Mettre à jour une catégorie de produit
 * Permissions: stock.gerer_categories
 */
router.put(
  '/:id',
  authenticate,
  authorize('stock.gerer_categories'),
  [
    body('nom').optional().isString().trim().notEmpty(),
    body('description').optional().isString().trim()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const categorieId = parseInt(req.params.id, 10);

      if (isNaN(categorieId)) {
        return res.status(400).json({ error: 'ID de catégorie invalide' });
      }

      const [categories] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM categories_produits WHERE id = ?`,
        [categorieId]
      );

      if (categories.length === 0) {
        return res.status(404).json({ error: 'Catégorie non trouvée' });
      }

      const fields: string[] = [];
      const params: any[] = [];

      if (req.body.nom !== undefined) {
        const nom = req.body.nom.trim();
        const [existing] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM categories_produits WHERE nom = ? AND id <> ?`,
          [nom, categorieId]
        );

        if (existing.length > 0) {
          return res.status(400).json({
            error: 'Une autre catégorie possède déjà ce nom'
          });
        }

        fields.push('nom = ?');
        params.push(nom);
      }

      if (req.body.description !== undefined) {
        const description = req.body.description.trim();
        fields.push('description = ?');
        params.push(description || null);
      }

      if (fields.length === 0) {
        return res.status(400).json({
          error: 'Aucune donnée à mettre à jour'
        });
      }

      params.push(categorieId);

      await pool.query<ResultSetHeader>(
        `UPDATE categories_produits
         SET ${fields.join(', ')}
         WHERE id = ?`,
        params
      );

      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, nom, description, created_at
         FROM categories_produits
         WHERE id = ?`,
        [categorieId]
      );

      res.json({
        success: true,
        message: 'Catégorie mise à jour avec succès',
        categorie: rows[0]
      });
    } catch (error: any) {
      console.error('Erreur mise à jour catégorie:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la mise à jour de la catégorie'
      });
    }
  }
);

/**
 * DELETE /api/categories/:id
 * Supprimer une catégorie de produit
 * Permissions: stock.gerer_categories
 */
router.delete(
  '/:id',
  authenticate,
  authorize('stock.gerer_categories'),
  async (req: Request, res: Response) => {
    try {
      const categorieId = parseInt(req.params.id, 10);

      if (isNaN(categorieId)) {
        return res.status(400).json({ error: 'ID de catégorie invalide' });
      }

      const [categories] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM categories_produits WHERE id = ?`,
        [categorieId]
      );

      if (categories.length === 0) {
        return res.status(404).json({ error: 'Catégorie non trouvée' });
      }

      const [usage] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM produits WHERE categorie_id = ?`,
        [categorieId]
      );

      if (usage[0].total > 0) {
        return res.status(400).json({
          error: 'Impossible de supprimer une catégorie utilisée par des produits'
        });
      }

      await pool.query<ResultSetHeader>(
        `DELETE FROM categories_produits WHERE id = ?`,
        [categorieId]
      );

      res.json({
        success: true,
        message: 'Catégorie supprimée avec succès'
      });
    } catch (error: any) {
      console.error('Erreur suppression catégorie:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la suppression de la catégorie'
      });
    }
  }
);

export default router;
