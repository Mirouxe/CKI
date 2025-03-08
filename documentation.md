# Documentation du Jeu de Reconnaissance de Célébrités

## Table des matières
1. [Vue d'ensemble du projet](#vue-densemble-du-projet)
2. [Architecture du projet](#architecture-du-projet)
3. [Description détaillée des fichiers](#description-détaillée-des-fichiers)
4. [Fonctionnement technique](#fonctionnement-technique)
5. [Concepts de programmation web utilisés](#concepts-de-programmation-web-utilisés)
6. [Guide de démarrage](#guide-de-démarrage)

## Vue d'ensemble du projet

Ce projet est un jeu web interactif où les utilisateurs doivent reconnaître des célébrités à partir d'images progressivement révélées. Le jeu comprend un système d'authentification complet (inscription/connexion) et un système de score persistant.

### Comment fonctionne le jeu ?
1. L'utilisateur crée un compte ou se connecte
2. Une fois connecté, il accède au jeu où des images de célébrités sont affichées
3. Les images sont d'abord floues ou partiellement visibles
4. L'utilisateur doit deviner qui est la célébrité
5. Pour chaque bonne réponse, le score augmente
6. Le système garde en mémoire les célébrités déjà trouvées pour ne pas les remontrer au même joueur

### Objectifs pédagogiques
- **Comprendre l'architecture client-serveur**
  - Communication entre le navigateur (client) et le serveur Node.js
  - Échanges de données via des requêtes HTTP
  - Gestion des états et des sessions

- **Maîtriser la gestion des sessions utilisateur**
  - Création et maintien des sessions
  - Sécurisation des données utilisateur
  - Gestion de l'état de connexion

- **Apprendre à gérer une base de données simple (JSON)**
  - Structure des données avec lowdb
  - Opérations CRUD (Create, Read, Update, Delete)
  - Persistance des données entre les sessions

- **Pratiquer les requêtes HTTP et les API REST**
  - Méthodes HTTP (GET, POST)
  - Gestion des réponses et des erreurs
  - Architecture REST pour les API

- **Manipuler le DOM avec JavaScript**
  - Modification dynamique du contenu HTML
  - Gestion des événements utilisateur
  - Mise à jour en temps réel de l'interface

## Architecture du projet

Le projet suit une architecture client-serveur classique, où chaque composant a un rôle spécifique :

### Structure des fichiers
```
projet/
│
├── server.js           # Serveur Node.js/Express
│   └── Gère toute la logique côté serveur
│       - Routes API
│       - Sessions
│       - Base de données
│
├── db.json            # Base de données JSON (lowdb)
│   └── Stocke de façon persistante
│       - Utilisateurs
│       - Scores
│       - Célébrités trouvées
│
├── index.html         # Page principale du jeu
│   └── Interface du jeu
│       - Affichage des images
│       - Zone de réponse
│       - Score
│
├── login.html         # Page de connexion/inscription
│   └── Formulaires d'authentification
│       - Inscription
│       - Connexion
│
├── login.js          # Logique de connexion/inscription
│   └── Gestion des formulaires
│       - Validation
│       - Envoi au serveur
│       - Gestion des réponses
│
├── script.js         # Logique du jeu
│   └── Fonctionnalités du jeu
│       - Chargement des images
│       - Vérification des réponses
│       - Mise à jour du score
│
├── style.css         # Styles CSS
│   └── Mise en forme visuelle
│       - Layout
│       - Animations
│       - Responsive design
│
└── images/           # Dossier des images
    └── Photos des célébrités
        - Différentes versions
        - Différents niveaux de difficulté
```

### Flux de données
1. **Client vers Serveur**
   - Requêtes d'authentification
   - Soumission des réponses
   - Demande de nouvelles images

2. **Serveur vers Client**
   - Réponses d'authentification
   - Confirmation des réponses
   - Envoi des images
   - Mise à jour des scores

## Description détaillée des fichiers

### 1. server.js
Le serveur est le cœur de l'application, développé avec Node.js et Express. Voici une analyse détaillée de ses composants :

#### Configuration initiale
```javascript
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
```
- **express** : Framework web pour Node.js
  - Simplifie la création de serveurs web
  - Gère les routes et les middlewares
  - Facilite le traitement des requêtes

- **bodyParser** : Middleware pour parser les requêtes
  - Parse les données POST
  - Convertit les données en format utilisable
  - Supporte différents types de contenu

#### Configuration des sessions
```javascript
app.use(session({
    secret: 'votre_clef_secrete',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true en production avec HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));
```
- **secret** : Clé pour signer les cookies
- **resave** : Évite de sauvegarder les sessions non modifiées
- **saveUninitialized** : Ne sauvegarde pas les sessions vides
- **cookie** :
  - **secure** : HTTPS uniquement en production
  - **httpOnly** : Protection XSS
  - **maxAge** : Durée de vie du cookie

#### Base de données (lowdb)
```javascript
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({
    users: [],
    seen_celebrities: []
}).write();
```
- **FileSync** : Adaptateur pour stockage fichier
- **defaults** : Structure initiale de la base
- **write** : Sauvegarde synchrone des données

#### Middleware d'authentification
```javascript
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    next();
};
```
- Vérifie la présence d'une session valide
- Redirige vers la connexion si nécessaire
- Protège les routes sensibles

#### Routes d'authentification
```javascript
app.post('/register', (req, res) => {
    // Validation des données
    // Création de l'utilisateur
    // Initialisation de la session
});

app.post('/login', (req, res) => {
    // Vérification des identifiants
    // Création de la session
    // Redirection vers le jeu
});
```

#### Routes du jeu
```javascript
app.get('/get-celebrity', requireAuth, (req, res) => {
    // Récupération des célébrités non vues
    // Filtrage selon l'utilisateur
});

app.post('/found-celebrity', requireAuth, (req, res) => {
    // Vérification de la réponse
    // Mise à jour du score
    // Sauvegarde en base
});
```

### 2. login.html
La page de connexion est la première interface que voit l'utilisateur :

#### Structure HTML
```html
<!DOCTYPE html>
<html>
<head>
    <title>Connexion au Jeu</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Formulaire d'inscription -->
    <form id="registerForm">
        <input type="text" name="firstname" required>
        <input type="text" name="lastname" required>
        <input type="password" name="password" required>
        <button type="submit">S'inscrire</button>
    </form>

    <!-- Formulaire de connexion -->
    <form id="loginForm">
        <!-- Champs similaires -->
    </form>
</body>
</html>
```

### 3. login.js
Gère toute la logique d'authentification côté client :

#### Gestion des formulaires
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Validation côté client
        // Envoi au serveur
        // Gestion des réponses
    });
});
```

#### Envoi des données
```javascript
const response = await fetch('/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(new FormData(registerForm))
});
```
- **fetch** : API moderne pour les requêtes HTTP
- **FormData** : Collecte les données du formulaire
- **URLSearchParams** : Encode les données pour l'envoi

### 4. index.html
Page principale du jeu avec une interface interactive :

#### Structure du jeu
```html
<div id="game-container">
    <div id="image-container">
        <!-- Images des célébrités -->
    </div>
    <div id="input-container">
        <!-- Zone de réponse -->
    </div>
    <div id="score-container">
        <!-- Affichage du score -->
    </div>
</div>
```

### 5. script.js
Contient toute la logique du jeu :

#### Chargement des images
```javascript
async function loadNewCelebrity() {
    const response = await fetch('/get-celebrity');
    const data = await response.json();
    // Affichage de l'image
    // Préparation du jeu
}
```

#### Vérification des réponses
```javascript
async function checkAnswer(answer) {
    // Normalisation de la réponse
    // Envoi au serveur
    // Mise à jour du score
    // Animation de réussite/échec
}
```

### 6. style.css
Styles et mise en page de l'application :

```css
/* Layout responsive */
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

/* Animations */
.celebrity-image {
    transition: filter 0.3s ease;
}

/* États du jeu */
.correct-answer {
    animation: success 0.5s ease;
}
```

## Fonctionnement technique

### Système d'authentification
Le processus complet d'authentification :

1. **Inscription**
   - Validation des données côté client
   - Envoi sécurisé au serveur
   - Vérification des doublons
   - Création du compte
   - Initialisation du score

2. **Connexion**
   - Vérification des identifiants
   - Création de la session
   - Cookie sécurisé
   - Redirection vers le jeu

3. **Maintien de session**
   - Vérification à chaque requête
   - Renouvellement automatique
   - Déconnexion après inactivité

### Protection des routes
Système de sécurité multicouche :

```javascript
// Middleware global de logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Protection des routes sensibles
app.use('/api', requireAuth);
app.use('/images', requireAuth);

// Middleware d'authentification
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    next();
};
```

### Gestion des scores
Système de scoring complexe :

1. **Validation des réponses**
   - Normalisation des entrées
   - Comparaison insensible à la casse
   - Gestion des accents

2. **Mise à jour du score**
   - Vérification des doublons
   - Incrémentation atomique
   - Sauvegarde en base

3. **Persistance**
   - Stockage dans la session
   - Sauvegarde en base
   - Synchronisation client/serveur

## Concepts de programmation web utilisés

### 1. Promises et Async/Await
La gestion asynchrone moderne :

```javascript
// Ancien style (Promises)
fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        // Traitement
    })
    .catch(error => {
        // Gestion d'erreur
    });

// Style moderne (Async/Await)
async function getData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        // Traitement
    } catch (error) {
        // Gestion d'erreur
    }
}
```

### 2. Sessions et Cookies
Gestion avancée des sessions :

```javascript
// Configuration des sessions
app.use(session({
    secret: 'votre_clef_secrete',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Utilisation dans les routes
app.get('/profile', (req, res) => {
    // Données de session disponibles
    const user = req.session.user;
    // Modification de la session
    req.session.lastAccess = Date.now();
});
```

### 3. API REST
Architecture REST complète :

```javascript
// GET - Lecture
app.get('/api/users', (req, res) => {
    // Liste des utilisateurs
});

// POST - Création
app.post('/api/users', (req, res) => {
    // Nouvel utilisateur
});

// PUT - Mise à jour complète
app.put('/api/users/:id', (req, res) => {
    // Modification utilisateur
});

// DELETE - Suppression
app.delete('/api/users/:id', (req, res) => {
    // Suppression utilisateur
});
```

### 4. Manipulation du DOM
Interactions riches avec le DOM :

```javascript
// Chargement sécurisé
document.addEventListener('DOMContentLoaded', () => {
    // Le DOM est prêt
});

// Sélection d'éléments
const element = document.querySelector('.ma-classe');
const elements = document.querySelectorAll('.ma-classe');

// Modification du contenu
element.textContent = 'Nouveau texte';
element.innerHTML = '<span>HTML</span>';

// Gestion des événements
element.addEventListener('click', (e) => {
    e.preventDefault();
    // Action
});

// Modifications de style
element.style.display = 'none';
element.classList.add('active');
```

## Guide de démarrage

### 1. Prérequis
- Node.js (v12 ou supérieur)
- npm (gestionnaire de paquets)
- Navigateur moderne
- Éditeur de code

### 2. Installation
```bash
# Cloner le projet
git clone <url-du-projet>

# Installer les dépendances
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos paramètres
```

### 3. Configuration du serveur
```javascript
// .env
PORT=3000
SESSION_SECRET=votre_clef_secrete
NODE_ENV=development
```

### 4. Structure des images
```
images/
├── celebrity1/
│   ├── zoom1.jpg
│   ├── zoom2.jpg
│   └── original.jpg
├── celebrity2/
│   └── ...
```

### 5. Démarrage
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## Bonnes pratiques implémentées

### 1. Sécurité
- **Validation des entrées**
  ```javascript
  function sanitizeInput(input) {
      return input.trim().toLowerCase();
  }
  ```

- **Protection XSS**
  ```javascript
  app.use(helmet());
  ```

- **Sessions sécurisées**
  ```javascript
  app.use(session({
      secret: process.env.SESSION_SECRET,
      // ...
  }));
  ```

### 2. Performance
- **Chargement asynchrone**
  ```javascript
  async function loadResources() {
      const [data1, data2] = await Promise.all([
          fetch('/api/resource1'),
          fetch('/api/resource2')
      ]);
  }
  ```

- **Mise en cache**
  ```javascript
  app.use(express.static('public', {
      maxAge: '1d'
  }));
  ```

### 3. Expérience utilisateur
- **Messages d'erreur**
  ```javascript
  function showError(message) {
      const errorDiv = document.getElementById('error');
      errorDiv.textContent = message;
      errorDiv.classList.add('visible');
  }
  ```

- **Animations fluides**
  ```css
  .transition {
      transition: all 0.3s ease;
  }
  ```

## Améliorations possibles

### 1. Sécurité
- **Hachage des mots de passe**
  ```javascript
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);
  ```

- **Protection CSRF**
  ```javascript
  app.use(csrf());
  ```

### 2. Fonctionnalités
- **Classement des joueurs**
  ```javascript
  app.get('/leaderboard', async (req, res) => {
      const topPlayers = await db.get('users')
          .orderBy('score', 'desc')
          .take(10)
          .value();
  });
  ```

### 3. Technique
- **Tests automatisés**
  ```javascript
  describe('Authentication', () => {
      it('should login valid users', async () => {
          // Test
      });
  });
  ```

## Conclusion

Ce projet démontre l'utilisation de nombreuses technologies web modernes :

1. **Frontend**
   - HTML5 sémantique
   - CSS3 avec Flexbox/Grid
   - JavaScript moderne (ES6+)

2. **Backend**
   - Node.js
   - Express
   - Sessions
   - Base de données JSON

3. **Sécurité**
   - Authentification
   - Protection des routes
   - Validation des données

4. **Architecture**
   - RESTful
   - Modulaire
   - Extensible

Le code est organisé de manière à être facilement compréhensible et maintenable, tout en suivant les meilleures pratiques de développement web. 