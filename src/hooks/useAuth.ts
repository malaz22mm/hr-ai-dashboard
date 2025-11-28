import { create } from 'zustand'

type User = {
  name: string;
  role: string;
}

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: { user: User; token: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { name: 'Amelia Carter', role: 'HR Director' },
  token: 'demo-token',
  isAuthenticated: true,
  login: ({ user, token }) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}))


