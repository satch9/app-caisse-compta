# Database - Schéma et Migrations

Ce dossier contient le schéma de base de données et les migrations SQL pour l'application de caisse.

## Structure

```
database/
├── init.sql          # Script d'initialisation complet (schéma initial + données de base)
├── migrations/       # Migrations appliquées après l'initialisation
└── README.md         # Ce fichier
```

## Fichier d'initialisation

**`init.sql`** : Script exécuté automatiquement par Docker au premier démarrage du conteneur MySQL.

Contient :
- Création de toutes les tables
- Index et contraintes
- Données de base (rôles, permissions)
- Utilisateur admin initial

## Migrations

Les migrations sont numérotées séquentiellement et appliquées manuellement.

### Convention de nommage

```
XXX_description.sql
```

- `XXX` : Numéro séquentiel sur 3 chiffres (002, 003, 004, etc.)
- `description` : Description courte en snake_case

### Migrations existantes

| Fichier | Description | Date | Statut |
|---------|-------------|------|--------|
| `002_add_session_transactions.sql` | Ajout types paiement fond_initial et fermeture_caisse, user_id nullable | 2025-11-07 | ✅ Appliquée |
| `003_add_monnaie_transaction_type.sql` | Ajout type paiement monnaie pour transactions de change | 2025-11-06 | ✅ Appliquée |

## Appliquer une migration

### Manuellement via Docker

```bash
# Se connecter au conteneur MySQL
docker-compose exec mysql mysql -uroot -prootpassword caisse_db

# Copier-coller le contenu du fichier SQL dans la console MySQL
# Ou utiliser source :
mysql> source /path/to/migration.sql
```

### Manuellement via ligne de commande

```bash
docker-compose exec -T mysql mysql -uroot -prootpassword caisse_db < database/migrations/XXX_description.sql
```

## Créer une nouvelle migration

1. **Numéroter séquentiellement** : Prendre le prochain numéro (ex: 004)
2. **Nommer clairement** : `004_add_new_feature.sql`
3. **Documenter** :
   ```sql
   -- Migration XXX: Description
   -- Date: YYYY-MM-DD
   -- Description détaillée du changement

   ALTER TABLE ...
   ```
4. **Tester** : Appliquer sur environnement de dev
5. **Documenter dans ce README** : Ajouter une ligne dans le tableau ci-dessus
6. **Commiter** : `git add` + `git commit`

## Notes importantes

- Les migrations sont **unidirectionnelles** (pas de rollback automatique)
- Toujours tester sur un environnement de dev d'abord
- Ne jamais modifier une migration déjà appliquée en production
- Garder les migrations petites et focalisées
- Documenter les changements de schéma dans les commits

## Réinitialiser la base de données

Pour recréer complètement la base :

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer le volume MySQL (ATTENTION : perte de données)
docker volume rm app-caisse-compta_mysql-data

# Redémarrer (init.sql sera réexécuté)
docker-compose up -d

# Appliquer les migrations manuellement dans l'ordre
```
