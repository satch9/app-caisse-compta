import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import comptaService from '../services/comptaService';
import exportService from '../services/exportService';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * GET /api/compta/journal-ventes
 * Récupérer le journal des ventes sur une période
 * Permission: compta.consulter_tout
 */
router.get(
  '/journal-ventes',
  authorize('compta.consulter_tout'),
  [
    query('date_debut').isDate().withMessage('Date de début invalide'),
    query('date_fin').isDate().withMessage('Date de fin invalide'),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit doit être entre 1 et 200'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset doit être >= 0')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const { date_debut, date_fin, limit, offset } = req.query;
      const result = await comptaService.getJournalVentes(
        date_debut as string,
        date_fin as string,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(result);
    } catch (error: any) {
      console.error('Erreur récupération journal ventes:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/compta/rapport-sessions
 * Récupérer le rapport des sessions de caisse
 * Permission: compta.consulter_tout
 */
router.get(
  '/rapport-sessions',
  authorize('compta.consulter_tout'),
  [
    query('date_debut').isDate().withMessage('Date de début invalide'),
    query('date_fin').isDate().withMessage('Date de fin invalide')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const { date_debut, date_fin } = req.query;
      const result = await comptaService.getRapportSessions(
        date_debut as string,
        date_fin as string
      );
      res.json(result);
    } catch (error: any) {
      console.error('Erreur récupération rapport sessions:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/compta/chiffre-affaires
 * Récupérer le chiffre d'affaires agrégé
 * Permission: compta.consulter_tout
 */
router.get(
  '/chiffre-affaires',
  authorize('compta.consulter_tout'),
  [
    query('date_debut').isDate().withMessage('Date de début invalide'),
    query('date_fin').isDate().withMessage('Date de fin invalide'),
    query('groupBy').optional().isIn(['jour', 'mois']).withMessage('groupBy doit être "jour" ou "mois"')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const { date_debut, date_fin, groupBy } = req.query;
      const result = await comptaService.getChiffreAffaires(
        date_debut as string,
        date_fin as string,
        (groupBy as 'jour' | 'mois') || 'jour'
      );
      res.json(result);
    } catch (error: any) {
      console.error('Erreur récupération chiffre affaires:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/compta/ventes-par-produit
 * Récupérer les ventes par produit et catégorie
 * Permission: compta.consulter_tout
 */
router.get(
  '/ventes-par-produit',
  authorize('compta.consulter_tout'),
  [
    query('date_debut').isDate().withMessage('Date de début invalide'),
    query('date_fin').isDate().withMessage('Date de fin invalide')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const { date_debut, date_fin } = req.query;
      const result = await comptaService.getVentesParProduit(
        date_debut as string,
        date_fin as string
      );
      res.json(result);
    } catch (error: any) {
      console.error('Erreur récupération ventes par produit:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/compta/valorisation-stock
 * Récupérer la valorisation du stock actuel
 * Permission: compta.consulter_tout
 */
router.get(
  '/valorisation-stock',
  authorize('compta.consulter_tout'),
  async (req: Request, res: Response) => {
    try {
      const result = await comptaService.getValorisationStock();
      res.json(result);
    } catch (error: any) {
      console.error('Erreur récupération valorisation stock:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/compta/journal-ventes/export
 * Exporter le journal des ventes au format Excel
 * Permission: compta.consulter_tout
 */
router.get(
  '/journal-ventes/export',
  authorize('compta.consulter_tout'),
  [
    query('date_debut').isDate().withMessage('Date de début invalide'),
    query('date_fin').isDate().withMessage('Date de fin invalide')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const { date_debut, date_fin } = req.query;

      // Récupérer toutes les données (sans pagination pour l'export)
      const data = await comptaService.getJournalVentes(
        date_debut as string,
        date_fin as string
      );

      // Générer le fichier Excel
      const buffer = await exportService.exportJournalVentesExcel(data);

      // Nom du fichier avec les dates
      const filename = `journal-ventes_${date_debut}_${date_fin}.xlsx`;

      // Envoyer le fichier
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Erreur export journal ventes:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/compta/rapport-sessions/export
 * Exporter le rapport des sessions au format Excel
 * Permission: compta.consulter_tout
 */
router.get(
  '/rapport-sessions/export',
  authorize('compta.consulter_tout'),
  [
    query('date_debut').isDate().withMessage('Date de début invalide'),
    query('date_fin').isDate().withMessage('Date de fin invalide')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const { date_debut, date_fin } = req.query;
      const data = await comptaService.getRapportSessions(
        date_debut as string,
        date_fin as string
      );

      const buffer = await exportService.exportRapportSessionsExcel(data);
      const filename = `rapport-sessions_${date_debut}_${date_fin}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Erreur export rapport sessions:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/compta/chiffre-affaires/export
 * Exporter le chiffre d'affaires au format Excel
 * Permission: compta.consulter_tout
 */
router.get(
  '/chiffre-affaires/export',
  authorize('compta.consulter_tout'),
  [
    query('date_debut').isDate().withMessage('Date de début invalide'),
    query('date_fin').isDate().withMessage('Date de fin invalide'),
    query('groupBy').optional().isIn(['jour', 'mois']).withMessage('groupBy doit être "jour" ou "mois"')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const { date_debut, date_fin, groupBy } = req.query;
      const data = await comptaService.getChiffreAffaires(
        date_debut as string,
        date_fin as string,
        (groupBy as 'jour' | 'mois') || 'jour'
      );

      const buffer = await exportService.exportChiffreAffairesExcel(data, (groupBy as string) || 'jour');
      const filename = `chiffre-affaires_${groupBy || 'jour'}_${date_debut}_${date_fin}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Erreur export chiffre affaires:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/compta/ventes-par-produit/export
 * Exporter les ventes par produit au format Excel
 * Permission: compta.consulter_tout
 */
router.get(
  '/ventes-par-produit/export',
  authorize('compta.consulter_tout'),
  [
    query('date_debut').isDate().withMessage('Date de début invalide'),
    query('date_fin').isDate().withMessage('Date de fin invalide')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Paramètres invalides', details: errors.array() });
    }

    try {
      const { date_debut, date_fin } = req.query;
      const data = await comptaService.getVentesParProduit(
        date_debut as string,
        date_fin as string
      );

      const buffer = await exportService.exportVentesParProduitExcel(data);
      const filename = `ventes-par-produit_${date_debut}_${date_fin}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Erreur export ventes par produit:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/compta/valorisation-stock/export
 * Exporter la valorisation du stock au format Excel
 * Permission: compta.consulter_tout
 */
router.get(
  '/valorisation-stock/export',
  authorize('compta.consulter_tout'),
  async (req: Request, res: Response) => {
    try {
      const data = await comptaService.getValorisationStock();

      const buffer = await exportService.exportValorisationStockExcel(data);
      const filename = `valorisation-stock_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Erreur export valorisation stock:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

export default router;
