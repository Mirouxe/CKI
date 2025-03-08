const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
require('dotenv').config();

// Importer les modèles et la connexion MongoDB
const connectDB = require('./models/db');
const User = require('./models/User');
const SeenCelebrity = require('./models/SeenCelebrity');

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

// Création du compte admin s'il n'existe pas
const createAdminAccount = async () => {
    try {
        const adminExists = await User.findOne({ 
            firstname: 'admin', 
            lastname: 'admin' 
        });

        if (!adminExists) {
            console.log('Création du compte admin...');
            await User.create({
                id: Date.now(),
                firstname: 'admin',
                lastname: 'admin',
                password: 'admin',
                score: 0,
                isAdmin: true
            });
            console.log('Compte admin créé avec succès');
        }
    } catch (error) {
        console.error('Erreur lors de la création du compte admin:', error);
    }
};

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
app.get('/test-db', requireAdmin, async (req, res) => {
    try {
        console.log('=== État actuel de la base de données ===');
        const users = await User.find({});
        const seenCelebrities = await SeenCelebrity.find({});
        
        // Ajouter les informations utilisateur aux célébrités vues
        const seenCelebritiesWithUserInfo = await Promise.all(seenCelebrities.map(async seen => {
            const user = await User.findOne({ id: seen.user_id });
            return {
                ...seen.toObject(),
                user_name: user ? `${user.firstname} ${user.lastname}` : 'Utilisateur inconnu'
            };
        }));

        // Calculer les statistiques des célébrités
        const celebrityStats = {};
        for (const seen of seenCelebrities) {
            if (!celebrityStats[seen.celebrity_name]) {
                celebrityStats[seen.celebrity_name] = {
                    name: seen.celebrity_name,
                    found_by: []
                };
            }
            const user = await User.findOne({ id: seen.user_id });
            if (user && !celebrityStats[seen.celebrity_name].found_by.includes(`${user.firstname} ${user.lastname}`)) {
                celebrityStats[seen.celebrity_name].found_by.push(`${user.firstname} ${user.lastname}`);
            }
        }

        const celebrityStatsArray = Object.values(celebrityStats).sort((a, b) => b.found_by.length - a.found_by.length);

        console.log('Utilisateurs:', users);
        console.log('Célébrités vues:', seenCelebritiesWithUserInfo);
        console.log('Statistiques des célébrités:', celebrityStatsArray);
        
        res.json({
            users: users,
            seen_celebrities: seenCelebritiesWithUserInfo,
            celebrity_stats: celebrityStatsArray
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route d'inscription avec logs améliorés
app.post('/register', async (req, res) => {
    try {
        console.log('\n=== Nouvelle tentative d\'inscription ===');
        console.log('Données reçues:', req.body);
        const { firstname, lastname, password } = req.body;
        
        const existingUser = await User.findOne({ firstname, lastname });

        if (existingUser) {
            console.log('❌ Utilisateur déjà existant:', existingUser);
            return res.status(400).send('Cet utilisateur existe déjà');
        }

        const newUser = await User.create({
            id: Date.now(),
            firstname,
            lastname,
            password,
            score: 0
        });

        console.log('✅ Nouvel utilisateur créé:', newUser);

        req.session.user = {
            id: newUser.id,
            firstname,
            lastname,
            score: 0
        };

        console.log('🔑 Session créée:', req.session.user);
        res.json({ success: true, redirect: '/' });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route de connexion avec logs améliorés
app.post('/login', async (req, res) => {
    try {
        console.log('\n=== Nouvelle tentative de connexion ===');
        console.log('Données reçues:', req.body);
        const { firstname, lastname, password } = req.body;
        
        const user = await User.findOne({ firstname, lastname, password });

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
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour obtenir les célébrités trouvées
app.get('/get-found-celebrities', requireAuth, async (req, res) => {
    try {
        const foundCelebrities = await SeenCelebrity.find({ 
            user_id: req.session.user.id, 
            found: true 
        }).distinct('celebrity_name');

        res.json({ foundCelebrities });
    } catch (error) {
        console.error('Erreur lors de la récupération des célébrités trouvées:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour obtenir une nouvelle célébrité
app.get('/get-celebrity', requireAuth, async (req, res) => {
    try {
        const seenCelebrities = await SeenCelebrity.find({ 
            user_id: req.session.user.id 
        }).distinct('celebrity_name');

        res.json({ seenCelebrities });
    } catch (error) {
        console.error('Erreur lors de la récupération des célébrités vues:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour marquer une célébrité comme trouvée
app.post('/found-celebrity', requireAuth, async (req, res) => {
    try {
        const { celebrityName } = req.body;

        // Vérifier si la célébrité a déjà été trouvée
        const existing = await SeenCelebrity.findOne({ 
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            found: true
        });

        if (existing) {
            return res.status(400).send('Célébrité déjà trouvée');
        }

        // Supprimer toute entrée précédente pour cette célébrité (si elle a été vue mais pas trouvée)
        await SeenCelebrity.deleteMany({ 
            user_id: req.session.user.id,
            celebrity_name: celebrityName
        });

        // Ajouter la célébrité à la liste des trouvées
        await SeenCelebrity.create({
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            seen_date: new Date(),
            found: true
        });

        // Mettre à jour le score
        const user = await User.findOne({ id: req.session.user.id });

        // Ajouter 10 points pour une bonne réponse
        const newScore = (user.score || 0) + 10;

        await User.updateOne(
            { id: req.session.user.id },
            { score: newScore }
        );

        req.session.user.score = newScore;

        res.json({ 
            success: true, 
            newScore: newScore
        });
    } catch (error) {
        console.error('Erreur lors du marquage d\'une célébrité comme trouvée:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour marquer une célébrité comme vue mais pas trouvée
app.post('/seen-celebrity', requireAuth, async (req, res) => {
    try {
        const { celebrityName } = req.body;

        // Vérifier si la célébrité a déjà été trouvée
        const foundCelebrity = await SeenCelebrity.findOne({ 
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            found: true
        });

        // Si déjà trouvée, ne rien faire
        if (foundCelebrity) {
            return res.json({ success: true });
        }

        // Vérifier si la célébrité a déjà été vue
        const seenCelebrity = await SeenCelebrity.findOne({ 
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            found: false
        });

        // Si déjà vue, ne rien faire
        if (seenCelebrity) {
            return res.json({ success: true });
        }

        // Ajouter la célébrité à la liste des vues
        await SeenCelebrity.create({
            user_id: req.session.user.id,
            celebrity_name: celebrityName,
            seen_date: new Date(),
            found: false
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors du marquage d\'une célébrité comme vue:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour obtenir le score actuel
app.get('/get-score', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ id: req.session.user.id });
        res.json({ score: user.score });
    } catch (error) {
        console.error('Erreur lors de la récupération du score:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
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
app.post('/admin/reset-db', requireAdmin, async (req, res) => {
    try {
        console.log('=== Réinitialisation de la base de données ===');
        await User.deleteMany({});
        await SeenCelebrity.deleteMany({});
        console.log('✅ Base de données réinitialisée');
        
        // Recréer le compte admin
        await createAdminAccount();
        
        res.json({ success: true, message: 'Base de données réinitialisée' });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation de la base de données:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/admin/delete-user', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.body;
        console.log('=== Suppression de l\'utilisateur:', userId);
        
        // Supprimer l'utilisateur
        await User.deleteOne({ id: parseInt(userId) });
        
        // Supprimer ses célébrités vues
        await SeenCelebrity.deleteMany({ user_id: parseInt(userId) });
        
        console.log('✅ Utilisateur et ses données supprimés');
        res.json({ success: true, message: 'Utilisateur supprimé' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/admin/clear-seen-celebrities', requireAdmin, async (req, res) => {
    try {
        console.log('=== Nettoyage de l\'historique des célébrités vues ===');
        await SeenCelebrity.deleteMany({});
        console.log('✅ Historique des célébrités vues nettoyé');
        res.json({ success: true, message: 'Historique des célébrités vues nettoyé' });
    } catch (error) {
        console.error('Erreur lors du nettoyage de l\'historique des célébrités vues:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour obtenir le classement des joueurs
app.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find({ 
            $or: [
                { firstname: { $ne: 'admin' } },
                { lastname: { $ne: 'admin' } }
            ]
        })
        .sort({ score: -1 })
        .lean();

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            firstname: user.firstname,
            lastname: user.lastname,
            score: user.score || 0
        }));

        res.json({ leaderboard });
    } catch (error) {
        console.error('Erreur lors de la récupération du classement:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour mettre à jour le score (pour les pénalités)
app.post('/update-score', requireAuth, async (req, res) => {
    try {
        const { score } = req.body;
        
        if (score === undefined) {
            return res.status(400).send('Score manquant');
        }
        
        // Mettre à jour le score dans la base de données
        await User.updateOne(
            { id: req.session.user.id },
            { score: score }
        );
        
        // Mettre à jour le score dans la session
        req.session.user.score = score;
        
        res.json({ success: true, newScore: score });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du score:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Nouvelle route pour supprimer un utilisateur avec l'ID dans l'URL
app.post('/admin/delete-user/:userId', requireAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('=== Suppression de l\'utilisateur (URL):', userId);

        // Supprimer l'utilisateur
        await User.deleteOne({ id: parseInt(userId) });

        // Supprimer ses célébrités vues
        await SeenCelebrity.deleteMany({ user_id: parseInt(userId) });

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Connexion à MongoDB et démarrage du serveur
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connexion à MongoDB
        await connectDB();
        
        // Création du compte admin
        await createAdminAccount();
        
        // Démarrage du serveur
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Serveur démarré sur le port ${PORT}`);
        });
    } catch (error) {
        console.error('Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
};

startServer(); 