-- Migration: Permettre transactions système sans user_id
-- Date: 2025-11-07
-- Description: Ajouter support pour transactions de fond de caisse et fermeture de session

-- Modifier user_id pour permettre NULL (pour transactions système)
ALTER TABLE transactions MODIFY COLUMN user_id INT NULL;

-- Ajouter nouveaux types de paiement pour traçabilité sessions
ALTER TABLE transactions MODIFY COLUMN type_paiement
  ENUM('especes', 'cheque', 'cb', 'monnaie', 'fond_initial', 'fermeture_caisse') NOT NULL;
