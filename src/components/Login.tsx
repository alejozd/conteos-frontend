// src/components/Login.tsx
import { useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useAuth } from '../hooks/useAuth';
import '../styles/Login.css'; 

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      toast.current?.show({ severity: 'warn', summary: 'Faltan datos', detail: 'Ingresa usuario y contraseña' });
      setLoading(false);
      return;
    }

    try {
      await login(username, password);
      toast.current?.show({ severity: 'success', summary: '¡Bienvenido!', detail: `Hola ${username}` });
      setTimeout(() => navigate("/post-login"), 500);
    } catch (err) {
      setLoginError(true);
      if (err instanceof Error && err.message === 'Request failed with status code 401') {
        toast.current?.show({ severity: 'error', summary: 'Error de autenticación', detail: 'Usuario o contraseña incorrectos' });
      } else {
        console.error(err);
        toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message });
      }          
    } finally {
    setLoading(false);
  }
  };

  return (
    <>
      <Toast ref={toast} position="top-center" />      

      {/* Usamos 'login-container' para el centrado y el fondo */}
      <div className="login-container">
        <div className="login-wrapper">
          {/* Usamos 'login-card' para el estilo y el padding/margin */}
          <Card className="login-card shadow-2xl rounded-2xl animate-fade-up">
            <div className="login-header">
              <i className="pi pi-box text-7xl mb-6" />
              <h1 className="text-4xl font-bold">Conteo de Inventario</h1>
              <p className="login-subtitle text-lg">Portal de acceso</p>
            </div>

            <div className="login-form-fields">
              <div className="form-group">
                <label className="login-label">
                  Usuario
                </label>
                <InputText
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 text-lg"
                  placeholder="Tu usuario"
                />
              </div>

              <div className="form-group" style={{ position: "relative" }}>
  <label className="login-label">Contraseña</label>

  <InputText
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className={`w-full h-12 text-lg ${loginError ? "p-invalid" : ""}`}
    placeholder="••••••••"
    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
  />

  {/* Ojo para mostrar/ocultar */}
  <i
    className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"}`}
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "12px",
      top: "42px",
      cursor: "pointer",
      color: "#bbb",
      fontSize: "1.2rem",
    }}
  />
</div>

              {/* Botón */}
              <Button
                label="Iniciar sesión"
                icon="pi pi-sign-in"
                onClick={handleLogin}
                className="w-full h-14 text-xl font-bold"
                disabled={loading}
  loading={loading}
              />
            </div>

            {/* Texto de Copyright */}
            <div className="login-footer">
              alejodev © 2025 • v1.0
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}