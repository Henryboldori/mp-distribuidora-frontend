import { createContext, useContext, useState, ReactNode } from 'react';

interface Usuario {
  id: number;
  nome: string;
  role: 'ADMIN' | 'VENDEDOR';
}

interface AuthContextType {
  usuario: Usuario | null;
  logar: (usuario: Usuario, token: string) => void;
  deslogar: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    // Tenta recuperar o login salvo, para a pessoa nao precisar logar de novo toda hora
    const salvo = localStorage.getItem('usuario');
    return salvo ? JSON.parse(salvo) : null;
  });

  function logar(novoUsuario: Usuario, token: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(novoUsuario));
    setUsuario(novoUsuario);
  }

  function deslogar() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, logar, deslogar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um AuthProvider');
  return ctx;
}
