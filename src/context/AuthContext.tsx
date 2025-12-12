// src/context/AuthContext.tsx
import { createContext, useState, type ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  empresa_id: number;
}

interface ConteoGrupo {
  id: number;
  fecha: string;
  descripcion: string;
  activo: number;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  grupoActivo: ConteoGrupo | null;
  setGrupoActivo: (g: ConteoGrupo | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [grupoActivo, setGrupoActivo] = useState<ConteoGrupo | null>(null);

  const login = async (username: string, password: string) => {    
    const res = await fetch('https://conteosapi.zdevs.uk/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),      
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setGrupoActivo(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin,grupoActivo,
        setGrupoActivo }}>
      {children}
    </AuthContext.Provider>
  );
};