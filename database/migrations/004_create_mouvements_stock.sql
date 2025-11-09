-- Migration: Création de la table mouvements_stock
-- Date: 2025-11-09
-- Description: Table pour tracer tous les mouvements de stock (entrées, sorties, ajustements, inventaires)

USE caisse_db;

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Référence au produit
  produit_id INT NOT NULL,

  -- Type de mouvement
  type_mouvement ENUM(
    'entree',           -- Réception de marchandise (commande, livraison)
    'sortie',           -- Vente au client
    'ajustement',       -- Correction manuelle
    'inventaire',       -- Ajustement suite à inventaire physique
    'perte',            -- Perte, casse, péremption
    'transfert'         -- Transfert entre stocks (future extension)
  ) NOT NULL,

  -- Quantité (positive pour entrée, négative pour sortie/perte)
  quantite INT NOT NULL,

  -- Stock avant et après le mouvement (pour audit)
  stock_avant INT NOT NULL,
  stock_apres INT NOT NULL,

  -- Motif/raison du mouvement
  motif VARCHAR(500),

  -- Référence à une transaction de vente (si sortie via caisse)
  transaction_id INT NULL,

  -- Référence à une commande fournisseur (si entrée via commande)
  commande_id INT NULL,

  -- Utilisateur ayant effectué le mouvement
  user_id INT NOT NULL,

  -- Date du mouvement
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Contraintes
  FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE RESTRICT,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,

  -- Index pour performances
  INDEX idx_produit_date (produit_id, created_at),
  INDEX idx_type_mouvement (type_mouvement),
  INDEX idx_user (user_id),
  INDEX idx_transaction (transaction_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commentaires sur la table
ALTER TABLE mouvements_stock COMMENT = 'Historique complet de tous les mouvements de stock';

-- Vue pour faciliter les requêtes avec les noms de produits et utilisateurs
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
  ms.transaction_id,
  ms.commande_id,
  ms.user_id,
  CONCAT(u.prenom, ' ', u.nom) AS user_nom,
  ms.created_at
FROM mouvements_stock ms
INNER JOIN produits p ON ms.produit_id = p.id
INNER JOIN categories c ON p.categorie_id = c.id
INNER JOIN users u ON ms.user_id = u.id
ORDER BY ms.created_at DESC;
