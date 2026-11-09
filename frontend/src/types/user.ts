export interface User {
  id: number;
  username: string;
  email: string;
}


export interface AuthCredentials {
  username?: string;
  email?: string;
  password: string;
}