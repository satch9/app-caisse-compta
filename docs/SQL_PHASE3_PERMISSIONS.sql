-- ================================================================
-- PHASE 3 - Ajout des Permissions (OPTIONNEL)
-- Date: 2025-11-12
-- ================================================================
-- À exécuter UNIQUEMENT si les tables permissions et roles existent
-- ================================================================

-- ================================================================
-- AJOUT PERMISSION admin.consulter_logs
-- ================================================================

INSERT INTO permissions (code, categorie, nom, description)
VALUES (
  'admin.consulter_logs',
  'admin',
  'Consulter les logs système',
  'Permet de visualiser l''historique des actions dans l''application'
);

-- Attribuer la permission au rôle ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code = 'admin.consulter_logs';


-- ================================================================
-- AJOUT PERMISSION admin.gerer_systeme
-- ================================================================

INSERT INTO permissions (code, categorie, nom, description)
VALUES (
  'admin.gerer_systeme',
  'admin',
  'Gérer le système',
  'Permet de gérer les paramètres système (nettoyage logs, configuration, etc.)'
);

-- Attribuer la permission au rôle ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code = 'admin.gerer_systeme';


-- ================================================================
-- VÉRIFICATIONS
-- ================================================================

-- Vérifier que les permissions ont été créées
SELECT
  p.id,
  p.code,
  p.nom,
  p.categorie
FROM permissions p
WHERE p.code IN ('admin.consulter_logs', 'admin.gerer_systeme')
ORDER BY p.code;

-- Vérifier que les permissions sont attribuées au rôle ADMIN
SELECT
  r.code AS role_code,
  r.nom AS role_nom,
  p.code AS permission_code,
  p.nom AS permission_nom
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'ADMIN'
  AND p.code IN ('admin.consulter_logs', 'admin.gerer_systeme')
ORDER BY p.code;
