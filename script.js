const celebrities = [
    { name: "Barack Obama", image: "President-Barack-Obama.jpg.jpg" },
];

let currentIndex = 0;
let score = 0;

function loadCelebrity() {
    document.getElementById("celebrity-image").src = celebrities[currentIndex].image;
    document.getElementById("user-input").value = "";
    document.getElementById("feedback").textContent = "";
}

function checkAnswer() {
    const userInput = document.getElementById("user-input").value.trim().toLowerCase();
    const correctName = celebrities[currentIndex].name.toLowerCase();

    if (userInput === correctName) {
        score++;
        document.getElementById("feedback").textContent = "? Bonne réponse !";
    } else {
        document.getElementById("feedback").textContent = `? Mauvaise réponse ! C'était ${celebrities[currentIndex].name}`;
    }

    document.getElementById("score").textContent = score;
}

function nextCelebrity() {
    currentIndex = (currentIndex + 1) % celebrities.length;
    loadCelebrity();
}

// Charger la première image au début
window.onload = loadCelebrity;
