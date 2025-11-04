import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/authService';

/**
 * Middleware pour vérifier qu'un utilisateur est authentifié
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔑 Middleware authenticate - Header:', authHeader ? 'présent' : 'absent');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Header Authorization manquant ou format incorrect');
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token extrait:', token.substring(0, 20) + '...');

    const decoded = authService.verifyToken(token);

    if (!decoded) {
      console.log('❌ Token invalide ou expiré');
      return res.status(401).json({ error: 'Token invalide' });
    }

    console.log('✅ Token décodé, userId:', decoded.userId);
    const user = await authService.getUserById(decoded.userId);

    if (!user) {
      console.log('❌ Utilisateur non trouvé pour userId:', decoded.userId);
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    console.log('✅ Utilisateur authentifié:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
