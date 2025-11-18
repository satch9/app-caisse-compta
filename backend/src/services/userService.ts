import db from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  created_at: Date;
  roles?: string | null;
  all_permissions?: string | null;
}

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  created_at: Date;
  roles: string[];
  permissions: string[];
}

class UserService {
  /**
   * Récupérer tous les utilisateurs avec leurs rôles et permissions
   */
  async getAllUsers(): Promise<User[]> {
    const query = `
      SELECT
        u.id,
        u.email,
        u.nom,
        u.prenom,
        u.created_at,
        GROUP_CONCAT(DISTINCT r.code) as roles,
        GROUP_CONCAT(DISTINCT p.code) as all_permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p2 ON up.permission_id = p2.id
      GROUP BY u.id
      ORDER BY u.nom, u.prenom
    `;

    const [rows] = await db.query<UserRow[]>(query);

    return rows.map(user => ({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      created_at: user.created_at,
      roles: user.roles ? user.roles.split(',') : [],
      permissions: user.all_permissions ? [...new Set(user.all_permissions.split(','))] : []
    }));
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(userId: number): Promise<User | null> {
    const query = `
      SELECT
        u.id,
        u.email,
        u.nom,
        u.prenom,
        u.created_at,
        GROUP_CONCAT(DISTINCT r.code) as roles,
        GROUP_CONCAT(DISTINCT p.code) as all_permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p2 ON up.permission_id = p2.id
      WHERE u.id = ?
      GROUP BY u.id
    `;

    const [rows] = await db.query<UserRow[]>(query, [userId]);

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      created_at: user.created_at,
      roles: user.roles ? user.roles.split(',') : [],
      permissions: user.all_permissions ? [...new Set(user.all_permissions.split(','))] : []
    };
  }

  /**
   * Créer un nouvel utilisateur
   */
  async createUser(data: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
  }): Promise<number> {
    // Vérifier si l'email existe déjà
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [data.email]
    );

    if (existing.length > 0) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const query = `
      INSERT INTO users (email, password_hash, nom, prenom)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query<ResultSetHeader>(query, [
      data.email,
      hashedPassword,
      data.nom,
      data.prenom
    ]);

    return result.insertId;
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(
    userId: number,
    data: {
      email?: string;
      nom?: string;
      prenom?: string;
      password?: string;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.email) {
      // Vérifier si l'email existe déjà pour un autre utilisateur
      const [existing] = await db.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [data.email, userId]
      );

      if (existing.length > 0) {
        throw new Error('Un autre utilisateur utilise déjà cet email');
      }

      updates.push('email = ?');
      values.push(data.email);
    }

    if (data.nom !== undefined) {
      updates.push('nom = ?');
      values.push(data.nom);
    }

    if (data.prenom !== undefined) {
      updates.push('prenom = ?');
      values.push(data.prenom);
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push('password_hash = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return;
    }

    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.query(query, values);
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId: number): Promise<void> {
    // Supprimer d'abord toutes les relations
    await db.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    await db.query('DELETE FROM user_permissions WHERE user_id = ?', [userId]);

    // Supprimer l'utilisateur
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
  }

  /**
   * Récupérer les utilisateurs par rôle
   */
  async getUsersByRole(roleCode: string): Promise<User[]> {
    const query = `
      SELECT DISTINCT
        u.id,
        u.email,
        u.nom,
        u.prenom,
        u.created_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.code = ?
      ORDER BY u.nom, u.prenom
    `;

    const [rows] = await db.query<UserRow[]>(query, [roleCode]);
    return rows.map(user => ({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      created_at: user.created_at,
      roles: [],
      permissions: []
    }));
  }
}

export default new UserService();
