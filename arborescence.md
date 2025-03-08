# Arborescence et Fonctionnement du Jeu "Qui est-ce?"

## Structure des Fichiers

```
jeu/
│
├── server.js                # Serveur Node.js, gestion des routes et de l'authentification
├── index.html               # Page principale du jeu
├── login.html               # Page de connexion et d'inscription
├── admin.html               # Interface d'administration
├── script.js                # Logique principale du jeu côté client
├── login.js                 # Gestion de la connexion et de l'inscription
├── style.css                # Styles CSS pour toutes les pages
├── db.json                  # Base de données JSON (utilisateurs et célébrités vues)
├── package.json             # Configuration des dépendances Node.js
├── documentation.md         # Documentation du projet
│
└── images/                  # Dossier contenant les images des célébrités
    ├── anthony_hopkins/     # Un dossier par célébrité
    │   ├── original.jpg     # Image originale
    │   ├── zoom1.jpg        # Image avec zoom niveau 1
    │   ├── zoom2.jpg        # Image avec zoom niveau 2
    │   ├── zoom3.jpg        # Image avec zoom niveau 3
    │   ├── zoom4.jpg        # Image avec zoom niveau 4
    │   ├── zoom5.jpg        # Image avec zoom niveau 5
    │   └── infos.txt        # Informations sur la célébrité (indices)
    │
    ├── antoine_de_saint_exupery/
    │   └── ...
    │
    └── [autres célébrités]/
        └── ...
```

## Flux de Fonctionnement

### 1. Authentification et Gestion des Utilisateurs

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  login.html │────▶│   login.js  │────▶│  server.js  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │   db.json   │
                                         └─────────────┘
```

- **login.html** : Interface utilisateur pour la connexion et l'inscription
- **login.js** : Gère les formulaires et envoie les requêtes au serveur
- **server.js** : Traite les requêtes d'authentification et gère les sessions
- **db.json** : Stocke les informations des utilisateurs

#### Routes d'authentification :
- `/register` : Inscription d'un nouvel utilisateur
- `/login` : Connexion d'un utilisateur existant

### 2. Jeu Principal

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  index.html │────▶│  script.js  │────▶│  server.js  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                          │                     │
                          ▼                     ▼
                   ┌─────────────┐      ┌─────────────┐
                   │   images/   │      │   db.json   │
                   └─────────────┘      └─────────────┘
```

- **index.html** : Interface principale du jeu
- **script.js** : Logique du jeu (chargement des images, vérification des réponses, etc.)
- **server.js** : Gère les requêtes API pour le jeu
- **images/** : Contient les images des célébrités à différents niveaux de zoom
- **db.json** : Stocke les scores et les célébrités vues par chaque utilisateur

#### Fonctionnalités du jeu :
- Affichage d'images de célébrités avec différents niveaux de zoom
- Système de points (gain pour les bonnes réponses, pénalités pour les aides)
- Indices pour aider à identifier les célébrités
- Classement des joueurs

### 3. Administration

```
┌─────────────┐     ┌─────────────┐
│  admin.html │────▶│  server.js  │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   db.json   │
                    └─────────────┘
```

- **admin.html** : Interface d'administration
- **server.js** : Gère les requêtes d'administration
- **db.json** : Base de données à administrer

#### Fonctionnalités d'administration :
- Gestion des utilisateurs (affichage, suppression)
- Statistiques sur les célébrités (qui a trouvé quoi)
- Réinitialisation des scores

## Flux de Données

### Chargement d'une Célébrité

1. Le client demande une nouvelle célébrité via script.js
2. Le serveur vérifie les célébrités déjà vues par l'utilisateur
3. Le serveur sélectionne une célébrité non trouvée ou aléatoire
4. Le client charge l'image avec le niveau de zoom initial
5. L'utilisateur tente d'identifier la célébrité

### Soumission d'une Réponse

1. L'utilisateur soumet sa réponse via le formulaire
2. script.js vérifie la réponse
3. Si correcte :
   - Le score est mis à jour
   - La célébrité est marquée comme "trouvée"
   - Les données sont envoyées au serveur pour mise à jour de db.json
4. Si incorrecte :
   - Un message d'erreur est affiché
   - L'utilisateur peut réessayer ou utiliser des aides

### Utilisation des Aides

1. L'utilisateur clique sur "Dézoom" :
   - Le niveau de zoom est augmenté
   - Une pénalité de points est appliquée
   - Une nouvelle image est chargée

2. L'utilisateur clique sur "Indice" :
   - Un indice est récupéré depuis le fichier infos.txt
   - Une pénalité de points est appliquée
   - L'indice est affiché à l'utilisateur

## Sécurité

- Authentification par session
- Protection des routes avec middleware requireAuth
- Accès administrateur limité aux comptes admin
- Protection contre les accès directs aux images

## Base de Données (db.json)

### Structure

```json
{
  "users": [
    {
      "id": 1234567890,
      "firstname": "John",
      "lastname": "Doe",
      "password": "password123",
      "score": 42
    },
    ...
  ],
  "seen_celebrities": [
    {
      "user_id": 1234567890,
      "celebrity_name": "anthony_hopkins",
      "seen_date": "2023-03-08T12:34:56.789Z",
      "found": true
    },
    ...
  ]
}
```

## Processus de Développement

Pour ajouter une nouvelle célébrité au jeu :

1. Créer un dossier avec le nom de la célébrité dans le dossier `images/`
2. Ajouter les images aux différents niveaux de zoom (original.jpg, zoom1.jpg, etc.)
3. Créer un fichier infos.txt avec des indices sur la célébrité
4. Ajouter le nom de la célébrité à la liste dans script.js

Pour modifier les règles du jeu :

1. Ajuster les constantes POINTS dans script.js
2. Modifier les fonctions de calcul de score 