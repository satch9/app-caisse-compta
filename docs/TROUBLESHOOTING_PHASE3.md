# Dépannage Phase 3 - Problèmes Courants

## Problème : Table `permissions` inconnue

### Symptôme
```
#1109 - Table inconnue 'PERMISSIONS' dans information_schema
```

### Cause
Votre base de données ne contient pas encore les tables du système de permissions (permissions, roles, role_permissions).

### Solution

#### Option 1 : Utiliser uniquement la table system_logs (Recommandé)

Exécutez le script simplifié qui crée uniquement la table des logs :

**Fichier : `docs/SQL_PHASE3_SIMPLE.sql`**

```sql
CREATE TABLE IF NOT EXISTS system_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
```

**Résultat** : La page Admin > Logs système sera accessible (mais peut afficher une erreur si la permission n'existe pas).

#### Option 2 : Créer toute la structure permissions

Si votre projet utilise le système de permissions mais que les tables n'ont jamais été créées :

1. **Trouver le script d'initialisation de la base de données**
   - Cherchez un fichier `schema.sql`, `init.sql` ou similaire dans le projet
   - Il devrait contenir la création des tables permissions, roles, etc.

2. **Ou créer les tables manuellement** :

```sql
-- Table permissions
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,
  categorie VARCHAR(50) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_categorie (categorie),
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table roles
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table role_permissions (relation many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table user_permissions (permissions personnalisées)
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_by INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

3. **Puis exécuter** `docs/SQL_PHASE3_PERMISSIONS.sql` pour ajouter les permissions des logs.

## Problème : Permission refusée sur /admin/logs

### Symptôme
Page blanche ou erreur 403 sur Admin > Logs système

### Cause
Votre utilisateur n'a pas la permission `admin.consulter_logs`

### Solution

**Méthode 1 : Via SQL (si les tables permissions existent)**

```sql
-- Donner temporairement toutes les permissions admin à votre utilisateur
INSERT INTO user_permissions (user_id, permission_id, granted)
SELECT 1, p.id, TRUE  -- Remplacer 1 par votre user_id
FROM permissions p
WHERE p.code LIKE 'admin.%';
```

**Méthode 2 : Désactiver temporairement le check de permission**

Modifier `backend/src/routes/logs.ts` :

```typescript
// AVANT
router.use(authorize('admin.consulter_logs'));

// APRÈS (temporaire pour tester)
// router.use(authorize('admin.consulter_logs'));
```

**⚠️ ATTENTION** : Remettre la protection après les tests !

## Problème : Table system_logs existe déjà

### Symptôme
```
#1050 - La table 'system_logs' existe déjà
```

### Solution
C'est normal ! Le script utilise `CREATE TABLE IF NOT EXISTS`, donc cette erreur ne devrait pas bloquer l'exécution. Si vous voyez cette erreur, c'est que la table est déjà créée correctement.

Passez directement à la vérification :

```sql
DESCRIBE system_logs;
```

## Problème : Foreign key constraint fails

### Symptôme
```
Cannot add foreign key constraint
```

### Cause
La table `users` n'existe pas ou n'a pas de clé primaire `id`

### Solution

Vérifier que la table users existe :

```sql
SHOW TABLES LIKE 'users';
DESCRIBE users;
```

Si la table n'existe pas, créez-la d'abord. Si elle existe mais sans `id`, modifiez la contrainte dans le script :

```sql
-- Retirer la ligne de contrainte
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL

-- Et créer la table sans cette contrainte
CREATE TABLE IF NOT EXISTS system_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;
```

## Comment Tester que Tout Fonctionne

### Test 1 : Vérifier la table system_logs

```sql
DESCRIBE system_logs;
```

Résultat attendu : 8 colonnes (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)

### Test 2 : Insérer un log de test

```sql
INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
VALUES (NULL, 'test_action', 'test_entity', 1, 'Ceci est un test');

SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 1;
```

### Test 3 : Accéder à la page Logs

1. Connectez-vous à l'application
2. Allez sur Admin > Logs système
3. Vous devriez voir :
   - La page se charge (pas d'erreur 500)
   - Les filtres s'affichent
   - Soit "Aucun log trouvé" soit le log de test

### Test 4 : Tester les filtres

Si vous avez des logs :
1. Utiliser le filtre "Action"
2. Sélectionner une action
3. Vérifier que la liste se filtre

## Fichiers de Scripts Disponibles

| Fichier | Usage | Quand l'utiliser |
|---------|-------|------------------|
| `SQL_PHASE3_SIMPLE.sql` | Crée uniquement system_logs | **Recommandé** - Pour démarrer rapidement |
| `SQL_PHASE3_PERMISSIONS.sql` | Ajoute les permissions | Si tables permissions/roles existent déjà |
| `SQL_PHASE3.sql` | Script complet original | Si tout est en place |

## Support

Si le problème persiste :

1. **Vérifiez les logs du backend** : `docker-compose logs backend`
2. **Vérifiez la console du navigateur** : F12 > Console
3. **Vérifiez les tables existantes** : `SHOW TABLES;`
4. **Vérifiez la structure de la base** : Consultez le fichier original de création du schéma

## Workaround Temporaire

Si vous voulez tester la Phase 3 sans les logs :

1. Commentez la route des logs dans `backend/src/index.ts` :
   ```typescript
   // app.use('/api/logs', logsRoutes);
   ```

2. Testez uniquement :
   - La matrice permissions (Admin > Rôles & Permissions)
   - Les permissions personnalisées (Admin > Utilisateurs > Bouton Clé)

3. Réactivez les logs plus tard quand la table sera créée
