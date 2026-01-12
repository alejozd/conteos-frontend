// src/context/AuthContext.tsx
import { createContext, useState, type ReactNode } from "react";
import api from "../services/api";

interface User {
  id: number;
  username: string;
  role: "admin" | "user";
  empresa_id: number;
  empresa_nombre: string;
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
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")!)
      : null
  );

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [grupoActivo, setGrupoActivo] = useState<ConteoGrupo | null>(null);

  const login = async (username: string, password: string) => {
    const res = await api.post("/api/auth/login", {
      username,
      password,
    });

    const data = res.data;

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setGrupoActivo(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAdmin,
        grupoActivo,
        setGrupoActivo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
