# Application de Gestion de Caisse - Club de Tennis

Application web complète de gestion de caisse pour un club de tennis, incluant la gestion des encaissements, des stocks, de la comptabilité et des comptes membres.

## 🎯 Fonctionnalités

- **Gestion de caisse** : Encaissements (espèces, chèque, CB)
- **Gestion de stocks** : Produits, inventaire, commandes
- **Documents comptables** : Génération de rapports pour le bilan financier
- **Gestion des membres** : Comptes membres et non-membres
- **Système de permissions modulaire** : Rôles prédéfinis et permissions granulaires

## 🏗️ Architecture

### Stack Technologique

#### Frontend
- **React** avec Vite.js et TypeScript
- **TailwindCSS v4** pour le styling (avec plugin Vite natif)
- **shadcn/ui** pour les composants UI
- **React Router** pour la navigation
- **Axios** pour les appels API
- **Recharts** pour les graphiques comptables

#### Backend
- **Node.js** avec Express et TypeScript
- **MySQL** pour la base de données
- **JWT** pour l'authentification
- **bcryptjs** pour le hachage des mots de passe (compatibilité Alpine Linux)

#### Infrastructure
- **Docker** & Docker Compose
- **phpMyAdmin** pour la gestion de la base de données
- Compatible **GitHub Codespaces**

## 🔐 Système de Permissions

L'application utilise un système RBAC (Role-Based Access Control) modulaire avec 7 rôles prédéfinis :

| Rôle | Description | Permissions principales |
|------|-------------|------------------------|
| **Admin** | Administrateur système | Toutes les permissions |
| **Président** | Vue d'ensemble du club | Caisse, consultation compta, rapports |
| **Trésorier** | Gestion financière | Comptabilité, stocks (pas de caisse) |
| **Secrétaire** | Gestion administrative | Membres, caisse |
| **Caissier** | Opérations de caisse | Encaissements, ventes |
| **Membre** | Membre du club | Consultation compte personnel |
| **Non-membre** | Invité | Consultation compte invité |

### Catégories de Permissions

- `caisse.*` - Opérations de caisse
- `stock.*` - Gestion de stock
- `compta.*` - Comptabilité
- `membres.*` - Gestion des membres
- `admin.*` - Administration système

Voir `docs/permissions.md` pour la documentation complète.

## 🚀 Installation

### Prérequis

- Docker et Docker Compose
- Node.js 20+ (pour développement local)
- npm ou yarn

### Installation avec Docker (Recommandé)

1. **Cloner le repository**
```bash
git clone <repository-url>
cd app-caisse-compta
```

2. **Démarrer les services avec Docker Compose**
```bash
docker-compose up -d
```

Cela va démarrer :
- MySQL sur le port 3306
- phpMyAdmin sur le port 8080
- Backend API sur le port 3001
- Frontend sur le port 5173

3. **Accéder aux services**
- Frontend : http://localhost:5173
- Backend API : http://localhost:3001
- phpMyAdmin : http://localhost:8080

### Installation locale (sans Docker)

#### Backend

```bash
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres de base de données
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
cp .env.example .env
# Éditer .env si nécessaire (par défaut: http://localhost:3001/api)
npm install
npm run dev
```

#### Base de données

Créer une base de données MySQL et exécuter le script :
```bash
mysql -u root -p < database/init.sql
```

## 🔧 Configuration

### Variables d'environnement

#### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=caisse_user
DB_PASSWORD=caisse_password
DB_NAME=caisse_db

JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

PORT=3001
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 👥 Compte par défaut

Un compte administrateur est créé automatiquement :

- **Email** : `admin@club-tennis.fr`
- **Mot de passe** : `admin123`

⚠️ **Important** : Changez ce mot de passe en production !

## 📖 Utilisation

### Connexion

1. Accédez à http://localhost:5173
2. Connectez-vous avec le compte admin
3. Accédez au tableau de bord

### Gestion des utilisateurs

1. Allez dans **Administration**
2. Créez de nouveaux utilisateurs
3. Assignez des rôles appropriés
4. Ajoutez des permissions personnalisées si nécessaire

### Opérations de caisse

1. Accédez à **Caisse** depuis le tableau de bord
2. Choisissez le mode de paiement (espèces, CB, chèque)
3. Effectuez la transaction
4. Consultez l'historique

### Gestion des stocks

1. Accédez à **Stock**
2. Ajoutez/modifiez des produits
3. Gérez l'inventaire
4. Passez des commandes

## 🏗️ Structure du projet

```
app-caisse-compta/
├── backend/                 # API Backend
│   ├── src/
│   │   ├── config/         # Configuration (DB, etc.)
│   │   ├── middleware/     # Middleware Express
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Logique métier
│   │   ├── types/          # Types TypeScript
│   │   └── index.ts        # Point d'entrée
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── contexts/       # Contexts React (Auth, Permissions)
│   │   ├── hooks/          # Hooks personnalisés
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   ├── types/          # Types TypeScript
│   │   └── App.tsx         # Composant principal
│   ├── .env
│   ├── package.json
│   └── tailwind.config.js
│
├── database/               # Scripts SQL
│   └── init.sql           # Initialisation de la DB
│
├── docs/                   # Documentation
│   └── permissions.md      # Documentation des permissions
│
├── docker-compose.yml      # Configuration Docker
└── README.md              # Ce fichier
```

## 🧪 Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📚 Documentation

- [Système de permissions](docs/permissions.md) - Documentation complète du système RBAC
- [Instructions projet](CLAUDE.md) - Contexte pour Claude Code

## 🔄 Développement

### Commandes utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Rebuild après des changements
docker-compose up -d --build

# Accéder à la base de données
docker-compose exec mysql mysql -u caisse_user -p caisse_db
```

### Hot Reload

Les deux applications (frontend et backend) supportent le hot reload :
- Modifications frontend : Rechargement automatique du navigateur
- Modifications backend : Redémarrage automatique avec `tsx watch`

## 🐛 Résolution de problèmes

### Erreur de connexion à la base de données

```bash
# Vérifier que MySQL est démarré
docker-compose ps

# Voir les logs MySQL
docker-compose logs mysql

# Recréer la base de données
docker-compose down -v
docker-compose up -d
```

### Port déjà utilisé

Modifiez les ports dans `docker-compose.yml` si nécessaire :
```yaml
ports:
  - "5174:5173"  # Frontend
  - "3002:3001"  # Backend
  - "8081:80"    # phpMyAdmin
```

### Crash de l'authentification (Segmentation Fault)

**Symptôme** : Le backend crash lors de la vérification des mots de passe avec l'erreur "Exit code 139" (Segmentation Fault).

**Cause** : Incompatibilité des binaires natifs de `bcrypt` avec Alpine Linux dans Docker.

**Solution** : Ce projet utilise **bcryptjs** (pure JavaScript) au lieu de `bcrypt` (binaires C++). Si vous rencontrez ce problème :

1. Vérifiez que `bcryptjs` est installé :
   ```bash
   cd backend
   npm list bcryptjs
   ```

2. Si `bcrypt` est présent, le remplacer :
   ```bash
   npm uninstall bcrypt @types/bcrypt
   npm install bcryptjs
   ```

3. Rebuilder le container Docker :
   ```bash
   docker-compose down
   docker-compose build --no-cache backend
   docker-compose up -d
   ```

**Note** : bcryptjs est légèrement plus lent que bcrypt mais offre une meilleure compatibilité cross-platform, notamment avec Alpine Linux utilisé dans nos images Docker.

## 🤝 Contribution

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Roadmap

### Phase 1 : MVP ✅
- [x] Système de permissions complet
- [x] Authentification JWT
- [x] Interface de base (Login, Dashboard, Caisse, Admin)
- [x] Configuration Docker

### Phase 2 : Fonctionnalités métier
- [ ] Implémentation complète des opérations de caisse
- [ ] Gestion avancée des stocks
- [ ] Génération de documents comptables
- [ ] Exports Excel/PDF
- [ ] Graphiques et statistiques

### Phase 3 : Améliorations
- [ ] Cache des permissions (Redis)
- [ ] Audit log complet
- [ ] Tests unitaires et d'intégration
- [ ] Documentation API (Swagger)
- [ ] Interface admin avancée

### Phase 4 : Production
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoring (Prometheus, Grafana)
- [ ] Backups automatiques
- [ ] Configuration HTTPS
- [ ] Optimisations de performance

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteur

Développé avec Claude Code (claude.ai/code)

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation dans `docs/`

---

**Note** : Cette application est conçue pour un club de tennis mais peut être adaptée à d'autres types d'associations sportives ou culturelles.
