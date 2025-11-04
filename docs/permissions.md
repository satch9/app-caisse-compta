# Système de Rôles et Permissions

## Vue d'ensemble

Ce document décrit en détail le système de gestion des rôles et permissions de l'application de caisse pour club de tennis.

## Architecture

### Principes de conception

Le système utilise une approche **RBAC (Role-Based Access Control) modulaire** avec les caractéristiques suivantes :

1. **Rôles prédéfinis** : Templates de permissions pour les cas d'usage courants
2. **Permissions granulaires** : Contrôle fin au niveau de chaque fonctionnalité
3. **Combinaison flexible** : Un utilisateur peut avoir plusieurs rôles simultanément
4. **Permissions additionnelles** : Possibilité d'ajouter des permissions spécifiques à un utilisateur

### Flux d'autorisation

```
Utilisateur → Rôles multiples → Permissions de rôles
         ↘ Permissions additionnelles ↗
                     ↓
         Ensemble de permissions effectif
                     ↓
         Vérification : userCan(permission)
```

## Schéma de Base de Données

### Tables SQL

```sql
-- Table des utilisateurs
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Table des rôles prédéfinis
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL, -- ADMIN, CAISSIER, etc.
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des permissions
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) UNIQUE NOT NULL, -- caisse.encaisser_especes, etc.
  categorie VARCHAR(50) NOT NULL, -- caisse, stock, compta, membres, admin
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_categorie (categorie)
);

-- Association rôles → permissions (many-to-many)
CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Association utilisateurs → rôles (many-to-many)
CREATE TABLE user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT, -- ID de l'utilisateur qui a assigné ce rôle
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Permissions additionnelles par utilisateur
CREATE TABLE user_permissions (
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted BOOLEAN DEFAULT TRUE, -- TRUE = accordé, FALSE = révoqué
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  PRIMARY KEY (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### Données initiales

```sql
-- Insertion des rôles
INSERT INTO roles (code, nom, description) VALUES
('ADMIN', 'Administrateur', 'Accès complet au système'),
('PRESIDENT', 'Président', 'Vue d''ensemble et gestion du club'),
('TRESORIER', 'Trésorier', 'Gestion comptable et stocks'),
('SECRETAIRE', 'Secrétaire', 'Gestion membres et caisse'),
('CAISSIER', 'Caissier/Bénévole', 'Encaissements et ventes'),
('MEMBRE', 'Membre du club', 'Consultation compte personnel'),
('NON_MEMBRE', 'Non-membre', 'Consultation compte invité');

-- Insertion des permissions - Caisse
INSERT INTO permissions (code, categorie, nom, description) VALUES
('caisse.encaisser_especes', 'caisse', 'Encaisser en espèces', 'Effectuer un encaissement en liquide'),
('caisse.encaisser_cheque', 'caisse', 'Encaisser par chèque', 'Effectuer un encaissement par chèque'),
('caisse.encaisser_cb', 'caisse', 'Encaisser par CB', 'Effectuer un encaissement par carte bancaire'),
('caisse.annuler_vente', 'caisse', 'Annuler une vente', 'Annuler une transaction'),
('caisse.voir_historique', 'caisse', 'Voir historique caisse', 'Consulter l''historique des transactions'),
('caisse.voir_historique_global', 'caisse', 'Voir tout l''historique', 'Consulter toutes les transactions de tous les caissiers');

-- Insertion des permissions - Stock
INSERT INTO permissions (code, categorie, nom, description) VALUES
('stock.consulter', 'stock', 'Consulter stocks', 'Voir l''état des stocks'),
('stock.modifier', 'stock', 'Modifier stocks', 'Modifier les quantités en stock'),
('stock.ajouter_produit', 'stock', 'Ajouter produit', 'Créer un nouveau produit'),
('stock.supprimer_produit', 'stock', 'Supprimer produit', 'Supprimer un produit'),
('stock.faire_inventaire', 'stock', 'Faire inventaire', 'Effectuer un inventaire des stocks'),
('stock.passer_commande', 'stock', 'Passer commande', 'Commander des produits auprès des fournisseurs');

-- Insertion des permissions - Comptabilité
INSERT INTO permissions (code, categorie, nom, description) VALUES
('compta.consulter_tout', 'compta', 'Consulter comptabilité', 'Voir tous les documents comptables'),
('compta.generer_documents', 'compta', 'Générer documents', 'Créer les documents comptables'),
('compta.exporter_bilan', 'compta', 'Exporter bilan', 'Exporter les données pour le bilan'),
('compta.corriger_ecritures', 'compta', 'Corriger écritures', 'Modifier les écritures comptables');

-- Insertion des permissions - Membres
INSERT INTO permissions (code, categorie, nom, description) VALUES
('membres.creer_compte', 'membres', 'Créer compte', 'Créer un compte membre ou non-membre'),
('membres.modifier_compte', 'membres', 'Modifier compte', 'Modifier les informations d''un compte'),
('membres.voir_liste', 'membres', 'Voir liste membres', 'Consulter la liste des membres'),
('membres.supprimer_compte', 'membres', 'Supprimer compte', 'Supprimer un compte utilisateur'),
('membres.consulter_compte_soi', 'membres', 'Voir son compte', 'Consulter son propre compte');

-- Insertion des permissions - Admin
INSERT INTO permissions (code, categorie, nom, description) VALUES
('admin.gerer_utilisateurs', 'admin', 'Gérer utilisateurs', 'Créer, modifier, supprimer des utilisateurs'),
('admin.configurer_app', 'admin', 'Configurer application', 'Modifier les paramètres de l''application'),
('admin.voir_logs', 'admin', 'Voir logs', 'Consulter les logs système'),
('admin.gerer_roles', 'admin', 'Gérer rôles', 'Créer et modifier les rôles et permissions');

-- Association des permissions aux rôles
-- ADMIN : toutes les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN';

-- PRESIDENT : caisse.*, compta.consulter_tout, compta.generer_documents, membres.voir_liste, stock.consulter
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PRESIDENT'
AND (
  p.categorie = 'caisse'
  OR p.code IN ('compta.consulter_tout', 'compta.generer_documents', 'membres.voir_liste', 'stock.consulter')
);

-- TRESORIER : stock.*, compta.*, membres.voir_liste (pas de caisse)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'TRESORIER'
AND (
  p.categorie IN ('stock', 'compta')
  OR p.code = 'membres.voir_liste'
);

-- SECRETAIRE : caisse.*, membres.*, stock.consulter
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SECRETAIRE'
AND (
  p.categorie IN ('caisse', 'membres')
  OR p.code = 'stock.consulter'
);

-- CAISSIER : encaissements, ventes, consultation stock
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CAISSIER'
AND p.code IN (
  'caisse.encaisser_especes',
  'caisse.encaisser_cheque',
  'caisse.encaisser_cb',
  'caisse.voir_historique',
  'stock.consulter'
);

-- MEMBRE : consultation de son propre compte
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'MEMBRE'
AND p.code = 'membres.consulter_compte_soi';

-- NON_MEMBRE : consultation de son propre compte
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'NON_MEMBRE'
AND p.code = 'membres.consulter_compte_soi';
```

## Implémentation Backend

### Service de gestion des permissions (Node.js/Express)

```javascript
// services/permissionService.js

class PermissionService {
  /**
   * Récupère tous les rôles d'un utilisateur
   */
  async getUserRoles(userId) {
    const query = `
      SELECT r.id, r.code, r.nom
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `;
    return await db.query(query, [userId]);
  }

  /**
   * Récupère toutes les permissions associées aux rôles d'un utilisateur
   */
  async getRolePermissions(userId) {
    const query = `
      SELECT DISTINCT p.code
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `;
    const results = await db.query(query, [userId]);
    return results.map(row => row.code);
  }

  /**
   * Récupère les permissions additionnelles de l'utilisateur
   */
  async getUserCustomPermissions(userId) {
    const query = `
      SELECT p.code, up.granted
      FROM permissions p
      INNER JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = ?
    `;
    const results = await db.query(query, [userId]);
    return results.reduce((acc, row) => {
      acc[row.code] = row.granted;
      return acc;
    }, {});
  }

  /**
   * Récupère toutes les permissions effectives d'un utilisateur
   */
  async getUserPermissions(userId) {
    // 1. Permissions des rôles
    const rolePermissions = await this.getRolePermissions(userId);

    // 2. Permissions additionnelles
    const customPermissions = await this.getUserCustomPermissions(userId);

    // 3. Fusion : rôles + additionnelles accordées - révoquées
    const effectivePermissions = new Set(rolePermissions);

    for (const [permission, granted] of Object.entries(customPermissions)) {
      if (granted) {
        effectivePermissions.add(permission);
      } else {
        effectivePermissions.delete(permission);
      }
    }

    return Array.from(effectivePermissions);
  }

  /**
   * Vérifie si un utilisateur possède une permission
   */
  async userCan(userId, permission) {
    const permissions = await this.getUserPermissions(userId);

    // Support des wildcards (ex: caisse.* correspond à caisse.encaisser_especes)
    return permissions.some(p => {
      if (p === permission) return true;
      if (p.endsWith('.*')) {
        const prefix = p.slice(0, -2);
        return permission.startsWith(prefix + '.');
      }
      return false;
    });
  }

  /**
   * Assigne un rôle à un utilisateur
   */
  async assignRole(userId, roleCode, assignedBy) {
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      SELECT ?, r.id, ?
      FROM roles r
      WHERE r.code = ?
    `;
    await db.query(query, [userId, assignedBy, roleCode]);
  }

  /**
   * Retire un rôle à un utilisateur
   */
  async removeRole(userId, roleCode) {
    const query = `
      DELETE ur FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ? AND r.code = ?
    `;
    await db.query(query, [userId, roleCode]);
  }

  /**
   * Ajoute une permission additionnelle à un utilisateur
   */
  async grantPermission(userId, permissionCode, assignedBy) {
    const query = `
      INSERT INTO user_permissions (user_id, permission_id, granted, assigned_by)
      SELECT ?, p.id, TRUE, ?
      FROM permissions p
      WHERE p.code = ?
      ON DUPLICATE KEY UPDATE granted = TRUE, assigned_by = ?
    `;
    await db.query(query, [userId, assignedBy, permissionCode, assignedBy]);
  }

  /**
   * Révoque une permission à un utilisateur
   */
  async revokePermission(userId, permissionCode) {
    const query = `
      INSERT INTO user_permissions (user_id, permission_id, granted)
      SELECT ?, p.id, FALSE
      FROM permissions p
      WHERE p.code = ?
      ON DUPLICATE KEY UPDATE granted = FALSE
    `;
    await db.query(query, [userId, permissionCode]);
  }
}

module.exports = new PermissionService();
```

### Middleware d'autorisation

```javascript
// middleware/authorize.js

const permissionService = require('../services/permissionService');

/**
 * Middleware pour vérifier qu'un utilisateur a une permission
 * Usage: router.get('/path', authorize('caisse.encaisser_especes'), handler)
 */
function authorize(requiredPermission) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const hasPermission = await permissionService.userCan(
        req.user.id,
        requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Permission refusée',
          required: requiredPermission
        });
      }

      next();
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}

/**
 * Middleware pour vérifier qu'un utilisateur a au moins une des permissions
 */
function authorizeAny(...permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      for (const permission of permissions) {
        const hasPermission = await permissionService.userCan(
          req.user.id,
          permission
        );
        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({
        error: 'Permission refusée',
        required: `Une des permissions: ${permissions.join(', ')}`
      });
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}

module.exports = { authorize, authorizeAny };
```

### Exemple d'utilisation dans les routes

```javascript
// routes/caisse.js

const express = require('express');
const { authorize } = require('../middleware/authorize');
const router = express.Router();

// Endpoint d'encaissement
router.post('/encaisser',
  authorize('caisse.encaisser_especes'),
  async (req, res) => {
    // Logique d'encaissement
    // L'utilisateur a déjà été vérifié par le middleware
  }
);

// Endpoint de consultation historique
router.get('/historique',
  authorize('caisse.voir_historique'),
  async (req, res) => {
    // Si l'utilisateur a caisse.voir_historique_global, montrer tout
    // Sinon, montrer uniquement ses propres transactions
    const canSeeAll = await permissionService.userCan(
      req.user.id,
      'caisse.voir_historique_global'
    );

    // ...
  }
);

module.exports = router;
```

## Implémentation Frontend (React)

### Context de permissions

```typescript
// contexts/PermissionsContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PermissionsContextType {
  permissions: string[];
  roles: string[];
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger les permissions de l'utilisateur connecté
    async function loadPermissions() {
      try {
        const response = await fetch('/api/auth/me/permissions');
        const data = await response.json();
        setPermissions(data.permissions);
        setRoles(data.roles);
      } catch (error) {
        console.error('Erreur chargement permissions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, []);

  const can = (permission: string): boolean => {
    return permissions.some(p => {
      if (p === permission) return true;
      if (p.endsWith('.*')) {
        const prefix = p.slice(0, -2);
        return permission.startsWith(prefix + '.');
      }
      return false;
    });
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, roles, can, hasRole, isLoading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions doit être utilisé dans PermissionsProvider');
  }
  return context;
}
```

### Hook personnalisé

```typescript
// hooks/useAuthorization.ts

import { usePermissions } from '../contexts/PermissionsContext';

export function useAuthorization() {
  const { can, hasRole } = usePermissions();

  return { can, hasRole };
}
```

### Composant de garde

```typescript
// components/Can.tsx

import { usePermissions } from '../contexts/PermissionsContext';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return null; // ou un loader
  }

  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
```

### Exemple d'utilisation dans les composants

```typescript
// pages/Caisse.tsx

import { Can } from '../components/Can';
import { useAuthorization } from '../hooks/useAuthorization';

export function CaissePage() {
  const { can } = useAuthorization();

  return (
    <div>
      <h1>Caisse</h1>

      {/* Affichage conditionnel simple */}
      <Can permission="caisse.encaisser_especes">
        <button>Encaisser en espèces</button>
      </Can>

      <Can permission="caisse.encaisser_cb">
        <button>Encaisser par CB</button>
      </Can>

      {/* Vérification programmatique */}
      {can('caisse.annuler_vente') && (
        <button className="btn-danger">Annuler vente</button>
      )}

      {/* Navigation conditionnelle */}
      <Can permission="compta.consulter_tout">
        <a href="/comptabilite">Voir la comptabilité</a>
      </Can>
    </div>
  );
}
```

## Interface d'Administration

### Page de gestion des utilisateurs

```typescript
// pages/admin/UserManagement.tsx

import { useState } from 'react';
import { useAuthorization } from '../../hooks/useAuthorization';

const AVAILABLE_ROLES = [
  { code: 'ADMIN', label: 'Administrateur' },
  { code: 'PRESIDENT', label: 'Président' },
  { code: 'TRESORIER', label: 'Trésorier' },
  { code: 'SECRETAIRE', label: 'Secrétaire' },
  { code: 'CAISSIER', label: 'Caissier/Bénévole' },
  { code: 'MEMBRE', label: 'Membre' },
  { code: 'NON_MEMBRE', label: 'Non-membre' },
];

export function UserManagement() {
  const { can } = useAuthorization();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  if (!can('admin.gerer_utilisateurs')) {
    return <div>Accès refusé</div>;
  }

  const handleSaveRoles = async () => {
    await fetch(`/api/admin/users/${selectedUser.id}/roles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: selectedRoles }),
    });
  };

  return (
    <div>
      <h1>Gestion des utilisateurs</h1>

      {selectedUser && (
        <div className="modal">
          <h2>Modifier : {selectedUser.nom}</h2>

          <div className="roles-section">
            <h3>Rôles prédéfinis</h3>
            {AVAILABLE_ROLES.map(role => (
              <label key={role.code}>
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.code)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRoles([...selectedRoles, role.code]);
                    } else {
                      setSelectedRoles(selectedRoles.filter(r => r !== role.code));
                    }
                  }}
                />
                {role.label}
              </label>
            ))}
          </div>

          <button onClick={handleSaveRoles}>Enregistrer</button>
        </div>
      )}
    </div>
  );
}
```

## Tests

### Tests unitaires des permissions

```javascript
// tests/permissionService.test.js

const permissionService = require('../services/permissionService');

describe('PermissionService', () => {
  describe('userCan', () => {
    it('devrait accorder la permission si l\'utilisateur a le rôle approprié', async () => {
      // User avec rôle CAISSIER
      const can = await permissionService.userCan(1, 'caisse.encaisser_especes');
      expect(can).toBe(true);
    });

    it('devrait refuser la permission si l\'utilisateur n\'a pas le rôle', async () => {
      // User avec rôle MEMBRE
      const can = await permissionService.userCan(2, 'caisse.encaisser_especes');
      expect(can).toBe(false);
    });

    it('devrait supporter les wildcards', async () => {
      // User avec permission caisse.*
      const can1 = await permissionService.userCan(1, 'caisse.encaisser_especes');
      const can2 = await permissionService.userCan(1, 'caisse.encaisser_cb');
      expect(can1).toBe(true);
      expect(can2).toBe(true);
    });

    it('devrait gérer les permissions additionnelles', async () => {
      // User CAISSIER avec permission stock.modifier en plus
      const can = await permissionService.userCan(1, 'stock.modifier');
      expect(can).toBe(true);
    });
  });
});
```

## Bonnes Pratiques

### 1. Principes de sécurité

- **Vérification côté serveur** : Ne jamais se fier uniquement au frontend
- **Permissions par défaut restrictives** : Deny by default
- **Audit trail** : Logger toutes les modifications de permissions
- **Révision régulière** : Revoir périodiquement les permissions des utilisateurs

### 2. Performance

- **Cache des permissions** : Mettre en cache les permissions pour éviter les requêtes répétées
- **Indexation DB** : Bien indexer les tables de permissions
- **Requêtes optimisées** : Utiliser des JOINs plutôt que des requêtes multiples

### 3. Évolutivité

- **Permissions atomiques** : Garder les permissions granulaires et spécifiques
- **Éviter la duplication** : Utiliser les rôles pour les cas courants
- **Documentation** : Documenter chaque permission et son usage

### 4. Expérience utilisateur

- **Messages clairs** : Expliquer pourquoi l'accès est refusé
- **Interface intuitive** : Rendre la gestion des rôles simple pour les admins
- **Feedback visuel** : Cacher/désactiver les éléments inaccessibles

## Feuille de route

### Phase 1 : MVP
- [ ] Implémentation du schéma de base de données
- [ ] Service de permissions backend
- [ ] Middleware d'autorisation
- [ ] Context React et hooks
- [ ] Interface admin basique

### Phase 2 : Améliorations
- [ ] Cache des permissions (Redis)
- [ ] Audit log des modifications
- [ ] Permissions temporaires (expiration)
- [ ] Interface admin avancée avec recherche/filtres

### Phase 3 : Fonctionnalités avancées
- [ ] Permissions basées sur les ressources (ex: gérer uniquement ses propres ventes)
- [ ] Délégation de permissions
- [ ] Hiérarchie de rôles
- [ ] Export/Import de configurations de rôles
