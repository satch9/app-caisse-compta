import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Compte {
  id: number;
  user_id: number;
  type_compte: 'membre';  // Seuls les membres peuvent avoir un compte
  solde: number;
  created_at: Date;
  updated_at: Date;
  // Infos utilisateur jointes
  email?: string;
  nom?: string;
  prenom?: string;
  is_active?: boolean;
}

export interface TransactionCompte {
  id: number;
  user_id: number | null;
  montant_total: number;
  type_paiement: 'especes' | 'cheque' | 'cb';
  created_at: Date;
  caissier_nom?: string;
  caissier_prenom?: string;
}

export interface AjustementSoldeData {
  user_id: number;
  montant: number;
  raison: string;
  admin_id: number;
}

class ComptesService {
  /**
   * Récupérer tous les comptes membres avec infos utilisateurs
   */
  async getAllComptes(filters?: {
    search?: string;
    is_active?: boolean;
  }): Promise<Compte[]> {
    let query = `
      SELECT
        c.id,
        c.user_id,
        c.type_compte,
        c.solde,
        c.created_at,
        c.updated_at,
        u.email,
        u.nom,
        u.prenom,
        u.is_active
      FROM comptes c
      INNER JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params: (string | number | boolean)[] = [];

    if (filters?.is_active !== undefined) {
      query += ' AND u.is_active = ?';
      params.push(filters.is_active);
    }

    if (filters?.search) {
      query += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY u.nom, u.prenom';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as Compte[];
  }

  /**
   * Récupérer un compte par user_id avec infos utilisateur
   */
  async getCompteByUserId(userId: number): Promise<Compte | null> {
    const query = `
      SELECT
        c.id,
        c.user_id,
        c.type_compte,
        c.solde,
        c.created_at,
        c.updated_at,
        u.email,
        u.nom,
        u.prenom,
        u.is_active
      FROM comptes c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [userId]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as Compte;
  }

  /**
   * Créer un compte pour un membre (adhérent) existant
   */
  async createCompte(
    userId: number,
    soldeInitial: number = 0
  ): Promise<number> {
    // Vérifier si le compte existe déjà
    const existingCompte = await this.getCompteByUserId(userId);
    if (existingCompte) {
      throw new Error('Un compte existe déjà pour cet utilisateur');
    }

    const query = `
      INSERT INTO comptes (user_id, type_compte, solde)
      VALUES (?, 'membre', ?)
    `;

    const [result] = await pool.query<ResultSetHeader>(
      query,
      [userId, soldeInitial]
    );

    return result.insertId;
  }

  /**
   * Ajuster manuellement le solde d'un compte (admin uniquement)
   * Crée une transaction fictive pour traçabilité
   */
  async ajusterSolde(data: AjustementSoldeData): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Vérifier que le compte existe
      const [compteRows] = await connection.query<RowDataPacket[]>(
        'SELECT id, solde FROM comptes WHERE user_id = ? FOR UPDATE',
        [data.user_id]
      );

      if (compteRows.length === 0) {
        throw new Error('Compte non trouvé');
      }

      const ancienSolde = compteRows[0].solde;
      const nouveauSolde = ancienSolde + data.montant;

      // 2. Mettre à jour le solde
      await connection.query(
        'UPDATE comptes SET solde = ? WHERE user_id = ?',
        [nouveauSolde, data.user_id]
      );

      // 3. Enregistrer l'ajustement dans une table de logs (optionnel)
      // Pour l'instant, on peut créer une transaction fictive avec session_id = NULL
      // ou créer une table dédiée aux ajustements

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer l'historique des transactions d'un compte
   */
  async getHistoriqueCompte(
    userId: number,
    options?: {
      limit?: number;
      offset?: number;
      dateDebut?: string;
      dateFin?: string;
    }
  ): Promise<{
    transactions: TransactionCompte[];
    total: number;
  }> {
    let query = `
      SELECT
        t.id,
        t.user_id,
        t.montant_total,
        t.type_paiement,
        t.created_at,
        u.nom as caissier_nom,
        u.prenom as caissier_prenom
      FROM transactions t
      LEFT JOIN users u ON t.caissier_id = u.id
      WHERE t.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (options?.dateDebut) {
      query += ' AND DATE(t.created_at) >= ?';
      params.push(options.dateDebut);
    }

    if (options?.dateFin) {
      query += ' AND DATE(t.created_at) <= ?';
      params.push(options.dateFin);
    }

    // Compter le total
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Récupérer les transactions avec pagination
    query += ' ORDER BY t.created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return {
      transactions: rows as TransactionCompte[],
      total,
    };
  }

  /**
   * Récupérer les statistiques d'un compte
   */
  async getStatistiquesCompte(userId: number): Promise<{
    solde_actuel: number;
    total_depenses: number;
    nb_transactions: number;
    derniere_transaction: Date | null;
    depense_moyenne: number;
  }> {
    const query = `
      SELECT
        c.solde as solde_actuel,
        COALESCE(SUM(t.montant_total), 0) as total_depenses,
        COUNT(t.id) as nb_transactions,
        MAX(t.created_at) as derniere_transaction,
        COALESCE(AVG(t.montant_total), 0) as depense_moyenne
      FROM comptes c
      LEFT JOIN transactions t ON c.user_id = t.user_id
      WHERE c.user_id = ?
      GROUP BY c.id, c.solde
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [userId]);

    if (rows.length === 0) {
      return {
        solde_actuel: 0,
        total_depenses: 0,
        nb_transactions: 0,
        derniere_transaction: null,
        depense_moyenne: 0,
      };
    }

    return rows[0] as any;
  }

  /**
   * Supprimer un compte (cascade delete via FK)
   */
  async deleteCompte(userId: number): Promise<void> {
    // Vérifier qu'il n'y a pas de transactions en cours
    const [transactions] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?',
      [userId]
    );

    if (transactions[0].count > 0) {
      throw new Error(
        'Impossible de supprimer un compte avec un historique de transactions'
      );
    }

    await pool.query('DELETE FROM comptes WHERE user_id = ?', [userId]);
  }
}

export default new ComptesService();
