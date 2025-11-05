# Configuration GitHub Codespaces

## 🔧 Configuration des ports

Pour que l'application fonctionne dans GitHub Codespaces, vous devez rendre les ports **publics**.

### Étape 1 : Ouvrir le panneau des ports

1. Dans VS Code, appuyez sur **Ctrl+`** (ou Cmd+` sur Mac) pour ouvrir le terminal
2. Cliquez sur l'onglet **PORTS** à côté de Terminal
3. Vous verrez les ports 3001, 3306, 5173, 8080

### Étape 2 : Rendre les ports publics

Pour chaque port, faites un **clic droit** et sélectionnez **Port Visibility → Public** :

#### Ports à rendre publics :
- ✅ **5173** (Frontend) → **Public**
- ✅ **3001** (Backend API) → **Public**  ← **IMPORTANT !**
- ⚠️ **3306** (MySQL) → Garder **Private** (sécurité)
- ⚠️ **8080** (phpMyAdmin) → **Public** (optionnel)

### Étape 3 : Vérification

Une fois les ports configurés en public, vous devriez voir :
- 🟢 **Port 5173** : Pas de cadenas 🔓
- 🟢 **Port 3001** : Pas de cadenas 🔓

## 🌐 URLs Codespaces

Vos URLs seront de la forme :
```
Frontend:  https://[codespace-name]-5173.app.github.dev
Backend:   https://[codespace-name]-3001.app.github.dev
```

## 🔄 Alternative : Configuration automatique

Créez un fichier `.devcontainer/devcontainer.json` :

```json
{
  "forwardPorts": [3001, 5173, 8080],
  "portsAttributes": {
    "3001": {
      "label": "Backend API",
      "onAutoForward": "notify",
      "visibility": "public"
    },
    "5173": {
      "label": "Frontend",
      "onAutoForward": "openBrowser",
      "visibility": "public"
    },
    "8080": {
      "label": "phpMyAdmin",
      "onAutoForward": "notify",
      "visibility": "public"
    },
    "3306": {
      "label": "MySQL",
      "visibility": "private"
    }
  }
}
```

## ✅ Test de la configuration

Une fois les ports configurés :

1. **Testez le backend** :
   ```bash
   curl https://[votre-codespace]-3001.app.github.dev/health
   ```
   Devrait retourner : `{"status":"ok","timestamp":"..."}`

2. **Testez le frontend** :
   Ouvrez https://[votre-codespace]-5173.app.github.dev dans votre navigateur

## 🐛 Si ça ne fonctionne toujours pas

### Vérifier les logs
```bash
docker-compose logs backend --tail=20
docker-compose logs frontend --tail=20
```

### Redémarrer les services
```bash
docker-compose restart
```

### Reconstruire si nécessaire
```bash
docker-compose down
docker-compose up -d --build
```

## 📝 Note sur CORS

Le backend est déjà configuré pour accepter les requêtes depuis :
- `http://localhost:5173` (développement local)
- `http://127.0.0.1:5173` (développement local)
- `https://[codespace]-5173.app.github.dev` (Codespaces frontend)
- `https://[codespace]-3001.app.github.dev` (Codespaces backend)

Si vous changez de Codespace, vous devrez mettre à jour ces URLs dans :
- `backend/src/index.ts` (configuration CORS)
- `frontend/.env` (URL de l'API)

## 🚀 Démarrage rapide après configuration

```bash
# Vérifier que tout tourne
docker-compose ps

# Accéder à l'application
# Frontend: Cliquez sur le port 5173 dans le panneau PORTS
# ou ouvrez https://[votre-codespace]-5173.app.github.dev
```
