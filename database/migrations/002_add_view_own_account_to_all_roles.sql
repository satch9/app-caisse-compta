-- Migration: Ajouter la permission membres.consulter_compte_soi aux rôles PRÉSIDENT, TRÉSORIER et CAISSIER
-- Date: 2025-11-11
-- Description: Tous les utilisateurs authentifiés doivent pouvoir consulter leur propre compte

-- Ajouter la permission pour le rôle PRÉSIDENT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PRESIDENT'
  AND p.code = 'membres.consulter_compte_soi'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Ajouter la permission pour le rôle TRÉSORIER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'TRESORIER'
  AND p.code = 'membres.consulter_compte_soi'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Ajouter la permission pour le rôle CAISSIER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CAISSIER'
  AND p.code = 'membres.consulter_compte_soi'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Vérifier les permissions ajoutées
SELECT
    r.code as role_code,
    r.nom as role_nom,
    p.code as permission_code,
    p.description as permission_description
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.code = 'membres.consulter_compte_soi'
ORDER BY r.code;
