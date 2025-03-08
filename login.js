// Gestion des formulaires
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const toggleButton = document.getElementById('toggle-register');
    let isRegisterMode = false;

    // Fonction pour afficher les messages d'erreur
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Fonction pour masquer les messages d'erreur
    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Fonction pour basculer entre les modes connexion et inscription
    function toggleMode() {
        isRegisterMode = !isRegisterMode;
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const toggleText = toggleButton.parentElement.querySelector('p');
        
        if (isRegisterMode) {
            submitButton.textContent = 'S\'inscrire';
            submitButton.setAttribute('data-mode', 'register');
            toggleText.textContent = 'Déjà un compte ?';
            toggleButton.textContent = 'Se connecter';
        } else {
            submitButton.textContent = 'Se connecter';
            submitButton.removeAttribute('data-mode');
            toggleText.textContent = 'Pas encore de compte ?';
            toggleButton.textContent = 'S\'inscrire';
        }
        
        hideError();
    }

    // Gestionnaire pour le bouton de basculement
    toggleButton.addEventListener('click', toggleMode);

    // Gestionnaire pour la soumission du formulaire
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const formData = new FormData(loginForm);
        const data = {
            firstname: formData.get('firstname'),
            lastname: formData.get('lastname'),
            password: formData.get('password')
        };

        try {
            const endpoint = isRegisterMode ? '/register' : '/login';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    window.location.href = result.redirect;
                }
            } else {
                const error = await response.text();
                showError(error);
            }
        } catch (error) {
            showError('Une erreur est survenue. Veuillez réessayer.');
            console.error('Erreur:', error);
        }
    });
}); 