import { useState, useEffect } from "react";
import { createGame, makeMove, getGame, resetGame } from "../tic-tac-toe";
import { useParams } from "react-router-dom";
import "./index.css";

interface GameViewProps {
  gameId: string;
  onBackToLobby: () => void;
}

function GameView() {
  const { gameId } = useParams();
  let [gameState, setGameState] = useState<(string | null)[]>([]);
  let [currentPlayer, setCurrentPlayer] = useState<string>("X");

  useEffect(() => {
    if (gameId) {
      onGetGame(gameId);
    }
  }, [gameId]);

  const onGetGame = async (gameId: string) => {
    try {
      const response = await getGame(gameId);
      const {
        room: { board },
      } = response.data;

      setGameState(board);
    } catch (error) {
      console.log("Error in getting game:", gameId);
    }
  };

  const onResetGame = async (roomId: string) => {
    const areYouSure = confirm("Are you sure?");

    if (areYouSure) {
      try {
        const response = await resetGame(roomId);
        const { room } = response.data;
        setGameState(room.board);
        setCurrentPlayer(room.currentPlayer);
      } catch (error) {
        console.log("Error in fetching", error);
      }
    }
  };

  const placePiece = async (position: number) => {
    try {
      const updatedBoard = await makeMove(position, gameId);
      const boardData = updatedBoard.data;
      const { boardState, currentPlayer, won } = boardData;

      setGameState(boardState);
      setCurrentPlayer(currentPlayer);

      console.log("won", won);

      if (won) {
        const winner = boardState.currentPlayer === "X" ? "O" : "X";
        alert(`The winner is: ${winner}`);
      }
    } catch (error) {
      alert(`There is an error: ${error.response.data.error}`);
    }
  };

  const generateBoard = () => {
    return gameState.map((cell, index) => {
      const hasPiece = gameState[index] !== null;
      return (
        <div
          className={`App--cell ${hasPiece && "App--cell--active"}`}
          key={index}
          onClick={() => placePiece(index)}
        >
          {gameState[index]}
        </div>
      );
    });
  };

  if (!gameId) {
    return <div>Loading</div>;
  }

  return (
    <div className="App--container">
      <div className="App--board-container">
        <div className="App--board">{generateBoard()}</div>
        <div className="App--history"></div>
      </div>
      <div className="App--info">
        <div>Hello World! current player: {currentPlayer}</div>
      </div>
      <div className="App--info">
        <button onClick={() => onResetGame(gameId)}>Reset game</button>
      </div>
    </div>
  );
}

export default GameView;
