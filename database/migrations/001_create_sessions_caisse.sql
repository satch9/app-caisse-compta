-- Migration 001: Création de la table sessions_caisse et permissions associées
-- Cette table gère le cycle de vie complet des sessions de caisse avec workflow de validation

-- =====================================================
-- 1. CRÉATION DE LA TABLE sessions_caisse
-- =====================================================

CREATE TABLE IF NOT EXISTS sessions_caisse (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tresorier_id INT NOT NULL COMMENT 'Trésorier qui crée la session et attribue le fond',
  caissier_id INT NOT NULL COMMENT 'Caissier qui gère la session',
  creee_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création de la session',
  ouverte_at TIMESTAMP NULL COMMENT 'Date d\'ouverture par le caissier',
  fermee_at TIMESTAMP NULL COMMENT 'Date de fermeture par le caissier',
  validee_at TIMESTAMP NULL COMMENT 'Date de validation par le trésorier',

  -- Montants
  fond_initial DECIMAL(10, 2) NOT NULL COMMENT 'Fond de caisse initial attribué',
  solde_attendu DECIMAL(10, 2) NULL COMMENT 'Solde calculé automatiquement (fond + ventes - monnaie)',
  solde_declare DECIMAL(10, 2) NULL COMMENT 'Solde déclaré par le caissier à la fermeture',
  solde_valide DECIMAL(10, 2) NULL COMMENT 'Solde recompté par le trésorier lors de la validation',
  ecart DECIMAL(10, 2) NULL COMMENT 'Écart entre solde attendu et solde validé',

  -- État de la session
  statut ENUM(
    'en_attente_caissier',      -- Session créée, attend ouverture par caissier
    'ouverte',                   -- Session active, ventes en cours
    'en_attente_validation',     -- Session fermée, attend validation trésorier
    'validee',                   -- Session validée avec ou sans écart acceptable
    'anomalie'                   -- Session validée avec anomalie (écart important)
  ) NOT NULL DEFAULT 'en_attente_caissier',

  -- Notes et commentaires
  note_ouverture TEXT NULL COMMENT 'Note optionnelle du caissier à l\'ouverture',
  note_fermeture TEXT NULL COMMENT 'Note optionnelle du caissier à la fermeture',
  note_validation TEXT NULL COMMENT 'Note du trésorier lors de la validation',

  -- Contraintes
  FOREIGN KEY (tresorier_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (caissier_id) REFERENCES users(id) ON DELETE RESTRICT,

  -- Index pour performance
  INDEX idx_statut (statut),
  INDEX idx_caissier (caissier_id),
  INDEX idx_tresorier (tresorier_id),
  INDEX idx_dates (creee_at, ouverte_at, fermee_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Gestion des sessions de caisse avec workflow trésorier-caissier';

-- =====================================================
-- 2. CRÉATION DES PERMISSIONS
-- =====================================================

-- Vérifier si les permissions existent déjà avant de les insérer
INSERT INTO permissions (code, nom, description, categorie)
SELECT * FROM (
  SELECT 'caisse.donner_fond_initial' as code,
         'caisse.donner_fond_initial' as nom,
         'Créer une session de caisse et attribuer un fond initial à un caissier' as description,
         'caisse' as categorie
  UNION ALL
  SELECT 'caisse.recevoir_fond',
         'caisse.recevoir_fond',
         'Recevoir un fond de caisse et ouvrir une session',
         'caisse'
  UNION ALL
  SELECT 'caisse.fermer_caisse',
         'caisse.fermer_caisse',
         'Fermer une session de caisse et déclarer le solde final',
         'caisse'
  UNION ALL
  SELECT 'caisse.valider_fermeture',
         'caisse.valider_fermeture',
         'Valider la fermeture d\'une session et recompter le solde',
         'caisse'
  UNION ALL
  SELECT 'caisse.consulter_sessions',
         'caisse.consulter_sessions',
         'Consulter l\'historique des sessions de caisse',
         'caisse'
) AS new_permissions
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE code = new_permissions.code
);

-- =====================================================
-- 3. ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- =====================================================

-- Récupérer les IDs des permissions et rôles
SET @perm_donner_fond = (SELECT id FROM permissions WHERE code = 'caisse.donner_fond_initial');
SET @perm_recevoir_fond = (SELECT id FROM permissions WHERE code = 'caisse.recevoir_fond');
SET @perm_fermer_caisse = (SELECT id FROM permissions WHERE code = 'caisse.fermer_caisse');
SET @perm_valider_fermeture = (SELECT id FROM permissions WHERE code = 'caisse.valider_fermeture');
SET @perm_consulter_sessions = (SELECT id FROM permissions WHERE code = 'caisse.consulter_sessions');

SET @role_admin = (SELECT id FROM roles WHERE nom = 'Admin');
SET @role_president = (SELECT id FROM roles WHERE nom = 'Président');
SET @role_tresorier = (SELECT id FROM roles WHERE nom = 'Trésorier');
SET @role_secretaire = (SELECT id FROM roles WHERE nom = 'Secrétaire');
SET @role_caissier = (SELECT id FROM roles WHERE nom = 'Caissier/Bénévole');
SET @role_be = (SELECT id FROM roles WHERE nom = 'BE');

-- Admin : toutes les permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_admin, @perm_donner_fond),
  (@role_admin, @perm_recevoir_fond),
  (@role_admin, @perm_fermer_caisse),
  (@role_admin, @perm_valider_fermeture),
  (@role_admin, @perm_consulter_sessions);

-- Trésorier : créer sessions, valider, consulter (mais ne peut pas être caissier)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_tresorier, @perm_donner_fond),
  (@role_tresorier, @perm_valider_fermeture),
  (@role_tresorier, @perm_consulter_sessions);

-- Président : consulter les sessions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_president, @perm_consulter_sessions);

-- Secrétaire : recevoir fond, ouvrir et fermer session (peut être caissier)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_secretaire, @perm_recevoir_fond),
  (@role_secretaire, @perm_fermer_caisse),
  (@role_secretaire, @perm_consulter_sessions);

-- Caissier/Bénévole : recevoir fond, ouvrir et fermer session
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_caissier, @perm_recevoir_fond),
  (@role_caissier, @perm_fermer_caisse),
  (@role_caissier, @perm_consulter_sessions);

-- BE (Breveté d'État) : recevoir fond, ouvrir et fermer session
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (@role_be, @perm_recevoir_fond),
  (@role_be, @perm_fermer_caisse),
  (@role_be, @perm_consulter_sessions);

-- =====================================================
-- 4. COMMENTAIRES ET DOCUMENTATION
-- =====================================================

/*
WORKFLOW DES SESSIONS DE CAISSE :

1. [Trésorier] Crée une session
   - Sélectionne un caissier
   - Définit le fond initial
   - Statut: en_attente_caissier

2. [Caissier] Ouvre la session
   - Vérifie le fond initial
   - Ajoute une note optionnelle
   - Transaction "fond_initial" créée automatiquement
   - Statut: ouverte

3. [Caissier] Effectue des ventes
   - Transactions espèces/chèque/cb/monnaie
   - Le système calcule le solde attendu en temps réel

4. [Caissier] Ferme la session
   - Compte les espèces physiquement
   - Déclare le solde final
   - Transaction "fermeture_caisse" créée automatiquement
   - Le système calcule l'écart automatiquement
   - Statut: en_attente_validation

5. [Trésorier] Valide la fermeture
   - Recompte les espèces (optionnel)
   - Valide ou signale une anomalie
   - Ajoute une note de validation
   - Statut: validee ou anomalie

CALCUL DU SOLDE ATTENDU :
  solde_attendu = fond_initial
                + SUM(ventes_especes)
                - SUM(monnaie_rendue)

CALCUL DE L'ÉCART :
  ecart = solde_valide - solde_attendu
*/
