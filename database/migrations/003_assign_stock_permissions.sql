-- Migration 003: Attribution des permissions de gestion des stocks aux rôles
-- Cette migration attribue les permissions stock aux différents rôles selon leurs responsabilités

-- =====================================================
-- 1. ATTRIBUTION DES PERMISSIONS STOCK AUX RÔLES
-- =====================================================

-- Récupérer les IDs des permissions stock
SET @perm_stock_consulter = (SELECT id FROM permissions WHERE code = 'stock.consulter');
SET @perm_stock_modifier = (SELECT id FROM permissions WHERE code = 'stock.modifier');
SET @perm_stock_ajouter = (SELECT id FROM permissions WHERE code = 'stock.ajouter_produit');
SET @perm_stock_supprimer = (SELECT id FROM permissions WHERE code = 'stock.supprimer_produit');
SET @perm_stock_inventaire = (SELECT id FROM permissions WHERE code = 'stock.faire_inventaire');
SET @perm_stock_commande = (SELECT id FROM permissions WHERE code = 'stock.passer_commande');

-- Récupérer les IDs des rôles
SET @role_admin = (SELECT id FROM roles WHERE nom = 'Admin');
SET @role_president = (SELECT id FROM roles WHERE nom = 'Président');
SET @role_tresorier = (SELECT id FROM roles WHERE nom = 'Trésorier');
SET @role_secretaire = (SELECT id FROM roles WHERE nom = 'Secrétaire');
SET @role_caissier = (SELECT id FROM roles WHERE nom = 'Caissier/Bénévole');
SET @role_be = (SELECT id FROM roles WHERE nom = 'BE');

-- =====================================================
-- Admin : TOUTES les permissions stock
-- =====================================================
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_admin, @perm_stock_consulter),
  (@role_admin, @perm_stock_modifier),
  (@role_admin, @perm_stock_ajouter),
  (@role_admin, @perm_stock_supprimer),
  (@role_admin, @perm_stock_inventaire),
  (@role_admin, @perm_stock_commande);

-- =====================================================
-- Trésorier : TOUTES les permissions stock
-- (Responsable de la gestion complète des stocks)
-- =====================================================
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_tresorier, @perm_stock_consulter),
  (@role_tresorier, @perm_stock_modifier),
  (@role_tresorier, @perm_stock_ajouter),
  (@role_tresorier, @perm_stock_supprimer),
  (@role_tresorier, @perm_stock_inventaire),
  (@role_tresorier, @perm_stock_commande);

-- =====================================================
-- Président : Consultation + Inventaire
-- (Peut superviser et faire des inventaires de contrôle)
-- =====================================================
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_president, @perm_stock_consulter),
  (@role_president, @perm_stock_inventaire);

-- =====================================================
-- Secrétaire : Consultation + Ajout produit
-- (Peut consulter et ajouter des produits occasionnellement)
-- =====================================================
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_secretaire, @perm_stock_consulter),
  (@role_secretaire, @perm_stock_ajouter);

-- =====================================================
-- Caissier/Bénévole : Consultation uniquement (lecture seule)
-- (Besoin de voir le stock pour les ventes)
-- =====================================================
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_caissier, @perm_stock_consulter);

-- =====================================================
-- BE (Breveté d'État) : Consultation uniquement (lecture seule)
-- (Besoin de voir le stock pour les cours/activités)
-- =====================================================
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_be, @perm_stock_consulter);

-- =====================================================
-- DOCUMENTATION
-- =====================================================

/*
RÉSUMÉ DES PERMISSIONS STOCK PAR RÔLE :

┌──────────────────┬──────────┬──────────┬─────────┬───────────┬────────────┬──────────┐
│ Rôle             │ Consulter│ Modifier │ Ajouter │ Supprimer │ Inventaire │ Commande │
├──────────────────┼──────────┼──────────┼─────────┼───────────┼────────────┼──────────┤
│ Admin            │    ✓     │    ✓     │    ✓    │     ✓     │     ✓      │    ✓     │
│ Trésorier        │    ✓     │    ✓     │    ✓    │     ✓     │     ✓      │    ✓     │
│ Président        │    ✓     │    ✗     │    ✗    │     ✗     │     ✓      │    ✗     │
│ Secrétaire       │    ✓     │    ✗     │    ✓    │     ✗     │     ✗      │    ✗     │
│ Caissier/Bénévole│    ✓     │    ✗     │    ✗    │     ✗     │     ✗      │    ✗     │
│ BE               │    ✓     │    ✗     │    ✗    │     ✗     │     ✗      │    ✗     │
└──────────────────┴──────────┴──────────┴─────────┴───────────┴────────────┴──────────┘

PHILOSOPHIE DE DISTRIBUTION :
- Trésorier = Gestionnaire principal des stocks (gestion complète)
- Président = Supervision et contrôle (consultation + inventaires)
- Secrétaire = Support administratif (consultation + ajout occasionnel)
- Caissiers/BE = Besoin opérationnel (lecture seule pour ventes/cours)
*/
