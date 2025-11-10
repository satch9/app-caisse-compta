import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export type TypeMouvement = 'entree' | 'sortie' | 'ajustement' | 'inventaire' | 'perte' | 'transfert';

export interface MouvementStock {
  id: number;
  produit_id: number;
  type_mouvement: TypeMouvement;
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  motif: string | null;
  commentaire: string | null;
  transaction_id: number | null;
  commande_id: number | null;
  user_id: number | null;
  created_at: Date;
}

export interface MouvementStockWithDetails extends MouvementStock {
  produit_nom: string;
  categorie_nom: string;
  user_nom: string | null;
}

export interface GetMouvementsFilters {
  produit_id?: number;
  type_mouvement?: TypeMouvement;
  date_debut?: string;
  date_fin?: string;
  user_id?: number;
  limit?: number;
  offset?: number;
}

export interface CreateMouvementData {
  produit_id: number;
  type_mouvement: TypeMouvement;
  quantite: number;
  motif?: string;
  commentaire?: string;
  transaction_id?: number;
  commande_id?: number;
  user_id?: number;
}

class MouvementStockService {
  /**
   * Créer un mouvement de stock
   * IMPORTANT: Cette méthode met à jour automatiquement le stock du produit
   */
  async createMouvement(data: CreateMouvementData): Promise<number> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Récupérer le stock actuel du produit
      const [produitRows] = await connection.query<RowDataPacket[]>(
        'SELECT stock_actuel FROM produits WHERE id = ?',
        [data.produit_id]
      );

      if (produitRows.length === 0) {
        throw new Error('Produit introuvable');
      }

      const stockAvant = produitRows[0].stock_actuel;
      let stockApres: number;

      // Calculer le nouveau stock selon le type de mouvement
      switch (data.type_mouvement) {
        case 'entree':
          stockApres = stockAvant + Math.abs(data.quantite);
          break;
        case 'sortie':
        case 'perte':
          stockApres = stockAvant - Math.abs(data.quantite);
          break;
        case 'ajustement':
        case 'inventaire':
          // Pour ajustement/inventaire, la quantité peut être positive ou négative
          stockApres = stockAvant + data.quantite;
          break;
        case 'transfert':
          // Pour transfert, géré selon le signe de la quantité
          stockApres = stockAvant + data.quantite;
          break;
        default:
          throw new Error(`Type de mouvement inconnu: ${data.type_mouvement}`);
      }

      // Vérifier que le stock ne devient pas négatif
      if (stockApres < 0) {
        throw new Error(`Stock insuffisant. Stock actuel: ${stockAvant}, tentative de retrait: ${Math.abs(data.quantite)}`);
      }

      // Insérer le mouvement
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO mouvements_stock
         (produit_id, type_mouvement, quantite, stock_avant, stock_apres,
          motif, commentaire, transaction_id, commande_id, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.produit_id,
          data.type_mouvement,
          data.quantite,
          stockAvant,
          stockApres,
          data.motif || null,
          data.commentaire || null,
          data.transaction_id || null,
          data.commande_id || null,
          data.user_id || null
        ]
      );

      // Mettre à jour le stock du produit
      await connection.query(
        'UPDATE produits SET stock_actuel = ? WHERE id = ?',
        [stockApres, data.produit_id]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer les mouvements de stock avec filtres
   */
  async getMouvements(filters: GetMouvementsFilters = {}): Promise<{ mouvements: MouvementStockWithDetails[]; total: number }> {
    const conditionsWithAlias: string[] = [];
    const conditionsWithoutAlias: string[] = [];
    const params: any[] = [];

    if (filters.produit_id) {
      conditionsWithAlias.push('ms.produit_id = ?');
      conditionsWithoutAlias.push('produit_id = ?');
      params.push(filters.produit_id);
    }

    if (filters.type_mouvement) {
      conditionsWithAlias.push('ms.type_mouvement = ?');
      conditionsWithoutAlias.push('type_mouvement = ?');
      params.push(filters.type_mouvement);
    }

    if (filters.date_debut) {
      conditionsWithAlias.push('DATE(ms.created_at) >= ?');
      conditionsWithoutAlias.push('DATE(created_at) >= ?');
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      conditionsWithAlias.push('DATE(ms.created_at) <= ?');
      conditionsWithoutAlias.push('DATE(created_at) <= ?');
      params.push(filters.date_fin);
    }

    if (filters.user_id) {
      conditionsWithAlias.push('ms.user_id = ?');
      conditionsWithoutAlias.push('user_id = ?');
      params.push(filters.user_id);
    }

    const whereClauseWithAlias = conditionsWithAlias.length > 0 ? `WHERE ${conditionsWithAlias.join(' AND ')}` : '';
    const whereClauseWithoutAlias = conditionsWithoutAlias.length > 0 ? `WHERE ${conditionsWithoutAlias.join(' AND ')}` : '';

    // Compter le total
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM mouvements_stock ms
       ${whereClauseWithAlias}`,
      params
    );

    const total = countRows[0].total;

    // Récupérer les mouvements avec détails via la vue
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM v_mouvements_stock
       ${whereClauseWithoutAlias}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      mouvements: rows as MouvementStockWithDetails[],
      total
    };
  }

  /**
   * Récupérer un mouvement par ID
   */
  async getMouvementById(id: number): Promise<MouvementStockWithDetails> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM v_mouvements_stock WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      throw new Error('Mouvement introuvable');
    }

    return rows[0] as MouvementStockWithDetails;
  }

  /**
   * Récupérer les mouvements d'un produit spécifique
   */
  async getMouvementsByProduit(produitId: number, limit: number = 20): Promise<MouvementStockWithDetails[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM v_mouvements_stock
       WHERE produit_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [produitId, limit]
    );

    return rows as MouvementStockWithDetails[];
  }

  /**
   * Récupérer les statistiques de mouvements pour un produit
   */
  async getStatistiquesProduit(produitId: number, dateDebut?: string, dateFin?: string): Promise<{
    total_entrees: number;
    total_sorties: number;
    total_ajustements: number;
    total_pertes: number;
  }> {
    const conditions: string[] = ['produit_id = ?'];
    const params: any[] = [produitId];

    if (dateDebut) {
      conditions.push('DATE(created_at) >= ?');
      params.push(dateDebut);
    }

    if (dateFin) {
      conditions.push('DATE(created_at) <= ?');
      params.push(dateFin);
    }

    const whereClause = conditions.join(' AND ');

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(CASE WHEN type_mouvement = 'entree' THEN quantite ELSE 0 END) as total_entrees,
        SUM(CASE WHEN type_mouvement = 'sortie' THEN ABS(quantite) ELSE 0 END) as total_sorties,
        SUM(CASE WHEN type_mouvement = 'ajustement' OR type_mouvement = 'inventaire' THEN ABS(quantite) ELSE 0 END) as total_ajustements,
        SUM(CASE WHEN type_mouvement = 'perte' THEN ABS(quantite) ELSE 0 END) as total_pertes
       FROM mouvements_stock
       WHERE ${whereClause}`,
      params
    );

    return {
      total_entrees: rows[0].total_entrees || 0,
      total_sorties: rows[0].total_sorties || 0,
      total_ajustements: rows[0].total_ajustements || 0,
      total_pertes: rows[0].total_pertes || 0
    };
  }
}

export default new MouvementStockService();
