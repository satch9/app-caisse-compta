-- Migration 005 : Ajout de la permission de gestion des catégories produits
-- Cette migration crée la permission stock.gerer_categories et l'associe aux rôles concernés.

-- =====================================================
-- 1. CRÉATION DE LA NOUVELLE PERMISSION (SI ABSENTE)
-- =====================================================

INSERT INTO permissions (code, categorie, nom, description)
SELECT 'stock.gerer_categories', 'stock', 'Gérer catégories', 'Créer, modifier et supprimer des catégories de produits'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE code = 'stock.gerer_categories'
);

-- Récupération (ou création) de l'ID de la permission
SET @perm_stock_gerer_categories = (
  SELECT id FROM permissions WHERE code = 'stock.gerer_categories'
);

-- =====================================================
-- 2. ATTRIBUTION AUX RÔLES
-- =====================================================

-- Récupération des rôles par leur code
SET @role_admin = (SELECT id FROM roles WHERE code = 'ADMIN');
SET @role_tresorier = (SELECT id FROM roles WHERE code = 'TRESORIER');

-- Attribution de la permission
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_admin, @perm_stock_gerer_categories),
  (@role_tresorier, @perm_stock_gerer_categories);

-- =====================================================
-- 3. DOCUMENTATION
-- =====================================================
/*
Rôles impactés :
  - ADMIN : garde l'accès complet au périmètre stock.
  - TRESORIER : possède la gestion opérationnelle du stock, y compris les catégories.

Pour étendre la permission à d'autres rôles :
  INSERT IGNORE INTO role_permissions (role_id, permission_id)
  VALUES (<role_id>, @perm_stock_gerer_categories);
*/

