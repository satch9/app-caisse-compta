# Migration vers Tailwind CSS v4

## Date : 2025-11-04

## Changements effectués

### ✅ Installation

- ✅ Désinstallé : `tailwindcss` (v3), `postcss`, `autoprefixer`
- ✅ Installé : `tailwindcss@next` (v4), `@tailwindcss/vite@next`

### ✅ Configuration

#### Fichiers supprimés
- ❌ `tailwind.config.js` (plus nécessaire)
- ❌ `postcss.config.js` (plus nécessaire)

#### Fichiers modifiés

**vite.config.ts**
```diff
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
+ import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
-  plugins: [react()],
+  plugins: [
+    react(),
+    tailwindcss(),
+  ],
})
```

**src/index.css**
```diff
- @tailwind base;
- @tailwind components;
- @tailwind utilities;
+ @import "tailwindcss";

@layer base {
  /* ... */
}
```

## Avantages de la migration

1. **Simplicité** : Plus besoin de gérer PostCSS et Tailwind config séparément
2. **Performance** : Compilation plus rapide grâce au plugin Vite natif
3. **Moderne** : Utilise les dernières fonctionnalités de Tailwind CSS
4. **Maintenance** : Moins de fichiers de configuration à maintenir

## Compatibilité

- ✅ **Vite 7** : Compatible avec `--legacy-peer-deps`
- ✅ **React** : Aucun changement nécessaire
- ✅ **Classes Tailwind** : Toutes les classes existantes fonctionnent
- ✅ **Customisation** : Via CSS variables au lieu de JS config

## Test de la migration

Pour vérifier que tout fonctionne :

```bash
# Démarrer le serveur de développement
cd frontend
npm run dev
```

Ouvrir http://localhost:5173 et vérifier que :
- ✅ Les styles Tailwind sont appliqués
- ✅ Les pages s'affichent correctement
- ✅ Pas d'erreurs dans la console

## Documentation

- [Documentation Tailwind v4](frontend/TAILWIND_V4.md)
- [Documentation officielle](https://tailwindcss.com/docs/installation/using-vite)

## Rollback (si nécessaire)

Si vous devez revenir à Tailwind v3 :

```bash
# Désinstaller v4
npm uninstall tailwindcss @tailwindcss/vite

# Réinstaller v3
npm install -D tailwindcss postcss autoprefixer

# Recréer les configs
npx tailwindcss init -p

# Restaurer index.css
# Remplacer @import "tailwindcss" par :
# @tailwind base;
# @tailwind components;
# @tailwind utilities;

# Restaurer vite.config.ts
# Supprimer le plugin tailwindcss()
```

## Support

En cas de problème :
1. Consulter [frontend/TAILWIND_V4.md](frontend/TAILWIND_V4.md)
2. Vérifier les [issues GitHub](https://github.com/tailwindlabs/tailwindcss/issues)
3. Consulter la [documentation officielle](https://tailwindcss.com)
