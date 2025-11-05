-- Migration: Ajouter le type de transaction 'monnaie'
-- Date: 2025-11-05
-- Description: Permet de tracer les opérations de monnaie sans impact sur le solde

-- 1. Modifier le type ENUM pour inclure 'monnaie'
ALTER TABLE transactions
MODIFY COLUMN type_paiement ENUM('especes', 'cheque', 'cb', 'monnaie') NOT NULL;

-- 2. Ajouter les colonnes pour tracer les montants
ALTER TABLE transactions
ADD COLUMN montant_recu DECIMAL(10, 2) NULL COMMENT 'Montant reçu pour opération de monnaie',
ADD COLUMN montant_rendu DECIMAL(10, 2) NULL COMMENT 'Montant rendu pour opération de monnaie';

-- 3. Créer un index pour faciliter les requêtes sur le type de transaction
CREATE INDEX idx_type_paiement ON transactions(type_paiement);
