# Démarrage Rapide

## 🚀 Lancer l'application (3 étapes)

### 1. Démarrer les services Docker

```bash
docker-compose up -d
```

Attendez quelques secondes que tous les services démarrent.

### 2. Vérifier que tout fonctionne

```bash
# Vérifier les services
docker-compose ps

# Devrait afficher 4 services running:
# - caisse-mysql
# - caisse-phpmyadmin
# - caisse-backend
# - caisse-frontend
```

### 3. Accéder à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001
- **phpMyAdmin** : http://localhost:8080

## 🔑 Connexion

Utilisez le compte administrateur par défaut :

- **Email** : `admin@club-tennis.fr`
- **Mot de passe** : `admin123`

⚠️ **IMPORTANT** : Ce mot de passe doit être changé avant toute utilisation en production !

## 🛠️ Développement local (sans Docker)

Si vous préférez développer sans Docker :

### Backend

```bash
# Installer les dépendances
cd backend
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres MySQL

# Lancer le serveur
npm run dev
```

Le backend sera accessible sur http://localhost:3001

### Frontend

```bash
# Installer les dépendances
cd frontend
npm install

# Configurer l'environnement
cp .env.example .env

# Lancer le serveur
npm run dev
```

Le frontend sera accessible sur http://localhost:5173

### Base de données

Si vous n'utilisez pas Docker, créez manuellement la base de données :

```bash
# Se connecter à MySQL
mysql -u root -p

# Créer la base de données et l'utilisateur
CREATE DATABASE caisse_db;
CREATE USER 'caisse_user'@'localhost' IDENTIFIED BY 'caisse_password';
GRANT ALL PRIVILEGES ON caisse_db.* TO 'caisse_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importer le schéma
mysql -u caisse_user -p caisse_db < database/init.sql
```

## 📝 Commandes utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Supprimer les volumes (⚠️ efface la base de données)
docker-compose down -v

# Redémarrer un service spécifique
docker-compose restart backend
docker-compose restart frontend

# Rebuild après modifications de code
docker-compose up -d --build
```

## 🎯 Première utilisation

1. **Connectez-vous** avec le compte admin
2. **Testez les permissions** en naviguant dans les différentes sections
3. **Créez des utilisateurs** via l'interface Admin
4. **Assignez des rôles** appropriés aux utilisateurs
5. **Gérez les stocks** : créez des produits et catégories, enregistrez des approvisionnements

## 🐛 Problèmes courants

### Le frontend ne démarre pas

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Le backend ne se connecte pas à la DB

```bash
# Vérifier que MySQL est bien démarré
docker-compose ps mysql

# Voir les logs MySQL
docker-compose logs mysql

# Recréer la base de données
docker-compose down -v
docker-compose up -d
```

### Port déjà utilisé

Si un port est déjà utilisé, modifiez `docker-compose.yml` :

```yaml
services:
  frontend:
    ports:
      - "5174:5173"  # Changez 5174 pour un port libre
```

## 📚 Documentation complète

Pour plus de détails, consultez :
- [README.md](README.md) - Documentation complète
- [docs/permissions.md](docs/permissions.md) - Système de permissions
- [CLAUDE.md](CLAUDE.md) - Instructions pour Claude Code

## 🎓 Prochaines étapes

Maintenant que l'application fonctionne :

1. Explorez les différentes pages (Dashboard, Caisse, Stock, Comptabilité, Membres, Admin)
2. Testez les permissions en créant des utilisateurs avec différents rôles
3. **Gérez les stocks** : créez des produits, enregistrez des achats directs ou créez des commandes fournisseurs
4. **Effectuez un inventaire physique** : utilisez le tableau de bord stock pour détecter les écarts
5. **Consultez la comptabilité** : générez les 5 rapports et exportez-les en Excel
6. **Gérez les comptes membres** : créez des comptes pour les adhérents et consultez leurs statistiques
7. **Explorez l'interface admin** : consultez la matrice permissions et les logs système
8. Consultez phpMyAdmin pour voir la structure de la base de données

Bon développement ! 🚀
