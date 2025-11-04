import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/authService';

/**
 * Middleware pour vérifier qu'un utilisateur est authentifié
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const user = await authService.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
