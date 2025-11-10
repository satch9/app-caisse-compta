-- Migration 006 : Création des tables pour la gestion des approvisionnements
-- Système hybride : achats directs (supermarché) + commandes fournisseurs

-- =====================================================
-- 1. TABLE APPROVISIONNEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS approvisionnements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('achat_direct', 'commande_fournisseur') NOT NULL,

  -- Champs communs
  montant_total DECIMAL(10,2) NOT NULL,
  date_achat DATETIME NOT NULL,
  user_id INT NOT NULL,
  notes TEXT NULL,

  -- Pour achats directs au supermarché
  magasin VARCHAR(255) NULL,
  ticket_photo_url VARCHAR(500) NULL,

  -- Pour commandes fournisseurs (NULL si achat direct)
  fournisseur_nom VARCHAR(255) NULL,
  fournisseur_contact VARCHAR(255) NULL,
  date_commande DATE NULL,
  date_livraison_prevue DATE NULL,
  date_livraison_reelle DATETIME NULL,
  statut ENUM('en_attente', 'livree', 'annulee') NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_type (type),
  INDEX idx_date_achat (date_achat),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. TABLE LIGNES D'APPROVISIONNEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS lignes_approvisionnements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  approvisionnement_id INT NOT NULL,
  produit_id INT NOT NULL,
  quantite INT NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (approvisionnement_id) REFERENCES approvisionnements(id) ON DELETE CASCADE,
  FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE RESTRICT,
  INDEX idx_approvisionnement (approvisionnement_id),
  INDEX idx_produit (produit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. VUE POUR FACILITER LES REQUÊTES
-- =====================================================

CREATE OR REPLACE VIEW v_approvisionnements AS
SELECT
  a.id,
  a.type,
  a.montant_total,
  a.date_achat,
  a.magasin,
  a.fournisseur_nom,
  a.statut,
  a.notes,
  CONCAT(u.prenom, ' ', u.nom) AS user_nom,
  a.created_at,
  COUNT(la.id) AS nombre_lignes
FROM approvisionnements a
INNER JOIN users u ON a.user_id = u.id
LEFT JOIN lignes_approvisionnements la ON a.id = la.approvisionnement_id
GROUP BY a.id, a.type, a.montant_total, a.date_achat, a.magasin,
         a.fournisseur_nom, a.statut, a.notes, u.prenom, u.nom, a.created_at
ORDER BY a.date_achat DESC;

-- =====================================================
-- 4. PERMISSIONS
-- =====================================================

-- Créer les permissions
INSERT INTO permissions (code, categorie, nom, description)
SELECT 'stock.enregistrer_achat', 'stock', 'Enregistrer un achat', 'Enregistrer des achats directs au supermarché'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE code = 'stock.enregistrer_achat'
);

INSERT INTO permissions (code, categorie, nom, description)
SELECT 'stock.gerer_commandes', 'stock', 'Gérer commandes fournisseurs', 'Créer et gérer des commandes auprès de fournisseurs'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE code = 'stock.gerer_commandes'
);

-- Récupérer les IDs des permissions
SET @perm_enregistrer_achat = (SELECT id FROM permissions WHERE code = 'stock.enregistrer_achat');
SET @perm_gerer_commandes = (SELECT id FROM permissions WHERE code = 'stock.gerer_commandes');

-- Récupérer les IDs des rôles
SET @role_admin = (SELECT id FROM roles WHERE code = 'ADMIN');
SET @role_tresorier = (SELECT id FROM roles WHERE code = 'TRESORIER');
SET @role_president = (SELECT id FROM roles WHERE code = 'PRESIDENT');
SET @role_be = (SELECT id FROM roles WHERE code = 'BE');

-- Attribution des permissions
-- Enregistrer un achat : accessible au bureau (Admin, Trésorier, Président, BE)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_admin, @perm_enregistrer_achat),
  (@role_tresorier, @perm_enregistrer_achat),
  (@role_president, @perm_enregistrer_achat),
  (@role_be, @perm_enregistrer_achat);

-- Gérer commandes : Admin et Trésorier uniquement
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_admin, @perm_gerer_commandes),
  (@role_tresorier, @perm_gerer_commandes);

-- =====================================================
-- 5. DOCUMENTATION
-- =====================================================

/*
USAGE :

1. ACHAT DIRECT (cas principal - supermarché)
   - type = 'achat_direct'
   - magasin = nom du magasin
   - montant_total = total du ticket
   - statut = NULL

2. COMMANDE FOURNISSEUR (cas avancé)
   - type = 'commande_fournisseur'
   - fournisseur_nom + fournisseur_contact
   - statut = 'en_attente' puis 'livree'
   - magasin = NULL

WORKFLOW :
1. Créer un approvisionnement
2. Ajouter des lignes (produits + quantités)
3. Si type = 'achat_direct' OU statut = 'livree' :
   → Créer automatiquement les mouvements d'entrée
   → Mettre à jour les stocks
*/
