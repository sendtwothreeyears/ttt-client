import axios, { type AxiosResponse } from "axios";
const baseUrl = `http://localhost:3001/api`;

export async function createGame(): Promise<AxiosResponse<any>> {
  return axios.post(`${baseUrl}/create`);
}

export async function resetGame(gameId: string): Promise<AxiosResponse<any>> {
  return axios.post(`${baseUrl}/reset`, { gameId });
}

export function makeMove(
  position: number,
  gameId: string,
): Promise<AxiosResponse<any>> {
  return axios.post(`${baseUrl}/makeMove/${gameId}`, {
    position,
  });
}
export function getGame(gameId: string): Promise<AxiosResponse<any>> {
  return axios.get(`${baseUrl}/games/${gameId}`);
}

export function getGames(): Promise<AxiosResponse<any>> {
  return axios.get(`${baseUrl}/games`);
}

export function deleteGame(gameId: string): Promise<AxiosResponse<any>> {
  return axios.delete(`${baseUrl}/games/${gameId}`);
}
