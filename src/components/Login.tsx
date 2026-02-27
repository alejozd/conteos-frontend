// src/components/Login.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoginError(false);
    setLoading(true);
    if (!username.trim() || !password) {
      toast.current?.show({
        severity: "warn",
        summary: "Faltan datos",
        detail: "Ingresa usuario y contraseña",
      });
      setLoading(false);
      return;
    }

    try {
      await login(username, password);
      toast.current?.show({
        severity: "success",
        summary: "¡Bienvenido!",
        detail: `Hola ${username}`,
      });
      setTimeout(() => navigate("/post-login"), 500);
    } catch (err) {
      setLoginError(true);
      if (
        err instanceof Error &&
        err.message.includes("401")
      ) {
        toast.current?.show({
          severity: "error",
          summary: "Error de autenticación",
          detail: "Usuario o contraseña incorrectos",
        });
      } else if (
        err instanceof Error &&
        err.message.includes("403")
      ) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Usuario inactivo. Contacte al administrador.",
        });
      } else {
        console.error(err);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: (err as Error).message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex align-items-center justify-content-center p-4"
      style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', fontFamily: 'Inter, sans-serif' }}
    >
      <Toast ref={toast} position="top-center" />

      <div className="w-full animate-fade-in-up" style={{ maxWidth: '450px' }}>
        <Card
          className="shadow-8 border-round-2xl"
          style={{ backgroundColor: '#27273d', color: '#f0f0f0', border: 'none', padding: '1.5rem' }}
        >
          <div className="text-center mb-5">
            <i className="pi pi-box text-blue-500 mb-3" style={{ fontSize: '5rem' }} />
            <h1 className="text-4xl font-bold text-white mb-2">Conteo de Inventario</h1>
            <p className="text-gray-400 text-lg">Portal de acceso</p>
          </div>

          <div className="flex flex-column gap-4">
            <div className="flex flex-column gap-2">
              <label className="text-sm font-medium text-gray-400">Usuario</label>
              <InputText
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-inputtext-lg"
                style={{ backgroundColor: '#383856', color: 'white', borderColor: '#4a4a6e' }}
                placeholder="Tu usuario"
              />
            </div>

            <div className="flex flex-column gap-2" style={{ position: 'relative' }}>
              <label className="text-sm font-medium text-gray-400">Contraseña</label>
              <InputText
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-inputtext-lg ${loginError ? "p-invalid" : ""}`}
                style={{ backgroundColor: '#383856', color: 'white', borderColor: '#4a4a6e' }}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <i
                className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"}`}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '2.8rem',
                  cursor: 'pointer',
                  color: '#bbb',
                  fontSize: '1.2rem'
                }}
              />
            </div>

            <Button
              label="Iniciar sesión"
              icon="pi pi-sign-in"
              onClick={handleLogin}
              className="w-full p-3 text-xl font-bold mt-2"
              disabled={loading}
              loading={loading}
            />
          </div>

          <div className="text-center text-gray-500 text-sm mt-5">
            alejodev © 2025 • v1.1
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        .p-card-body { padding: 1.5rem !important; }
      `}</style>
    </div>
  );
}
