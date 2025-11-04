import db from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    const query = `
      SELECT id, email, password_hash, nom, prenom, is_active
      FROM users
      WHERE email = ? AND is_active = TRUE
    `;

    const [rows] = await db.query<UserRow[]>(query, [email]);

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

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
