import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import permissionService from '../services/permissionService';

/**
 * Middleware pour vérifier qu'un utilisateur a une permission
 * Usage: router.get('/path', authorize('caisse.encaisser_especes'), handler)
 */
export function authorize(requiredPermission: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const hasPermission = await permissionService.userCan(
        req.user.id,
        requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Permission refusée',
          required: requiredPermission
        });
      }

      next();
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}

/**
 * Middleware pour vérifier qu'un utilisateur a au moins une des permissions
 */
export function authorizeAny(...permissions: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      for (const permission of permissions) {
        const hasPermission = await permissionService.userCan(
          req.user.id,
          permission
        );
        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({
        error: 'Permission refusée',
        required: `Une des permissions: ${permissions.join(', ')}`
      });
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}
