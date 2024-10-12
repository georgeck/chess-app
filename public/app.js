const socket = io();
const board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDrop: onDrop
});

const game = new Chess();

// Handle reset game button
document.getElementById('resetBtn').addEventListener('click', () => {
    game.reset();
    board.position(game.fen());
    updateStatus();

    // Send reset event to server
    socket.emit('reset');
});

function onDrop(source, target) {
    // console.log('onDrop:', source, target);
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to queen for simplicity
    });

    if (move === null)
        return 'snapback';

    // Send the move in the format { from: 'e2', to: 'e4' }
    socket.emit('move', { from: source, to: target, promotion: 'q' });
    updateStatus();
}

socket.on('stockfish-move', (move) => {
    // console.log('stockfish-move',move);
    // move is in format 'c7c5' - convert to { from: 'c7', to: 'c5' }
    move = {
        from: move.slice(0, 2),
        to: move.slice(2, 4)
    };
    game.move(move);
    board.position(game.fen());
    updateStatus();
});

async function analyzeChessPosition(position) {
    const url = 'https://openwebui.local/ollama/api/chat';
    const headers = {
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc4OGI1YWNkLTFiMjktNDJkYy1hYmYxLTY4ZTVjNjY1NGM2YSJ9.tUguBdQkuQon3_Ryp1c5nLVC1-Xl_JQCB0JDNXwLQns',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json'
    };
    const body = JSON.stringify({
        stream: false,
        model: 'llama3.2:latest',
        messages: [
            {
                role: 'user',
                content: `Analyze the following chess position and help me play the best next move: ${position}`
            }
        ]
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


function updateStatus() {
    let status;
    let moveColor = 'White';

    if (game.turn() === 'b') {
        moveColor = 'Black';
    }

    if (game.in_checkmate()) {
        status = `Game over, ${moveColor} is in checkmate.`;
    } else if (game.in_draw()) {
        status = 'Game over, drawn position';
    } else {
        status = `${moveColor} to move`;
        if (game.in_check()) {
            status += `, ${moveColor} is in check`;
        }
    }
    console.log(status);

    const pgn = game.pgn();

    // Format the PGN to show each move on a new line
    function formatPgn(pgn) {
        // Split the PGN into an array of moves
        const moves = pgn.split(/\d+\./).slice(1);
        return moves.map((move, i) => {
            // Add the move number to the start of each move
            return `${i + 1}. ${move}`;
        }).join('\n');
    }

    // Update the `pgn` element with the current game state
    document.getElementById('pgn').textContent = formatPgn(pgn);

}

// create a handler for the analyzeBtn click event
document.getElementById('analyzeBtn').addEventListener('click', () => {
    analyzeChessPosition(game.pgn()).then(data => {
        // update the analysisResult element with the response
        document.getElementById('analysisResult').textContent = data.message.content;
    });
});