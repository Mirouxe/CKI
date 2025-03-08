const mongoose = require('mongoose');
const User = require('./models/User');
const SeenCelebrity = require('./models/SeenCelebrity');
require('dotenv').config();

async function testCelebrityOperations() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');
    
    // Récupérer l'utilisateur de test
    const testUser = await User.findOne({ firstname: 'Test', lastname: 'Utilisateur' });
    
    if (!testUser) {
      console.log('❌ Utilisateur de test non trouvé. Veuillez d\'abord exécuter test-create-user.js');
      return;
    }
    
    console.log('📋 Utilisateur de test trouvé:', testUser.firstname, testUser.lastname);
    
    // Créer une entrée de célébrité vue
    const celebrity = new SeenCelebrity({
      user_id: testUser.id,
      celebrity_name: 'anthony_hopkins',
      seen_date: new Date(),
      found: true
    });
    
    // Sauvegarder la célébrité vue
    await celebrity.save();
    console.log('✅ Célébrité vue créée avec succès');
    
    // Récupérer les célébrités vues par l'utilisateur
    const seenCelebrities = await SeenCelebrity.find({ user_id: testUser.id });
    console.log(`📊 Nombre de célébrités vues par l'utilisateur: ${seenCelebrities.length}`);
    console.log('📋 Célébrités vues:', seenCelebrities);
    
    console.log('\n✅ Test des opérations sur les célébrités terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du test des opérations sur les célébrités:', error);
  } finally {
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('🔌 Connexion à MongoDB fermée');
  }
}

// Exécuter le test
testCelebrityOperations(); 