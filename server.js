const express = require('express');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

// Configuration du middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'votre_clef_secrete',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // mettre true en production avec HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));

// Initialisation de la base de données
const adapter = new FileSync('db.json');
const db = low(adapter);

// Définir la structure par défaut de la base de données
db.defaults({
    users: [],
    seen_celebrities: []
}).write();

// Création du compte admin s'il n'existe pas
const createAdminAccount = () => {
    const adminExists = db.get('users')
        .find({ firstname: 'admin', lastname: 'admin' })
        .value();

    if (!adminExists) {
        console.log('Création du compte admin...');
        db.get('users')
            .push({
                id: Date.now(),
                firstname: 'admin',
                lastname: 'admin',
                password: 'admin',
                score: 0
            })
            .write();
        console.log('Compte admin créé avec succès');
    }
};

// Appeler la fonction au démarrage
createAdminAccount();

// Middleware pour logger les requêtes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Session:`, req.session.user ? 'Connecté' : 'Non connecté');
    next();
});

// Middleware d'authentification
const requireAuth = (req, res, next) => {
    console.log('=== Tentative d\'accès à une ressource protégée ===');
    console.log('URL:', req.url);
    console.log('Session:', req.session.user ? 'Connecté' : 'Non connecté');
    
    if (!req.session.user) {
        console.log('❌ Accès refusé - Redirection vers login');
        return res.redirect('/login.html');
    }
    console.log('✅ Accès autorisé');
    next();
};

// Middleware d'authentification admin
const requireAdmin = (req, res, next) => {
    console.log('=== Vérification des droits admin ===');
    console.log('Session utilisateur:', req.session.user);
    
    if (!req.session.user) {
        console.log('❌ Pas de session utilisateur');
        return res.redirect('/login.html');
    }
    
    if (req.session.user.firstname !== 'admin' || req.session.user.lastname !== 'admin') {
        console.log('❌ Utilisateur non admin:', req.session.user.firstname, req.session.user.lastname);
        return res.redirect('/');
    }
    
    console.log('✅ Accès admin autorisé');
    next();
};

// Routes publiques
app.get('/login.html', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Fichiers statiques publics
app.use('/login.js', express.static(path.join(__dirname, 'login.js')));
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));

// Protection des routes du jeu
app.use('/script.js', express.static(path.join(__dirname, 'script.js')));

// Servir les images de manière protégée
app.use('/images', requireAuth, (req, res, next) => {
    // Désactiver le cache pour les images
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
}, express.static(path.join(__dirname, 'images')));

// Servir les autres fichiers statiques après l'authentification
app.use(express.static(__dirname));

// Route de test pour vérifier la base de données (protégée)
app.get('/test-db', requireAdmin, (req, res) => {
    console.log('=== État actuel de la base de données ===');
    const users = db.get('users').value();
    const seenCelebrities = db.get('seen_celebrities').value();
    
    // Ajouter les informations utilisateur aux célébrités vues
    const seenCelebritiesWithUserInfo = seenCelebrities.map(seen => {
        const user = users.find(u => u.id === seen.user_id);
        return {
            ...seen,
            user_name: user ? `${user.firstname} ${user.lastname}` : 'Utilisateur inconnu'
        };
    });

    // Calculer les statistiques des célébrités
    const celebrityStats = {};
    seenCelebrities.forEach(seen => {
        if (!celebrityStats[seen.celebrity_name]) {
            celebrityStats[seen.celebrity_name] = {
                name: seen.celebrity_name,
                found_by: []
            };
        }
        const user = users.find(u => u.id === seen.user_id);
        if (user && !celebrityStats[seen.celebrity_name].found_by.includes(`${user.firstname} ${user.lastname}`)) {
            celebrityStats[seen.celebrity_name].found_by.push(`${user.firstname} ${user.lastname}`);
        }
    });

    const celebrityStatsArray = Object.values(celebrityStats).sort((a, b) => b.found_by.length - a.found_by.length);

    console.log('Utilisateurs:', users);
    console.log('Célébrités vues:', seenCelebritiesWithUserInfo);
    console.log('Statistiques des célébrités:', celebrityStatsArray);
    
    res.json({
        users: users,
        seen_celebrities: seenCelebritiesWithUserInfo,
        celebrity_stats: celebrityStatsArray
    });
});

// Route d'inscription avec logs améliorés
app.post('/register', (req, res) => {
    console.log('\n=== Nouvelle tentative d\'inscription ===');
    console.log('Données reçues:', req.body);
    const { firstname, lastname, password } = req.body;
    
    const existingUser = db.get('users')
        .find({ firstname, lastname })
        .value();

    if (existingUser) {
        console.log('❌ Utilisateur déjà existant:', existingUser);
        return res.status(400).send('Cet utilisateur existe déjà');
    }

    const newUser = {
        id: Date.now(),
        firstname,
        lastname,
        password,
        score: 0
    };

    console.log('✅ Nouvel utilisateur à créer:', newUser);
    
    db.get('users')
        .push(newUser)
        .write();

    console.log('📊 Base de données après inscription:', db.get('users').value());

    req.session.user = {
        id: newUser.id,
        firstname,
        lastname,
        score: 0
    };

    console.log('🔑 Session créée:', req.session.user);
    res.json({ success: true, redirect: '/' });
});

// Route de connexion avec logs améliorés
app.post('/login', (req, res) => {
    console.log('\n=== Nouvelle tentative de connexion ===');
    console.log('Données reçues:', req.body);
    const { firstname, lastname, password } = req.body;
    
    const user = db.get('users')
        .find({ firstname, lastname, password })
        .value();

    if (!user) {
        console.log('❌ Échec de la connexion: utilisateur non trouvé');
        return res.status(401).send('Identifiants incorrects');
    }

    console.log('✅ Utilisateur trouvé:', user);

    req.session.user = {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        score: user.score
    };

    console.log('🔑 Session créée:', req.session.user);
    
    // Redirection vers admin.html si l'utilisateur est admin
    const redirectUrl = (firstname === 'admin' && lastname === 'admin') ? '/admin.html' : '/';
    console.log('🔄 Redirection vers:', redirectUrl);
    res.json({ success: true, redirect: redirectUrl });
});

// Route pour obtenir les célébrités trouvées
app.get('/get-found-celebrities', requireAuth, (req, res) => {
    const foundCelebrities = db.get('seen_celebrities')
        .filter({ user_id: req.session.user.id, found: true })
        .map('celebrity_name')
        .value();

    res.json({ foundCelebrities });
});

// Route pour obtenir une nouvelle célébrité
app.get('/get-celebrity', requireAuth, (req, res) => {
    const seenCelebrities = db.get('seen_celebrities')
        .filter({ user_id: req.session.user.id })
        .map('celebrity_name')
        .value();

    res.json({ seenCelebrities });
});

// Route pour marquer une célébrité comme trouvée
app.post('/found-celebrity', requireAuth, (req, res) => {
    const { celebrityName } = req.body;

    // Vérifier si la célébrité a déjà été trouvée
    const existing = db.get('seen_celebrities')
        .find({ 
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            found: true
        })
        .value();

    if (existing) {
        return res.status(400).send('Célébrité déjà trouvée');
    }

    // Supprimer toute entrée précédente pour cette célébrité (si elle a été vue mais pas trouvée)
    db.get('seen_celebrities')
        .remove({ 
            user_id: req.session.user.id,
            celebrity_name: celebrityName
        })
        .write();

    // Ajouter la célébrité à la liste des trouvées
    db.get('seen_celebrities')
        .push({
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            seen_date: new Date().toISOString(),
            found: true
        })
        .write();

    // Mettre à jour le score
    const user = db.get('users')
        .find({ id: req.session.user.id })
        .value();

    // Ajouter 10 points pour une bonne réponse
    const newScore = (user.score || 0) + 10;

    db.get('users')
        .find({ id: req.session.user.id })
        .assign({ score: newScore })
        .write();

    req.session.user.score = newScore;

    res.json({ 
        success: true, 
        newScore: newScore
    });
});

// Route pour marquer une célébrité comme vue mais pas trouvée
app.post('/seen-celebrity', requireAuth, (req, res) => {
    const { celebrityName } = req.body;

    // Vérifier si la célébrité a déjà été trouvée
    const foundCelebrity = db.get('seen_celebrities')
        .find({ 
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            found: true
        })
        .value();

    // Si déjà trouvée, ne rien faire
    if (foundCelebrity) {
        return res.json({ success: true });
    }

    // Vérifier si la célébrité a déjà été vue
    const seenCelebrity = db.get('seen_celebrities')
        .find({ 
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            found: false
        })
        .value();

    // Si déjà vue, ne rien faire
    if (seenCelebrity) {
        return res.json({ success: true });
    }

    // Ajouter la célébrité à la liste des vues
    db.get('seen_celebrities')
        .push({
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            seen_date: new Date().toISOString(),
            found: false
        })
        .write();

    res.json({ success: true });
});

// Route pour obtenir le score actuel
app.get('/get-score', requireAuth, (req, res) => {
    const user = db.get('users')
        .find({ id: req.session.user.id })
        .value();

    res.json({ score: user.score });
});

// Route de déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});

// Route pour la page d'administration (protégée)
app.get('/admin.html', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Routes d'administration de la base de données (protégées)
app.post('/admin/reset-db', requireAdmin, (req, res) => {
    console.log('=== Réinitialisation de la base de données ===');
    db.set('users', []).write();
    db.set('seen_celebrities', []).write();
    console.log('✅ Base de données réinitialisée');
    res.json({ success: true, message: 'Base de données réinitialisée' });
});

app.post('/admin/delete-user', requireAdmin, (req, res) => {
    const { userId } = req.body;
    console.log('=== Suppression de l\'utilisateur:', userId);
    
    // Supprimer l'utilisateur
    db.get('users')
        .remove({ id: parseInt(userId) })
        .write();
    
    // Supprimer ses célébrités vues
    db.get('seen_celebrities')
        .remove({ user_id: parseInt(userId) })
        .write();
    
    console.log('✅ Utilisateur et ses données supprimés');
    res.json({ success: true, message: 'Utilisateur supprimé' });
});

app.post('/admin/clear-seen-celebrities', requireAdmin, (req, res) => {
    console.log('=== Nettoyage de l\'historique des célébrités vues ===');
    db.set('seen_celebrities', []).write();
    console.log('✅ Historique des célébrités vues nettoyé');
    res.json({ success: true, message: 'Historique des célébrités vues nettoyé' });
});

// Route pour obtenir le classement des joueurs
app.get('/leaderboard', (req, res) => {
    const users = db.get('users')
        .value()
        .filter(user => user.firstname !== 'admin' && user.lastname !== 'admin') // Exclure l'admin
        .sort((a, b) => (b.score || 0) - (a.score || 0)) // Trier par score décroissant
        .map((user, index) => ({
            rank: index + 1,
            firstname: user.firstname,
            lastname: user.lastname,
            score: user.score || 0
        }));

    res.json({ leaderboard: users });
});

// Route pour mettre à jour le score (pour les pénalités)
app.post('/update-score', requireAuth, (req, res) => {
    const { score } = req.body;
    
    if (score === undefined) {
        return res.status(400).send('Score manquant');
    }
    
    // Mettre à jour le score dans la base de données
    db.get('users')
        .find({ id: req.session.user.id })
        .assign({ score: score })
        .write();
    
    // Mettre à jour le score dans la session
    req.session.user.score = score;
    
    res.json({ success: true, newScore: score });
});

// Nouvelle route pour supprimer un utilisateur avec l'ID dans l'URL
app.post('/admin/delete-user/:userId', requireAdmin, (req, res) => {
    const userId = req.params.userId;
    console.log('=== Suppression de l\'utilisateur (URL):', userId);

    // Supprimer l'utilisateur
    db.get('users')
        .remove({ id: parseInt(userId) })
        .write();

    // Supprimer ses célébrités vues
    db.get('seen_celebrities')
        .remove({ user_id: parseInt(userId) })
        .write();

    res.json({ success: true });
});

// Démarrer le serveur
app.listen(3000, '0.0.0.0', () => {
    console.log('Serveur démarré sur le port 3000');
}); 