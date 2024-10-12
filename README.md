# chess-app
Simple chess game that uses STOCKFISH engine. 

## Setup

1. Download the STOCKFISH engine from [stockfishchess.org](https://stockfishchess.org/download/) and place it in the same directory as the `server.js` file.
2. If you have the binary file in a different directory, update the path in the `.env` file.

## Running the App
To run the app, execute the following commands:
```
pnpm install
pnpm start
```

### Libraries used:
- [chess.js](https://github.com/jhlywa/chess.js) ->  JavaScript library for chess move validation and check/checkmate/draw detection
- [chessboard-js](https://chessboardjs.com/) -> JavaScript chessboard
- [stockfish engine](https://stockfishchess.org/) -> UCI chess engine; Engine is run locally as a child process
- [express](https://expressjs.com/) -> Web framework for Node.js
- [socket.io](https://socket.io/) -> Real-time bidirectional event-based communication
- [ollama](https://ollama.com/) -> host quantized LLM models locally
- [Open WebUI](https://openwebui.com/) -> Web-based user interface for LLM

### Features:
- Play against the computer
- Analysis board with LLM running locally using [ollama](https://ollama.com/) and [Open WebUI](https://openwebui.com/).
 
### How it works:
The client renders the chess board using `chessboardjs`. Each move is validated using `chess.js`. The client sends the move to the server (using socket.io), which then sends the move to the STOCKFISH engine. 
The engine calculates the best move and sends it back to the client (again using socket.io). The client renders the move on the board.

The state of the board is maintained both on the server and the client using `chess.js`.

For game analysis, the current position is extracted from the client in the `PGN` format and sent to the server. 
The server then sends the position to the LLM model running locally using [ollama](https://ollama.com/).
