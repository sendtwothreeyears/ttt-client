import { useState, useEffect } from "react";
import { createGame, getGames, deleteGame } from "../api";
import { useNavigate, Link } from "react-router-dom";
import "./index.css";
import "../globals.css";

type Cell = string | null;

type RoomSummary = {
  room: string;
  board: Cell[];
  currentPlayer: string;
  won: boolean;
};

function GameLobby() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchGames = async () => {
    try {
      const response = await getGames();
      const rooms = response.data;
      setRooms(rooms);
    } catch (error) {
      console.error("Failed to fetch games:", error);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const createNewGame = async () => {
    setLoading(true);

    try {
      const response = await createGame();
      if (response) {
        const { roomId } = response.data;
        navigate(`/games/${roomId}`);
      } else {
        console.error("Failed to create game");
      }
    } catch (error) {
      console.log("Error in creating room", error);
    } finally {
      setLoading(false);
    }
  };

  const onDeleteGame = async (gameId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const areYouSure = confirm("Are you sure you want to delete this game?");
    if (areYouSure) {
      try {
        await deleteGame(gameId);
        await fetchGames();
      } catch (error) {
        console.error("Failed to delete game:", error);
      }
    }
  };

  const getGameStatus = (game: RoomSummary): string => {
    if (game.won) {
      const winner = game.currentPlayer === "X" ? "O" : "X";
      return `Winner: ${winner}`;
    }
    const moveCount = game.board.filter((cell) => cell !== null).length;
    if (moveCount === 0) {
      return "New Game";
    }
    return `In Progress (${game.currentPlayer}'s turn)`;
  };

  const getGameProgress = (game: RoomSummary): string => {
    const totalMoves = game.board.filter((cell) => cell !== null).length;
    return `${totalMoves}/9 moves`;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const generateBoard = (board: Cell[]): React.ReactNode[] => {
    return board.map((cell: Cell, index: number) => {
      const hasPiece = board[index] !== null;
      return (
        <div className={`cell ${hasPiece && "cell--active"}`} key={index}>
          {board[index]}
        </div>
      );
    });
  };

  const generateRooms = (): React.ReactNode[] => {
    return rooms.map((room) => {
      return (
        <Link to={`/games/${room.room}`} key={room.room} className="Room--link">
          <div key={room.room} className="Room--overview">
            <div>Room ID: {room.room}</div>
            <div>{getGameStatus(room)}</div>
            <div>{getGameProgress(room)}</div>
            <button onClick={(e) => onDeleteGame(room.room, e)}>Delete</button>
            <div className="container Room--container">
              <div className="board-container">
                <div className="board">{generateBoard(room.board)}</div>
              </div>
            </div>
          </div>
        </Link>
      );
    });
  };
  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>Tic Tac Toe Lobby</h1>

      <button
        onClick={createNewGame}
        disabled={loading}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "30px",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Creating..." : "New Game"}
      </button>

      <div>{generateRooms()}</div>

      <button
        onClick={fetchGames}
        style={{
          padding: "10px 20px",
          fontSize: "14px",
          backgroundColor: "#f0f0f0",
          border: "1px solid #ddd",
          borderRadius: "5px",
          cursor: "pointer",
          marginTop: "30px",
        }}
      >
        Refresh Games
      </button>
    </div>
  );
}

export default GameLobby;
