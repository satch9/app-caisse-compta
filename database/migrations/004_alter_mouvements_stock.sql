-- Migration: Amélioration de la table mouvements_stock
-- Date: 2025-11-09
-- Description: Ajout de types de mouvements et colonnes de référence

USE caisse_db;

-- Ajouter les nouveaux types de mouvements
ALTER TABLE mouvements_stock
  MODIFY COLUMN type_mouvement ENUM(
    'entree',           -- Réception de marchandise (commande, livraison)
    'sortie',           -- Vente au client
    'ajustement',       -- Correction manuelle
    'inventaire',       -- Ajustement suite à inventaire physique
    'perte',            -- Perte, casse, péremption
    'transfert'         -- Transfert entre stocks (future extension)
  ) NOT NULL;

-- Ajouter colonnes de référence (ignore si existe déjà)
SET @dbname = 'caisse_db';
SET @tablename = 'mouvements_stock';
SET @columnname_trans = 'transaction_id';
SET @columnname_cmd = 'commande_id';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname_trans) > 0,
  'SELECT "Column transaction_id already exists" AS message',
  'ALTER TABLE mouvements_stock ADD COLUMN transaction_id INT NULL AFTER commentaire'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname_cmd) > 0,
  'SELECT "Column commande_id already exists" AS message',
  'ALTER TABLE mouvements_stock ADD COLUMN commande_id INT NULL AFTER transaction_id'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Renommer 'reference' en 'motif' pour plus de clarté (si colonne reference existe)
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = 'reference') > 0,
  'ALTER TABLE mouvements_stock CHANGE COLUMN reference motif VARCHAR(500) NULL',
  'SELECT "Column reference does not exist" AS message'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Renommer 'commentaire' n'est pas nécessaire car il sert le même but que 'motif'
-- On garde les deux pour compatibilité

-- Ajouter les contraintes de clés étrangères si elles n'existent pas
SET @constraint_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = 'caisse_db'
    AND TABLE_NAME = 'mouvements_stock'
    AND CONSTRAINT_NAME = 'fk_mouvement_transaction'
);

SET @sql = IF(
  @constraint_exists = 0,
  'ALTER TABLE mouvements_stock ADD CONSTRAINT fk_mouvement_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT',
  'SELECT "Constraint fk_mouvement_transaction already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter index pour performances (ignore si existe déjà)
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND INDEX_NAME = 'idx_transaction') > 0,
  'SELECT "Index idx_transaction already exists" AS message',
  'ALTER TABLE mouvements_stock ADD INDEX idx_transaction (transaction_id)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND INDEX_NAME = 'idx_commande') > 0,
  'SELECT "Index idx_commande already exists" AS message',
  'ALTER TABLE mouvements_stock ADD INDEX idx_commande (commande_id)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW v_mouvements_stock AS
SELECT
  ms.id,
  ms.produit_id,
  p.nom AS produit_nom,
  c.nom AS categorie_nom,
  ms.type_mouvement,
  ms.quantite,
  ms.stock_avant,
  ms.stock_apres,
  ms.motif,
  ms.commentaire,
  ms.transaction_id,
  ms.commande_id,
  ms.user_id,
  CONCAT(u.prenom, ' ', u.nom) AS user_nom,
  ms.created_at
FROM mouvements_stock ms
INNER JOIN produits p ON ms.produit_id = p.id
INNER JOIN categories_produits c ON p.categorie_id = c.id
LEFT JOIN users u ON ms.user_id = u.id
ORDER BY ms.created_at DESC;
