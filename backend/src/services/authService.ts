import db from '../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  nom: string;
  prenom: string;
  is_active: boolean;
}

class AuthService {
  /**
   * Crée un nouvel utilisateur
   */
  async createUser(email: string, password: string, nom: string, prenom: string): Promise<number> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (email, password_hash, nom, prenom)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [email, hashedPassword, nom, prenom]);
    return (result as any).insertId;
  }

  /**
   * Authentifie un utilisateur
   */
  async login(email: string, password: string): Promise<{ token: string; user: any } | null> {
    console.log('🔍 AuthService.login: Début pour', email);

    const query = `
      SELECT id, email, password_hash, nom, prenom, is_active
      FROM users
      WHERE email = ? AND is_active = TRUE
    `;

    console.log('📊 AuthService.login: Requête SQL...');
    const [rows] = await db.query<UserRow[]>(query, [email]);
    console.log('✅ AuthService.login: Requête terminée, lignes trouvées:', rows.length);

    if (rows.length === 0) {
      console.log('❌ AuthService.login: Aucun utilisateur trouvé');
      return null;
    }

    const user = rows[0];
    console.log('👤 AuthService.login: Utilisateur trouvé, ID:', user.id, 'Email:', user.email);
    console.log('🔐 AuthService.login: Vérification du mot de passe...');
    console.log('📝 AuthService.login: Type de password_hash:', typeof user.password_hash);
    console.log('📝 AuthService.login: Hash existe?', !!user.password_hash);
    if (user.password_hash) {
      console.log('📝 AuthService.login: Hash stocké (20 premiers chars):', user.password_hash.substring(0, 20));
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
      console.log('✅ AuthService.login: Mot de passe vérifié, valide:', isPasswordValid);
    } catch (error) {
      console.error('❌ AuthService.login: Erreur lors de la vérification du mot de passe:', error);
      return null;
    }

    if (!isPasswordValid) {
      console.log('❌ AuthService.login: Mot de passe incorrect');
      return null;
    }

    console.log('🎫 AuthService.login: Génération du token JWT...');
    const jwtSecret: string = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const jwtExpiresIn: StringValue | number = (process.env.JWT_EXPIRES_IN || '24h') as StringValue;
    const signOptions: SignOptions = { expiresIn: jwtExpiresIn };
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      signOptions
    );
    console.log('✅ AuthService.login: Token généré avec succès');

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom
      }
    };
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(userId: number): Promise<any | null> {
    const query = `
      SELECT id, email, nom, prenom, is_active
      FROM users
      WHERE id = ?
    `;
    const [rows] = await db.query<UserRow[]>(query, [userId]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  /**
   * Vérifie un token JWT
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
