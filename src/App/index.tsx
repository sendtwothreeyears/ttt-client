import { useState, useEffect } from "react";
import { createGame, makeMove } from "../tic-tac-toe";
import "./index.css";

function App() {
  let [gameState, setGameState] = useState<(string | null)[]>([]);
  let [currentPlayer, setCurrentPlayer] = useState<string>("X");

  useEffect(() => {
    resetGame(true);
  }, []);

  const resetGame = async (isBrandNewGame: boolean) => {
    if (!isBrandNewGame) {
      const areYouSure = confirm("Are you sure?");
      if (!areYouSure) {
        return;
      }
    }
    try {
      const response = await createGame();
      const data = response.data;
      const { board, currentPlayer } = data;
      setGameState(board);
      setCurrentPlayer(currentPlayer);
    } catch (error) {
      console.log("Error in fetching", error);
    }
  };

  const placePiece = async (position: number) => {
    try {
      const updatedBoard = await makeMove(position);
      const boardState = updatedBoard.data.boardState;
      const newGameState = boardState.board;
      setGameState(newGameState);
      setCurrentPlayer(boardState.currentPlayer);

      if (boardState.won) {
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

  if (!gameState.length) {
    return <div>Loading</div>;
  }

  return (
    <div className="App--container">
      <div className="App--board-container">
        <div className="App--board">{generateBoard()}</div>
        <div className="App--history">
          {/* <div>Game History Log</div>
          <p>(Player) - (Action) - (Row, Column)</p> */}
        </div>
      </div>
      <div className="App--info">
        <div>Hello World! current player: {currentPlayer}</div>
      </div>
      <div className="App--info">
        <button onClick={() => resetGame(false)}>Reset game</button>
      </div>
    </div>
  );
}

export default App;
