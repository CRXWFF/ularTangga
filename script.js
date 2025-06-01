// Inisialisasi papan dan pemain
const boardSize = 100;
const players = [
    { id: 1, position: 1, emoji: '🐶', skipTurn: false },
    { id: 2, position: 1, emoji: '🐱', skipTurn: false }
];
let currentPlayerIndex = 0;
let isMoving = false;

// Daftar tangga, ular, dan kotak pertanyaan
const ladders = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 63: 81, 71: 91 };
const snakes = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79 };
const questionCells = [10, 25, 50, 75];

// Daftar pertanyaan
const questions = [
    {
        text: "2 + 3 = ?",
        options: ["4", "5", "6", "7"],
        answer: "5"
    },
    {
        text: "Ibukota Indonesia adalah?",
        options: ["Jakarta", "Bandung", "Surabaya", "Medan"],
        answer: "Jakarta"
    },
    {
        text: "Hewan yang bernapas dengan insang?",
        options: ["Katak", "Ikan", "Kucing", "Burung"],
        answer: "Ikan"
    },
    {
        text: "Kata yang berlawanan dengan 'besar' adalah?",
        options: ["Kecil", "Panjang", "Tinggi", "Lebar"],
        answer: "Kecil"
    },
    {
        text: "5 × 4 = ?",
        options: ["15", "20", "25", "30"],
        answer: "20"
    },
    {
        text: "Gunung tertinggi di Indonesia?",
        options: ["Rinjani", "Semeru", "Kerinci", "Jaya Wijaya"],
        answer: "Jaya Wijaya"
    },
    {
        text: "Tumbuhan menghasilkan oksigen melalui?",
        options: ["Fotosintesis", "Respirasi", "Transpirasi", "Evaporasi"],
        answer: "Fotosintesis"
    },
    {
        text: "10 - 7 = ?",
        options: ["2", "3", "4", "5"],
        answer: "3"
    },
    {
        text: "Nama planet tempat kita tinggal?",
        options: ["Mars", "Bumi", "Jupiter", "Venus"],
        answer: "Bumi"
    },
    {
        text: "Bahasa resmi negara Indonesia adalah?",
        options: ["Jawa", "Sunda", "Indonesia", "Inggris"],
        answer: "Indonesia"
    }
];

function createBoard() {
    const board = document.getElementById('board');
    for (let i = boardSize; i >= 1; i--) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = `cell-${i}`;
        if (ladders[i]) cell.classList.add('ladder');
        if (Object.values(snakes).includes(i)) cell.classList.add('snake');
        if (questionCells.includes(i)) cell.classList.add('question');
        cell.textContent = i;
        board.appendChild(cell);
    }
    updatePlayerPositions();
}

function rollDice() {
    const result = Math.floor(Math.random() * 6) + 1; // Hanya 1-6
    console.log(`Hasil dadu: ${result}`);
    return result;
}

function showQuestion(player) {
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
                isMoving = false; // Pastikan isMoving diatur ulang
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                startTurn();
            }, 1000);
        });
        questionOptions.appendChild(button);
    });

    popup.classList.remove('hidden');
}

async function animatePlayer(player, startPos, endPos) {
    isMoving = true;
    const playerElement = document.querySelector(`.player[data-player-id="${player.id}"]`);
    const steps = Math.min(endPos - startPos, boardSize - startPos); // Batasi langkah
    const path = [];

    // Buat jalur hanya untuk jumlah langkah yang sesuai
    for (let i = 1; i <= steps && startPos + i <= boardSize; i++) {
        path.push(startPos + i);
    }
    console.log(`Pemain ${player.id} bergerak dari ${startPos} ke ${endPos}, langkah: ${steps}, jalur: ${path}`);

    // Animasi per kotak
    for (const pos of path) {
        player.position = pos;
        const cell = document.getElementById(`cell-${pos}`);
        if (cell) {
            cell.appendChild(playerElement);
            await new Promise(resolve => setTimeout(resolve, 300)); // Durasi per kotak: 300ms
        } else {
            console.error(`Kotak cell-${pos} tidak ditemukan!`);
            isMoving = false;
            return;
        }
    }

    // Cek tangga atau ular setelah animasi
    if (ladders[player.position]) {
        const newPos = ladders[player.position];
        document.getElementById('message').textContent = `Yay! Pemain ${player.id} naik tangga ke ${newPos}!`;
        await new Promise(resolve => setTimeout(resolve, 500)); // Jeda sebelum animasi tangga
        await animatePlayer(player, player.position, newPos);
    } else if (snakes[player.position]) {
        const newPos = snakes[player.position];
        document.getElementById('message').textContent = `Oh tidak! Pemain ${player.id} digigit ular, turun ke ${newPos}!`;
        await new Promise(resolve => setTimeout(resolve, 500)); // Jeda sebelum animasi ular
        await animatePlayer(player, player.position, newPos);
    }

    isMoving = false; // Pastikan isMoving diatur ulang setelah animasi
}

async function movePlayer(player, steps) {
    if (player.skipTurn) {
        document.getElementById('message').textContent = `Pemain ${player.id} kehilangan giliran!`;
        player.skipTurn = false;
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        isMoving = false; // Pastikan isMoving diatur ulang
        startTurn();
        return;
    }

    const startPos = player.position;
    let newPosition = Math.min(player.position + steps, boardSize); // Batasi hingga boardSize
    console.log(`Pemain ${player.id} mulai dari ${startPos}, tujuan ${newPosition}, langkah ${steps}`);

    if (newPosition === startPos) {
        document.getElementById('message').textContent = `Pemain ${player.id} melewati batas!`;
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        isMoving = false; // Pastikan isMoving diatur ulang
        startTurn();
        return;
    }

    await animatePlayer(player, startPos, newPosition);

    // Cek pertanyaan setelah animasi
    if (questionCells.includes(player.position)) {
        document.getElementById('message').textContent = `Pemain ${player.id} dapat pertanyaan!`;
        showQuestion(player);
        return;
    }

    // Cek pemenang
    if (player.position === boardSize) {
        document.getElementById('message').textContent = `Selamat! Pemain ${player.id} menang! 🎉`;
        document.getElementById('roll-dice').disabled = true;
        isMoving = false; // Pastikan isMoving diatur ulang
        return;
    }

    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    startTurn();
}

function updatePlayerPositions() {
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
}

function startTurn() {
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
    document.getElementById('roll-dice').disabled = false; // Pastikan tombol aktif
}

document.getElementById('roll-dice').addEventListener('click', () => {
    if (isMoving) {
        console.log('Tombol dadu diklik tetapi masih bergerak');
        return;
    }
    const currentPlayer = players[currentPlayerIndex];
    const diceResult = rollDice();
    document.getElementById('dice-result').textContent = diceResult;
    movePlayer(currentPlayer, diceResult);
});

// Inisialisasi permainan
createBoard();
startTurn();