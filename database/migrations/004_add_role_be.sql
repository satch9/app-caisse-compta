-- Migration: Ajouter le rôle BE (Breveté d'État)
-- Date: 2025-11-07
-- Description: Ajout du rôle pour le professeur de tennis avec permissions caisse, membres et stock (lecture)

-- Créer le rôle BE
INSERT INTO roles (code, nom, description) VALUES
('BE', 'BE', 'Breveté d''État - Professeur de tennis, gestion quotidienne bar/boutique');

-- Assigner les permissions au rôle BE
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE nom = 'BE'),
  id
FROM permissions
WHERE code IN (
  -- CAISSE : opérations complètes bar/boutique
  'caisse.encaisser_especes',
  'caisse.encaisser_cheque',
  'caisse.encaisser_cb',
  'caisse.annuler_vente',
  'caisse.recevoir_fond',
  'caisse.fermer_caisse',
  'caisse.voir_historique',

  -- MEMBRES : création et gestion
  'membres.creer_compte',
  'membres.modifier_compte',
  'membres.voir_liste',
  'membres.consulter_compte_soi',

  -- STOCK : consultation uniquement
  'stock.consulter'
);
