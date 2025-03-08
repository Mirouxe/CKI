const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';

// Fonction pour tester la connexion
async function testLogin() {
  try {
    console.log('🔑 Test de connexion...');
    const response = await axios.post(`${API_URL}/login`, {
      firstname: 'Test',
      lastname: 'Utilisateur',
      password: 'test123'
    });
    
    console.log('✅ Connexion réussie:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Fonction pour tester l'obtention du score
async function testGetScore(cookie) {
  try {
    console.log('📊 Test d\'obtention du score...');
    const response = await axios.get(`${API_URL}/get-score`, {
      headers: {
        Cookie: cookie
      }
    });
    
    console.log('✅ Score obtenu:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'obtention du score:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Fonction principale
async function runTests() {
  try {
    // Test de connexion
    const loginResult = await testLogin();
    
    if (!loginResult) {
      console.log('❌ Impossible de continuer les tests sans connexion réussie');
      return;
    }
    
    // Autres tests ici...
    
    console.log('\n✅ Tous les tests ont été exécutés');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
  }
}

// Exécuter les tests
runTests(); 