import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';
import mouvementStockService from './mouvementStockService';

export type TypeApprovisionnement = 'achat_direct' | 'commande_fournisseur';
export type StatutCommande = 'en_attente' | 'livree' | 'annulee';

interface LigneApprovisionnement {
  produit_id: number;
  quantite: number;
  prix_unitaire: number;
}

interface CreateApprovisionnementData {
  type: TypeApprovisionnement;
  montant_total: number;
  date_achat: string; // ISO date
  user_id: number;
  notes?: string;

  // Pour achats directs
  magasin?: string;
  ticket_photo_url?: string;

  // Pour commandes fournisseurs
  fournisseur_nom?: string;
  fournisseur_contact?: string;
  date_commande?: string;
  date_livraison_prevue?: string;
  statut?: StatutCommande;

  // Lignes (produits)
  lignes: LigneApprovisionnement[];
}

interface Approvisionnement extends RowDataPacket {
  id: number;
  type: TypeApprovisionnement;
  montant_total: number;
  date_achat: string;
  user_id: number;
  notes: string | null;
  magasin: string | null;
  fournisseur_nom: string | null;
  statut: StatutCommande | null;
  created_at: string;
}

interface ApprovisionnementWithDetails extends Approvisionnement {
  user_nom: string;
  lignes: {
    produit_id: number;
    produit_nom: string;
    quantite: number;
    prix_unitaire: number;
  }[];
}

class ApprovisionnementService {
  /**
   * Créer un approvisionnement (achat direct ou commande)
   */
  async createApprovisionnement(data: CreateApprovisionnementData): Promise<number> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insérer l'approvisionnement
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO approvisionnements
         (type, montant_total, date_achat, user_id, notes,
          magasin, ticket_photo_url,
          fournisseur_nom, fournisseur_contact,
          date_commande, date_livraison_prevue, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.type,
          data.montant_total,
          data.date_achat,
          data.user_id,
          data.notes || null,
          data.magasin || null,
          data.ticket_photo_url || null,
          data.fournisseur_nom || null,
          data.fournisseur_contact || null,
          data.date_commande || null,
          data.date_livraison_prevue || null,
          data.statut || null
        ]
      );

      const approvisionnementId = result.insertId;

      // Insérer les lignes
      for (const ligne of data.lignes) {
        await connection.query(
          `INSERT INTO lignes_approvisionnements
           (approvisionnement_id, produit_id, quantite, prix_unitaire)
           VALUES (?, ?, ?, ?)`,
          [approvisionnementId, ligne.produit_id, ligne.quantite, ligne.prix_unitaire]
        );
      }

      // Si achat direct, créer les mouvements de stock immédiatement
      if (data.type === 'achat_direct') {
        await this.creerMouvementsStock(connection, approvisionnementId, data.lignes, data.user_id);
      }

      await connection.commit();
      return approvisionnementId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Marquer une commande fournisseur comme livrée
   */
  async marquerCommeLivree(id: number, userId: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Vérifier que c'est bien une commande fournisseur
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT type, statut FROM approvisionnements WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        throw new Error('Approvisionnement non trouvé');
      }

      if (rows[0].type !== 'commande_fournisseur') {
        throw new Error('Cette opération est réservée aux commandes fournisseurs');
      }

      if (rows[0].statut === 'livree') {
        throw new Error('Cette commande a déjà été marquée comme livrée');
      }

      // Mettre à jour le statut
      await connection.query(
        `UPDATE approvisionnements
         SET statut = 'livree', date_livraison_reelle = NOW()
         WHERE id = ?`,
        [id]
      );

      // Récupérer les lignes
      const [lignes] = await connection.query<RowDataPacket[]>(
        'SELECT produit_id, quantite, prix_unitaire FROM lignes_approvisionnements WHERE approvisionnement_id = ?',
        [id]
      );

      // Créer les mouvements de stock
      await this.creerMouvementsStock(connection, id, lignes as LigneApprovisionnement[], userId);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Créer les mouvements de stock pour un approvisionnement
   */
  private async creerMouvementsStock(
    connection: any,
    approvisionnementId: number,
    lignes: LigneApprovisionnement[],
    userId: number
  ): Promise<void> {
    for (const ligne of lignes) {
      // Utiliser le service de mouvement pour gérer les stocks
      await mouvementStockService.createMouvement({
        produit_id: ligne.produit_id,
        type_mouvement: 'entree',
        quantite: ligne.quantite,
        motif: `Approvisionnement #${approvisionnementId}`,
        user_id: userId
      });
    }
  }

  /**
   * Récupérer tous les approvisionnements avec filtres
   */
  async getAll(filters: {
    type?: TypeApprovisionnement;
    date_debut?: string;
    date_fin?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ approvisionnements: ApprovisionnementWithDetails[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.type) {
      conditions.push('a.type = ?');
      params.push(filters.type);
    }

    if (filters.date_debut) {
      conditions.push('DATE(a.date_achat) >= ?');
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      conditions.push('DATE(a.date_achat) <= ?');
      params.push(filters.date_fin);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Compter le total
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM approvisionnements a ${whereClause}`,
      params
    );

    const total = countRows[0].total;

    // Récupérer les approvisionnements
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, CONCAT(u.prenom, ' ', u.nom) AS user_nom
       FROM approvisionnements a
       INNER JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY a.date_achat DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Pour chaque approvisionnement, récupérer les lignes
    const approvisionnements: ApprovisionnementWithDetails[] = [];
    for (const row of rows) {
      const [lignes] = await pool.query<RowDataPacket[]>(
        `SELECT la.produit_id, p.nom AS produit_nom, la.quantite, la.prix_unitaire
         FROM lignes_approvisionnements la
         INNER JOIN produits p ON la.produit_id = p.id
         WHERE la.approvisionnement_id = ?`,
        [row.id]
      );

      approvisionnements.push({
        ...row,
        lignes: lignes as any[]
      } as ApprovisionnementWithDetails);
    }

    return { approvisionnements, total };
  }

  /**
   * Récupérer un approvisionnement par ID
   */
  async getById(id: number): Promise<ApprovisionnementWithDetails | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, CONCAT(u.prenom, ' ', u.nom) AS user_nom
       FROM approvisionnements a
       INNER JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const [lignes] = await pool.query<RowDataPacket[]>(
      `SELECT la.produit_id, p.nom AS produit_nom, la.quantite, la.prix_unitaire
       FROM lignes_approvisionnements la
       INNER JOIN produits p ON la.produit_id = p.id
       WHERE la.approvisionnement_id = ?`,
      [id]
    );

    return {
      ...rows[0],
      lignes: lignes as any[]
    } as ApprovisionnementWithDetails;
  }

  /**
   * Supprimer un approvisionnement (si pas encore traité)
   */
  async delete(id: number): Promise<void> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT type, statut FROM approvisionnements WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      throw new Error('Approvisionnement non trouvé');
    }

    // Ne pas supprimer un achat direct (déjà traité) ou une commande livrée
    if (rows[0].type === 'achat_direct') {
      throw new Error('Impossible de supprimer un achat direct déjà enregistré');
    }

    if (rows[0].statut === 'livree') {
      throw new Error('Impossible de supprimer une commande déjà livrée');
    }

    await pool.query('DELETE FROM approvisionnements WHERE id = ?', [id]);
  }
}

export default new ApprovisionnementService();
