import { RowDataPacket } from 'mysql2';
import pool from '../config/database';

export interface JournalVentesResult {
  transactions: Array<{
    id: number;
    date: string;
    numero: string;
    type_paiement: string;
    montant: number;
    caissier: string;
    statut: string;
  }>;
  totaux: {
    especes: number;
    cheque: number;
    cb: number;
    total: number;
  };
  total_count?: number;
}

export interface RapportSessionsResult {
  sessions: Array<{
    id: number;
    date_ouverture: string;
    date_fermeture: string | null;
    caissier: string;
    fond_initial: number;
    solde_attendu: number;
    solde_valide: number | null;
    ecart: number | null;
    statut: string;
  }>;
  total_ecarts: number;
}

export interface ChiffreAffairesResult {
  data: Array<{
    periode: string;
    montant: number;
    nb_transactions: number;
  }>;
  total: number;
  nb_total_transactions: number;
  panier_moyen: number;
}

export interface VentesParProduitResult {
  produits: Array<{
    produit_id: number;
    produit_nom: string;
    categorie_nom: string;
    quantite_vendue: number;
    ca_total: number;
    prix_moyen: number;
  }>;
  par_categorie: Array<{
    categorie_nom: string;
    ca_total: number;
    quantite_vendue: number;
  }>;
}

export interface ValorisationStockResult {
  total_valeur_achat: number;
  total_valeur_vente: number;
  marge_potentielle: number;
  par_categorie: Array<{
    categorie_nom: string;
    valeur_achat: number;
    valeur_vente: number;
    marge: number;
  }>;
}

class ComptaService {
  /**
   * Journal des ventes - Liste toutes les transactions sur une période
   */
  async getJournalVentes(
    date_debut: string,
    date_fin: string,
    limit?: number,
    offset?: number
  ): Promise<JournalVentesResult> {
    // Compter le nombre total de transactions
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM transactions t
       WHERE DATE(t.created_at) >= ?
         AND DATE(t.created_at) <= ?
         AND t.type_paiement IN ('especes', 'cheque', 'cb')`,
      [date_debut, date_fin]
    );
    const total_count = countRows[0]?.total || 0;

    // Récupérer les transactions (exclure fond_initial, fermeture_caisse, monnaie)
    const limitClause = limit !== undefined ? `LIMIT ${limit}` : '';
    const offsetClause = offset !== undefined ? `OFFSET ${offset}` : '';

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        t.id,
        t.created_at as date,
        CONCAT('TR-', LPAD(t.id, 6, '0')) as numero,
        t.type_paiement,
        t.montant_total as montant,
        CONCAT(u.prenom, ' ', u.nom) as caissier,
        t.statut
       FROM transactions t
       INNER JOIN users u ON t.caissier_id = u.id
       WHERE DATE(t.created_at) >= ?
         AND DATE(t.created_at) <= ?
         AND t.type_paiement IN ('especes', 'cheque', 'cb')
       ORDER BY t.created_at DESC
       ${limitClause} ${offsetClause}`,
      [date_debut, date_fin]
    );

    // Calculer les totaux par type de paiement (uniquement transactions valides)
    const [totauxRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        type_paiement,
        SUM(montant_total) as total
       FROM transactions
       WHERE DATE(created_at) >= ?
         AND DATE(created_at) <= ?
         AND statut = 'validee'
         AND type_paiement IN ('especes', 'cheque', 'cb')
       GROUP BY type_paiement`,
      [date_debut, date_fin]
    );

    const totaux = {
      especes: 0,
      cheque: 0,
      cb: 0,
      total: 0
    };

    totauxRows.forEach((row: any) => {
      const montant = parseFloat(row.total) || 0;
      if (row.type_paiement === 'especes') totaux.especes = montant;
      else if (row.type_paiement === 'cheque') totaux.cheque = montant;
      else if (row.type_paiement === 'cb') totaux.cb = montant;
      totaux.total += montant;
    });

    return {
      transactions: rows.map((row: any) => ({
        ...row,
        montant: parseFloat(row.montant) || 0
      })),
      totaux,
      total_count
    };
  }

  /**
   * Rapport des sessions de caisse
   */
  async getRapportSessions(date_debut: string, date_fin: string): Promise<RapportSessionsResult> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        s.id,
        s.ouverte_at as date_ouverture,
        s.fermee_at as date_fermeture,
        CONCAT(u.prenom, ' ', u.nom) as caissier,
        s.fond_initial,
        s.solde_attendu,
        s.solde_valide,
        s.ecart,
        s.statut
       FROM sessions_caisse s
       INNER JOIN users u ON s.caissier_id = u.id
       WHERE DATE(s.ouverte_at) >= ?
         AND DATE(s.ouverte_at) <= ?
       ORDER BY s.ouverte_at DESC`,
      [date_debut, date_fin]
    );

    // Calculer le total des écarts (sessions validées uniquement)
    const total_ecarts = rows
      .filter((s: any) => s.statut === 'validee' && s.ecart !== null)
      .reduce((sum: number, s: any) => sum + Math.abs(parseFloat(s.ecart) || 0), 0);

    return {
      sessions: rows.map((row: any) => ({
        ...row,
        fond_initial: parseFloat(row.fond_initial) || 0,
        solde_attendu: parseFloat(row.solde_attendu) || 0,
        solde_valide: row.solde_valide ? parseFloat(row.solde_valide) : null,
        ecart: row.ecart ? parseFloat(row.ecart) : null
      })),
      total_ecarts
    };
  }

  /**
   * Chiffre d'affaires par période
   */
  async getChiffreAffaires(
    date_debut: string,
    date_fin: string,
    groupBy: 'jour' | 'mois' = 'jour'
  ): Promise<ChiffreAffairesResult> {
    const dateFormat = groupBy === 'jour'
      ? 'DATE(created_at)'
      : 'DATE_FORMAT(created_at, "%Y-%m")';

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        ${dateFormat} as periode,
        SUM(montant_total) as montant,
        COUNT(*) as nb_transactions
       FROM transactions
       WHERE DATE(created_at) >= ?
         AND DATE(created_at) <= ?
         AND statut = 'validee'
         AND type_paiement IN ('especes', 'cheque', 'cb')
       GROUP BY periode
       ORDER BY periode ASC`,
      [date_debut, date_fin]
    );

    const data = rows.map((row: any) => ({
      periode: row.periode,
      montant: parseFloat(row.montant) || 0,
      nb_transactions: parseInt(row.nb_transactions) || 0
    }));

    const total = data.reduce((sum, d) => sum + d.montant, 0);
    const nb_total_transactions = data.reduce((sum, d) => sum + d.nb_transactions, 0);
    const panier_moyen = nb_total_transactions > 0 ? total / nb_total_transactions : 0;

    return {
      data,
      total,
      nb_total_transactions,
      panier_moyen
    };
  }

  /**
   * Ventes par produit
   */
  async getVentesParProduit(date_debut: string, date_fin: string): Promise<VentesParProduitResult> {
    // Ventes par produit
    const [produitsRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.id as produit_id,
        p.nom as produit_nom,
        c.nom as categorie_nom,
        SUM(lt.quantite) as quantite_vendue,
        SUM(lt.prix_total) as ca_total,
        AVG(lt.prix_unitaire) as prix_moyen
       FROM lignes_transaction lt
       INNER JOIN transactions t ON lt.transaction_id = t.id
       INNER JOIN produits p ON lt.produit_id = p.id
       INNER JOIN categories_produits c ON p.categorie_id = c.id
       WHERE DATE(t.created_at) >= ?
         AND DATE(t.created_at) <= ?
         AND t.statut = 'validee'
       GROUP BY p.id, p.nom, c.nom
       ORDER BY ca_total DESC`,
      [date_debut, date_fin]
    );

    // Agrégation par catégorie
    const [categoriesRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        c.nom as categorie_nom,
        SUM(lt.prix_total) as ca_total,
        SUM(lt.quantite) as quantite_vendue
       FROM lignes_transaction lt
       INNER JOIN transactions t ON lt.transaction_id = t.id
       INNER JOIN produits p ON lt.produit_id = p.id
       INNER JOIN categories_produits c ON p.categorie_id = c.id
       WHERE DATE(t.created_at) >= ?
         AND DATE(t.created_at) <= ?
         AND t.statut = 'validee'
       GROUP BY c.nom
       ORDER BY ca_total DESC`,
      [date_debut, date_fin]
    );

    return {
      produits: produitsRows.map((row: any) => ({
        produit_id: row.produit_id,
        produit_nom: row.produit_nom,
        categorie_nom: row.categorie_nom,
        quantite_vendue: parseInt(row.quantite_vendue) || 0,
        ca_total: parseFloat(row.ca_total) || 0,
        prix_moyen: parseFloat(row.prix_moyen) || 0
      })),
      par_categorie: categoriesRows.map((row: any) => ({
        categorie_nom: row.categorie_nom,
        ca_total: parseFloat(row.ca_total) || 0,
        quantite_vendue: parseInt(row.quantite_vendue) || 0
      }))
    };
  }

  /**
   * Valorisation du stock actuel
   */
  async getValorisationStock(): Promise<ValorisationStockResult> {
    // Valorisation globale
    const [globalRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(p.stock_actuel * p.prix_achat) as total_valeur_achat,
        SUM(p.stock_actuel * p.prix_vente) as total_valeur_vente
       FROM produits p
       WHERE p.is_active = 1 AND p.stock_actuel > 0`
    );

    const total_valeur_achat = parseFloat(globalRows[0]?.total_valeur_achat) || 0;
    const total_valeur_vente = parseFloat(globalRows[0]?.total_valeur_vente) || 0;
    const marge_potentielle = total_valeur_vente - total_valeur_achat;

    // Par catégorie
    const [categoriesRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        c.nom as categorie_nom,
        SUM(p.stock_actuel * p.prix_achat) as valeur_achat,
        SUM(p.stock_actuel * p.prix_vente) as valeur_vente
       FROM produits p
       INNER JOIN categories_produits c ON p.categorie_id = c.id
       WHERE p.is_active = 1 AND p.stock_actuel > 0
       GROUP BY c.nom
       ORDER BY valeur_achat DESC`
    );

    return {
      total_valeur_achat,
      total_valeur_vente,
      marge_potentielle,
      par_categorie: categoriesRows.map((row: any) => {
        const valeur_achat = parseFloat(row.valeur_achat) || 0;
        const valeur_vente = parseFloat(row.valeur_vente) || 0;
        return {
          categorie_nom: row.categorie_nom,
          valeur_achat,
          valeur_vente,
          marge: valeur_vente - valeur_achat
        };
      })
    };
  }
}

export default new ComptaService();
