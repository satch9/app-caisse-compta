import db from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import fs from 'fs/promises';
import path from 'path';

interface SystemLog extends RowDataPacket {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: Date;
  user_email?: string;
  user_nom?: string;
  user_prenom?: string;
}

interface LogFilters {
  user_id?: number;
  action?: string;
  entity_type?: string;
  date_debut?: string;
  date_fin?: string;
  limit?: number;
  offset?: number;
}

class LogService {
  /**
   * Créer un log système
   */
  async createLog(data: {
    user_id?: number;
    action: string;
    entity_type?: string;
    entity_id?: number;
    details?: string;
    ip_address?: string;
  }): Promise<number> {
    const query = `
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query<ResultSetHeader>(query, [
      data.user_id || null,
      data.action,
      data.entity_type || null,
      data.entity_id || null,
      data.details || null,
      data.ip_address || null,
    ]);

    return result.insertId;
  }

  /**
   * Récupérer les logs avec filtres
   */
  async getLogs(filters: LogFilters = {}): Promise<{ logs: SystemLog[]; total: number }> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.user_id) {
      conditions.push('sl.user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.action) {
      conditions.push('sl.action = ?');
      params.push(filters.action);
    }

    if (filters.entity_type) {
      conditions.push('sl.entity_type = ?');
      params.push(filters.entity_type);
    }

    if (filters.date_debut) {
      conditions.push('sl.created_at >= ?');
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      conditions.push('sl.created_at <= ?');
      params.push(filters.date_fin);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM system_logs sl
      ${whereClause}
    `;

    const [countRows] = await db.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0]?.total || 0;

    // Récupérer les logs
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const logsQuery = `
      SELECT
        sl.*,
        u.email as user_email,
        u.nom as user_nom,
        u.prenom as user_prenom
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [logs] = await db.query<SystemLog[]>(logsQuery, [...params, limit, offset]);

    return { logs, total };
  }

  /**
   * Récupérer les types d'actions uniques
   */
  async getUniqueActions(): Promise<string[]> {
    const query = `
      SELECT DISTINCT action
      FROM system_logs
      ORDER BY action
    `;

    const [rows] = await db.query<RowDataPacket[]>(query);
    return rows.map(row => row.action);
  }

  /**
   * Récupérer les types d'entités uniques
   */
  async getUniqueEntityTypes(): Promise<string[]> {
    const query = `
      SELECT DISTINCT entity_type
      FROM system_logs
      WHERE entity_type IS NOT NULL
      ORDER BY entity_type
    `;

    const [rows] = await db.query<RowDataPacket[]>(query);
    return rows.map(row => row.entity_type);
  }

  /**
   * Récupérer les logs à supprimer (plus anciens que X jours) pour export
   */
  async getLogsToDelete(days: number): Promise<SystemLog[]> {
    const query = `
      SELECT
        sl.*,
        u.email as user_email,
        u.nom as user_nom,
        u.prenom as user_prenom
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE sl.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY sl.created_at ASC
    `;

    const [logs] = await db.query<SystemLog[]>(query, [days]);
    return logs;
  }

  /**
   * Sauvegarder les logs dans un fichier JSON sur le serveur
   */
  async saveLogsToFile(logs: SystemLog[], days: number): Promise<string> {
    // Créer le dossier archives s'il n'existe pas
    const archivesDir = path.join(process.cwd(), 'archives', 'logs');
    await fs.mkdir(archivesDir, { recursive: true });

    // Nom du fichier avec date et nombre de logs
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `logs_archive_${timestamp}_${logs.length}_logs.json`;
    const filepath = path.join(archivesDir, filename);

    // Préparer les données à exporter
    const exportData = {
      success: true,
      logs: logs,
      total: logs.length,
      exportDate: new Date().toISOString(),
      olderThanDays: days,
      archivedBy: 'system',
    };

    // Écrire le fichier
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf-8');

    return filepath;
  }

  /**
   * Supprimer les logs plus anciens que X jours
   */
  async deleteOldLogs(days: number): Promise<number> {
    const query = `
      DELETE FROM system_logs
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const [result] = await db.query<ResultSetHeader>(query, [days]);
    return result.affectedRows;
  }
}

export default new LogService();
