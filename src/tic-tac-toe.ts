import axios, { type AxiosResponse } from "axios";
const baseUrl = `http://localhost:3001/api`;

export async function createGame(): Promise<AxiosResponse<any>> {
  return axios.post(`${baseUrl}/create`);
}

export function makeMove(position: number): Promise<AxiosResponse<any>> {
  return axios.post(`${baseUrl}/makeMove`, {
    position,
  });
}
