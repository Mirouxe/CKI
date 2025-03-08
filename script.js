// État du jeu
let currentCelebrity = null;
let currentZoomLevel = 1;
let score = 0;
let celebrities = [
    "anthony_hopkins",
    "antoine_de_saint_exupery",
    "bruce_lee",
    "cedric_villani",
    "charles_baudelaire",
    "charles_de_gaulle",
    "emmanuel_macron",
    "francois_civil",
    "hugh_jackman",
    "jean_d'ormesson",
    "jorge_mario_bergoglio",
    "keanu_reeves",
    "marie_curie",
    "michael_jordan",
    "pablo_picasso",
    "quentin_tarantino",
    "rafael_nadal",
    "reda_kateb",
    "romain_gary",
    "salvador_dali",
    "simone_veil",
    "steve_jobs",
    "tom_hanks",
    "victor_hugo",
    "virginie_efira",
    "zinedine_zidane"
];
let usedHints = new Set();
let seenCelebrities = new Set();
let foundCelebrities = new Set();
let allCelebrities = [...celebrities]; // Copie de toutes les célébrités

// Constantes pour les points
const POINTS = {
    CORRECT_ANSWER: 10,   // Points gagnés pour une bonne réponse
    DEZOOM_PENALTY: -2,   // Points perdus pour un dézoom
    HINT_PENALTY: -3,     // Points perdus pour un indice
    MIN_SCORE: 0          // Score minimum (ne peut pas être négatif)
};

// Fonction pour charger le score initial
async function loadUserScore() {
    try {
        const response = await fetch('/get-score');
        const data = await response.json();
        score = data.score;
        updateScoreDisplay();
    } catch (error) {
        console.error('Erreur lors du chargement du score:', error);
    }
}

// Fonction pour mettre à jour l'affichage du score
function updateScoreDisplay() {
    // Mettre à jour l'attribut data-score sur les boutons d'action (pour compatibilité)
    const actionButtonsElement = document.querySelector('.action-buttons');
    actionButtonsElement.setAttribute('data-score', score);
    
    // Mettre à jour le nouvel élément d'affichage du score
    const scoreDisplayElement = document.querySelector('.score-display');
    scoreDisplayElement.setAttribute('data-score', score);
    scoreDisplayElement.textContent = score;
    
    // Ajouter un effet de surbrillance
    scoreDisplayElement.classList.add('score-updated');
    setTimeout(() => {
        scoreDisplayElement.classList.remove('score-updated');
    }, 1000);
}

// Fonction pour mettre à jour le score
async function updateScore(points) {
    // Calculer le nouveau score (ne peut pas être négatif)
    const newScore = Math.max(POINTS.MIN_SCORE, score + points);
    
    // Si le score n'a pas changé, ne rien faire
    if (newScore === score) return;
    
    // Mettre à jour le score local
    score = newScore;
    
    // Mettre à jour l'affichage
    updateScoreDisplay();
    
    // Mettre à jour le score sur le serveur
    try {
        await fetch('/update-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: newScore })
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du score:', error);
    }
}

// Fonction pour charger les célébrités déjà trouvées
async function loadFoundCelebrities() {
    try {
        const response = await fetch('/get-found-celebrities');
        const data = await response.json();
        foundCelebrities = new Set(data.foundCelebrities);
        
        // Filtrer les célébrités pour ne garder que celles qui n'ont pas été trouvées
        celebrities = allCelebrities.filter(celeb => !foundCelebrities.has(celeb));
        
        if (celebrities.length === 0) {
            document.getElementById('feedback').textContent = "Félicitations ! Vous avez trouvé toutes les célébrités !";
            document.getElementById('feedback').style.color = "#28a745";
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement des célébrités trouvées:', error);
        return false;
    }
}

// Fonction pour charger les célébrités déjà vues
async function loadSeenCelebrities() {
    try {
        const response = await fetch('/get-celebrity');
        const data = await response.json();
        seenCelebrities = new Set(data.seenCelebrities);
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement des célébrités vues:', error);
        return false;
    }
}

// Fonction pour mélanger le tableau des célébrités
function shuffleCelebrities() {
    for (let i = celebrities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [celebrities[i], celebrities[j]] = [celebrities[j], celebrities[i]];
    }
}

// Fonction pour formater le nom de fichier
function formatImagePath(name) {
    return name.toLowerCase().replace(/ /g, '_');
}

// Fonction pour mettre à jour l'image
function updateImage() {
    if (!currentCelebrity) {
        console.log('Pas de célébrité courante');
        return;
    }
    
    const imgElement = document.getElementById('celebrity-image');
    const timestamp = new Date().getTime();
    const imagePath = `images/${formatImagePath(currentCelebrity)}/zoom${currentZoomLevel}.jpg?t=${timestamp}`;
    console.log('Chargement de l\'image:', imagePath);

    // Ajouter une classe de chargement
    imgElement.classList.add('loading');
    
    // Précharger l'image
    const img = new Image();
    img.onload = function() {
        console.log('Image chargée avec succès');
        imgElement.src = imagePath;
        document.getElementById('zoom-count').textContent = `Zoom ${currentZoomLevel}/5`;
        
        // Retirer la classe de chargement après un court délai pour une transition fluide
        setTimeout(() => {
            imgElement.classList.remove('loading');
        }, 100);
    };
    img.onerror = function() {
        console.error('Erreur de chargement de l\'image:', imagePath);
        imgElement.classList.remove('loading');
    };
    img.src = imagePath;
}

// Fonction pour charger la célébrité suivante
async function loadNextCelebrity() {
    console.log('Chargement de la célébrité suivante...');
    
    // Réinitialiser l'état
    currentZoomLevel = 1;
    usedHints.clear();
    document.getElementById('user-input').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('dezoom-btn').disabled = false;
    document.getElementById('hint-btn').disabled = false;

    // Marquer la célébrité actuelle comme vue si elle existe
    if (currentCelebrity) {
        try {
            await fetch('/seen-celebrity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ celebrityName: currentCelebrity })
            });
        } catch (error) {
            console.error('Erreur lors du marquage de la célébrité comme vue:', error);
        }
    }

    // Charger les célébrités trouvées et vues
    await loadFoundCelebrities();
    await loadSeenCelebrities();

    // Si plus de célébrités, recharger la liste
    if (celebrities.length === 0) {
        console.log('Plus de célébrités disponibles, rechargement...');
        const hasAvailableCelebrities = await loadFoundCelebrities();
        if (!hasAvailableCelebrities) {
            console.log('Toutes les célébrités ont été trouvées');
            return;
        }
        shuffleCelebrities();
    }

    // Sélectionner la prochaine célébrité
    // Priorité aux célébrités jamais vues
    const unseenCelebrities = celebrities.filter(celeb => !seenCelebrities.has(celeb));
    
    if (unseenCelebrities.length > 0) {
        // Prendre une célébrité jamais vue
        const randomIndex = Math.floor(Math.random() * unseenCelebrities.length);
        currentCelebrity = unseenCelebrities[randomIndex];
        
        // Retirer cette célébrité de la liste des disponibles
        celebrities = celebrities.filter(celeb => celeb !== currentCelebrity);
    } else {
        // Toutes les célébrités ont été vues mais pas trouvées, en prendre une au hasard
        const randomIndex = Math.floor(Math.random() * celebrities.length);
        currentCelebrity = celebrities[randomIndex];
        
        // Retirer cette célébrité de la liste des disponibles
        celebrities = celebrities.filter(celeb => celeb !== currentCelebrity);
    }
    
    console.log('Nouvelle célébrité:', currentCelebrity);
    
    // Mettre à jour l'image
    updateImage();
}

// Fonction pour gérer le dézoom
function handleDezoom() {
    if (currentZoomLevel < 5) {
        currentZoomLevel++;
        updateImage();
        
        // Appliquer la pénalité de points pour le dézoom
        updateScore(POINTS.DEZOOM_PENALTY);
        
        // Afficher un message de pénalité
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `<i class="fas fa-search-minus"></i> Dézoom appliqué <span class="penalty">(${POINTS.DEZOOM_PENALTY} points)</span>`;
        feedback.style.color = "#e74c3c";
        
        if (currentZoomLevel === 5) {
            document.getElementById('dezoom-btn').disabled = true;
        }
    }
}

// Fonction pour afficher un indice
async function showHint() {
    try {
        // Récupérer les indices depuis le fichier infos.txt dans le dossier de la célébrité
        const response = await fetch(`images/${currentCelebrity.replace(/ /g, '_')}/infos.txt`);
        if (!response.ok) {
            throw new Error('Impossible de charger les indices');
        }
        
        const text = await response.text();
        const lines = text.split('\n');
        
        // Analyser le fichier d'indices
        const hints = {};
        
        // Parcourir le fichier ligne par ligne pour extraire les paires clé/valeur
        for (let i = 0; i < lines.length - 1; i++) {
            const key = lines[i].trim();
            const value = lines[i + 1].trim();
            
            // Si la ligne actuelle n'est pas vide et la suivante non plus, c'est une paire clé/valeur
            if (key && value && !key.includes(':') && !value.includes(':')) {
                hints[key] = value;
                i++; // Sauter la ligne de valeur
            }
        }
        
        // Sélectionner un indice parmi ceux qui n'ont pas encore été utilisés
        const availableHints = Object.entries(hints).filter(([key]) => !usedHints.has(key));

        if (availableHints.length === 0) {
            const feedback = document.getElementById('feedback');
            feedback.innerHTML = "Tous les indices ont déjà été utilisés.";
            feedback.style.color = "#e74c3c";
            return;
        }

        // Appliquer la pénalité de points pour l'indice
        updateScore(POINTS.HINT_PENALTY);
        
        // Afficher un message de pénalité
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `<i class="fas fa-lightbulb"></i> Indice utilisé <span class="penalty">(${POINTS.HINT_PENALTY} points)</span>`;
        feedback.style.color = "#e74c3c";
        
        // Attendre un court instant pour que le message de pénalité soit visible
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * availableHints.length);
            const [key, value] = availableHints[randomIndex];
            
            // Marquer cet indice comme utilisé
            usedHints.add(key);
            
            // Afficher l'indice
            feedback.innerHTML = `<i class="fas fa-lightbulb"></i> <strong>${key}</strong> ${value}`;
            feedback.style.color = "#f39c12";
        }, 10);
        
    } catch (error) {
        console.error('Erreur lors de l\'affichage de l\'indice:', error);
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = "Impossible de charger les indices.";
        feedback.style.color = "#e74c3c";
    }
}

// Fonction pour normaliser une chaîne (supprimer les accents, espaces multiples, etc.)
function normalizeString(str) {
    // Convertir en minuscules
    str = str.toLowerCase();
    
    // Supprimer les accents
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Remplacer les tirets et underscores par des espaces
    str = str.replace(/[-_]/g, " ");
    
    // Supprimer les caractères spéciaux et la ponctuation
    str = str.replace(/[^\w\s]/g, "");
    
    // Remplacer les espaces multiples par un seul espace
    str = str.replace(/\s+/g, " ");
    
    // Supprimer les espaces au début et à la fin
    str = str.trim();
    
    return str;
}

// Fonction pour calculer la distance de Levenshtein (distance d'édition) entre deux chaînes
function levenshteinDistance(a, b) {
    const matrix = [];
    
    // Initialiser la matrice
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    // Remplir la matrice
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // suppression
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}

// Fonction pour vérifier si deux chaînes sont similaires
function areSimilar(str1, str2) {
    const normalized1 = normalizeString(str1);
    const normalized2 = normalizeString(str2);
    
    // Vérifier l'égalité exacte après normalisation
    if (normalized1 === normalized2) {
        return true;
    }
    
    // Vérifier si l'une est contenue dans l'autre
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        // Si l'une des chaînes est très courte, exiger qu'elle soit au moins 60% de la longueur de l'autre
        const minLength = Math.min(normalized1.length, normalized2.length);
        const maxLength = Math.max(normalized1.length, normalized2.length);
        if (minLength >= 3 && minLength >= maxLength * 0.6) {
            return true;
        }
    }
    
    // Calculer la distance de Levenshtein
    const distance = levenshteinDistance(normalized1, normalized2);
    
    // Tolérer une distance proportionnelle à la longueur de la chaîne la plus longue
    const maxDistance = Math.max(normalized1.length, normalized2.length) * 0.3; // 30% de tolérance
    
    return distance <= maxDistance;
}

// Fonction pour vérifier la réponse
async function checkAnswer() {
    const userInput = document.getElementById('user-input').value.trim();
    const correctName = currentCelebrity;

    // Utiliser la fonction de similarité pour comparer les noms
    if (areSimilar(userInput, correctName)) {
        try {
            const response = await fetch('/found-celebrity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ celebrityName: currentCelebrity })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Mettre à jour le score avec les points pour une bonne réponse
                await updateScore(POINTS.CORRECT_ANSWER);
                
                // Ajouter la célébrité à la liste des célébrités trouvées
                foundCelebrities.add(currentCelebrity);
                
                // Afficher un message de succès
                document.getElementById('feedback').innerHTML = `<i class="fas fa-check-circle" style="color: var(--success-color);"></i> Bravo ! C'est bien <strong>${currentCelebrity}</strong>. <span class="bonus">+${POINTS.CORRECT_ANSWER} points</span>`;
                
                // Afficher l'image originale pendant 3 secondes
                const imgElement = document.getElementById('celebrity-image');
                const timestamp = new Date().getTime();
                const originalImagePath = `images/${formatImagePath(currentCelebrity)}/original.jpg?t=${timestamp}`;
                
                // Sauvegarder l'image actuelle
                const currentImageSrc = imgElement.src;
                
                // Ajouter une classe de transition pour un effet de fondu
                imgElement.classList.add('reveal-transition');
                
                // Charger l'image originale
                imgElement.src = originalImagePath;
                
                // Ajouter un message indiquant que l'image originale est affichée
                const zoomCountElement = document.getElementById('zoom-count');
                const originalZoomText = zoomCountElement.textContent;
                zoomCountElement.textContent = "Image originale";
                
                // Charger la prochaine célébrité après un délai de 3 secondes
                setTimeout(() => {
                    // Retirer la classe de transition
                    imgElement.classList.remove('reveal-transition');
                    
                    // Restaurer le texte du zoom
                    zoomCountElement.textContent = originalZoomText;
                    
                    // Passer à la célébrité suivante
                    loadNextCelebrity();
                }, 3000);
            }
        } catch (error) {
            console.error('Erreur lors de la validation de la réponse:', error);
        }
    } else {
        // Afficher un message d'erreur
        document.getElementById('feedback').innerHTML = `<i class="fas fa-times-circle" style="color: var(--accent-color);"></i> Ce n'est pas <strong>${userInput}</strong>. Essayez encore !`;
        
        // Effacer le champ de saisie
        document.getElementById('user-input').value = '';
    }
}

// Fonction pour charger le classement
async function loadLeaderboard() {
    try {
        const response = await fetch('/leaderboard');
        const data = await response.json();
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';
        
        data.leaderboard.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.rank}</td>
                <td>${player.firstname} ${player.lastname}</td>
                <td>${player.score}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors du chargement du classement:', error);
    }
}

// Fonction pour gérer l'affichage temporaire des tooltips d'aide
function showTemporaryTooltips() {
    // Afficher le conteneur des tooltips
    const helpTooltips = document.getElementById('help-tooltips');
    helpTooltips.style.display = 'block';
    
    // Sélectionner tous les tooltips d'aide
    const tooltips = [
        document.getElementById('dezoom-tooltip'),
        document.getElementById('hint-tooltip'),
        document.getElementById('next-tooltip'),
        document.getElementById('score-tooltip')
    ];
    
    // Afficher les tooltips un par un avec un délai
    tooltips.forEach((tooltip, index) => {
        setTimeout(() => {
            // Masquer tous les tooltips d'abord
            tooltips.forEach(t => {
                t.classList.remove('visible');
                t.classList.remove('animated');
            });
            
            // Afficher le tooltip actuel
            tooltip.classList.add('visible');
            tooltip.classList.add('animated');
        }, index * 4000); // 4 secondes par tooltip (réduit de 6 à 4 secondes car les textes sont plus courts)
    });
    
    // Masquer tous les tooltips après 16 secondes (4 tooltips * 4 secondes)
    setTimeout(() => {
        tooltips.forEach(tooltip => {
            tooltip.classList.remove('visible');
            tooltip.classList.remove('animated');
        });
        
        // Masquer le conteneur après un court délai
        setTimeout(() => {
            helpTooltips.style.display = 'none';
        }, 500);
    }, 16000);
}

// Fonction pour initialiser les événements
function initEvents() {
    // Événements existants
    document.getElementById('dezoom-btn').addEventListener('click', handleDezoom);
    document.getElementById('hint-btn').addEventListener('click', showHint);
    document.getElementById('next-btn').addEventListener('click', loadNextCelebrity);
    document.getElementById('submit-btn').addEventListener('click', checkAnswer);
    document.getElementById('user-input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
        checkAnswer();
        }
    });
    document.getElementById('logout-btn').addEventListener('click', function() {
        window.location.href = '/logout';
    });
    document.getElementById('help-btn').addEventListener('click', showTemporaryTooltips);
    
    // Optimisations pour mobile
    const userInput = document.getElementById('user-input');
    
    // Fermer le clavier virtuel quand l'utilisateur clique ailleurs
    document.addEventListener('click', function(event) {
        if (event.target !== userInput && event.target.id !== 'submit-btn') {
            userInput.blur();
        }
    });
    
    // Ajuster la position de la page quand le clavier virtuel apparaît
    userInput.addEventListener('focus', function() {
        // Sur mobile, faire défiler la page pour que l'input soit visible
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                userInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    });
    
    // Détecter l'orientation de l'écran et ajuster l'interface
    window.addEventListener('resize', handleResize);
    handleResize(); // Appel initial
}

// Fonction pour gérer le redimensionnement et l'orientation
function handleResize() {
    const isMobile = window.innerWidth <= 768;
    const isLandscape = window.innerWidth > window.innerHeight;
    
    // Ajuster l'interface en fonction de l'orientation sur mobile
    if (isMobile) {
        const imageContainer = document.querySelector('.image-container');
        const celebrityImage = document.getElementById('celebrity-image');
        
        if (isLandscape) {
            // En mode paysage, réduire la taille de l'image
            celebrityImage.style.maxHeight = '150px';
            imageContainer.style.minHeight = '180px';
        } else {
            // En mode portrait, utiliser les valeurs par défaut du CSS
            celebrityImage.style.maxHeight = '';
            imageContainer.style.minHeight = '';
        }
    }
}

// Initialisation du jeu
document.addEventListener('DOMContentLoaded', async function() {
    await loadUserScore();
    await loadFoundCelebrities();
    await loadSeenCelebrities();
    shuffleCelebrities();
    await loadNextCelebrity();
    await loadLeaderboard();
    showTemporaryTooltips(); // Afficher les tooltips temporairement au chargement initial
    initEvents(); // Initialiser les événements
});

// Mettre à jour le classement périodiquement
setInterval(loadLeaderboard, 30000);