import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Types pour les résultats de requêtes MySQL
 */

// Type générique pour INSERT/UPDATE/DELETE
export interface MysqlInsertResult extends ResultSetHeader {
  insertId: number;
  affectedRows: number;
}

export interface MysqlUpdateResult extends ResultSetHeader {
  affectedRows: number;
  changedRows: number;
}

export interface MysqlDeleteResult extends ResultSetHeader {
  affectedRows: number;
}

// Type pour COUNT(*)
export interface CountResult extends RowDataPacket {
  total: number;
}

// Types pour les tables

export interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  nom: string;
  prenom: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserPublic {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  is_active: boolean;
}

export interface TransactionRow extends RowDataPacket {
  id: number;
  user_id: number | null;
  caissier_id: number;
  type_paiement: string;
  montant_total: number;
  reference_cheque: string | null;
  reference_cb: string | null;
  montant_recu: number | null;
  montant_rendu: number | null;
  statut: string;
  annulee_par: number | null;
  annulee_at: Date | null;
  raison_annulation: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionWithUser extends TransactionRow {
  user_nom: string | null;
  user_prenom: string | null;
  caissier_nom: string;
  caissier_prenom: string;
}

export interface LigneTransactionRow extends RowDataPacket {
  id: number;
  transaction_id: number;
  produit_id: number;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  created_at: Date;
}

export interface LigneTransactionWithProduct extends LigneTransactionRow {
  produit_nom: string;
}

export interface ProduitRow extends RowDataPacket {
  id: number;
  nom: string;
  description: string | null;
  prix_vente: number;
  prix_achat: number;
  stock_actuel: number;
  stock_min: number;
  stock_max: number;
  categorie_id: number;
  code_barre: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProduitWithStock extends ProduitRow {
  stock_actuel: number;
  nom: string;
}

export interface CompteRow extends RowDataPacket {
  id: number;
  user_id: number;
  solde: number;
  created_at: Date;
  updated_at: Date;
}

export interface RoleRow extends RowDataPacket {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  created_at: Date;
}

export interface PermissionRow extends RowDataPacket {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  created_at: Date;
}

export interface UserRoleRow extends RowDataPacket {
  user_id: number;
  role_id: number;
  created_at: Date;
}

export interface RolePermissionRow extends RowDataPacket {
  role_id: number;
  permission_id: number;
  created_at: Date;
}

export interface UserPermissionRow extends RowDataPacket {
  user_id: number;
  permission_id: number;
  created_at: Date;
}

export interface SessionCaisseRow extends RowDataPacket {
  id: number;
  caissier_id: number;
  fond_initial: number;
  fond_final: number | null;
  statut: 'ouverte' | 'fermee';
  opened_at: Date;
  closed_at: Date | null;
}

export interface LogRow extends RowDataPacket {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: Date;
}

export interface PermissionFull extends RowDataPacket {
  id: number;
  code: string;
  categorie: string | null;
  nom: string;
  description: string | null;
}

export interface RoleFull extends RowDataPacket {
  id: number;
  code: string;
  nom: string;
  description: string | null;
}

export interface TopProduitVendu extends RowDataPacket {
  produit_id: number;
  nom: string;
  categorie_nom: string;
  quantite_vendue: number;
  ca_genere: number;
}

export interface StockParCategorie extends RowDataPacket {
  categorie_id: number;
  categorie_nom: string;
  nb_produits: number;
  valeur_stock: number;
}
