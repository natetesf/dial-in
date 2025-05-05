let remainingAttempts = 3;
let guessProgress = [];
let emojiFeedbackGrid = [];

let gameOver = false;
let correctWordArray = [];
let currentIndex = 0; // Track the currently active cell


let timerStarted = false;
let timerInterval = null;
let startTime = null;
let totalTime = 0; // in seconds


let finalWinStatus = null;
let finalTotalSeconds = null;
let finalAnswerWord = "";



//pull date and game # from html
const gameInfoText = document.getElementById("game-info").innerText;
// Split the text to get the game number and current date
const parts = gameInfoText.split(" – ");
const gameNumber = parts[0].replace("Dial In #", "").trim();  // Extracts the game number
const currentDate = parts[1].trim();  // Extracts the current date
console.log('Game Number:', gameNumber);
console.log('Current Date:', currentDate);


function displayNumberGrid(wordArray) {
    console.log(wordArray);
    const numberGrid = document.getElementById("number-grid");
    numberGrid.innerHTML = "";
    wordArray.forEach(char => {
        const cell = document.createElement("div");
        cell.classList.add("grid-cell");
        cell.textContent = convertLetterToNumber(char);
        numberGrid.appendChild(cell);
    });
}

function convertLetterToNumber(letter) {
    const keypad = {
        'A': '2', 'B': '2', 'C': '2',
        'D': '3', 'E': '3', 'F': '3',
        'G': '4', 'H': '4', 'I': '4',
        'J': '5', 'K': '5', 'L': '5',
        'M': '6', 'N': '6', 'O': '6',
        'P': '7', 'Q': '7', 'R': '7', 'S': '7',
        'T': '8', 'U': '8', 'V': '8',
        'W': '9', 'X': '9', 'Y': '9', 'Z': '9',
        ' ': '0'
    };
    return keypad[letter] || '-';
}

function submitGuess() {
    if (gameOver) return;

    const cells = document.querySelectorAll(".input-cell");

    // Collect user input from the grid
    let guess = Array.from(cells)
        .map(cell => (cell.textContent.length === 0 ? " " : cell.textContent))
        .join("");

    if (guess.length !== 10) {
        console.error("Error: Guess is not exactly 10 characters.");
        return;
    }

    fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            guess: guess,
            remainingAttempts: remainingAttempts // 👈 Add this if it's not here yet
        })
    })
    
    .then(res => res.json())
    .then(data => {
        if (data.result === "error") {
            console.error("❌ Invalid submission:", data.message);
            return;
        }

        // Track the guess
        guessProgress.push(guess);

        // Highlight the guess using server-provided match indexes
        displayGuess(guess, data.matches);
        let emojiRow = "";
        for (let i = 0; i < guess.length; i++) {
            emojiRow += data.matches.includes(i) ? "🟩" : "⬛️";
        }
        console.log(emojiRow)
        emojiFeedbackGrid.push(emojiRow);

        if (data.word) {
            finalAnswerWord = data.word; // ✅ global variable
        }

        // Reduce remaining attempts
        if (remainingAttempts > 0) {
            remainingAttempts--;
        }

        // Hide dot indicator
        let dotElement = document.getElementById("dot" + (remainingAttempts + 1));
        if (dotElement) {
            dotElement.style.visibility = "hidden";
        }

        // End game on correct guess or final attempt
        if (data.result === "correct" || remainingAttempts <= 0) {
            endGame(data.result === "correct");
        } else {
            setTimeout(() => {
                if (!gameOver) clearInputGrid();
            }, 0);
        }
    })
    .catch(err => {
        console.error("Guess submission failed:", err);
    });
}


function displayGuess(guessString, matchIndexes = []) {
    const guessContainer = document.getElementById("guess-container");
    let guessArray = guessString.split("");

    let guessRow;

    if (gameOver) {
        guessRow = guessContainer.lastElementChild;
        console.log("🏁 Game Over: Updating the final guess row.");
    } else {
        guessRow = document.createElement("div");
        guessRow.classList.add("guess-row");
    }

    guessRow.innerHTML = "";

    guessArray.forEach((letter, index) => {
        const cell = document.createElement("div");
        cell.classList.add("grid-cell");
        cell.textContent = letter;

        if (matchIndexes.includes(index)) {
            cell.classList.add("correct"); // ✅ Apply green if correct
        }

        guessRow.appendChild(cell);
    });

    if (!gameOver) {
        guessContainer.appendChild(guessRow);
    }
}



function clearInputGrid() {
    if (gameOver) return; // Prevents clearing the grid if the game has ended

    const cells = document.querySelectorAll(".input-cell");
    cells.forEach(cell => (cell.textContent = ""));
    currentIndex = 0; // Reset input cursor to the first cell
    highlightCurrentCell(currentIndex);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
}

function removeInputGrid() {
    const inputGrid = document.getElementById("guess-input-grid");
    if (inputGrid) {
        inputGrid.remove(); // ✅ Completely removes the element
        console.log("🗑️ Input grid removed from HTML after game over.");
    }
}




function createInputGrid() {
    const inputGrid = document.getElementById("guess-input-grid");

    if (!inputGrid) {
        console.error("Error: #guess-input-grid element not found.");
        return;
    }

    inputGrid.innerHTML = ""; // Clear previous grid

    for (let i = 0; i < 10; i++) {
        const cell = document.createElement("div");
        cell.classList.add("grid-cell", "input-cell");
        cell.dataset.index = i; // Store index for reference
        cell.textContent = ""; // Initially empty
        inputGrid.appendChild(cell);
    }

    document.addEventListener("keydown", handleTyping); // Listen for typing events
    highlightCurrentCell(0); // Start with the first cell selected
}

document.addEventListener("keydown", function (event) {
    const popup = document.getElementById("how-to-play-popup");
    const introVisible = document.getElementById("game-intro").style.display !== "none";

    if (introVisible && event.key === "Enter") {
        document.getElementById("play-btn").click();
    } else if (!popup.classList.contains("popup-hidden") && event.key === "Enter") {
        startGameTimer();
        document.getElementById("play-button").click();

    } else if (event.key === "Enter" && !gameOver) {
        let submitButton = document.getElementById("submit-btn");

        // Only trigger submitGuess() if the button is enabled
        if (!submitButton.disabled) {
            submitGuess();
        }
    }
});



function handleTyping(event) {
    const cells = document.querySelectorAll(".input-cell");

    // Allow letters A-Z and spaces
    if ((event.key.match(/^[a-zA-Z]$/) || event.key === " ") && currentIndex < 10) {
        cells[currentIndex].textContent = event.key === " " ? " " : event.key.toUpperCase();
        currentIndex++;
    } 
    // Handle Backspace to move backward
    else if (event.key === "Backspace" && currentIndex > 0) {
        currentIndex--;
        cells[currentIndex].textContent = "";
    }

    highlightCurrentCell(currentIndex);
    checkInput(); // Enable or disable the enter button
}


function highlightCurrentCell(index) {
    const cells = document.querySelectorAll(".input-cell");
    cells.forEach(cell => cell.classList.remove("active-cell")); // Remove previous highlight
    if (index < 10) {
        cells[index].classList.add("active-cell"); // Highlight current cell
    }
}

function checkInput() {
    const cells = document.querySelectorAll(".input-cell");

    // Build the guess
    let guess = Array.from(cells).map(cell =>
        (cell.textContent.length === 0 ? "_" : cell.textContent)
    ).join("");

    const submitBtn = document.getElementById("submit-btn");
    const isValid = guess.length === 10 && !guess.includes("_");

    // Enable/disable button
    submitBtn.disabled = !isValid;

    // Toggle visual classes
    if (isValid) {
        submitBtn.classList.remove("disabled");
        submitBtn.classList.add("active");
    } else {
        submitBtn.classList.add("disabled");
        submitBtn.classList.remove("active");
    }
}


document.addEventListener("DOMContentLoaded", () => {
    createInputGrid();
});

document.getElementById("submit-btn").onclick = function () {
    if (!gameOver && !this.disabled) {
        submitGuess();
    }
};

function endGame(isWin) {
    gameOver = true;
    finalWinStatus = isWin;
    finalTotalSeconds = stopGameTimer();

    let mobileInput = document.getElementById("hidden-mobile-input");
    // Remove focus from the input field to close the keyboard
    mobileInput.blur();

    // Hide submit button and disable input grid
    document.getElementById("submit-btn").style.display = "none";
    removeInputGrid()

    console.log("Final guess locked in. No new input allowed.");
    
    showShareablePopup(isWin, finalTotalSeconds);
}

function showShareablePopup(isWin, finalTotalSeconds) {
    console.log("📢 in shareable function");

    let shareablePopup = document.getElementById("shareable-popup");
    console.log("Popup Element:", shareablePopup);

    if (!shareablePopup) {
        console.error("❌ Error: #shareable-popup element not found in DOM!");
        return;
    }

    // ✅ Determine the message based on the number of attempts
    let message;
    if (remainingAttempts === 2) {
        message = "You're a star. Mom and Dad would be proud"; // ✅ First try
    } else if (remainingAttempts === 1) {
        message = "Super!"; // ✅ Two tries
    } else if (remainingAttempts === 0 ) {
        message = "Get it together man"; // ✅ Three tries
    } else {
        message = "Better Luck Next Time!"; // ✅ User failed
    }

    // ✅ Generate emoji-based representation of guesses
    let emojiGrid = emojiFeedbackGrid.join("\n");

        

    if (isWin) {
        fullShareText = `DIAL IN #${gameNumber} solved in ${formatTime(finalTotalSeconds)}!\n${emojiGrid}`;
        document.getElementById("shareable-text").innerText = fullShareText;
    } else {
        fullShareText = `DIAL IN #${gameNumber} defeated me!\n${emojiGrid}`;
        document.getElementById("shareable-text").innerText = fullShareText;
    }
    

    // ✅ Update the popup content
    document.getElementById("popup-message").innerText = message; // Set dynamic message
    document.getElementById("code-word").innerText = `"${finalAnswerWord}"`;

    
    // ✅ Remove "hidden" and add "shareable-popup" class to make it visible
    shareablePopup.classList.remove("hidden");
    shareablePopup.classList.add("shareable-popup");


    // ✅ Show the Share button by removing `hidden-share`
    document.getElementById("share-btn").classList.remove("hidden-share");

    console.log("✅ Popup should be visible now.");
    console.log(isWin)
}

function updateCountdown() {
    const now = new Date();
    const options = { timeZone: 'America/Chicago' };
    const chicagoNow = new Date(now.toLocaleString('en-US', options));

    const tomorrow = new Date(chicagoNow);
    tomorrow.setDate(chicagoNow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diffMs = (tomorrow - chicagoNow) + 60000; // ⬅️ Add 1 minute
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    document.getElementById("countdown-hours").textContent =
        `${hours} hour${hours !== 1 ? 's' : ''}`;
    document.getElementById("countdown-minutes").textContent =
        `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
updateCountdown();
setInterval(updateCountdown, 60000);


/* timer logic to keep track of how long the user took to play */


function startGameTimer() {
    console.log("inside start timer");

    if (timerStarted) return;
    console.log("⏱️ startGameTimer() called");


    timerStarted = true;
    startTime = Date.now();

    timerInterval = setInterval(() => {
        totalTime = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        document.getElementById("game-timer").textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopGameTimer() {
    clearInterval(timerInterval);
    return totalTime;
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    const minText = m === 1 ? "1 min" : `${m} mins`;
    const secText = s === 1 ? "1 sec" : `${s} secs`;

    return m > 0 ? `${minText} ${secText}` : secText;
}


document.addEventListener("DOMContentLoaded", function () {
    let mobileInput = document.getElementById("hidden-mobile-input");

    // ✅ Use a delay to ensure the page loads fully before focusing
    setTimeout(() => {
        focusInput();
    }, 500); // Slight delay to avoid browser restrictions

    // ✅ Refocus when a user taps the input grid
    document.getElementById("guess-input-grid").addEventListener("click", function () {
        focusInput();
    });
});


// ✅ Move to the next cell after typing a letter
function moveToNextCell() {
    let cells = document.querySelectorAll(".input-cell");
    let currentIndex = Array.from(cells).findIndex(cell => cell.classList.contains("active-cell"));

    if (currentIndex !== -1 && currentIndex < cells.length - 1) {
        cells[currentIndex].classList.remove("active-cell");
        cells[currentIndex + 1].classList.add("active-cell");
    }
}

document.getElementById("close-popup").addEventListener("click", function () {
    let popup = document.getElementById("shareable-popup");
    popup.classList.remove("shareable-popup");
    popup.classList.add("hidden"); // ✅ Hide popup again
});


document.getElementById("share-btn").addEventListener("click", function () {
    showShareablePopup(finalWinStatus, finalTotalSeconds);
});


document.getElementById("play-btn").addEventListener("click", function () {
    document.getElementById("game-intro").style.display = "none"; // Hide the overlay
    document.getElementById("how-to-play-popup").classList.remove("popup-hidden");
});


// ✅ Open How to Play popup
document.getElementById("help-icon").addEventListener("click", function () {
    const sharePopup = document.getElementById("shareable-popup");
    const howToPopup = document.getElementById("how-to-play-popup");

    // ✅ Close shareable popup if it's open
    if (!sharePopup.classList.contains("hidden")) {
        sharePopup.classList.add("hidden");
        sharePopup.classList.remove("shareable-popup"); // Optional: reset any added classes
    }

    // ✅ Open How to Play
    howToPopup.classList.remove("popup-hidden");
});

// ✅ Close How to Play popup
document.getElementById("close-how-to-play").addEventListener("click", function () {
    document.getElementById("how-to-play-popup").classList.add("popup-hidden");
    focusInput();
    startGameTimer(); // ✅ Start only once
});


// ✅ Close popup when PLAY button is clicked
document.getElementById("play-button").addEventListener("click", function () {
    document.getElementById("how-to-play-popup").classList.add("popup-hidden");
    focusInput();
    startGameTimer();
});


function focusInput() {
    let mobileInput = document.getElementById("hidden-mobile-input");
    let guessGrid = document.getElementById("guess-input-grid");
    let focusSpot = document.getElementById("guess-container");

    mobileInput.focus();
}

// ✅ Refocus when the user taps the guess input grid
document.getElementById("guess-input-grid").addEventListener("click", function () {
    focusInput();
});

// ✅ Call `focusInput()` whenever a new grid is added after a guess
function createNewGuessInputGrid() {
    let newGrid = document.createElement("div");
    newGrid.classList.add("guess-row");
    document.getElementById("guess-container").appendChild(newGrid);
    
    focusInput(); // ✅ Ensures keyboard opens immediately
}
