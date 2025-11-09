-- Script d'initialisation de la base de données
-- Application de gestion de caisse pour club de tennis

-- ========================================
-- TABLES PRINCIPALES
-- ========================================

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Table des rôles prédéfinis
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Table des permissions
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(100) UNIQUE NOT NULL,
    categorie VARCHAR(50) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categorie (categorie)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Association rôles → permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Association utilisateurs → rôles (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Permissions additionnelles par utilisateur
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ========================================
-- DONNÉES INITIALES - RÔLES
-- ========================================

INSERT INTO
    roles (code, nom, description)
VALUES (
        'ADMIN',
        'Administrateur',
        'Accès complet au système'
    ),
    (
        'PRESIDENT',
        'Président',
        'Vue d''ensemble et gestion du club'
    ),
    (
        'TRESORIER',
        'Trésorier',
        'Gestion comptable et stocks'
    ),
    (
        'SECRETAIRE',
        'Secrétaire',
        'Gestion membres et caisse'
    ),
    (
        'CAISSIER',
        'Caissier/Bénévole',
        'Encaissements et ventes'
    ),
    (
        'MEMBRE',
        'Membre du club',
        'Consultation compte personnel'
    ),
    (
        'NON_MEMBRE',
        'Non-membre',
        'Consultation compte invité'
    );

-- ========================================
-- DONNÉES INITIALES - PERMISSIONS
-- ========================================

-- Permissions Caisse
INSERT INTO
    permissions (
        code,
        categorie,
        nom,
        description
    )
VALUES (
        'caisse.encaisser_especes',
        'caisse',
        'Encaisser en espèces',
        'Effectuer un encaissement en liquide'
    ),
    (
        'caisse.encaisser_cheque',
        'caisse',
        'Encaisser par chèque',
        'Effectuer un encaissement par chèque'
    ),
    (
        'caisse.encaisser_cb',
        'caisse',
        'Encaisser par CB',
        'Effectuer un encaissement par carte bancaire'
    ),
    (
        'caisse.annuler_vente',
        'caisse',
        'Annuler une vente',
        'Annuler une transaction'
    ),
    (
        'caisse.voir_historique',
        'caisse',
        'Voir historique caisse',
        'Consulter l''historique des transactions'
    ),
    (
        'caisse.voir_historique_global',
        'caisse',
        'Voir tout l''historique',
        'Consulter toutes les transactions de tous les caissiers'
    );

-- Permissions Stock
INSERT INTO
    permissions (
        code,
        categorie,
        nom,
        description
    )
VALUES (
        'stock.consulter',
        'stock',
        'Consulter stocks',
        'Voir l''état des stocks'
    ),
    (
        'stock.modifier',
        'stock',
        'Modifier stocks',
        'Modifier les quantités en stock'
    ),
    (
        'stock.ajouter_produit',
        'stock',
        'Ajouter produit',
        'Créer un nouveau produit'
    ),
    (
        'stock.supprimer_produit',
        'stock',
        'Supprimer produit',
        'Supprimer un produit'
    ),
    (
        'stock.faire_inventaire',
        'stock',
        'Faire inventaire',
        'Effectuer un inventaire des stocks'
    ),
    (
        'stock.passer_commande',
        'stock',
        'Passer commande',
        'Commander des produits auprès des fournisseurs'
    ),
    (
        'stock.gerer_categories',
        'stock',
        'Gérer catégories',
        'Créer, modifier et supprimer des catégories de produits'
    );

-- Permissions Comptabilité
INSERT INTO
    permissions (
        code,
        categorie,
        nom,
        description
    )
VALUES (
        'compta.consulter_tout',
        'compta',
        'Consulter comptabilité',
        'Voir tous les documents comptables'
    ),
    (
        'compta.generer_documents',
        'compta',
        'Générer documents',
        'Créer les documents comptables'
    ),
    (
        'compta.exporter_bilan',
        'compta',
        'Exporter bilan',
        'Exporter les données pour le bilan'
    ),
    (
        'compta.corriger_ecritures',
        'compta',
        'Corriger écritures',
        'Modifier les écritures comptables'
    );

-- Permissions Membres
INSERT INTO
    permissions (
        code,
        categorie,
        nom,
        description
    )
VALUES (
        'membres.creer_compte',
        'membres',
        'Créer compte',
        'Créer un compte membre ou non-membre'
    ),
    (
        'membres.modifier_compte',
        'membres',
        'Modifier compte',
        'Modifier les informations d''un compte'
    ),
    (
        'membres.voir_liste',
        'membres',
        'Voir liste membres',
        'Consulter la liste des membres'
    ),
    (
        'membres.supprimer_compte',
        'membres',
        'Supprimer compte',
        'Supprimer un compte utilisateur'
    ),
    (
        'membres.consulter_compte_soi',
        'membres',
        'Voir son compte',
        'Consulter son propre compte'
    );

-- Permissions Admin
INSERT INTO
    permissions (
        code,
        categorie,
        nom,
        description
    )
VALUES (
        'admin.gerer_utilisateurs',
        'admin',
        'Gérer utilisateurs',
        'Créer, modifier, supprimer des utilisateurs'
    ),
    (
        'admin.configurer_app',
        'admin',
        'Configurer application',
        'Modifier les paramètres de l''application'
    ),
    (
        'admin.voir_logs',
        'admin',
        'Voir logs',
        'Consulter les logs système'
    ),
    (
        'admin.gerer_roles',
        'admin',
        'Gérer rôles',
        'Créer et modifier les rôles et permissions'
    );

-- ========================================
-- ASSOCIATIONS RÔLES → PERMISSIONS
-- ========================================

-- ADMIN : toutes les permissions
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.code = 'ADMIN';

-- PRESIDENT : caisse.*, compta.consulter_tout, compta.generer_documents, membres.voir_liste, stock.consulter
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.code = 'PRESIDENT'
    AND (
        p.categorie = 'caisse'
        OR p.code IN (
            'compta.consulter_tout',
            'compta.generer_documents',
            'membres.voir_liste',
            'stock.consulter'
        )
    );

-- TRESORIER : stock.*, compta.*, membres.voir_liste (pas de caisse)
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.code = 'TRESORIER'
    AND (
        p.categorie IN ('stock', 'compta')
        OR p.code = 'membres.voir_liste'
    );

-- SECRETAIRE : caisse.*, membres.*, stock.consulter
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.code = 'SECRETAIRE'
    AND (
        p.categorie IN ('caisse', 'membres')
        OR p.code = 'stock.consulter'
    );

-- CAISSIER : encaissements, ventes, consultation stock
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.code = 'CAISSIER'
    AND p.code IN (
        'caisse.encaisser_especes',
        'caisse.encaisser_cheque',
        'caisse.encaisser_cb',
        'caisse.voir_historique',
        'stock.consulter'
    );

-- MEMBRE : consultation de son propre compte
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.code = 'MEMBRE'
    AND p.code = 'membres.consulter_compte_soi';

-- NON_MEMBRE : consultation de son propre compte
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.code = 'NON_MEMBRE'
    AND p.code = 'membres.consulter_compte_soi';

-- ========================================
-- TABLES MÉTIER
-- ========================================

-- Table des catégories de produits
CREATE TABLE IF NOT EXISTS categories_produits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Table des produits
CREATE TABLE IF NOT EXISTS produits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    categorie_id INT,
    prix_vente DECIMAL(10, 2) NOT NULL,
    prix_achat DECIMAL(10, 2),
    stock_actuel INT DEFAULT 0,
    stock_minimum INT DEFAULT 0,
    stock_maximum INT DEFAULT 0,
    unite VARCHAR(20) DEFAULT 'unité',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categorie_id) REFERENCES categories_produits (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Table des transactions de caisse
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    caissier_id INT NOT NULL,
    type_paiement ENUM ('especes', 'cheque', 'cb') NOT NULL,
    montant_total DECIMAL(10, 2) NOT NULL,
    reference_cheque VARCHAR(100),
    reference_cb VARCHAR(100),
    statut ENUM ('validee', 'annulee') DEFAULT 'validee',
    annulee_par INT,
    annulee_at TIMESTAMP NULL,
    raison_annulation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (caissier_id) REFERENCES users (id),
    FOREIGN KEY (annulee_par) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Table des lignes de transaction
CREATE TABLE IF NOT EXISTS lignes_transaction (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL,
    prix_unitaire DECIMAL(10, 2) NOT NULL,
    prix_total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produit_id INT NOT NULL,
    type_mouvement ENUM (
        'entree',
        'sortie',
        'ajustement',
        'inventaire'
    ) NOT NULL,
    quantite INT NOT NULL,
    stock_avant INT NOT NULL,
    stock_apres INT NOT NULL,
    reference VARCHAR(100),
    commentaire TEXT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Table des comptes membres/non-membres
CREATE TABLE IF NOT EXISTS comptes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    type_compte ENUM ('membre', 'non_membre') NOT NULL,
    solde DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ========================================
-- DONNÉES DE TEST
-- ========================================

-- Utilisateur administrateur par défaut
-- Mot de passe : admin123 (à changer en production)
INSERT INTO
    users (
        email,
        password_hash,
        nom,
        prenom,
        is_active
    )
VALUES (
        'admin@club-tennis.fr',
        '$2b$10$vZMR99EzwdzPONbJZtAj1uOEooZbyVjH4L2AYey7aQUJ056LWwog2',
        'Admin',
        'Principal',
        TRUE
    );

-- Assigner le rôle ADMIN à l'utilisateur admin
INSERT INTO
    user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
    CROSS JOIN roles r
WHERE
    u.email = 'admin@club-tennis.fr'
    AND r.code = 'ADMIN';

-- Catégories de produits exemples
INSERT INTO
    categories_produits (nom, description)
VALUES (
        'Boissons chaudes',
        'Café, thé, chocolat chaud'
    ),
    (
        'Boissons fraîches',
        'Sodas, jus, eau'
    ),
    (
        'Snacks',
        'Barres chocolatées, chips, biscuits'
    ),
    (
        'Restauration',
        'Sandwichs, salades'
    );

-- Produits exemples
INSERT INTO
    produits (
        nom,
        categorie_id,
        prix_vente,
        prix_achat,
        stock_actuel,
        stock_minimum
    )
VALUES (
        'Café',
        1,
        1.50,
        0.30,
        100,
        20
    ),
    ('Thé', 1, 1.50, 0.25, 80, 20),
    (
        'Coca-Cola',
        2,
        2.50,
        1.00,
        50,
        15
    ),
    (
        'Eau minérale',
        2,
        1.00,
        0.40,
        100,
        30
    ),
    (
        'Barre chocolatée',
        3,
        1.80,
        0.80,
        60,
        20
    ),
    (
        'Chips',
        3,
        2.00,
        0.90,
        40,
        15
    ),
    (
        'Sandwich jambon',
        4,
        4.50,
        2.00,
        20,
        5
    ),
    (
        'Salade César',
        4,
        5.50,
        2.50,
        15,
        5
    );