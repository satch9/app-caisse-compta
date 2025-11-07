import db from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import transactionService from './transactionService';

interface SessionCaisse extends RowDataPacket {
  id: number;
  tresorier_id: number;
  caissier_id: number;
  creee_at: Date;
  ouverte_at: Date | null;
  fermee_at: Date | null;
  validee_at: Date | null;
  fond_initial: number;
  solde_attendu: number | null;
  solde_declare: number | null;
  solde_valide: number | null;
  ecart: number | null;
  statut: 'en_attente_caissier' | 'ouverte' | 'en_attente_validation' | 'validee' | 'anomalie';
  note_ouverture: string | null;
  note_fermeture: string | null;
  note_validation: string | null;
  tresorier_nom?: string;
  tresorier_prenom?: string;
  caissier_nom?: string;
  caissier_prenom?: string;
}

class SessionCaisseService {
  /**
   * Créer une nouvelle session de caisse (Trésorier donne le fond)
   */
  async creerSession(
    tresorier_id: number,
    caissier_id: number,
    fond_initial: number,
    note_ouverture?: string
  ): Promise<number> {
    const query = `
      INSERT INTO sessions_caisse
        (tresorier_id, caissier_id, fond_initial, note_ouverture, statut)
      VALUES (?, ?, ?, ?, 'en_attente_caissier')
    `;

    const [result] = await db.query<ResultSetHeader>(
      query,
      [tresorier_id, caissier_id, fond_initial, note_ouverture || null]
    );

    return result.insertId;
  }

  /**
   * Caissier confirme la réception du fond et ouvre la caisse
   */
  async ouvrirSession(
    session_id: number,
    caissier_id: number,
    note_ouverture?: string
  ): Promise<void> {
    // Vérifier que la session existe et est en attente
    const session = await this.getSessionById(session_id);

    if (session.caissier_id !== caissier_id) {
      throw new Error('Cette session n\'est pas assignée à ce caissier');
    }

    if (session.statut !== 'en_attente_caissier') {
      throw new Error('Cette session ne peut pas être ouverte');
    }

    const query = `
      UPDATE sessions_caisse
      SET
        statut = 'ouverte',
        ouverte_at = NOW(),
        note_ouverture = COALESCE(?, note_ouverture)
      WHERE id = ? AND caissier_id = ?
    `;

    await db.query(query, [note_ouverture || null, session_id, caissier_id]);

    // Créer une transaction pour tracer le fond de caisse initial dans l'historique
    await transactionService.createTransaction({
      user_id: null, // Transaction système
      caissier_id: caissier_id,
      type_paiement: 'fond_initial',
      montant_total: session.fond_initial,
      lignes: [],
      montant_recu: session.fond_initial,
      montant_rendu: 0
    });
  }

  /**
   * Calculer le solde attendu d'une session
   */
  async calculerSoldeAttendu(session_id: number): Promise<number> {
    const session = await this.getSessionById(session_id);

    // Récupérer toutes les transactions de la session (pendant qu'elle était ouverte)
    const query = `
      SELECT
        type_paiement,
        montant_total,
        montant_recu,
        montant_rendu
      FROM transactions
      WHERE caissier_id = ?
        AND created_at >= ?
        AND created_at <= COALESCE(?, NOW())
        AND statut = 'validee'
    `;

    const [transactions] = await db.query<RowDataPacket[]>(
      query,
      [session.caissier_id, session.ouverte_at, session.fermee_at]
    );

    // Calcul : Fond initial + Ventes espèces - Monnaie rendue
    let solde = parseFloat(session.fond_initial.toString());

    for (const t of transactions) {
      if (t.type_paiement === 'especes') {
        solde += parseFloat(t.montant_total);
      } else if (t.type_paiement === 'monnaie') {
        // Pour la monnaie : on enlève ce qu'on a rendu
        solde -= parseFloat(t.montant_rendu || 0);
      }
    }

    return solde;
  }

  /**
   * Caissier ferme la caisse et déclare le solde
   */
  async fermerSession(
    session_id: number,
    caissier_id: number,
    solde_declare: number,
    note_fermeture?: string
  ): Promise<void> {
    const session = await this.getSessionById(session_id);

    if (session.caissier_id !== caissier_id) {
      throw new Error('Cette session n\'appartient pas à ce caissier');
    }

    if (session.statut !== 'ouverte') {
      throw new Error('Cette session ne peut pas être fermée');
    }

    // Calculer le solde attendu
    const solde_attendu = await this.calculerSoldeAttendu(session_id);
    const ecart = solde_declare - solde_attendu;

    const query = `
      UPDATE sessions_caisse
      SET
        statut = 'en_attente_validation',
        fermee_at = NOW(),
        solde_attendu = ?,
        solde_declare = ?,
        ecart = ?,
        note_fermeture = ?
      WHERE id = ? AND caissier_id = ?
    `;

    await db.query(query, [
      solde_attendu,
      solde_declare,
      ecart,
      note_fermeture || null,
      session_id,
      caissier_id
    ]);

    // Créer une transaction pour tracer la fermeture de caisse dans l'historique
    await transactionService.createTransaction({
      user_id: null, // Transaction système
      caissier_id: caissier_id,
      type_paiement: 'fermeture_caisse',
      montant_total: solde_declare,
      lignes: [],
      montant_recu: solde_declare,
      montant_rendu: 0
    });
  }

  /**
   * Trésorier valide la fermeture
   */
  async validerFermeture(
    session_id: number,
    tresorier_id: number,
    solde_valide: number,
    statut_final: 'validee' | 'anomalie',
    note_validation?: string
  ): Promise<void> {
    const session = await this.getSessionById(session_id);

    if (session.tresorier_id !== tresorier_id) {
      throw new Error('Seul le trésorier ayant créé la session peut la valider');
    }

    if (session.statut !== 'en_attente_validation') {
      throw new Error('Cette session ne peut pas être validée');
    }

    const query = `
      UPDATE sessions_caisse
      SET
        statut = ?,
        validee_at = NOW(),
        solde_valide = ?,
        note_validation = ?
      WHERE id = ? AND tresorier_id = ?
    `;

    await db.query(query, [
      statut_final,
      solde_valide,
      note_validation || null,
      session_id,
      tresorier_id
    ]);
  }

  /**
   * Récupérer une session par ID avec infos des utilisateurs
   */
  async getSessionById(session_id: number): Promise<SessionCaisse> {
    const query = `
      SELECT
        sc.*,
        t.nom AS tresorier_nom,
        t.prenom AS tresorier_prenom,
        c.nom AS caissier_nom,
        c.prenom AS caissier_prenom
      FROM sessions_caisse sc
      JOIN users t ON sc.tresorier_id = t.id
      JOIN users c ON sc.caissier_id = c.id
      WHERE sc.id = ?
    `;

    const [rows] = await db.query<SessionCaisse[]>(query, [session_id]);

    if (rows.length === 0) {
      throw new Error('Session de caisse non trouvée');
    }

    return rows[0];
  }

  /**
   * Récupérer les sessions avec filtres
   */
  async getSessions(filters: {
    caissier_id?: number;
    tresorier_id?: number;
    statut?: string;
    date_debut?: string;
    date_fin?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ sessions: SessionCaisse[]; total: number }> {
    let conditions: string[] = [];
    let params: any[] = [];

    if (filters.caissier_id) {
      conditions.push('sc.caissier_id = ?');
      params.push(filters.caissier_id);
    }

    if (filters.tresorier_id) {
      conditions.push('sc.tresorier_id = ?');
      params.push(filters.tresorier_id);
    }

    if (filters.statut) {
      conditions.push('sc.statut = ?');
      params.push(filters.statut);
    }

    if (filters.date_debut) {
      conditions.push('sc.creee_at >= ?');
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      conditions.push('sc.creee_at <= ?');
      params.push(filters.date_fin);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sessions_caisse sc
      ${whereClause}
    `;
    const [countRows] = await db.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Récupérer les sessions
    const query = `
      SELECT
        sc.*,
        t.nom AS tresorier_nom,
        t.prenom AS tresorier_prenom,
        c.nom AS caissier_nom,
        c.prenom AS caissier_prenom
      FROM sessions_caisse sc
      JOIN users t ON sc.tresorier_id = t.id
      JOIN users c ON sc.caissier_id = c.id
      ${whereClause}
      ORDER BY sc.creee_at DESC
      LIMIT ? OFFSET ?
    `;

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [rows] = await db.query<SessionCaisse[]>(query, [...params, limit, offset]);

    return { sessions: rows, total };
  }

  /**
   * Récupérer la session active d'un caissier
   */
  async getSessionActive(caissier_id: number): Promise<SessionCaisse | null> {
    const query = `
      SELECT
        sc.*,
        t.nom AS tresorier_nom,
        t.prenom AS tresorier_prenom,
        c.nom AS caissier_nom,
        c.prenom AS caissier_prenom
      FROM sessions_caisse sc
      JOIN users t ON sc.tresorier_id = t.id
      JOIN users c ON sc.caissier_id = c.id
      WHERE sc.caissier_id = ? AND sc.statut IN ('en_attente_caissier', 'ouverte')
      ORDER BY sc.creee_at DESC
      LIMIT 1
    `;

    const [rows] = await db.query<SessionCaisse[]>(query, [caissier_id]);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Récupérer les sessions en attente de validation pour le trésorier
   */
  async getSessionsEnAttenteValidation(tresorier_id?: number): Promise<SessionCaisse[]> {
    let query = `
      SELECT
        sc.*,
        t.nom AS tresorier_nom,
        t.prenom AS tresorier_prenom,
        c.nom AS caissier_nom,
        c.prenom AS caissier_prenom
      FROM sessions_caisse sc
      JOIN users t ON sc.tresorier_id = t.id
      JOIN users c ON sc.caissier_id = c.id
      WHERE sc.statut = 'en_attente_validation'
    `;

    const params: any[] = [];

    if (tresorier_id) {
      query += ' AND sc.tresorier_id = ?';
      params.push(tresorier_id);
    }

    query += ' ORDER BY sc.fermee_at ASC';

    const [rows] = await db.query<SessionCaisse[]>(query, params);

    return rows;
  }
}

export default new SessionCaisseService();
