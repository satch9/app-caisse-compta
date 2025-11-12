-- ================================================================
-- PHASE 3 - Scripts SQL à Exécuter
-- Date: 2025-11-12
-- ================================================================

-- ================================================================
-- 1. CRÉATION TABLE SYSTEM_LOGS
-- ================================================================
-- Table pour stocker l'historique des actions dans l'application

CREATE TABLE IF NOT EXISTS system_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT COMMENT 'ID de l''utilisateur qui a effectué l''action (NULL si action système)',
  action VARCHAR(100) NOT NULL COMMENT 'Type d''action effectuée (ex: login, create_user, update_produit)',
  entity_type VARCHAR(50) COMMENT 'Type d''entité concernée (ex: user, produit, transaction)',
  entity_id INT COMMENT 'ID de l''entité concernée',
  details TEXT COMMENT 'Détails supplémentaires de l''action (JSON ou texte)',
  ip_address VARCHAR(45) COMMENT 'Adresse IP de l''utilisateur (support IPv6)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date et heure de l''action',

  -- Indexes pour optimiser les requêtes
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at),

  -- Contrainte de clé étrangère (suppression SET NULL si user supprimé)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des actions système pour audit et traçabilité';


-- ================================================================
-- 2. AJOUT PERMISSION admin.consulter_logs
-- ================================================================
-- Permission pour consulter les logs système

INSERT INTO permissions (code, categorie, nom, description)
VALUES (
  'admin.consulter_logs',
  'admin',
  'Consulter les logs système',
  'Permet de visualiser l''historique des actions dans l''application'
) ON DUPLICATE KEY UPDATE
  nom = VALUES(nom),
  description = VALUES(description);

-- Attribuer la permission au rôle ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code = 'admin.consulter_logs'
ON DUPLICATE KEY UPDATE role_id = role_id;


-- ================================================================
-- 3. (OPTIONNEL) PERMISSION admin.gerer_systeme
-- ================================================================
-- Permission pour gérer les paramètres système (nettoyage logs, etc.)

INSERT INTO permissions (code, categorie, nom, description)
VALUES (
  'admin.gerer_systeme',
  'admin',
  'Gérer le système',
  'Permet de gérer les paramètres système (nettoyage logs, configuration, etc.)'
) ON DUPLICATE KEY UPDATE
  nom = VALUES(nom),
  description = VALUES(description);

-- Attribuer la permission au rôle ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code = 'admin.gerer_systeme'
ON DUPLICATE KEY UPDATE role_id = role_id;


-- ================================================================
-- 4. VÉRIFICATIONS
-- ================================================================

-- Vérifier que la table a été créée
SELECT
  TABLE_NAME,
  CREATE_TIME,
  TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'system_logs';

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


-- ================================================================
-- NOTES D'UTILISATION
-- ================================================================
--
-- 1. Exécutez ces scripts dans l'ordre sur votre base de données
-- 2. Les scripts utilisent ON DUPLICATE KEY UPDATE pour être réexécutables
-- 3. Après exécution, vérifiez les résultats avec les requêtes de vérification
--
-- Pour tester le système de logs :
-- - Connectez-vous en tant qu'ADMIN
-- - Allez sur Admin > Logs système
-- - Vous devriez voir la page (vide au début)
--
-- Pour commencer à logger des actions :
-- - Utilisez logService.createLog() dans votre code backend
-- - Exemple :
--   await logService.createLog({
--     user_id: req.user.id,
--     action: 'create_user',
--     entity_type: 'user',
--     entity_id: newUserId,
--     details: 'Nouvel utilisateur créé',
--     ip_address: req.ip
--   });
--
-- ================================================================
