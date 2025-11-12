-- ================================================================
-- PHASE 3 - Scripts SQL SIMPLIFIÉ
-- Date: 2025-11-12
-- ================================================================
-- Ce script crée uniquement la table system_logs
-- Les permissions seront ajoutées via l'interface si nécessaire
-- ================================================================

-- ================================================================
-- CRÉATION TABLE SYSTEM_LOGS
-- ================================================================

CREATE TABLE IF NOT EXISTS system_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- VÉRIFICATION
-- ================================================================

-- Afficher les informations de la table créée
DESCRIBE system_logs;

-- ================================================================
-- NOTES
-- ================================================================
--
-- La table system_logs a été créée avec succès.
--
-- Les permissions admin.consulter_logs et admin.gerer_systeme
-- peuvent être ajoutées de deux façons :
--
-- OPTION 1 : Via l'interface Admin (recommandé si vous avez déjà des rôles)
--   1. Connectez-vous en tant qu'ADMIN
--   2. Allez sur Admin > Rôles & Permissions
--   3. Les permissions seront visibles si elles existent dans votre base
--
-- OPTION 2 : Via SQL (si la structure permissions existe)
--   Exécutez le fichier SQL_PHASE3_PERMISSIONS.sql
--
-- Pour tester :
--   - La page Admin > Logs système devrait maintenant être accessible
--   - Elle sera vide au début (aucun log enregistré)
--
-- ================================================================
