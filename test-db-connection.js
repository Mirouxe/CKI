const mongoose = require('mongoose');
const User = require('./models/User');
const SeenCelebrity = require('./models/SeenCelebrity');
require('dotenv').config();

async function testConnection() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');
    
    // Compter les utilisateurs
    const userCount = await User.countDocuments();
    console.log(`📊 Nombre d'utilisateurs dans la base de données: ${userCount}`);
    
    // Afficher les utilisateurs
    const users = await User.find({});
    console.log('\n📋 Liste des utilisateurs:');
    users.forEach(user => {
      console.log(`- ${user.firstname} ${user.lastname} (score: ${user.score})`);
    });
    
    // Compter les célébrités vues
    const seenCount = await SeenCelebrity.countDocuments();
    console.log(`\n🎬 Nombre de célébrités vues: ${seenCount}`);
    
    // Afficher quelques célébrités vues (limité à 5)
    if (seenCount > 0) {
      const seenCelebrities = await SeenCelebrity.find({}).limit(5);
      console.log('\n🎭 Exemples de célébrités vues:');
      for (const seen of seenCelebrities) {
        const user = await User.findOne({ id: seen.user_id });
        const userName = user ? `${user.firstname} ${user.lastname}` : 'Utilisateur inconnu';
        console.log(`- ${seen.celebrity_name} (vue par: ${userName}, trouvée: ${seen.found ? 'Oui' : 'Non'})`);
      }
    }
    
    console.log('\n✅ Test de connexion terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:', error);
  } finally {
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('🔌 Connexion à MongoDB fermée');
  }
}

// Exécuter le test
testConnection(); 