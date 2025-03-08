const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testCreateUser() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');
    
    // Créer un utilisateur de test
    const testUser = new User({
      id: Date.now(),
      firstname: 'Test',
      lastname: 'Utilisateur',
      password: 'test123',
      score: 50
    });
    
    // Sauvegarder l'utilisateur
    await testUser.save();
    console.log('✅ Utilisateur de test créé avec succès');
    
    // Vérifier que l'utilisateur a été créé
    const user = await User.findOne({ firstname: 'Test', lastname: 'Utilisateur' });
    console.log('📋 Utilisateur créé:', user);
    
    console.log('\n✅ Test de création d\'utilisateur terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du test de création d\'utilisateur:', error);
  } finally {
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('🔌 Connexion à MongoDB fermée');
  }
}

// Exécuter le test
testCreateUser(); 