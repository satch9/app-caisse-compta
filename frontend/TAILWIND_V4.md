# Tailwind CSS v4 Configuration

Ce projet utilise **Tailwind CSS v4** avec le nouveau plugin Vite natif.

## Avantages de Tailwind v4

- ✅ **Configuration simplifiée** : Plus besoin de PostCSS ou tailwind.config.js
- ✅ **Plugin Vite natif** : Intégration directe dans vite.config.ts
- ✅ **Performance améliorée** : Compilation plus rapide
- ✅ **Import CSS moderne** : Utilise `@import "tailwindcss"`

## Configuration actuelle

### 1. vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

### 2. src/index.css
```css
@import "tailwindcss";

@layer base {
  /* Vos styles personnalisés */
}
```

## Différences avec Tailwind v3

| Aspect | v3 | v4 |
|--------|----|----|
| Configuration | `tailwind.config.js` + `postcss.config.js` | Plugin Vite directement |
| Import CSS | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| PostCSS | Requis | Non requis |
| Performance | Standard | Améliorée |

## Installation (déjà fait dans ce projet)

```bash
# Installer Tailwind CSS v4
npm install tailwindcss@next @tailwindcss/vite@next

# Configurer vite.config.ts (voir ci-dessus)

# Mettre à jour index.css (voir ci-dessus)
```

## Personnalisation

Avec Tailwind v4, la personnalisation se fait via **CSS Variables** dans votre fichier CSS :

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --font-display: 'Inter', sans-serif;
  --spacing-custom: 2.5rem;
}
```

Ou directement dans les `@layer` :

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }
}
```

## Utilisation dans les composants

L'utilisation reste identique à Tailwind v3 :

```tsx
<div className="flex items-center justify-center p-4 bg-blue-500">
  <h1 className="text-2xl font-bold text-white">Hello Tailwind v4</h1>
</div>
```

## Documentation officielle

- [Tailwind CSS v4 Documentation](https://tailwindcss.com)
- [Installation avec Vite](https://tailwindcss.com/docs/installation/using-vite)

## Troubleshooting

### Erreur de compatibilité avec Vite 7

Si vous obtenez une erreur de peer dependency avec Vite 7, installez avec :

```bash
npm install tailwindcss@next @tailwindcss/vite@next --legacy-peer-deps
```

### Les styles ne s'appliquent pas

1. Vérifiez que `@import "tailwindcss"` est présent en haut de `src/index.css`
2. Vérifiez que le plugin est bien ajouté dans `vite.config.ts`
3. Redémarrez le serveur de développement : `npm run dev`

### Migration depuis v3

Si vous migrez depuis Tailwind v3 :

1. Désinstaller les anciens packages :
   ```bash
   npm uninstall tailwindcss postcss autoprefixer
   ```

2. Installer v4 :
   ```bash
   npm install tailwindcss@next @tailwindcss/vite@next
   ```

3. Supprimer `tailwind.config.js` et `postcss.config.js`

4. Mettre à jour `vite.config.ts` et `index.css` (voir ci-dessus)

## Support

Pour toute question sur Tailwind CSS v4, consultez :
- [Documentation officielle](https://tailwindcss.com)
- [GitHub Discussions](https://github.com/tailwindlabs/tailwindcss/discussions)
