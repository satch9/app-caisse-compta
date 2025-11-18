import db from '../config/database';
import { RowDataPacket } from 'mysql2';
import { PermissionFull, RoleFull } from '../types/database';

interface PermissionRow extends RowDataPacket {
  code: string;
}

interface CustomPermissionRow extends RowDataPacket {
  code: string;
  granted: boolean;
}

interface RoleRow extends RowDataPacket {
  id: number;
  code: string;
  nom: string;
}

class PermissionService {
  /**
   * Récupère tous les rôles d'un utilisateur
   */
  async getUserRoles(userId: number): Promise<RoleRow[]> {
    const query = `
      SELECT r.id, r.code, r.nom
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `;
    const [rows] = await db.query<RoleRow[]>(query, [userId]);
    return rows;
  }

  /**
   * Récupère toutes les permissions associées aux rôles d'un utilisateur
   */
  async getRolePermissions(userId: number): Promise<string[]> {
    const query = `
      SELECT DISTINCT p.code
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `;
    const [rows] = await db.query<PermissionRow[]>(query, [userId]);
    return rows.map(row => row.code);
  }

  /**
   * Récupère les permissions additionnelles de l'utilisateur
   */
  async getUserCustomPermissions(userId: number): Promise<Record<string, boolean>> {
    const query = `
      SELECT p.code, up.granted
      FROM permissions p
      INNER JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = ?
    `;
    const [rows] = await db.query<CustomPermissionRow[]>(query, [userId]);
    return rows.reduce((acc, row) => {
      acc[row.code] = row.granted;
      return acc;
    }, {} as Record<string, boolean>);
  }

  /**
   * Récupère toutes les permissions effectives d'un utilisateur
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    // 1. Permissions des rôles
    const rolePermissions = await this.getRolePermissions(userId);

    // 2. Permissions additionnelles
    const customPermissions = await this.getUserCustomPermissions(userId);

    // 3. Fusion : rôles + additionnelles accordées - révoquées
    const effectivePermissions = new Set(rolePermissions);

    for (const [permission, granted] of Object.entries(customPermissions)) {
      if (granted) {
        effectivePermissions.add(permission);
      } else {
        effectivePermissions.delete(permission);
      }
    }

    return Array.from(effectivePermissions);
  }

  /**
   * Vérifie si un utilisateur possède une permission
   */
  async userCan(userId: number, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    // Support des wildcards (ex: caisse.* correspond à caisse.encaisser_especes)
    return permissions.some(p => {
      if (p === permission) return true;
      if (p.endsWith('.*')) {
        const prefix = p.slice(0, -2);
        return permission.startsWith(prefix + '.');
      }
      return false;
    });
  }

  /**
   * Assigne un rôle à un utilisateur
   */
  async assignRole(userId: number, roleCode: string, assignedBy?: number): Promise<void> {
    const query = `
      INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
      SELECT ?, r.id, ?
      FROM roles r
      WHERE r.code = ?
    `;
    await db.query(query, [userId, assignedBy || null, roleCode]);
  }

  /**
   * Retire un rôle à un utilisateur
   */
  async removeRole(userId: number, roleCode: string): Promise<void> {
    const query = `
      DELETE ur FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ? AND r.code = ?
    `;
    await db.query(query, [userId, roleCode]);
  }

  /**
   * Ajoute une permission additionnelle à un utilisateur
   */
  async grantPermission(userId: number, permissionCode: string, assignedBy?: number): Promise<void> {
    const query = `
      INSERT INTO user_permissions (user_id, permission_id, granted, assigned_by)
      SELECT ?, p.id, TRUE, ?
      FROM permissions p
      WHERE p.code = ?
      ON DUPLICATE KEY UPDATE granted = TRUE, assigned_by = ?
    `;
    await db.query(query, [userId, assignedBy || null, permissionCode, assignedBy || null]);
  }

  /**
   * Révoque une permission à un utilisateur
   */
  async revokePermission(userId: number, permissionCode: string): Promise<void> {
    const query = `
      INSERT INTO user_permissions (user_id, permission_id, granted)
      SELECT ?, p.id, FALSE
      FROM permissions p
      WHERE p.code = ?
      ON DUPLICATE KEY UPDATE granted = FALSE
    `;
    await db.query(query, [userId, permissionCode]);
  }

  /**
   * Récupère toutes les permissions disponibles
   */
  async getAllPermissions(): Promise<PermissionFull[]> {
    const query = `
      SELECT id, code, categorie, nom, description
      FROM permissions
      ORDER BY categorie, nom
    `;
    const [rows] = await db.query<PermissionFull[]>(query);
    return rows;
  }

  /**
   * Récupère tous les rôles disponibles
   */
  async getAllRoles(): Promise<RoleFull[]> {
    const query = `
      SELECT id, code, nom, description
      FROM roles
      ORDER BY nom
    `;
    const [rows] = await db.query<RoleFull[]>(query);
    return rows;
  }

  /**
   * Récupère la matrice permissions (quels rôles ont quelles permissions)
   * Format: { roleCode: { permissionCode: boolean } }
   */
  async getRolePermissionsMatrix(): Promise<Record<string, Record<string, boolean>>> {
    const query = `
      SELECT r.code as role_code, p.code as permission_code
      FROM roles r
      CROSS JOIN permissions p
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND p.id = rp.permission_id
      WHERE rp.permission_id IS NOT NULL
      ORDER BY r.code, p.code
    `;

    const [rows] = await db.query<RowDataPacket[]>(query);

    const matrix: Record<string, Record<string, boolean>> = {};

    for (const row of rows) {
      const roleCode = row.role_code as string;
      const permissionCode = row.permission_code as string;

      if (!matrix[roleCode]) {
        matrix[roleCode] = {};
      }
      matrix[roleCode][permissionCode] = true;
    }

    return matrix;
  }
}

export default new PermissionService();
