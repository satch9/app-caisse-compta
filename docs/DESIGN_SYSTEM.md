# Système de Design - TCX Saint-André

## Vue d'ensemble

Ce document décrit le système de design de l'application de gestion de caisse/comptabilité pour le Club de Tennis TCX Saint-André.

## Typographie

### Police principale : Inter

La police **Inter** a été choisie pour sa lisibilité exceptionnelle, sa modernité et son excellente performance sur tous les écrans.

- **Source** : Google Fonts
- **Poids disponibles** : 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- **Caractéristiques** :
  - Optimisée pour les interfaces numériques
  - Excellente lisibilité à toutes les tailles
  - Support des ligatures et des caractères alternatifs
  - Rendu optimisé avec antialiasing

### Hiérarchie typographique

```css
h1 {
  font-size: 2.25rem;      /* 36px */
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

h2 {
  font-size: 1.875rem;     /* 30px */
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

h3 {
  font-size: 1.5rem;       /* 24px */
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

body {
  font-size: 1rem;         /* 16px */
  font-weight: 400;
  line-height: 1.5;
}
```

## Palette de couleurs

### Mode clair (Light Mode)

#### Couleurs de base
- **Background** : Blanc pur (`hsl(0 0% 100%)`)
- **Foreground** : Bleu-gris foncé (`hsl(222 47% 11%)`)
- **Card** : Gris clair (`hsl(0 0% 95%)`) - Pour élévation claire
- **Border** : Gris bleu clair (`hsl(214 32% 91%)`)

#### Couleurs principales

##### Primary (Vert émeraude professionnel)
- **Couleur** : `hsl(158 64% 42%)` - Vert émeraude
- **Usage** : Actions principales, boutons primaires, liens importants
- **Raison** : Associé au tennis (couleur des courts) et aux valeurs positives en finance
- **Foreground** : Blanc (`hsl(0 0% 100%)`)

##### Secondary (Bleu ardoise doux)
- **Couleur** : `hsl(214 32% 91%)`
- **Usage** : Éléments secondaires, arrière-plans subtils
- **Foreground** : Bleu-gris foncé (`hsl(222 47% 11%)`)

##### Accent (Sarcelle vibrant)
- **Couleur** : `hsl(172 66% 50%)`
- **Usage** : Mises en évidence, éléments interactifs spéciaux
- **Foreground** : Blanc (`hsl(0 0% 100%)`)

#### Couleurs sémantiques

##### Success (Vert)
- **Couleur** : `hsl(142 71% 45%)`
- **Usage** : Confirmations, actions réussies, valeurs positives
- **Foreground** : Blanc (`hsl(0 0% 100%)`)

##### Warning (Ambre)
- **Couleur** : `hsl(38 92% 50%)`
- **Usage** : Avertissements, actions nécessitant attention
- **Foreground** : Blanc (`hsl(0 0% 100%)`)

##### Info (Bleu)
- **Couleur** : `hsl(199 89% 48%)`
- **Usage** : Informations, messages informatifs
- **Foreground** : Blanc (`hsl(0 0% 100%)`)

##### Destructive (Rouge)
- **Couleur** : `hsl(0 84% 60%)`
- **Usage** : Erreurs, actions destructives, suppressions
- **Foreground** : Blanc (`hsl(0 0% 100%)`)

### Mode sombre (Dark Mode)

#### Couleurs de base
- **Background** : Bleu-gris très foncé (`hsl(222 47% 11%)`)
- **Foreground** : Blanc cassé (`hsl(210 40% 98%)`)
- **Card** : Bleu-gris moyen (`hsl(222 47% 22%)`) - Élévation forte (11% contraste)
- **Border** : Gris bleu moyen (`hsl(217 33% 25%)`) - Visibilité améliorée

#### Couleurs principales (Dark Mode)

##### Primary
- **Couleur** : `hsl(158 64% 52%)` - Vert émeraude plus clair pour le contraste
- **Foreground** : Bleu-gris très foncé (`hsl(222 47% 11%)`)

##### Accent
- **Couleur** : `hsl(172 66% 60%)` - Sarcelle plus clair
- **Foreground** : Bleu-gris très foncé (`hsl(222 47% 11%)`)

##### Success
- **Couleur** : `hsl(142 71% 55%)` - Vert plus clair
- **Foreground** : Bleu-gris très foncé (`hsl(222 47% 11%)`)

##### Warning
- **Couleur** : `hsl(38 92% 60%)` - Ambre plus clair
- **Foreground** : Bleu-gris très foncé (`hsl(222 47% 11%)`)

##### Info
- **Couleur** : `hsl(199 89% 58%)` - Bleu plus clair
- **Foreground** : Bleu-gris très foncé (`hsl(222 47% 11%)`)

## Espacements et bordures

### Border Radius
- **Valeur par défaut** : `0.75rem` (12px)
- **Usage** : Boutons, cartes, inputs, modales

### Espacements
L'application utilise l'échelle d'espacement standard de Tailwind CSS :
- `0.25rem` (4px) - `0.5rem` (8px) - `0.75rem` (12px) - `1rem` (16px) - `1.5rem` (24px) - `2rem` (32px) - etc.

## Composants UI

### Boutons
Les boutons utilisent les couleurs du système de design via les variables CSS :
- **Primary** : Utilise `--primary`
- **Secondary** : Utilise `--secondary`
- **Destructive** : Utilise `--destructive`
- **Outline** : Bordure avec couleur de texte

### Cartes
- Fond : `--card`
- Texte : `--card-foreground`
- Bordure : `--border`
- Border radius : `--radius`

### Inputs
- Fond : Transparent ou `--background`
- Bordure : `--input`
- Focus ring : `--ring`
- Texte : `--foreground`

## Accessibilité

### Contraste
Toutes les combinaisons de couleurs respectent les standards WCAG 2.1 :
- **AA** : Minimum pour le texte normal
- **AAA** : Recommandé pour le texte important

### Focus visible
- Tous les éléments interactifs ont un indicateur de focus visible
- Utilisation de `outline` et `box-shadow` pour une meilleure visibilité

### Sélection de texte
- Couleur de sélection : `--primary` avec opacité 20%
- Texte sélectionné : `--foreground`

## Scrollbar personnalisée

### Style
- **Largeur** : 10px
- **Track** : Gris avec opacité réduite
- **Thumb** : Couleur de bordure avec border-radius arrondi
- **Hover** : Opacité augmentée pour meilleure visibilité

## Animations

### Transitions
- **Base** : 150ms avec easing `cubic-bezier(0.4, 0, 0.2, 1)`
- **Lente** : 300ms avec le même easing

### Animations disponibles
- `animate-in` : Entrée avec scale et fade
- `animate-out` : Sortie avec scale et fade
- `fade-in` : Fade simple
- `slide-in-from-top` : Slide depuis le haut
- `slide-in-from-bottom` : Slide depuis le bas
- `scale-in` : Scale avec fade

## Responsive Design

L'application utilise les breakpoints Tailwind CSS :
- **sm** : 640px
- **md** : 768px
- **lg** : 1024px
- **xl** : 1280px
- **2xl** : 1536px

## Utilisation dans le code

### Variables CSS
Toutes les couleurs sont accessibles via les variables CSS définies dans `src/index.css` :

```css
/* Exemple d'utilisation */
.my-component {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

### Classes Tailwind
Les couleurs sont également disponibles via les classes Tailwind :
- `bg-primary`, `text-primary`
- `bg-secondary`, `text-secondary`
- `bg-destructive`, `text-destructive`
- `bg-success`, `text-success`
- `bg-warning`, `text-warning`
- `bg-info`, `text-info`

## Évolution future

Le système de design peut être étendu avec :
- Des variantes de couleurs supplémentaires si nécessaire
- Des composants UI supplémentaires
- Des animations personnalisées
- Des thèmes personnalisés par utilisateur

## Notes de conception

### Choix du vert émeraude (Primary)
Le vert émeraude a été choisi comme couleur principale pour plusieurs raisons :
1. **Association au tennis** : Couleur naturelle des courts de tennis
2. **Finance positive** : Le vert est universellement associé aux valeurs positives en finance
3. **Professionnalisme** : Le vert émeraude est une couleur professionnelle et moderne
4. **Accessibilité** : Excellent contraste avec le blanc et les fonds clairs

### Choix d'Inter
Inter a été choisie car :
1. **Lisibilité** : Optimisée spécifiquement pour les écrans
2. **Modernité** : Design contemporain et professionnel
3. **Performance** : Chargement rapide via Google Fonts avec preconnect
4. **Polyvalence** : Fonctionne bien à toutes les tailles et poids

