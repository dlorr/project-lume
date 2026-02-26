import apiClient from "../axios";
import type { Board } from "@/types/board.types";

export const boardsApi = {
  getBoard: (projectId: string) =>
    apiClient.get<Board>(`/projects/${projectId}/board`),
};
