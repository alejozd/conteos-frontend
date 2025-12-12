// src/components/Login.tsx
import { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useAuth } from '../hooks/useAuth';
import '../styles/Login.css'; // <--- ¡Importamos nuestro CSS!

export default function Login() {
  const [username, setUsername] = useState('alejo');
  const [password, setPassword] = useState('Pascal2025*');
  const toast = useRef<Toast>(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      toast.current?.show({ severity: 'warn', summary: 'Faltan datos', detail: 'Ingresa usuario y contraseña' });
      return;
    }

    try {
      await login(username, password);
      toast.current?.show({ severity: 'success', summary: '¡Bienvenido!', detail: `Hola ${username}` });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message });
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

              <div className="form-group">
                <label className="login-label">
                  Contraseña
                </label>
                <InputText
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 text-lg"
                  placeholder="••••••••"
                />
              </div>

              {/* Botón */}
              <Button
                label="Iniciar sesión"
                icon="pi pi-sign-in"
                onClick={handleLogin}
                className="w-full h-14 text-xl font-bold"
              />
            </div>

            {/* Texto de Copyright */}
            <div className="login-footer">
              Metrocerámicas © 2025 • v1.0
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}