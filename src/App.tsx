import { Routes, Route } from "react-router-dom";
import GameLobby from "./GameLobby";
import GameView from "./GameView";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GameLobby />} />
      <Route path="/games/:gameId" element={<GameView />} />
    </Routes>
  );
}
