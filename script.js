// Inisialisasi papan dan pemain
const boardSize = 100;
const players = [
    { id: 1, position: 1, emoji: '🐶', skipTurn: false },
    { id: 2, position: 1, emoji: '🐱', skipTurn: false }
];
let currentPlayerIndex = 0;
let isMoving = false;
let ladders = {};
let snakes = {};
let questionCells = [];
let questions = [];

function generateBoardElements(numQuestionCells) {
    ladders = {};
    snakes = {};
    questionCells = [];

    // Daftar kotak yang tersedia (2-100, kecuali kotak 1)
    let availableCells = Array.from({ length: boardSize - 1 }, (_, i) => i + 2);
    const usedCells = new Set();

    // Generate 7 tangga
    for (let i = 0; i < 7; i++) {
        if (availableCells.length < 2) break;
        const startIndex = Math.floor(Math.random() * availableCells.length);
        const start = availableCells[startIndex];
        availableCells.splice(startIndex, 1);
        usedCells.add(start);

        const possibleDestinations = availableCells.filter(cell => cell > start);
        if (possibleDestinations.length === 0) continue;
        const endIndex = Math.floor(Math.random() * possibleDestinations.length);
        const end = possibleDestinations[endIndex];
        availableCells = availableCells.filter(cell => cell !== end);
        usedCells.add(end);

        ladders[start] = end;
    }

    // Generate 10 ular
    for (let i = 0; i < 10; i++) {
        if (availableCells.length < 2) break;
        const startIndex = Math.floor(Math.random() * availableCells.length);
        const start = availableCells[startIndex];
        availableCells.splice(startIndex, 1);
        usedCells.add(start);

        const possibleDestinations = availableCells.filter(cell => cell < start && cell >= 2);
        if (possibleDestinations.length === 0) continue;
        const endIndex = Math.floor(Math.random() * possibleDestinations.length);
        const end = possibleDestinations[endIndex];
        availableCells = availableCells.filter(cell => cell !== end);
        usedCells.add(end);

        snakes[start] = end;
    }

    // Generate kotak pertanyaan sesuai input pengguna
    const maxQuestions = Math.min(numQuestionCells, availableCells.length);
    for (let i = 0; i < maxQuestions; i++) {
        if (availableCells.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableCells.length);
        questionCells.push(availableCells[randomIndex]);
        usedCells.add(availableCells[randomIndex]);
        availableCells.splice(randomIndex, 1);
    }

    console.log(`Tangga: ${JSON.stringify(ladders)}`);
    console.log(`Ular: ${JSON.stringify(snakes)}`);
    console.log(`Kotak pertanyaan: ${questionCells}`);
}

function createBoard(numQuestionCells) {
    generateBoardElements(numQuestionCells);
    const board = document.getElementById('board');
    board.innerHTML = ''; // Bersihkan papan
    for (let i = boardSize; i >= 1; i--) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = `cell-${i}`;
        if (ladders[i]) cell.classList.add('ladder');
        if (snakes[i]) cell.classList.add('snake'); // Tandai kotak asal ular
        if (questionCells.includes(i)) cell.classList.add('question');
        cell.textContent = i;
        board.appendChild(cell);
    }
    updatePlayerPositions();
}

function rollDice() {
    const result = Math.floor(Math.random() * 6) + 1;
    console.log(`Hasil dadu: ${result}`);
    return result;
}

function showQuestion(player) {
    try {
        const popup = document.getElementById('question-popup');
        const questionText = document.getElementById('question-text');
        const questionOptions = document.getElementById('question-options');
        const questionFeedback = document.getElementById('question-feedback');

        const question = questions[Math.floor(Math.random() * questions.length)];
        questionText.textContent = question.text;
        questionOptions.innerHTML = '';
        questionFeedback.textContent = '';

        question.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.addEventListener('click', () => {
                if (option === question.answer) {
                    questionFeedback.textContent = 'Benar! Lanjutkan giliran berikutnya.';
                    questionFeedback.style.color = '#008000';
                } else {
                    questionFeedback.textContent = 'Salah! Kamu kehilangan giliran.';
                    questionFeedback.style.color = '#ff0000';
                    player.skipTurn = true;
                }
                setTimeout(() => {
                    popup.classList.add('hidden');
                    isMoving = false;
                    console.log('Pop-up pertanyaan ditutup, isMoving diatur ke false');
                    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                    startTurn();
                }, 1000);
            });
            questionOptions.appendChild(button);
        });

        popup.classList.remove('hidden');
    } catch (error) {
        console.error('Error di showQuestion:', error);
        isMoving = false;
        startTurn();
    }
}

async function animatePlayer(player, startPos, endPos) {
    try {
        console.log(`Memulai animasi pemain ${player.id} dari ${startPos} ke ${endPos}`);
        isMoving = true;

        // Validasi posisi
        if (endPos < 1 || endPos > boardSize) {
            console.error(`Posisi tujuan ${endPos} tidak valid!`);
            isMoving = false;
            return;
        }

        // Tentukan jalur animasi
        const path = [];
        if (endPos >= startPos) {
            // Pergerakan maju
            for (let i = startPos + 1; i <= endPos; i++) {
                path.push(i);
            }
        } else {
            // Pergerakan mundur (ular)
            for (let i = startPos - 1; i >= endPos; i--) {
                path.push(i);
            }
        }
        console.log(`Jalur animasi pemain ${player.id}: ${path}`);

        // Animasi per kotak
        for (const pos of path) {
            const cell = document.getElementById(`cell-${pos}`);
            if (!cell) {
                console.error(`Kotak cell-${pos} tidak ditemukan!`);
                isMoving = false;
                return;
            }
            player.position = pos;
            updatePlayerPositions();
            console.log(`Pemain ${player.id} bergerak ke posisi ${pos}`);
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Pastikan posisi akhir
        player.position = endPos;
        updatePlayerPositions();

        // Cek tangga atau ular
        if (ladders[player.position]) {
            const newPos = ladders[player.position];
            document.getElementById('message').textContent = `Yay! Pemain ${player.id} naik tangga ke ${newPos}!`;
            console.log(`Pemain ${player.id} naik tangga ke ${newPos}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            await animatePlayer(player, player.position, newPos);
        } else if (snakes[player.position]) {
            const newPos = snakes[player.position];
            document.getElementById('message').textContent = `Oh tidak! Pemain ${player.id} digigit ular, turun ke ${newPos}!`;
            console.log(`Pemain ${player.id} digigit ular, turun ke ${newPos}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            await animatePlayer(player, player.position, newPos);
        }

        isMoving = false;
        console.log(`Animasi selesai untuk pemain ${player.id}, isMoving diatur ke false`);
    } catch (error) {
        console.error('Error di animatePlayer:', error);
        isMoving = false;
        updatePlayerPositions();
        startTurn();
    }
}

async function movePlayer(player, steps) {
    try {
        if (player.skipTurn) {
            document.getElementById('message').textContent = `Pemain ${player.id} kehilangan giliran!`;
            player.skipTurn = false;
            currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            isMoving = false;
            console.log('Pemain kehilangan giliran, isMoving diatur ke false');
            startTurn();
            return;
        }

        const startPos = player.position;
        let newPosition = Math.min(player.position + steps, boardSize);
        console.log(`Pemain ${player.id} mulai dari ${startPos}, tujuan ${newPosition}, langkah: ${steps}`);

        if (newPosition === startPos) {
            document.getElementById('message').textContent = `Pemain ${player.id} melewati batas!`;
            currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            isMoving = false;
            console.log('Melewati batas, isMoving diatur ke false');
            startTurn();
            return;
        }

        await animatePlayer(player, startPos, newPosition);

        if (questionCells.includes(player.position)) {
            document.getElementById('message').textContent = `Pemain ${player.id} dapat pertanyaan!`;
            console.log(`Pemain ${player.id} mendarat di kotak pertanyaan ${player.position}`);
            showQuestion(player);
            return;
        }

        if (player.position === boardSize) {
            document.getElementById('message').textContent = `Selamat! Pemain ${player.id} menang! 🎉`;
            document.getElementById('roll-dice').disabled = true;
            isMoving = false;
            console.log('Pemain menang, isMoving diatur ke false');
            return;
        }

        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        startTurn();
    } catch (error) {
        console.error('Error di movePlayer:', error);
        isMoving = false;
        startTurn();
    }
}

function updatePlayerPositions() {
    try {
        document.querySelectorAll('.player').forEach(el => el.remove());
        players.forEach(player => {
            const cell = document.getElementById(`cell-${player.position}`);
            if (cell) {
                const playerElement = document.createElement('span');
                playerElement.classList.add('player');
                playerElement.setAttribute('data-player-id', player.id);
                playerElement.textContent = player.emoji;
                cell.appendChild(playerElement);
            } else {
                console.error(`Kotak cell-${player.position} tidak ditemukan untuk pemain ${player.id}`);
            }
        });
    } catch (error) {
        console.error('Error di updatePlayerPositions:', error);
    }
}

function startTurn() {
    try {
        if (isMoving) {
            console.log('Masih bergerak, menunggu animasi selesai');
            return;
        }
        const currentPlayer = players[currentPlayerIndex];
        document.getElementById('current-player').textContent = `Pemain ${currentPlayer.id} ${currentPlayer.emoji}`;
        document.getElementById('dice-result').textContent = '-';
        if (!document.getElementById('message').textContent.includes('Pertanyaan')) {
            document.getElementById('message').textContent = '';
        }
        document.getElementById('roll-dice').disabled = false;
        console.log(`Giliran pemain ${currentPlayer.id}, tombol dadu diaktifkan`);
    } catch (error) {
        console.error('Error di startTurn:', error);
    }
}

// Setup formulir pertanyaan
document.getElementById('add-question').addEventListener('click', () => {
    try {
        const questionInputs = document.getElementById('question-inputs');
        const newInput = document.createElement('div');
        newInput.classList.add('question-input');
        newInput.innerHTML = `
            <label>Pertanyaan:</label>
            <input type="text" class="question-text" placeholder="Masukkan pertanyaan" required>
            <label>Opsi (pisahkan dengan koma):</label>
            <input type="text" class="question-options" placeholder="Opsi 1,Opsi 2,Opsi 3,Opsi 4" required>
            <label>Jawaban Benar:</label>
            <input type="text" class="question-answer" placeholder="Jawaban benar" required>
        `;
        questionInputs.appendChild(newInput);
    } catch (error) {
        console.error('Error di add-question:', error);
    }
});

document.getElementById('start-game').addEventListener('click', () => {
    try {
        const questionInputs = document.querySelectorAll('.question-input');
        const questionCount = parseInt(document.getElementById('question-count').value);
        const errorDiv = document.getElementById('setup-error');
        questions = [];

        // Validasi input
        if (questionCount < 1 || questionCount > 10 || isNaN(questionCount)) {
            errorDiv.textContent = 'Jumlah kotak pertanyaan harus antara 1 dan 10!';
            return;
        }

        let valid = true;
        questionInputs.forEach(input => {
            const text = input.querySelector('.question-text').value.trim();
            const options = input.querySelector('.question-options').value.split(',').map(opt => opt.trim());
            const answer = input.querySelector('.question-answer').value.trim();

            if (!text || options.length < 2 || !answer || !options.includes(answer)) {
                valid = false;
            } else {
                questions.push({ text, options, answer });
            }
        });

        if (!valid || questions.length === 0) {
            errorDiv.textContent = 'Masukkan setidaknya satu pertanyaan valid dengan opsi dan jawaban benar!';
            return;
        }

        // Sembunyikan setup dan tampilkan permainan
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        // Mulai permainan
        createBoard(questionCount);
        startTurn();
    } catch (error) {
        console.error('Error di start-game:', error);
    }
});

document.getElementById('roll-dice').addEventListener('click', () => {
    try {
        if (isMoving) {
            console.log('Tombol dadu diklik tetapi masih bergerak');
            return;
        }
        const currentPlayer = players[currentPlayerIndex];
        const diceResult = rollDice();
        document.getElementById('dice-result').textContent = diceResult;
        movePlayer(currentPlayer, diceResult);
    } catch (error) {
        console.error('Error di roll-dice:', error);
        isMoving = false;
        startTurn();
    }
});