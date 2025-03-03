// État du jeu
let currentCelebrity = null;
let currentZoomLevel = 1;
let score = 0;
let celebrities = [];
let usedHints = new Set(); // Pour suivre les indices déjà utilisés

// Fonction pour charger la liste des célébrités depuis le dossier images
async function loadCelebrities() {
    try {
        celebrities = [
            "tom hanks",
            "quentin tarantino",
            "jorge mario bergoglio",
            "bruce lee",
            "brad pitt"
        ];
        // Créer une nouvelle copie du tableau pour la rotation
        window.fullCelebrityList = [...celebrities];
        shuffleCelebrities();
        loadNextCelebrity();
    } catch (error) {
        console.error("Erreur lors du chargement des célébrités:", error);
    }
}

// Mélanger le tableau des célébrités
function shuffleCelebrities() {
    for (let i = celebrities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [celebrities[i], celebrities[j]] = [celebrities[j], celebrities[i]];
    }
}

// Charger la célébrité suivante
function loadNextCelebrity() {
    if (celebrities.length === 0) {
        // Recharger la liste complète depuis la sauvegarde
        celebrities = [...window.fullCelebrityList];
        shuffleCelebrities();
    }
    
    currentCelebrity = celebrities.pop();
    currentZoomLevel = 1;
    usedHints.clear();
    
    // Précharger l'image pour vérifier qu'elle existe
    const img = new Image();
    img.onload = function() {
        updateImage();
        updateZoomCount();
        document.getElementById("user-input").value = "";
        document.getElementById("feedback").textContent = "";
        document.getElementById("dezoom-btn").disabled = false;
        document.getElementById("hint-btn").disabled = false;
    };
    img.onerror = function() {
        console.error(`Impossible de charger l'image pour ${currentCelebrity}`);
        loadNextCelebrity(); // Passer à la célébrité suivante si l'image n'existe pas
    };
    img.src = `images/${formatImagePath(currentCelebrity)}/zoom${currentZoomLevel}.jpg`;
}

// Fonction utilitaire pour formater le nom de fichier
function formatImagePath(name) {
    return name.toLowerCase().replace(/ /g, "_");
}

// Mettre à jour l'image avec le niveau de zoom actuel
function updateImage() {
    const imgElement = document.getElementById("celebrity-image");
    const timestamp = new Date().getTime();
    imgElement.src = `images/${formatImagePath(currentCelebrity)}/zoom${currentZoomLevel}.jpg?v=${timestamp}`;
}

// Mettre à jour le compteur de zoom
function updateZoomCount() {
    const zoomCount = document.getElementById("zoom-count");
    zoomCount.textContent = `Zoom ${currentZoomLevel}/5`;
}

// Vérifier la réponse
function checkAnswer() {
    const userInput = document.getElementById("user-input").value.trim().toLowerCase();
    const correctName = currentCelebrity.toLowerCase();

    // Fonction pour normaliser les chaînes (suppression des accents et caractères spéciaux)
    const normalizeString = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    if (normalizeString(userInput) === normalizeString(correctName)) {
        score++;
        document.getElementById("score").textContent = score;
        document.getElementById("feedback").textContent = "Bravo ! C'est la bonne réponse !";
        document.getElementById("feedback").style.color = "#28a745";
        
        // Afficher l'image originale
        const imgElement = document.getElementById("celebrity-image");
        const timestamp = new Date().getTime();
        imgElement.src = `images/${formatImagePath(currentCelebrity)}/original.jpg?v=${timestamp}`;
        
        // Réactiver le bouton dezoom pour la prochaine célébrité
        document.getElementById("dezoom-btn").disabled = false;
        setTimeout(loadNextCelebrity, 2500);
    } else {
        document.getElementById("feedback").textContent = "Ce n'est pas la bonne réponse, essayez encore !";
        document.getElementById("feedback").style.color = "#dc3545";
    }
}

// Gérer le dezoom
function handleDezoom() {
    if (currentZoomLevel < 5) {
        currentZoomLevel++;
        updateImage();
        updateZoomCount();
        
        if (currentZoomLevel === 5) {
            document.getElementById("dezoom-btn").disabled = true;
            document.getElementById("feedback").textContent = "C'est votre dernière chance !";
            document.getElementById("feedback").style.color = "#ffc107";
        }
    }
}

// Fonction pour charger et afficher un indice aléatoire
async function showRandomHint() {
    try {
        const response = await fetch(`images/${formatImagePath(currentCelebrity)}/infos.txt`);
        if (!response.ok) throw new Error('Impossible de charger les indices');
        
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const hints = {
            'Métier:': null,
            'Origine:': null,
            'Date de naissance:': null
        };
        
        let currentKey = null;
        for (const line of lines) {
            if (line.trim() in hints) {
                currentKey = line.trim();
            } else if (currentKey) {
                hints[currentKey] = line.trim();
            }
        }

        // Convertir en tableau d'indices disponibles (non utilisés)
        const availableHints = Object.entries(hints)
            .filter(([key]) => !usedHints.has(key))
            .filter(([, value]) => value !== null);

        if (availableHints.length === 0) {
            document.getElementById("feedback").textContent = "Vous avez utilisé tous les indices disponibles !";
            document.getElementById("feedback").style.color = "#dc3545";
            document.getElementById("hint-btn").disabled = true;
            return;
        }

        // Sélectionner un indice aléatoire
        const randomIndex = Math.floor(Math.random() * availableHints.length);
        const [hintType, hintValue] = availableHints[randomIndex];
        
        // Marquer cet indice comme utilisé
        usedHints.add(hintType);
        
        // Afficher l'indice
        document.getElementById("feedback").textContent = `${hintType} ${hintValue}`;
        document.getElementById("feedback").style.color = "#ffc107";

        // Désactiver le bouton si tous les indices ont été utilisés
        if (usedHints.size === Object.keys(hints).length) {
            document.getElementById("hint-btn").disabled = true;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des indices:', error);
        document.getElementById("feedback").textContent = "Impossible de charger les indices";
        document.getElementById("feedback").style.color = "#dc3545";
    }
}

// Event listeners
document.getElementById("submit-btn").addEventListener("click", checkAnswer);
document.getElementById("dezoom-btn").addEventListener("click", handleDezoom);
document.getElementById("hint-btn").addEventListener("click", showRandomHint);
document.getElementById("next-btn").addEventListener("click", loadNextCelebrity);
document.getElementById("user-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        checkAnswer();
    }
});

// Initialiser le jeu
window.onload = loadCelebrities;
