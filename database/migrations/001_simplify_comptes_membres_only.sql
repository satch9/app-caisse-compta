-- Migration: Simplifier la gestion des comptes
-- Règle métier : Seuls les adhérents (membres) peuvent avoir un compte
-- Les non-membres/visiteurs paient immédiatement (pas de compte)

-- 1. Mettre à jour tous les comptes existants de type 'non_membre' en 'membre'
--    (car s'ils ont un compte, ce sont des habitués qu'on considère comme membres)
UPDATE comptes SET type_compte = 'membre' WHERE type_compte = 'non_membre';

-- 2. Modifier l'ENUM pour ne garder que 'membre'
ALTER TABLE comptes
  MODIFY COLUMN type_compte ENUM('membre') NOT NULL DEFAULT 'membre';

-- Note: On garde la colonne pour faciliter d'éventuelles évolutions futures
-- mais pour l'instant un seul type existe : 'membre'
