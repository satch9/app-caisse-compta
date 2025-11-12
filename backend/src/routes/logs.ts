import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import logService from '../services/logService';
import { AuthRequest } from '../types';

const router = express.Router();

// Toutes les routes nécessitent l'authentification et la permission admin
router.use(authenticate);
router.use(authorize('admin.consulter_logs'));

/**
 * GET /api/logs
 * Récupérer les logs avec filtres
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const filters = {
      user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
      action: req.query.action as string,
      entity_type: req.query.entity_type as string,
      date_debut: req.query.date_debut as string,
      date_fin: req.query.date_fin as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await logService.getLogs(filters);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Erreur récupération logs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/logs/actions
 * Récupérer la liste des actions uniques
 */
router.get('/actions', async (req: AuthRequest, res) => {
  try {
    const actions = await logService.getUniqueActions();
    res.json({ success: true, actions });
  } catch (error) {
    console.error('Erreur récupération actions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/logs/entity-types
 * Récupérer la liste des types d'entités uniques
 */
router.get('/entity-types', async (req: AuthRequest, res) => {
  try {
    const entityTypes = await logService.getUniqueEntityTypes();
    res.json({ success: true, entityTypes });
  } catch (error) {
    console.error('Erreur récupération types d\'entités:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/logs/cleanup/:days
 * Supprimer les logs plus anciens que X jours
 */
router.delete('/cleanup/:days', authorize('admin.gerer_systeme'), async (req: AuthRequest, res) => {
  try {
    const days = parseInt(req.params.days);

    if (isNaN(days) || days < 30) {
      return res.status(400).json({ error: 'Le nombre de jours doit être au moins 30' });
    }

    const deletedCount = await logService.deleteOldLogs(days);
    res.json({
      success: true,
      message: `${deletedCount} logs supprimés`,
      deletedCount,
    });
  } catch (error) {
    console.error('Erreur suppression logs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
