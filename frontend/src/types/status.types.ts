export interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  boardId: string;
}

export interface CreateStatusPayload {
  name: string;
  color?: string;
  order: number;
  isDefault?: boolean;
}
