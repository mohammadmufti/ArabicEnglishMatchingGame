    // Game variables
    let sentences = [];
    let isWordGame = true;
    let currentIndex = 0;
    let score = 0;
    let mistakes = 0;
    let difficultyLevel = 5;
    let currentPosition = 0;
    let answerLog = [];
    let levelIndexs = [];
    let currentLevelQuestions = []; // To store the current level's questions
    let currentQuestionIndex = 0; // To track our position in currentLevelQuestions
    
    // DOM elements
    const loadingScreen = document.getElementById('loading-screen');
    const errorScreen = document.getElementById('error-screen');
    const errorMessage = document.getElementById('error-message');
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const dataStats = document.getElementById('data-stats');
    const difficultySlider = document.getElementById('difficulty');
    const difficultyValue = document.getElementById('difficulty-value');
    const difficultyText = document.getElementById('difficulty-text');
    const startButton = document.getElementById('start-game');
    const arabicText = document.getElementById('arabic-text');
    const optionsContainer = document.getElementById('options-container');
    const scoreDisplay = document.getElementById('score');
    const mistakesDisplay = document.getElementById('mistakes');
    const feedbackDisplay = document.getElementById('feedback');
    const nextButton = document.getElementById('next-question');
    const doneButton = document.getElementById('done-button');
    const summaryModal = document.getElementById('summary-modal');
    const closeModal = document.getElementById('close-modal');
    const summaryDifficulty = document.getElementById('summary-difficulty');
    const summaryCorrect = document.getElementById('summary-correct');
    const summaryMistakes = document.getElementById('summary-mistakes');
    const summaryRate = document.getElementById('summary-rate');
    const answerLogContainer = document.getElementById('answer-log');
    const copyText = document.getElementById('copy-text');
    const downloadLogButton = document.getElementById('download-log');
    const newGameButton = document.getElementById('new-game');
    const startModal = document.getElementById('startModal');
    const sentenceGameButton = document.getElementById('sentenceGameButton');
    const wordGameButton = document.getElementById('wordGameButton');

    // Load the ara.txt file
    function loadAraFile() {
        fetch('ara.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load ara.txt file');
                }
                return response.text();
            })
            .then(content => {
                parseFileContent(content);
            })
            .catch(error => {
                console.error('Error loading ara.txt:', error);
                loadingScreen.style.display = 'none';
                errorScreen.style.display = 'block';
                errorMessage.textContent = error.message || 'Unable to load ara.txt. Please make sure the file is in the same directory as this HTML file.';
            });
    }

    // Function to load FSTU.csv
    function loadFSTUFile() {
        fetch('FSTU.csv')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load FSTU.csv file');
                }
                return response.text();
            })
            .then(content => {
                parseCSVContent(content);
            })
            .catch(error => {
                console.error('Error loading FSTU.csv:', error);
                loadingScreen.style.display = 'none';
                errorScreen.style.display = 'block';
                errorMessage.textContent = error.message || 'Unable to load FSTU.csv. Please make sure the file is in the same directory as this HTML file.';
            });
    }

    // Parse CSV file content
    function parseCSVContent(content) {
        sentences = [];
        const lines = content.split('\n').map(line => line.trim()).filter(line => line !== ''); // Split by lines, trim whitespace, and remove empty lines

        // Iterate through the lines in pairs
        for (let i = 0; i < lines.length; i += 2) {
            const arabic = lines[i]
                .replace(/,$/, '') // Remove trailing commas
                .replace(/^"|"$/g, '') // Remove quotation marks at the start or end
                .trim(); // Trim whitespace

            const english = lines[i + 1]?.replace(/,$/, '') // Remove trailing commas
                .replace(/^"|"$/g, '') // Remove quotation marks at the start or end
                .trim(); // Trim whitespace
            // Ensure both Arabic and English lines exist
            if (arabic && english) {
                sentences.push({
                    arabic: arabic,
                    english: english
                });
            } else {
                console.warn(`Skipping incomplete pair at line ${i + 1}:`, { arabic, english });
            }
        }

        loadingScreen.style.display = 'none';
        
        if (sentences.length > 0) {
            setupScreen.style.display = 'block';
            dataStats.textContent = `Loaded ${sentences.length} sentences`;
        } else {
            errorScreen.style.display = 'block';
            errorMessage.textContent = 'No valid data found in FSTU.csv. Please check the file format.';
        }
        createDifficultyLevelIndexes();
    }

    // Parse text file content
    function parseFileContent(content) {
        sentences = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim() === '') continue;
            
            const parts = line.split('\t');
            if (parts.length >= 2) {
                sentences.push({
                    english: parts[0],
                    arabic: parts[1],
                    source: parts[2] || ''
                });
            }
        }
        
        loadingScreen.style.display = 'none';
        
        if (sentences.length > 0) {
            setupScreen.style.display = 'block';
            dataStats.textContent = `Loaded ${sentences.length} sentences`;
        } else {
            errorScreen.style.display = 'block';
            errorMessage.textContent = 'No valid data found in ara.txt. Please check the file format.';
        }
        createDifficultyLevelIndexes();
    }

    // Update difficulty text based on slider value
    function updateDifficultyText() {
        const value = parseInt(difficultySlider.value);
        difficultyValue.textContent = value;
        
        let text = "";
        if (value <= 2) text = "Beginner";
        else if (value <= 4) text = "Elementary";
        else if (value <= 6) text = "Intermediate";
        else if (value <= 8) text = "Advanced";
        else text = "Expert";
        
        difficultyText.textContent = text;
    }

    // Indexes difficulty levels and shuffles pairs
    function createDifficultyLevelIndexes() {
        levelIndexes = []; // Reset the array
        const totalSentences = sentences.length;
        const segmentSize = Math.ceil(totalSentences / 10); // Size of each segment

        for (let level = 1; level <= 10; level++) {
            // Calculate the range for the current difficulty level
            const minIndex = (level - 1) * segmentSize;
            const maxIndex = Math.min(level * segmentSize, totalSentences) - 1;

            // Extract the indices for this segment
            const segmentIndices = [];
            for (let i = minIndex; i <= maxIndex; i++) {
                segmentIndices.push(i);
            }

            // Shuffle the indices randomly
            const shuffledIndices = shuffleArray(segmentIndices);

            // Store the shuffled indices in the levelIndexes array
            levelIndexes.push(shuffledIndices);
        }
    }

    // Helper function to shuffle an array using Fisher-Yates algorithm
    function shuffleArray(array) {
        const shuffled = [...array]; // Clone the array to avoid modifying the original
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
        }
        return shuffled;
    }

    // Get sentences based on difficulty level with randomization
    function getSentencesForDifficulty(difficulty) {

        if (sentences.length === 0) {
            console.error("No sentences loaded. Cannot calculate difficulty range.");
            return null; 
        }
        const totalSentences = sentences.length;
        
        // Define segment size for each difficulty level
        const segmentSize = Math.ceil(totalSentences / 10);
        
        // Calculate range for the given difficulty
        const minIndex = Math.max(0, (difficulty - 1) * segmentSize);
        const maxIndex = Math.min(difficulty * segmentSize - 1, totalSentences - 1);
        
        // Pick a random position within that range
        return getRandomInt(minIndex, maxIndex);
    }

    // Generate a random number between min and max
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getOptions(correctAnswer, difficultyLevel) {
        const options = [correctAnswer];
        const usedIndices = new Set([currentPosition]);

        // Tokenize the correct answer
        const correctAnswerTokens = correctAnswer.split(/\s+/);
        const correctTokenCount = correctAnswerTokens.length;

        // Determine the minimum number of matching tokens based on difficulty
        const minMatchingTokens = Math.min(2, Math.ceil(difficultyLevel / 5)); // Example: 1 token for low difficulty, 2 for high

        // Check if the correct answer ends with a question mark - edge case
        const endsWithQuestionMark = endsWithCharacter(correctAnswer, '?');

        // Specific one word edge cases
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const islamicMonths = [
            "Rajab", "Shaban", "Ramadhan", "Shawwal", "Zul Qadah", "Zul Hijjah",
            "Muharram", "Safar", "Rabi al-Awal", "Rabi at-Thani", "Jumada al-Awal", "Jumada at-Thani"
        ];
        const ones = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
        const teens = ["eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
        const tens = ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety", "one hundred"];

        if (isWordGame && correctAnswer.startsWith("to")) {
            let toCount = 0; // Count how many wrong answers start with "to"

            // Ensure at least 2 wrong answers start with "to"
            while (toCount < 2 && options.length < 4) {
                const randomIndex = getRandomInt(0, sentences.length - 1);
                const randomSentence = sentences[randomIndex].english;

                // Check if the random sentence starts with "to" and isn't already used
                if (
                    !usedIndices.has(randomIndex) && // Avoid duplicates
                    randomSentence !== correctAnswer && // Avoid using the correct answer itself
                    randomSentence.startsWith("to") // Ensure it starts with "to"
                ) {
                    options.push(randomSentence);
                    usedIndices.add(randomIndex);
                    toCount++;
                }
            }

            // If we still don't have enough "to" answers after exhausting the loop, relax the condition
            if (toCount < 2) {
                console.warn("Not enough 'to' answers found. Relaxing constraints.");
            }
        }

        // If the correct answer is a day of the week
        if (daysOfWeek.includes(correctAnswer)) {
            const wrongAnswers = [];
            const availableDays = daysOfWeek.filter(day => day !== correctAnswer); // Exclude the correct answer

            while (wrongAnswers.length < 3 && availableDays.length > 0) {
                const randomIndex = getRandomInt(0, availableDays.length - 1);
                const randomDay = availableDays.splice(randomIndex, 1)[0]; // Remove the selected day to avoid duplicates
                wrongAnswers.push(randomDay);
            }

            options.push(...wrongAnswers); // Add the wrong answers to the options array
        }
        
        // If the correct answer is a particular month
        if (islamicMonths.includes(correctAnswer)) {
            const wrongAnswers = [];
            const availableMonths = islamicMonths.filter(month => month !== correctAnswer); // Exclude the correct answer

            while (wrongAnswers.length < 3 && availableMonths.length > 0) {
                const randomIndex = getRandomInt(0, availableMonths.length - 1);
                const randomMonth = availableMonths.splice(randomIndex, 1)[0]; // Remove the selected month to avoid duplicates
                wrongAnswers.push(randomMonth);
            }

            options.push(...wrongAnswers); // Add the wrong answers to the options array
        }

        // Check if correctAnswer is in the "ones" set
        if (ones.includes(correctAnswer)) {
            const wrongAnswers = [];
            const availableNumbers = ones.filter(number => number !== correctAnswer); // Exclude the correct answer

            while (wrongAnswers.length < 3 && availableNumbers.length > 0) {
                const randomIndex = getRandomInt(0, availableNumbers.length - 1);
                const randomNumber = availableNumbers.splice(randomIndex, 1)[0]; // Remove the selected number to avoid duplicates
                wrongAnswers.push(randomNumber);
            }

            options.push(...wrongAnswers); // Add the wrong answers to the options array
        }

        // Check if correctAnswer is in the "teens" set
        else if (teens.includes(correctAnswer)) {
            const wrongAnswers = [];
            const availableNumbers = teens.filter(number => number !== correctAnswer); // Exclude the correct answer

            while (wrongAnswers.length < 3 && availableNumbers.length > 0) {
                const randomIndex = getRandomInt(0, availableNumbers.length - 1);
                const randomNumber = availableNumbers.splice(randomIndex, 1)[0]; // Remove the selected number to avoid duplicates
                wrongAnswers.push(randomNumber);
            }

            options.push(...wrongAnswers); // Add the wrong answers to the options array
        }

        // Check if correctAnswer is in the "tens" set
        else if (tens.includes(correctAnswer)) {
            const wrongAnswers = [];
            const availableNumbers = tens.filter(number => number !== correctAnswer); // Exclude the correct answer

            while (wrongAnswers.length < 3 && availableNumbers.length > 0) {
                const randomIndex = getRandomInt(0, availableNumbers.length - 1);
                const randomNumber = availableNumbers.splice(randomIndex, 1)[0]; // Remove the selected number to avoid duplicates
                wrongAnswers.push(randomNumber);
            }

            options.push(...wrongAnswers); // Add the wrong answers to the options array
        }

        // Add 3 more random options
        let attempts = 0; // Track the number of attempts to find valid options
        const maxAttempts = 5; // Prevent infinite loops by limiting attempts

        while (options.length < 4 && options.length < sentences.length) {
            const randomIndex = getRandomInt(0, sentences.length - 1);
            const randomSentence = sentences[randomIndex].english;

            if (isWordGame) {
                // For Word Matching Game, just ensure no duplicates and avoid using the correct answer
                if (
                    !usedIndices.has(randomIndex) && // Avoid duplicates
                    randomSentence !== correctAnswer // Avoid using the correct answer itself
                ) {
                    options.push(randomSentence);
                    usedIndices.add(randomIndex);
                }
            } else {
                // Tokenize the random sentence
                const randomSentenceTokens = randomSentence.split(/\s+/);
                const randomTokenCount = randomSentenceTokens.length;

                // Ensure the random option matches the grammatical structure (punctuation), token similarity, and token length
                if (
                    !usedIndices.has(randomIndex) && // Avoid duplicates
                    randomSentence !== correctAnswer && // Avoid using the correct answer itself
                    (!endsWithQuestionMark || endsWithCharacter(randomSentence, '?')) && // Punctuation match
                    countMatchingTokens(correctAnswer, randomSentence) >= minMatchingTokens && // Token similarity
                    isTokenLengthSimilar(correctTokenCount, randomTokenCount) // Token length similarity
                ) {
                    options.push(randomSentence);
                    usedIndices.add(randomIndex);
                }
                attempts++; // Increment the attempt counter
            }
        }

        // Shuffle options
        return options.sort(() => Math.random() - 0.5);
    }

    // Helper function to check if two token counts are similar
    function isTokenLengthSimilar(correctTokenCount, randomTokenCount) {
        if (correctTokenCount <= 2) {
            // Strict match for 1 or 2 tokens
            return correctTokenCount === randomTokenCount;
        } else if (correctTokenCount === 3) {
            // Allow ±1 token difference for 3 tokens
            return Math.abs(correctTokenCount - randomTokenCount) <= 1;
        } else {
            // Looser restriction for >3 tokens
            return Math.abs(correctTokenCount - randomTokenCount) <= 2;
        }
    }

    // Helper function to check if a string ends with a specific character
    function endsWithCharacter(sentence, character) {
        return sentence.trim().endsWith(character);
    }
    
    // Helper function to count matching tokens between two sentences
    function countMatchingTokens(sentence1, sentence2) {
        const tokens1 = sentence1.toLowerCase().split(/\s+/); // Split into words
        const tokens2 = sentence2.toLowerCase().split(/\s+/);
        return tokens1.filter(token => tokens2.includes(token)).length; // Count matches
    }

    // Setup a new question
    function setupQuestion() {
        // Clear previous state
        optionsContainer.innerHTML = '';
        feedbackDisplay.textContent = '';
        nextButton.style.display = 'none';
        
        // Get current sentence
        const currentSentence = sentences[currentPosition];
        
        // Fade out and then update text with animation
        arabicText.style.opacity = 0;
        setTimeout(() => {
            arabicText.textContent = currentSentence.arabic;
            arabicText.style.opacity = 1;

        // Create Play Button
        const playButton = document.createElement('button');
        playButton.innerHTML = '🔊'; // Microphone symbol
        playButton.classList.add('play-button');

        // Preprocess the Arabic text to include only the parts before the " ج "
        let truncatedText = currentSentence.arabic;
        const separator = " ج "; // The separator to look for
        if (truncatedText.includes(separator)) {
            truncatedText = truncatedText.split(separator)[0].trim(); // Keep only the part before " ج "
        }            
        
        // Attach the onclick event with the truncated text
        playButton.onclick = () => responsiveVoice.speak(truncatedText, "Arabic Male"), { rate: 0.7 };

        // Append the button to the arabicText container
        arabicText.style.position = 'relative';
        arabicText.appendChild(playButton);

        }, 200);
        
        // Generate and display options
        const options = getOptions(currentSentence.english, difficultyLevel);
        
        // Add options with staggered animation
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.style.opacity = 0;
            optionElement.style.transform = 'translateY(20px)';
            optionElement.addEventListener('click', () => checkAnswer(option, currentSentence.english, optionElement));
            
            optionsContainer.appendChild(optionElement);
            
            // Staggered appearance
            setTimeout(() => {
                optionElement.style.opacity = 1;
                optionElement.style.transform = 'translateY(0)';
                optionElement.style.transition = 'all 0.3s ease';
            }, 100 * index);
        });
    }

    // Check if the selected answer is correct
    function checkAnswer(selectedAnswer, correctAnswer, optionElement) {
        // Disable all options
        const allOptions = document.querySelectorAll('.option');
        allOptions.forEach(option => {
            option.style.pointerEvents = 'none';
            if (option.textContent === correctAnswer) {
                option.classList.add('correct');
            }
        });
        
        // Get the current Arabic text minus extraneous symbols
        const currentArabic = arabicText.textContent.replace(/🔊/g, '');
        
        if (selectedAnswer === correctAnswer) {
            // Correct answer
            score++;
            scoreDisplay.textContent = score;
            feedbackDisplay.textContent = 'Correct!';
            feedbackDisplay.style.color = '#28a745';
            
            // Add to answer log
            answerLog.push({
                arabic: currentArabic,
                english: correctAnswer,
                userAnswer: selectedAnswer,
                isCorrect: true
            });
            
        } else {
            // Incorrect answer
            mistakes++;
            mistakesDisplay.textContent = mistakes;
            optionElement.classList.add('incorrect');
            feedbackDisplay.textContent = 'Incorrect!';
            feedbackDisplay.style.color = '#ff4b2b';
            
            // Add to answer log
            answerLog.push({
                arabic: currentArabic,
                english: correctAnswer,
                userAnswer: selectedAnswer,
                isCorrect: false
            });
         }
        
        // Show next button with animation
        nextButton.style.display = 'block';
        nextButton.style.opacity = 0;
        nextButton.style.transform = 'translateY(20px)';
        setTimeout(() => {
            nextButton.style.opacity = 1;
            nextButton.style.transform = 'translateY(0)';
            nextButton.style.transition = 'all 0.3s ease';
        }, 300);
    }
    
    // Generate summary for the session
    function generateSummary() {
        // Calculate success rate
        const total = score + mistakes;
        const successRate = total > 0 ? Math.round((score / total) * 100) : 0;
        
        // Update summary modal
        summaryDifficulty.textContent = `${difficultyLevel} (${difficultyText.textContent})`;
        summaryCorrect.textContent = score;
        summaryMistakes.textContent = mistakes;
        summaryRate.textContent = successRate;
        
        // Clear previous log entries
        answerLogContainer.innerHTML = '';
        
        // Add log entries
        answerLog.forEach((entry, index) => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${entry.isCorrect ? 'correct' : 'incorrect'}`;
            
            logEntry.innerHTML = `
                <div><strong>Question ${index + 1}:</strong></div>
                <div><strong>Arabic:</strong> ${entry.arabic}</div>
                <div><strong>Correct English:</strong> ${entry.english}</div>
                <div><strong>Your Answer:</strong> ${entry.userAnswer}</div>
                <div><strong>Result:</strong> ${entry.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}</div>
            `;
            
            answerLogContainer.appendChild(logEntry);
        });
        
        // Generate copy text
        let copyContent = `Arabic-English Matching Game Session Summary\n`;
        copyContent += `--------------------------------------\n`;
        copyContent += `Difficulty Level: ${difficultyLevel} (${difficultyText.textContent})\n`;
        copyContent += `Total Correct Answers: ${score}\n`;
        copyContent += `Total Mistakes: ${mistakes}\n`;
        copyContent += `Success Rate: ${successRate}%\n\n`;
        copyContent += `Answer Log:\n`;
        
        answerLog.forEach((entry, index) => {
            copyContent += `\nQuestion ${index + 1}:\n`;
            copyContent += `Arabic: ${entry.arabic}\n`;
            copyContent += `Correct English: ${entry.english}\n`;
            copyContent += `Your Answer: ${entry.userAnswer}\n`;
            copyContent += `Result: ${entry.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}\n`;
        });
        
        copyText.value = copyContent;
        
        // Show the modal
        summaryModal.style.display = 'block';
    }
    
    // Download session results as a text file
    function downloadResults() {
        const content = copyText.value;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'arabic-english-game-results.txt';
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    // Reset the game for a new session
    function resetGame() {
        score = 0;
        mistakes = 0;
        answerLog = [];
        
        scoreDisplay.textContent = score;
        mistakesDisplay.textContent = mistakes;
        
        summaryModal.style.display = 'none';
        gameScreen.style.display = 'none';
        startModal.style.display = 'block';
    }

    // Event Listeners

    // Show the modal when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        startModal.style.display = 'block'; // Show the modal

        // Handle Sentence Matching Game selection
        sentenceGameButton.addEventListener('click', () => {
            startModal.style.display = 'none'; // Hide the modal
            isWordGame = false;
            loadAraFile(); // Load ara.txt
        });

        // Handle Word Matching Game selection
        wordGameButton.addEventListener('click', () => {
            startModal.style.display = 'none'; // Hide the modal
            isWordGame = true;
            loadFSTUFile(); // Load FSTU.csv
        });
    });

    difficultySlider.addEventListener('input', updateDifficultyText);
    
    // Start button actions
    startButton.addEventListener('click', () => {
        difficultyLevel = parseInt(difficultySlider.value);
        
        // Create the level indexes if not already done
        if (levelIndexes.length === 0) {
            createDifficultyLevelIndexes();
        }
        
        // Set up the current level's questions
        currentLevelQuestions = levelIndexes[difficultyLevel - 1]; // Arrays are 0-indexed
        currentQuestionIndex = 0;
        
        // Set the current position to the first question in this level
        if (currentLevelQuestions.length > 0) {
            currentPosition = currentLevelQuestions[currentQuestionIndex];
        } else {
            console.error("No questions available for this level");
            return;
        }
        
        setupScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        
        setupQuestion();
        if (typeof responsiveVoice !== "undefined") {
            responsiveVoice.speak("Hello", "Arabic Male");
        } else {
            console.error("ResponsiveVoice library failed to load.");
        }
    });
    
    // Next button logic
    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        
        // Check if we've gone through all questions in the current level
        if (currentQuestionIndex >= currentLevelQuestions.length) {
            // Move to the next difficulty level
            difficultyLevel = Math.min(difficultyLevel + 1, 10);
            
            // If we're out of levels, end the game
            if (difficultyLevel > 10) {
                generateSummary();
                return;
            }
            
            // Set up the next level's questions
            currentLevelQuestions = levelIndexes[difficultyLevel - 1];
            currentQuestionIndex = 0;
        }
        
        // Set the current position to the next question
        currentPosition = currentLevelQuestions[currentQuestionIndex];
        
        setupQuestion();
    });
    
    doneButton.addEventListener('click', generateSummary);
    
    closeModal.addEventListener('click', () => {
        summaryModal.style.display = 'none';
    });
    
    downloadLogButton.addEventListener('click', downloadResults);
    
    newGameButton.addEventListener('click', resetGame);
    
    // Close the modal if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target === summaryModal) {
            summaryModal.style.display = 'none';
        }
    });

    // Initialize
    updateDifficultyText();