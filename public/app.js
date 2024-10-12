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
}