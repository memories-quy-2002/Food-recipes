export type AuthUser = {
  id: number;
  email: string;
  role?: 'user' | 'admin';
};
