Attention !!! : la langue a utilisé est le français.

Je souhaite créer une application web gérant la caisse (encaissement liquide, chèque, cb) pour une structure comme un club de tennis.

Il faudrait y intégrer la gestion de stocks (boissons, alimentaires etc...). En produit de sortie il faudrait pouvoir avoir tous les documents comptables pour faire le bilan et être intégré par la suite dans le bilan financier du club.
Pour les membres du club comme pour les non membres un compte pourrait être créé.

Technologies :
- vitejs pour react
- shadcn
- tailwindcss
- base de données mysql (phpmyadmin)
- docker (si possible car je développe sous l'espace github codespace)
- pour les graphiques pour les documents comptables, je veux quelque chose de pro, fiable

## Système de Rôles et Permissions

### Architecture : Permissions Modulaires

Le système utilise une approche modulaire combinant :
- **Rôles prédéfinis** : Templates de permissions pour les cas d'usage courants
- **Permissions granulaires** : Contrôle fin par fonctionnalité
- **Combinaison flexible** : Un utilisateur peut avoir plusieurs rôles

### Profils Utilisateurs

#### 1. Administrateur
- Configuration complète du système
- Gestion des utilisateurs et attribution des rôles
- Accès à toutes les fonctionnalités
- Correction/ajustement des données

#### 2. Président
- Vue d'ensemble et tableaux de bord
- Accès aux rapports et statistiques globales
- Consultation de toute la comptabilité
- Peut effectuer des encaissements (membre du bureau)

#### 3. Trésorier
- **Consultation/validation comptabilité uniquement** (pas d'encaissements directs)
- Génération des documents comptables pour le bilan
- Gestion des stocks (inventaire, commandes, alertes)
- Rapports financiers et exports
- Validation/réconciliation des opérations

#### 4. Secrétaire
- Gestion administrative des membres
- Création de comptes membres/non-membres
- Consultation des opérations
- Peut effectuer des encaissements (membre du bureau)

#### 5. Caissier/Bénévole
- Encaissements (liquide, chèque, CB)
- Ventes de produits
- Consultation du stock (lecture seule)
- Historique de leurs propres opérations

#### 6. Membre du club
- Consultation de leur compte personnel
- Historique de leurs achats/paiements
- Solde du compte
- (Optionnel : rechargement de compte en ligne)

#### 7. Non-membre/Invité
- Consultation de leur compte invité
- Historique limité de leurs transactions

### Permissions Granulaires

#### Permissions Caisse
- `caisse.encaisser_especes`
- `caisse.encaisser_cheque`
- `caisse.encaisser_cb`
- `caisse.annuler_vente`
- `caisse.voir_historique`

#### Permissions Stocks
- `stock.consulter`
- `stock.modifier`
- `stock.ajouter_produit`
- `stock.faire_inventaire`
- `stock.passer_commande`

#### Permissions Comptabilité
- `compta.consulter_tout`
- `compta.generer_documents`
- `compta.exporter_bilan`
- `compta.corriger_ecritures`

#### Permissions Membres
- `membres.creer_compte`
- `membres.modifier_compte`
- `membres.voir_liste`
- `membres.supprimer_compte`

#### Permissions Système
- `admin.gerer_utilisateurs`
- `admin.configurer_app`
- `admin.voir_logs`

### Matrice des Permissions

| Fonctionnalité | Admin | Président | Trésorier | Secrétaire | Caissier | Membre | Non-membre |
|----------------|-------|-----------|-----------|------------|----------|--------|------------|
| Encaissements | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ |
| Gestion stocks | ✓ | ✓ | ✓ | ✗ | Lecture | ✗ | ✗ |
| Documents comptables | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Gestion membres | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Configuration système | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Consultation compte | ✓ | ✓ | ✓ | ✓ | ✓ | Soi | Soi |

### Exemples de Combinaisons

**Marie** (Secrétaire + Caissier) :
- Peut gérer les membres ET faire les encaissements
- Rôles : `["SECRETAIRE", "CAISSIER"]`

**Jean** (Président + Trésorier) :
- Cumul des responsabilités du bureau
- Rôles : `["PRESIDENT", "TRESORIER"]`

**Paul** (Caissier avec gestion stock) :
- Rôle standard : `["CAISSIER"]`
- Permissions supplémentaires : `["stock.modifier", "stock.faire_inventaire"]` 