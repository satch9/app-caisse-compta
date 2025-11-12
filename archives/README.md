# Archives - Logs Système

Ce dossier contient les archives des logs système supprimés de la base de données.

## Structure

```
archives/
└── logs/
    ├── .gitkeep
    ├── logs_archive_2025-11-12_150_logs.json
    ├── logs_archive_2025-10-15_320_logs.json
    └── logs_archive_2025-09-20_280_logs.json
```

## Fonctionnement

### Sauvegarde automatique

Lorsqu'un administrateur nettoie les anciens logs via **Admin > Config > Nettoyage des logs**, le système effectue automatiquement :

1. **Export des logs à supprimer** → fichier JSON généré
2. **Sauvegarde sur le serveur** → fichier enregistré dans `archives/logs/`
3. **Téléchargement navigateur** → copie pour l'administrateur
4. **Suppression de la base** → logs retirés de MySQL

### Format des fichiers

**Nom du fichier :** `logs_archive_YYYY-MM-DD_XXX_logs.json`

- `YYYY-MM-DD` : Date de l'archivage
- `XXX` : Nombre de logs archivés

**Contenu du fichier :**

```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "user_id": 5,
      "action": "login",
      "entity_type": "user",
      "entity_id": 5,
      "details": "Connexion réussie pour: admin@example.com",
      "ip_address": "192.168.1.100",
      "created_at": "2024-08-15T10:30:00.000Z",
      "user_email": "admin@example.com",
      "user_nom": "Dupont",
      "user_prenom": "Jean"
    }
  ],
  "total": 150,
  "exportDate": "2025-11-12T14:30:00.000Z",
  "olderThanDays": 90,
  "archivedBy": "system"
}
```

## Sécurité et confidentialité

⚠️ **Important** : Ces fichiers contiennent des données sensibles :
- Adresses IP des utilisateurs
- Emails et noms complets
- Historique des actions

### Recommandations :

1. **Restreindre l'accès** : Seuls les administrateurs doivent pouvoir accéder à ce dossier
2. **Sauvegardes** : Inclure ce dossier dans vos backups réguliers
3. **Rétention** : Définir une politique de conservation (ex: garder 2 ans)
4. **Conformité RGPD** : Documenter la conservation des logs

## Gestion des archives

### Consultation d'une archive

```bash
# Lire un fichier d'archive
cat archives/logs/logs_archive_2025-11-12_150_logs.json | jq

# Compter le nombre de logs archivés
jq '.total' archives/logs/logs_archive_2025-11-12_150_logs.json

# Rechercher une action spécifique
jq '.logs[] | select(.action == "login")' archives/logs/*.json
```

### Nettoyage manuel des archives anciennes

```bash
# Supprimer les archives de plus de 2 ans
find archives/logs -name "*.json" -mtime +730 -delete
```

### Sauvegarde des archives

```bash
# Créer une archive compressée
tar -czf archives_logs_backup_$(date +%Y-%m-%d).tar.gz archives/logs/

# Copier vers un stockage externe
rsync -av archives/logs/ /mnt/backup/logs/
```

## Restauration

Si vous devez consulter d'anciens logs :

1. Ouvrir le fichier JSON correspondant à la période
2. Utiliser `jq` ou un éditeur JSON pour parcourir les données
3. Si nécessaire, réimporter dans une base de test pour analyse

## Permissions système

Le dossier `archives/logs/` doit être accessible en écriture par le processus backend :

```bash
# Vérifier les permissions
ls -la archives/logs/

# Ajuster si nécessaire
chmod 755 archives/logs/
```

## Monitoring

### Vérifier l'espace disque

```bash
# Taille totale des archives
du -sh archives/logs/

# Détail par fichier
du -h archives/logs/*.json
```

### Alertes recommandées

- Alerter si l'espace disque < 10GB
- Notifier lors de chaque archivage
- Vérifier l'intégrité des archives mensuellement
