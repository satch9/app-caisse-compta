-- Migration: Permettre des comptes pour visiteurs sans compte utilisateur
-- Pour les non-membres ponctuels (accompagnateurs, etc.)

-- 1. Rendre user_id nullable et ajouter des champs pour les visiteurs
ALTER TABLE comptes
  MODIFY COLUMN user_id INT NULL,
  ADD COLUMN nom VARCHAR(100) NULL AFTER user_id,
  ADD COLUMN prenom VARCHAR(100) NULL AFTER nom,
  ADD COLUMN email VARCHAR(255) NULL AFTER prenom,
  ADD COLUMN notes TEXT NULL AFTER email;

-- 2. Modifier la contrainte UNIQUE sur user_id pour permettre plusieurs NULL
ALTER TABLE comptes
  DROP INDEX user_id,
  ADD UNIQUE KEY unique_user_id (user_id);

-- 3. Ajouter une contrainte pour s'assurer qu'on a soit user_id soit nom/prenom
ALTER TABLE comptes
  ADD CONSTRAINT check_compte_identity
  CHECK (
    (user_id IS NOT NULL) OR
    (nom IS NOT NULL AND prenom IS NOT NULL)
  );

-- Note: Pour les comptes existants avec user_id, les champs nom/prenom/email
-- resteront NULL (on les récupère via JOIN avec users)
