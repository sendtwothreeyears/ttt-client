import { useState, useCallback, useEffect, useRef } from "react";
import { makeMove, resetGame } from "../api";
import { useParams, Link } from "react-router-dom";
import "./index.css";

type Cell = string | null;

function ErrorModal({
  message,
  currentPlayer,
  onClose,
}: {
  message: string;
  currentPlayer: string;
  onClose: () => void;
}) {
  const taunt = message.includes("already occupied")
    ? `YOU FOOL. ${currentPlayer} has already placed a piece here!`
    : message.includes("already won")
      ? "IT'S OVER. The battle has already been decided!"
      : `PATHETIC. ${message}`;

  return (
    <div className="Modal--backdrop" onClick={onClose}>
      <div className="Modal--content Modal--content--error" onClick={(e) => e.stopPropagation()}>
        <div className="Modal--taunt">{taunt}</div>
        <button className="Modal--btn Modal--btn--error" onClick={onClose}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

function VictoryModal({
  winner,
  flawless,
  onClose,
}: {
  winner: string;
  flawless: boolean;
  onClose: () => void;
}) {
  return (
    <div className="Modal--backdrop" onClick={onClose}>
      <div className="Modal--content" onClick={(e) => e.stopPropagation()}>
        {flawless && (
          <div className="Modal--flawless">FLAWLESS VICTORY</div>
        )}
        <div className={`Modal--winner Modal--winner--${winner}`}>
          {winner} WINS
        </div>
        <button className="Modal--btn" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}

function WinLineOverlay({ winLine }: { winLine: number[] }) {
  // Map cell index to center coordinates (percentage-based for a 3x3 grid)
  const cellCenter = (idx: number) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    return {
      x: col * 33.33 + 16.665,
      y: row * 33.33 + 16.665,
    };
  };

  const start = cellCenter(winLine[0]);
  const end = cellCenter(winLine[winLine.length - 1]);

  return (
    <svg className="WinLine--overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <filter id="winLineGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line
        className="WinLine--line"
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function GameView() {
  const { gameId } = useParams();
  const [gameState, setGameState] = useState<Cell[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>("X");
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [modalInfo, setModalInfo] = useState<{ winner: string; flawless: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:3001/api/games/${gameId}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const {
          room: { board, currentPlayer, winLine: wl },
        } = data;
        if (data.type === "gameUpdate") {
          setGameState(board);
          setCurrentPlayer(currentPlayer);
          setWinLine(wl ?? null);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      console.log("WebSocket disconnected");

      if (event.code === 1008) {
        // Game not found
        console.error("Game not found");
      } else {
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };
  }, [gameId]);

  useEffect(() => {
    if (gameId) {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [gameId, connectWebSocket]);

  const onResetGame = async (roomId: string) => {
    const areYouSure = confirm("Are you sure?");

    if (areYouSure) {
      try {
        const response = await resetGame(roomId);
        const { room } = response.data;
        setGameState(room.board);
        setCurrentPlayer(room.currentPlayer);
        setWinLine(null);
        setModalInfo(null);
      } catch (error) {
        console.log("Error in fetching", error);
      }
    }
  };

  const placePiece = async (position: number) => {
    try {
      const updatedBoard = await makeMove(position, gameId!);
      const boardData = updatedBoard.data;
      const { boardState, currentPlayer, won, winLine: wl } = boardData;

      setGameState(boardState);
      setCurrentPlayer(currentPlayer);
      setWinLine(wl ?? null);

      if (won) {
        const winner = currentPlayer === "X" ? "O" : "X";
        const totalMoves = boardState.filter((c: Cell) => c !== null).length;
        const flawless = totalMoves <= 5;
        setModalInfo({ winner, flawless });
      }
    } catch (error) {
      const message = (error as any).response?.data?.error ?? (error as Error).message;
      setErrorMsg(message);
    }
  };

  const generateBoard = (): React.ReactNode[] => {
    return gameState.map((cell: Cell, index: number) => {
      const hasPiece = cell !== null;
      return (
        <div
          className={`App--cell ${hasPiece ? "App--cell--active" : ""}`}
          data-piece={cell ?? undefined}
          key={index}
          onClick={() => placePiece(index)}
        >
          {cell}
        </div>
      );
    });
  };

  if (!gameId) {
    return <div>Loading</div>;
  }

  return (
    <div className="App--container">
      <div>Room ID: {gameId}</div>
      <div className="App--board-container">
        <div className="App--board">
          {generateBoard()}
          {winLine && <WinLineOverlay winLine={winLine} />}
        </div>
        <div className="App--history"></div>
      </div>
      <div className="App--info">
        <div>Hello World! current player: {currentPlayer}</div>
      </div>
      <div className="App--info">
        <button onClick={() => onResetGame(gameId)}>Reset game</button>
      </div>
      <div className="App--info">
        <Link to="/">Return to lobby</Link>
      </div>
      {modalInfo && (
        <VictoryModal
          winner={modalInfo.winner}
          flawless={modalInfo.flawless}
          onClose={() => setModalInfo(null)}
        />
      )}
      {errorMsg && (
        <ErrorModal
          message={errorMsg}
          currentPlayer={currentPlayer}
          onClose={() => setErrorMsg(null)}
        />
      )}
    </div>
  );
}

export default GameView;
