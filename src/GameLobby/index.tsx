import { useState, useEffect, useRef } from "react";
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
  winLine: number[] | null;
};

const SPHERE_RADIUS = 380;
const FRICTION = 0.97;
const KEY_ACCELERATION = 0.35;
const MAX_VELOCITY = 6;

function GameLobby() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const globeRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const animFrameRef = useRef(0);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const lastPointerX = useRef(0);

  const fetchGames = async () => {
    try {
      const response = await getGames();
      setRooms(response.data);
    } catch (error) {
      console.error("Failed to fetch games:", error);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Animation loop with inertia physics
  useEffect(() => {
    const animate = () => {
      const keys = keysRef.current;
      if (keys.left) {
        velocityRef.current = Math.max(
          velocityRef.current - KEY_ACCELERATION,
          -MAX_VELOCITY,
        );
      }
      if (keys.right) {
        velocityRef.current = Math.min(
          velocityRef.current + KEY_ACCELERATION,
          MAX_VELOCITY,
        );
      }

      velocityRef.current *= FRICTION;
      if (Math.abs(velocityRef.current) < 0.01) velocityRef.current = 0;

      rotationRef.current += velocityRef.current;

      const globe = globeRef.current;
      if (globe) {
        globe.style.transform = `rotateY(${rotationRef.current}deg)`;

        const cards = globe.querySelectorAll(
          "[data-angle]",
        ) as NodeListOf<HTMLElement>;
        cards.forEach((card) => {
          const angle = parseFloat(card.dataset.angle || "0");
          const effective = (((rotationRef.current + angle) % 360) + 360) % 360;
          const rad = (effective * Math.PI) / 180;
          const z = Math.cos(rad);
          card.style.opacity = String(Math.max(0, z));
          card.style.pointerEvents = z > 0.2 ? "auto" : "none";
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        keysRef.current.left = true;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        keysRef.current.right = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "ArrowRight") keysRef.current.right = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Pointer drag handlers for mouse/touch rotation
  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    hasDragged.current = false;
    lastPointerX.current = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPointerX.current;
    lastPointerX.current = e.clientX;
    if (Math.abs(dx) > 2) hasDragged.current = true;
    velocityRef.current += dx * 0.15;
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  // Prevent accidental navigation after dragging the sphere
  const onClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const createNewGame = async () => {
    setLoading(true);
    try {
      const response = await createGame();
      if (response) {
        const { roomId } = response.data;
        navigate(`/games/${roomId}`);
      }
    } catch (error) {
      console.log("Error in creating room", error);
    } finally {
      setLoading(false);
    }
  };

  const onDeleteGame = async (gameId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this game?")) {
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
    if (moveCount === 0) return "New Game";
    return `${game.currentPlayer}'s turn`;
  };

  const getGameProgress = (game: RoomSummary): string => {
    const totalMoves = game.board.filter((cell) => cell !== null).length;
    return `${totalMoves}/9 moves`;
  };

  const generateBoard = (board: Cell[]): React.ReactNode[] => {
    return board.map((cell, index) => {
      const hasPiece = cell !== null;
      return (
        <div
          className={`cell ${hasPiece ? "cell--active" : ""}`}
          data-piece={cell ?? undefined}
          key={index}
        >
          {cell}
        </div>
      );
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const angleStep = rooms.length > 0 ? 360 / rooms.length : 0;
  const ringSize = SPHERE_RADIUS * 2;
  const ringOffset = -SPHERE_RADIUS;

  return (
    <div className="Lobby">
      <h1 className="Lobby--header">Tic Tac Toe Lobby</h1>

      <button onClick={createNewGame} disabled={loading} className="Lobby--btn">
        {loading ? "Creating..." : "New Game"}
      </button>

      <div
        className="Sphere--viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {/* Ambient sphere glow */}
        <div className="Sphere--ambient" />

        {/* 3D Globe */}
        <div ref={globeRef} className="Sphere--globe">
          {/* Wireframe longitude rings */}
          {[0, 45, 90, 135].map((angle) => (
            <div
              key={`ring-${angle}`}
              className="Sphere--ring"
              style={{
                width: ringSize,
                height: ringSize,
                left: ringOffset,
                top: ringOffset,
                transform: `rotateY(${angle}deg)`,
              }}
            />
          ))}
          {/* Equator ring */}
          <div
            className="Sphere--ring Sphere--ring--equator"
            style={{
              width: ringSize,
              height: ringSize,
              left: ringOffset,
              top: ringOffset,
            }}
          />

          {/* Room cards */}
          {rooms.map((room, i) => {
            const cardAngle = i * angleStep;
            return (
              <div
                key={room.room}
                className="Sphere--card"
                data-angle={cardAngle}
                style={{
                  transform: `rotateY(${cardAngle}deg) translateZ(${SPHERE_RADIUS}px)`,
                }}
              >
                <Link to={`/games/${room.room}`} className="Room--link">
                  <div className="Sphere--card-inner">
                    <div className="Sphere--card-id">
                      {room.room.slice(0, 8)}
                    </div>
                    <div className="Sphere--card-status">
                      {getGameStatus(room)}
                    </div>
                    <div className="Sphere--card-progress">
                      {getGameProgress(room)}
                    </div>
                    <div className="Sphere--card-board">
                      <div className="board Lobby--board">
                        {generateBoard(room.board)}
                      </div>
                    </div>
                    <button
                      className="Lobby--btn--danger"
                      onClick={(e) => onDeleteGame(room.room, e)}
                    >
                      Delete
                    </button>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {rooms.length === 0 && (
          <div className="Sphere--empty">No games yet — create one!</div>
        )}
      </div>

      <div className="Lobby--hint">← → to rotate</div>

      <button onClick={fetchGames} className="Lobby--btn--secondary">
        Refresh Games
      </button>
    </div>
  );
}

export default GameLobby;
