const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const Chess = require('chess.js').Chess;

require('dotenv').config();


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static('public'));

// Use PORT from .env or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Initialize a new chess game
const game = new Chess();

// Path to Stockfish binary or default to current directory
const stockfishPath = process.env.STOCKFISH_PATH || './';

// Spawn Stockfish process
const stockfish = spawn(`${stockfishPath}stockfish`);

stockfish.stdin.write('uci\n');
const THREADS = process.env.STOCKFISH_THREADS || 2;
stockfish.stdin.write(`setoption name Threads value ${THREADS}\n`);

stockfish.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Stockfish: ${output}`);

    const lines = output.split('\n');
    const bestMoveLine = lines.find((line) => line.startsWith('bestmove'));
    if (bestMoveLine) {
        const bestMove = bestMoveLine.split(' ')[1];
        game.move({ from: bestMove.slice(0, 2), to: bestMove.slice(2, 4) });
        console.log('stockfish-move', bestMove, '\n' ,game.ascii());
        io.emit('stockfish-move', bestMove);
    }
});

stockfish.on('error', (err) => {
    console.error('Failed to start Stockfish:', err);
});

stockfish.on('exit', (code, signal) => {
    console.log(`Stockfish exited with code ${code} and signal ${signal}`);
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('move', (move) => {
        console.log('Received move:', move);
        const result = game.move(move);
        console.log(game.ascii());

        if (result) {
            console.log('Valid move:', result.after);
            stockfish.stdin.write(`position fen ${result.after}\n`);
            stockfish.stdin.write('d\n');
            stockfish.stdin.write('go depth 25\n');
        } else {
            console.log('Invalid move:', move);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    stockfish.kill();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
    // exit the node process immediately
    setTimeout(() => {
        console.error('forcefully shutting down');
        process.exit(0);
    }, 100);
});