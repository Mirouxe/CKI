# Jeu de Reconnaissance de Célébrités

Un jeu web où les joueurs doivent identifier des célébrités à partir d'images avec différents niveaux de zoom.

## Fonctionnalités

- Système d'authentification (inscription/connexion)
- Affichage d'images de célébrités avec différents niveaux de zoom
- Système de points (gain pour les bonnes réponses, pénalités pour les aides)
- Indices pour aider à identifier les célébrités
- Classement des joueurs
- Interface d'administration

## Technologies utilisées

- **Frontend** : HTML, CSS, JavaScript vanilla
- **Backend** : Node.js, Express
- **Base de données** : MongoDB (via Mongoose)
- **Authentification** : Sessions Express

## Installation

1. Clonez ce dépôt
2. Installez les dépendances avec `npm install`
3. Créez un fichier `.env` à la racine du projet avec les variables suivantes :
   ```
   MONGODB_URI=votre_chaine_de_connexion_mongodb
   PORT=3000
   ```
4. Démarrez le serveur avec `npm start`

## Configuration de MongoDB

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster (l'offre gratuite est suffisante)
3. Configurez l'accès réseau pour autoriser les connexions depuis votre serveur
4. Créez un utilisateur de base de données
5. Obtenez votre chaîne de connexion et ajoutez-la dans le fichier `.env`

## Migration des données

Si vous avez des données existantes dans un fichier `db.json`, vous pouvez les migrer vers MongoDB en exécutant :

```
node migrate-data.js
```

## Déploiement

Pour déployer l'application sur Render :

1. Connectez votre dépôt GitHub à Render
2. Créez un nouveau service Web
3. Configurez les variables d'environnement (MONGODB_URI et PORT)
4. Déployez l'application

## Structure du projet

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
├── migrate-data.js          # Script de migration des données vers MongoDB
├── models/                  # Modèles Mongoose
│   ├── User.js              # Modèle pour les utilisateurs
│   ├── SeenCelebrity.js     # Modèle pour les célébrités vues
│   └── db.js                # Configuration de la connexion à MongoDB
├── package.json             # Configuration des dépendances Node.js
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
    └── [autres célébrités]/
        └── ...
```

## Licence

Ce projet est sous licence MIT. 