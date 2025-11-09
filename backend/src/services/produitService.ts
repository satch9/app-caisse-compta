import db from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import mouvementStockService from './mouvementStockService';

interface Produit extends RowDataPacket {
  id: number;
  nom: string;
  description: string | null;
  categorie_id: number;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  stock_minimum: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  categorie_nom?: string;
  niveau_stock?: 'normal' | 'alerte' | 'critique';
}

interface CreateProduitData {
  nom: string;
  description?: string;
  categorie_id: number;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  stock_minimum: number;
  is_active?: boolean;
}

interface UpdateProduitData {
  nom?: string;
  description?: string;
  categorie_id?: number;
  prix_achat?: number;
  prix_vente?: number;
  stock_actuel?: number;
  stock_minimum?: number;
  is_active?: boolean;
}

interface GetProduitsFilters {
  categorie_id?: number;
  actifs_seulement?: boolean;
  recherche?: string;
  niveau_stock?: 'normal' | 'alerte' | 'critique';
  limit?: number;
  offset?: number;
}

class ProduitService {
  /**
   * Récupérer la liste des produits avec filtres
   */
  async getProduits(filters: GetProduitsFilters = {}): Promise<{ produits: Produit[]; total: number }> {
    let whereConditions: string[] = [];
    let params: any[] = [];

    // Filtrer par défaut sur les produits actifs
    const actifsSeul = filters.actifs_seulement !== false;
    if (actifsSeul) {
      whereConditions.push('p.is_active = TRUE');
    }

    if (filters.categorie_id) {
      whereConditions.push('p.categorie_id = ?');
      params.push(filters.categorie_id);
    }

    if (filters.recherche) {
      whereConditions.push('(p.nom LIKE ? OR p.description LIKE ?)');
      const searchTerm = `%${filters.recherche}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.niveau_stock) {
      if (filters.niveau_stock === 'critique') {
        whereConditions.push('p.stock_actuel <= p.stock_minimum');
      } else if (filters.niveau_stock === 'alerte') {
        whereConditions.push('p.stock_actuel > p.stock_minimum AND p.stock_actuel <= (p.stock_minimum * 1.5)');
      } else if (filters.niveau_stock === 'normal') {
        whereConditions.push('p.stock_actuel > (p.stock_minimum * 1.5)');
      }
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM produits p
      ${whereClause}
    `;
    const [countRows] = await db.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Récupérer les produits
    const query = `
      SELECT p.*,
             c.nom as categorie_nom,
             CASE
               WHEN p.stock_actuel <= p.stock_minimum THEN 'critique'
               WHEN p.stock_actuel <= (p.stock_minimum * 1.5) THEN 'alerte'
               ELSE 'normal'
             END as niveau_stock
      FROM produits p
      LEFT JOIN categories_produits c ON p.categorie_id = c.id
      ${whereClause}
      ORDER BY p.nom ASC
      LIMIT ? OFFSET ?
    `;

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const [rows] = await db.query<Produit[]>(query, [...params, limit, offset]);

    return { produits: rows, total };
  }

  /**
   * Récupérer un produit par ID
   */
  async getProduitById(id: number): Promise<Produit> {
    const query = `
      SELECT p.*,
             c.nom as categorie_nom,
             CASE
               WHEN p.stock_actuel <= p.stock_minimum THEN 'critique'
               WHEN p.stock_actuel <= (p.stock_minimum * 1.5) THEN 'alerte'
               ELSE 'normal'
             END as niveau_stock
      FROM produits p
      LEFT JOIN categories_produits c ON p.categorie_id = c.id
      WHERE p.id = ?
    `;

    const [rows] = await db.query<Produit[]>(query, [id]);

    if (rows.length === 0) {
      throw new Error('Produit non trouvé');
    }

    return rows[0];
  }

  /**
   * Créer un nouveau produit
   */
  async createProduit(data: CreateProduitData): Promise<number> {
    // Vérifier que la catégorie existe
    const [categories] = await db.query<RowDataPacket[]>(
      'SELECT id FROM categories_produits WHERE id = ?',
      [data.categorie_id]
    );

    if (categories.length === 0) {
      throw new Error('Catégorie invalide');
    }

    // Vérifier qu'un produit avec le même nom n'existe pas déjà
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM produits WHERE nom = ?',
      [data.nom]
    );

    if (existing.length > 0) {
      throw new Error('Un produit avec ce nom existe déjà');
    }

    const query = `
      INSERT INTO produits
        (nom, description, categorie_id, prix_achat, prix_vente, stock_actuel, stock_minimum, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query<ResultSetHeader>(query, [
      data.nom,
      data.description || null,
      data.categorie_id,
      data.prix_achat,
      data.prix_vente,
      data.stock_actuel,
      data.stock_minimum,
      data.is_active !== false // Par défaut true
    ]);

    const produitId = result.insertId;

    // Créer un mouvement de stock initial si stock_actuel > 0
    if (data.stock_actuel > 0) {
      await mouvementStockService.createMouvement({
        produit_id: produitId,
        type_mouvement: 'entree',
        quantite: data.stock_actuel,
        motif: 'Stock initial lors de la création du produit'
      });
    }

    return produitId;
  }

  /**
   * Mettre à jour un produit
   */
  async updateProduit(id: number, data: UpdateProduitData, userId?: number): Promise<void> {
    // Vérifier que le produit existe et récupérer le stock actuel
    const produit = await this.getProduitById(id);

    // Si on change la catégorie, vérifier qu'elle existe
    if (data.categorie_id !== undefined) {
      const [categories] = await db.query<RowDataPacket[]>(
        'SELECT id FROM categories_produits WHERE id = ?',
        [data.categorie_id]
      );

      if (categories.length === 0) {
        throw new Error('Catégorie invalide');
      }
    }

    // Si on change le nom, vérifier qu'il n'y a pas de doublon
    if (data.nom !== undefined) {
      const [existing] = await db.query<RowDataPacket[]>(
        'SELECT id FROM produits WHERE nom = ? AND id != ?',
        [data.nom, id]
      );

      if (existing.length > 0) {
        throw new Error('Un produit avec ce nom existe déjà');
      }
    }

    // Construire la requête UPDATE dynamiquement
    const updates: string[] = [];
    const params: any[] = [];

    if (data.nom !== undefined) {
      updates.push('nom = ?');
      params.push(data.nom);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description || null);
    }

    if (data.categorie_id !== undefined) {
      updates.push('categorie_id = ?');
      params.push(data.categorie_id);
    }

    if (data.prix_achat !== undefined) {
      updates.push('prix_achat = ?');
      params.push(data.prix_achat);
    }

    if (data.prix_vente !== undefined) {
      updates.push('prix_vente = ?');
      params.push(data.prix_vente);
    }

    // Ne pas mettre à jour le stock_actuel directement via cette méthode
    // Utiliser ajusterStock() pour créer un mouvement de stock
    if (data.stock_actuel !== undefined && data.stock_actuel !== produit.stock_actuel) {
      throw new Error('Pour modifier le stock, utilisez la méthode ajusterStock() ou l\'API de mouvements de stock');
    }

    if (data.stock_minimum !== undefined) {
      updates.push('stock_minimum = ?');
      params.push(data.stock_minimum);
    }

    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active);
    }

    if (updates.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    // Ajouter updated_at
    updates.push('updated_at = NOW()');

    const query = `
      UPDATE produits
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    params.push(id);

    await db.query(query, params);
  }

  /**
   * Supprimer un produit (soft delete en le désactivant)
   */
  async deleteProduit(id: number): Promise<void> {
    // Vérifier que le produit existe
    await this.getProduitById(id);

    // Vérifier qu'il n'y a pas de transactions associées
    const [transactions] = await db.query<RowDataPacket[]>(
      'SELECT id FROM lignes_transaction WHERE produit_id = ? LIMIT 1',
      [id]
    );

    if (transactions.length > 0) {
      // Si des transactions existent, on fait un soft delete
      await db.query(
        'UPDATE produits SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
        [id]
      );
    } else {
      // Sinon, on peut supprimer physiquement
      await db.query('DELETE FROM produits WHERE id = ?', [id]);
    }
  }

  /**
   * Récupérer les produits en alerte de stock
   */
  async getProduitsEnAlerte(): Promise<Produit[]> {
    const query = `
      SELECT p.*,
             c.nom as categorie_nom,
             CASE
               WHEN p.stock_actuel <= p.stock_minimum THEN 'critique'
               WHEN p.stock_actuel <= (p.stock_minimum * 1.5) THEN 'alerte'
               ELSE 'normal'
             END as niveau_stock
      FROM produits p
      LEFT JOIN categories_produits c ON p.categorie_id = c.id
      WHERE p.is_active = TRUE
        AND p.stock_actuel <= (p.stock_minimum * 1.5)
      ORDER BY
        CASE
          WHEN p.stock_actuel <= p.stock_minimum THEN 1
          ELSE 2
        END,
        p.stock_actuel ASC
    `;

    const [rows] = await db.query<Produit[]>(query);

    return rows;
  }

  /**
   * Ajuster le stock d'un produit (pour inventaire)
   * IMPORTANT: Cette méthode crée automatiquement un mouvement de stock
   */
  async ajusterStock(id: number, nouvelleQuantite: number, motif?: string, userId?: number): Promise<void> {
    // Vérifier que le produit existe
    const produit = await this.getProduitById(id);

    const stockAvant = produit.stock_actuel;
    const difference = nouvelleQuantite - stockAvant;

    // Si le stock ne change pas, rien à faire
    if (difference === 0) {
      return;
    }

    // Créer un mouvement de stock (qui mettra à jour automatiquement le stock du produit)
    await mouvementStockService.createMouvement({
      produit_id: id,
      type_mouvement: 'ajustement',
      quantite: difference,
      motif: motif || 'Ajustement manuel du stock',
      user_id: userId
    });
  }
}

export default new ProduitService();
