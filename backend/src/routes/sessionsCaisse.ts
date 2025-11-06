import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import sessionCaisseService from '../services/sessionCaisseService';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { AuthRequest } from '../types';

const router = Router();

/**
 * POST /api/sessions-caisse
 * Créer une nouvelle session (Trésorier donne le fond)
 * Permission: caisse.donner_fond_initial
 */
router.post(
  '/',
  authenticate,
  authorize('caisse.donner_fond_initial'),
  [
    body('caissier_id').isInt({ min: 1 }).withMessage('caissier_id invalide'),
    body('fond_initial').isFloat({ min: 0 }).withMessage('fond_initial doit être >= 0'),
    body('note_ouverture').optional().isString().trim()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { caissier_id, fond_initial, note_ouverture } = req.body;
      const tresorier_id = req.user!.id;

      const session_id = await sessionCaisseService.creerSession(
        tresorier_id,
        caissier_id,
        fond_initial,
        note_ouverture
      );

      const session = await sessionCaisseService.getSessionById(session_id);

      res.status(201).json({
        success: true,
        message: 'Session de caisse créée avec succès',
        session
      });
    } catch (error: any) {
      console.error('Erreur création session caisse:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la création de la session'
      });
    }
  }
);

/**
 * POST /api/sessions-caisse/:id/ouvrir
 * Caissier confirme la réception du fond et ouvre la caisse
 * Permission: caisse.recevoir_fond
 */
router.post(
  '/:id/ouvrir',
  authenticate,
  authorize('caisse.recevoir_fond'),
  [
    body('note_ouverture').optional().isString().trim()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const session_id = parseInt(req.params.id);
      const caissier_id = req.user!.id;
      const { note_ouverture } = req.body;

      await sessionCaisseService.ouvrirSession(session_id, caissier_id, note_ouverture);

      const session = await sessionCaisseService.getSessionById(session_id);

      res.json({
        success: true,
        message: 'Caisse ouverte avec succès',
        session
      });
    } catch (error: any) {
      console.error('Erreur ouverture session:', error);
      res.status(400).json({
        error: error.message || 'Erreur lors de l\'ouverture de la session'
      });
    }
  }
);

/**
 * POST /api/sessions-caisse/:id/fermer
 * Caissier ferme la caisse et déclare le solde
 * Permission: caisse.fermer_caisse
 */
router.post(
  '/:id/fermer',
  authenticate,
  authorize('caisse.fermer_caisse'),
  [
    body('solde_declare').isFloat({ min: 0 }).withMessage('solde_declare invalide'),
    body('note_fermeture').optional().isString().trim()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const session_id = parseInt(req.params.id);
      const caissier_id = req.user!.id;
      const { solde_declare, note_fermeture } = req.body;

      await sessionCaisseService.fermerSession(
        session_id,
        caissier_id,
        solde_declare,
        note_fermeture
      );

      const session = await sessionCaisseService.getSessionById(session_id);

      res.json({
        success: true,
        message: 'Caisse fermée avec succès',
        session
      });
    } catch (error: any) {
      console.error('Erreur fermeture session:', error);
      res.status(400).json({
        error: error.message || 'Erreur lors de la fermeture de la session'
      });
    }
  }
);

/**
 * POST /api/sessions-caisse/:id/valider
 * Trésorier valide la fermeture
 * Permission: caisse.valider_fermeture
 */
router.post(
  '/:id/valider',
  authenticate,
  authorize('caisse.valider_fermeture'),
  [
    body('solde_valide').isFloat({ min: 0 }).withMessage('solde_valide invalide'),
    body('statut_final').isIn(['validee', 'anomalie']).withMessage('statut_final invalide'),
    body('note_validation').optional().isString().trim()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const session_id = parseInt(req.params.id);
      const tresorier_id = req.user!.id;
      const { solde_valide, statut_final, note_validation } = req.body;

      await sessionCaisseService.validerFermeture(
        session_id,
        tresorier_id,
        solde_valide,
        statut_final,
        note_validation
      );

      const session = await sessionCaisseService.getSessionById(session_id);

      res.json({
        success: true,
        message: 'Fermeture validée avec succès',
        session
      });
    } catch (error: any) {
      console.error('Erreur validation fermeture:', error);
      res.status(400).json({
        error: error.message || 'Erreur lors de la validation'
      });
    }
  }
);

/**
 * GET /api/sessions-caisse
 * Récupérer les sessions avec filtres
 * Permission: caisse.consulter_sessions
 */
router.get(
  '/',
  authenticate,
  authorize('caisse.consulter_sessions'),
  [
    query('caissier_id').optional().isInt({ min: 1 }),
    query('tresorier_id').optional().isInt({ min: 1 }),
    query('statut').optional().isIn(['en_attente_caissier', 'ouverte', 'en_attente_validation', 'validee', 'anomalie']),
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

      const filters = {
        caissier_id: req.query.caissier_id ? parseInt(req.query.caissier_id as string) : undefined,
        tresorier_id: req.query.tresorier_id ? parseInt(req.query.tresorier_id as string) : undefined,
        statut: req.query.statut as string,
        date_debut: req.query.date_debut as string,
        date_fin: req.query.date_fin as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await sessionCaisseService.getSessions(filters);

      res.json({
        success: true,
        sessions: result.sessions,
        total: result.total,
        limit: filters.limit,
        offset: filters.offset
      });
    } catch (error: any) {
      console.error('Erreur récupération sessions:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération des sessions'
      });
    }
  }
);

/**
 * GET /api/sessions-caisse/:id
 * Récupérer une session par ID
 * Permission: caisse.consulter_sessions
 */
router.get(
  '/:id',
  authenticate,
  authorize('caisse.consulter_sessions'),
  async (req: Request, res: Response) => {
    try {
      const session_id = parseInt(req.params.id);

      if (isNaN(session_id)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const session = await sessionCaisseService.getSessionById(session_id);

      res.json({
        success: true,
        session
      });
    } catch (error: any) {
      console.error('Erreur récupération session:', error);
      res.status(404).json({
        error: error.message || 'Session non trouvée'
      });
    }
  }
);

/**
 * GET /api/sessions-caisse/active/me
 * Récupérer la session active du caissier connecté
 * Permission: caisse.recevoir_fond (caissier)
 */
router.get(
  '/active/me',
  authenticate,
  authorize('caisse.recevoir_fond'),
  async (req: AuthRequest, res: Response) => {
    try {
      const caissier_id = req.user!.id;

      const session = await sessionCaisseService.getSessionActive(caissier_id);

      res.json({
        success: true,
        session
      });
    } catch (error: any) {
      console.error('Erreur récupération session active:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération de la session active'
      });
    }
  }
);

/**
 * GET /api/sessions-caisse/en-attente-validation/me
 * Récupérer les sessions en attente de validation pour le trésorier connecté
 * Permission: caisse.valider_fermeture
 */
router.get(
  '/en-attente-validation/me',
  authenticate,
  authorize('caisse.valider_fermeture'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tresorier_id = req.user!.id;

      const sessions = await sessionCaisseService.getSessionsEnAttenteValidation(tresorier_id);

      res.json({
        success: true,
        sessions
      });
    } catch (error: any) {
      console.error('Erreur récupération sessions en attente:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération des sessions'
      });
    }
  }
);

export default router;
