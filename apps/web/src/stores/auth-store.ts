import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/lib/types";

// Estado global de autenticação. Qualquer componente lê com
//   const user = useAuthStore((s) => s.user)
// e só re-renderiza quando AQUELE pedaço muda (o "seletor" entre parênteses).
interface AuthState {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  // persist: grava o estado no localStorage do navegador e o recarrega ao abrir o site,
  // para o usuário continuar logado depois de um F5.
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "flowmind-auth", // chave no localStorage
      storage: createJSONStorage(() => localStorage),
      // Guarda só os dados; as funções são recriadas pelo create().
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
