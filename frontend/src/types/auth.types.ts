export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
