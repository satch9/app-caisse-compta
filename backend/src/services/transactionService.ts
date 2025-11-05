import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/database';

export interface LigneTransaction {
  produit_id: number;
  quantite: number;
  prix_unitaire: number;
}

export interface CreateTransactionData {
  user_id: number;
  caissier_id: number;
  type_paiement: 'especes' | 'cheque' | 'cb' | 'monnaie';
  lignes: LigneTransaction[];
  reference_cheque?: string;
  reference_cb?: string;
  montant_recu?: number;
  montant_rendu?: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  caissier_id: number;
  type_paiement: string;
  montant_total: number;
  reference_cheque?: string;
  reference_cb?: string;
  statut: string;
  created_at: Date;
  lignes?: any[];
}

/**
 * Service pour gérer les transactions de caisse
 * Garantit l'atomicité des opérations : stock + transaction + compte
 */
class TransactionService {
  /**
   * Créer une nouvelle transaction avec mise à jour atomique du stock
   */
  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const connection: PoolConnection = await pool.getConnection();

    try {
      // Démarrer une transaction SQL
      await connection.beginTransaction();

      // 1. Calculer le montant total
      let montant_total = 0;

      // Pour les transactions de type 'monnaie', le montant total est toujours 0
      if (data.type_paiement === 'monnaie') {
        montant_total = 0;
      } else {
        for (const ligne of data.lignes) {
          montant_total += ligne.prix_unitaire * ligne.quantite;
        }
      }

      // 2. Vérifier et réserver le stock pour chaque produit (sauf pour monnaie)
      if (data.type_paiement !== 'monnaie') {
        for (const ligne of data.lignes) {
        // Vérifier le stock disponible
        const [stockRows] = await connection.query<any[]>(
          'SELECT stock_actuel, nom FROM produits WHERE id = ? AND is_active = TRUE FOR UPDATE',
          [ligne.produit_id]
        );

        if (stockRows.length === 0) {
          throw new Error(`Produit ${ligne.produit_id} non trouvé ou inactif`);
        }

        const stockActuel = stockRows[0].stock_actuel;
        const nomProduit = stockRows[0].nom;

        if (stockActuel < ligne.quantite) {
          throw new Error(
            `Stock insuffisant pour ${nomProduit}. Disponible: ${stockActuel}, Demandé: ${ligne.quantite}`
          );
        }

        // Déduire du stock
        const nouveauStock = stockActuel - ligne.quantite;
        await connection.query(
          'UPDATE produits SET stock_actuel = ? WHERE id = ?',
          [nouveauStock, ligne.produit_id]
        );

        // Enregistrer le mouvement de stock
        await connection.query(
          `INSERT INTO mouvements_stock
           (produit_id, type_mouvement, quantite, stock_avant, stock_apres, reference, user_id, commentaire)
           VALUES (?, 'sortie', ?, ?, ?, ?, ?, ?)`,
          [
            ligne.produit_id,
            ligne.quantite,
            stockActuel,
            nouveauStock,
            `VENTE`,
            data.caissier_id,
            `Vente caisse`
          ]
        );
      }
      }

      // 3. Créer la transaction
      const [transactionResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO transactions
         (user_id, caissier_id, type_paiement, montant_total, reference_cheque, reference_cb, montant_recu, montant_rendu, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'validee')`,
        [
          data.user_id,
          data.caissier_id,
          data.type_paiement,
          montant_total,
          data.reference_cheque || null,
          data.reference_cb || null,
          data.montant_recu || null,
          data.montant_rendu || null
        ]
      );

      const transactionId = transactionResult.insertId;

      // 4. Créer les lignes de transaction (sauf pour monnaie)
      if (data.type_paiement !== 'monnaie') {
        for (const ligne of data.lignes) {
        const prix_total = ligne.prix_unitaire * ligne.quantite;
        await connection.query(
          `INSERT INTO lignes_transaction
           (transaction_id, produit_id, quantite, prix_unitaire, prix_total)
           VALUES (?, ?, ?, ?, ?)`,
          [transactionId, ligne.produit_id, ligne.quantite, ligne.prix_unitaire, prix_total]
        );
      }
      }

      // 5. Mettre à jour le solde du compte si existe (sauf pour monnaie)
      if (data.type_paiement !== 'monnaie') {
      const [compteRows] = await connection.query<any[]>(
        'SELECT id, solde FROM comptes WHERE user_id = ? FOR UPDATE',
        [data.user_id]
      );

      if (compteRows.length > 0) {
        const nouveauSolde = compteRows[0].solde - montant_total;
        await connection.query(
          'UPDATE comptes SET solde = ? WHERE user_id = ?',
          [nouveauSolde, data.user_id]
        );
      }
      }

      // Valider la transaction SQL
      await connection.commit();

      // Récupérer la transaction créée avec ses lignes
      return await this.getTransactionById(transactionId);

    } catch (error) {
      // Annuler toutes les modifications en cas d'erreur
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer une transaction par ID avec ses lignes
   */
  async getTransactionById(id: number): Promise<Transaction> {
    const [rows] = await pool.query<any[]>(
      `SELECT t.*,
              u.nom as user_nom, u.prenom as user_prenom,
              c.nom as caissier_nom, c.prenom as caissier_prenom
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users c ON t.caissier_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      throw new Error('Transaction non trouvée');
    }

    const transaction = rows[0];

    // Récupérer les lignes
    const [lignesRows] = await pool.query<any[]>(
      `SELECT lt.*, p.nom as produit_nom
       FROM lignes_transaction lt
       LEFT JOIN produits p ON lt.produit_id = p.id
       WHERE lt.transaction_id = ?`,
      [id]
    );

    transaction.lignes = lignesRows;

    return transaction;
  }

  /**
   * Récupérer les transactions avec filtres
   */
  async getTransactions(filters: {
    caissier_id?: number;
    user_id?: number;
    type_paiement?: string;
    statut?: string;
    date_debut?: string;
    date_fin?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: Transaction[], total: number }> {
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (filters.caissier_id) {
      whereConditions.push('t.caissier_id = ?');
      params.push(filters.caissier_id);
    }

    if (filters.user_id) {
      whereConditions.push('t.user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.type_paiement) {
      whereConditions.push('t.type_paiement = ?');
      params.push(filters.type_paiement);
    }

    if (filters.statut) {
      whereConditions.push('t.statut = ?');
      params.push(filters.statut);
    }

    if (filters.date_debut) {
      whereConditions.push('DATE(t.created_at) >= ?');
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      whereConditions.push('DATE(t.created_at) <= ?');
      params.push(filters.date_fin);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Compter le total
    const [countRows] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Récupérer les transactions
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [rows] = await pool.query<any[]>(
      `SELECT t.*,
              u.nom as user_nom, u.prenom as user_prenom,
              c.nom as caissier_nom, c.prenom as caissier_prenom
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users c ON t.caissier_id = c.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { transactions: rows, total };
  }

  /**
   * Annuler une transaction
   */
  async cancelTransaction(transactionId: number, userId: number, raison: string): Promise<void> {
    const connection: PoolConnection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Vérifier que la transaction existe et est validée
      const [transactionRows] = await connection.query<any[]>(
        'SELECT * FROM transactions WHERE id = ? AND statut = "validee" FOR UPDATE',
        [transactionId]
      );

      if (transactionRows.length === 0) {
        throw new Error('Transaction non trouvée ou déjà annulée');
      }

      const transaction = transactionRows[0];

      // Récupérer les lignes de transaction
      const [lignesRows] = await connection.query<any[]>(
        'SELECT * FROM lignes_transaction WHERE transaction_id = ?',
        [transactionId]
      );

      // Restaurer le stock pour chaque produit
      for (const ligne of lignesRows) {
        const [produitRows] = await connection.query<any[]>(
          'SELECT stock_actuel FROM produits WHERE id = ? FOR UPDATE',
          [ligne.produit_id]
        );

        if (produitRows.length > 0) {
          const stockActuel = produitRows[0].stock_actuel;
          const nouveauStock = stockActuel + ligne.quantite;

          await connection.query(
            'UPDATE produits SET stock_actuel = ? WHERE id = ?',
            [nouveauStock, ligne.produit_id]
          );

          // Enregistrer le mouvement de stock
          await connection.query(
            `INSERT INTO mouvements_stock
             (produit_id, type_mouvement, quantite, stock_avant, stock_apres, reference, user_id, commentaire)
             VALUES (?, 'entree', ?, ?, ?, ?, ?, ?)`,
            [
              ligne.produit_id,
              ligne.quantite,
              stockActuel,
              nouveauStock,
              `ANNULATION-${transactionId}`,
              userId,
              `Annulation vente: ${raison}`
            ]
          );
        }
      }

      // Restaurer le solde du compte si existe
      const [compteRows] = await connection.query<any[]>(
        'SELECT id, solde FROM comptes WHERE user_id = ? FOR UPDATE',
        [transaction.user_id]
      );

      if (compteRows.length > 0) {
        const nouveauSolde = compteRows[0].solde + transaction.montant_total;
        await connection.query(
          'UPDATE comptes SET solde = ? WHERE user_id = ?',
          [nouveauSolde, transaction.user_id]
        );
      }

      // Marquer la transaction comme annulée
      await connection.query(
        `UPDATE transactions
         SET statut = 'annulee', annulee_par = ?, annulee_at = NOW(), raison_annulation = ?
         WHERE id = ?`,
        [userId, raison, transactionId]
      );

      await connection.commit();

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default new TransactionService();
