const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importer les modèles et la connexion MongoDB
const connectDB = require('./models/db');
const User = require('./models/User');
const SeenCelebrity = require('./models/SeenCelebrity');

// Fonction pour lire le fichier db.json
const readDbJson = () => {
  try {
    const dbPath = path.join(__dirname, 'db.json');
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture de db.json:', error);
    return { users: [], seen_celebrities: [] };
  }
};

// Fonction pour migrer les utilisateurs
const migrateUsers = async (users) => {
  console.log(`Migration de ${users.length} utilisateurs...`);
  
  for (const user of users) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ id: user.id });
      
      if (!existingUser) {
        // Créer un nouvel utilisateur
        const newUser = new User({
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          password: user.password,
          score: user.score || 0,
          isAdmin: (user.firstname === 'admin' && user.lastname === 'admin')
        });
        
        await newUser.save();
        console.log(`✅ Utilisateur migré: ${user.firstname} ${user.lastname}`);
      } else {
        console.log(`⚠️ Utilisateur déjà existant: ${user.firstname} ${user.lastname}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la migration de l'utilisateur ${user.firstname} ${user.lastname}:`, error);
    }
  }
};

// Fonction pour migrer les célébrités vues
const migrateSeenCelebrities = async (seenCelebrities) => {
  console.log(`Migration de ${seenCelebrities.length} célébrités vues...`);
  
  for (const seen of seenCelebrities) {
    try {
      // Vérifier si l'entrée existe déjà
      const existingSeen = await SeenCelebrity.findOne({
        user_id: seen.user_id,
        celebrity_name: seen.celebrity_name
      });
      
      if (!existingSeen) {
        // Créer une nouvelle entrée
        const newSeen = new SeenCelebrity({
          user_id: seen.user_id,
          celebrity_name: seen.celebrity_name,
          seen_date: seen.seen_date ? new Date(seen.seen_date) : new Date(),
          found: seen.found || false
        });
        
        await newSeen.save();
        console.log(`✅ Célébrité vue migrée: ${seen.celebrity_name} pour l'utilisateur ${seen.user_id}`);
      } else {
        console.log(`⚠️ Célébrité vue déjà existante: ${seen.celebrity_name} pour l'utilisateur ${seen.user_id}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la migration de la célébrité vue ${seen.celebrity_name}:`, error);
    }
  }
};

// Fonction principale pour migrer les données
const migrateData = async () => {
  try {
    // Connexion à MongoDB
    await connectDB();
    
    // Lire les données de db.json
    const { users, seen_celebrities } = readDbJson();
    
    // Migrer les utilisateurs
    await migrateUsers(users);
    
    // Migrer les célébrités vues
    await migrateSeenCelebrities(seen_celebrities);
    
    console.log('✅ Migration terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
};

// Exécuter la migration
migrateData(); 